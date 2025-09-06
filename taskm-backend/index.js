require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const AppDataSource = require('./data-source');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const attendanceRoutes = require('./routes/attendance');
const wfhRoutes = require('./routes/wfh');
const notificationRoutes = require('./routes/notification');
const reportRoutes = require('./routes/report');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

const app = express();
const port = process.env.PORT || 5000;

// Validate DB config early and provide a clear error if missing
function validateDbConfig() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasPgVars =
    process.env.PGHOST &&
    process.env.PGUSER &&
    process.env.PGPASSWORD &&
    process.env.PGDATABASE;
  if (!hasDatabaseUrl && !hasPgVars) {
    console.error(
      '❌ Missing database configuration. Set either DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE env vars.'
    );
    process.exit(1);
  }
}
validateDbConfig();

// Allow multiple origins if needed
const clientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: clientUrls,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Log DB connection host and port (without sensitive info)
try {
  if (process.env.DATABASE_URL) {
    const parsed = new URL(process.env.DATABASE_URL);
    console.log(
      `🔎 Attempting to connect to database host: ${parsed.hostname}:${
        parsed.port || '5432'
      }`
    );
  } else {
    console.log(
      `🔎 Attempting to connect to database host: ${process.env.PGHOST}:${
        process.env.PGPORT || '5432'
      }`
    );
  }
} catch {
  console.warn('⚠️ Could not parse DATABASE_URL for debug logging.');
}

// Initialize TypeORM and run migrations, setup holidays, etc.
async function initializeTypeORM() {
  try {
    await AppDataSource.initialize();
    console.log('✅ TypeORM Data Source initialized.');

    // Run migrations safely
    try {
      const executed = await AppDataSource.runMigrations({ transaction: 'each' });
      console.log(
        '✅ TypeORM migrations executed:',
        executed.length ? executed.map((m) => m.name).join(', ') : 'none'
      );
    } catch (migrationErr) {
      console.error('❌ Migration error:', migrationErr);

      // Retry migrations without transaction if aborted error
      if (
        String(migrationErr).toLowerCase().includes('current transaction is aborted')
      ) {
        console.warn(
          "⚠️ 'current transaction is aborted' detected. Retrying migrations with transaction: 'none'."
        );
        const retried = await AppDataSource.runMigrations({ transaction: 'none' });
        console.log(
          '✅ Retry migrations executed:',
          retried.length ? retried.map((m) => m.name).join(', ') : 'none'
        );
      } else {
        // For known benign errors continue, else exit
        const pgCode = migrationErr?.code || migrationErr?.driverError?.code;
        const benignCodes = ['23505', '23514', '42710'];
        if (
          pgCode &&
          benignCodes.includes(pgCode)
        ) {
          console.warn(`⚠️ Non-fatal migration error (code: ${pgCode}). Continuing startup.`);
        } else if (
          String(migrationErr).toLowerCase().includes('already exists') ||
          String(migrationErr).toLowerCase().includes('duplicate')
        ) {
          console.warn('⚠️ Non-fatal migration message (already exists/duplicate). Continuing startup.');
        } else {
          console.error('❌ Unknown migration error, aborting startup.');
          process.exit(1);
        }
      }
    }

    // Ensure optional columns (safe for dev, no harm in prod)
    try {
      await AppDataSource.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE`
      );
      await AppDataSource.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT`
      );
      await AppDataSource.query(
        `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER`
      );
      console.log('✅ Optional columns ensured.');
    } catch (colErr) {
      console.warn('⚠️ Optional column check failed:', colErr.message);
    }

    // Seed holidays (try API, fallback to hardcoded)
    try {
      const Holiday = require('./entities/Holiday');
      const holidayRepo = AppDataSource.getRepository(Holiday);
      const year = new Date().getFullYear();

      try {
        const res = await axios.get(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/IN`
        );
        for (const h of res.data) {
          const date = h.date;
          const name = h.localName || h.name;
          const existing = await holidayRepo.findOneBy({ date });
          if (!existing) {
            const rec = holidayRepo.create({ date, name, type: 'national' });
            await holidayRepo.save(rec);
            console.log('✅ Seeded holiday from API:', name, date);
          }
        }
      } catch {
        // fallback holidays
        const fallback = [
          { date: `${year}-01-14`, name: 'Makar Sankranti', type: 'national' },
          { date: `${year}-01-26`, name: 'Republic Day', type: 'national' },
          { date: `${year}-05-01`, name: 'Labor Day', type: 'national' },
          { date: `${year}-08-15`, name: 'Independence Day', type: 'national' },
          { date: `${year}-10-02`, name: 'Gandhi Jayanti', type: 'national' },
          { date: `${year}-12-25`, name: 'Christmas', type: 'national' },
        ];
        for (const h of fallback) {
          const existing = await holidayRepo.findOneBy({ date: h.date });
          if (!existing) {
            const rec = holidayRepo.create(h);
            await holidayRepo.save(rec);
            console.log('✅ Seeded fallback holiday:', h.name, h.date);
          }
        }
      }
    } catch (holidayErr) {
      console.warn('⚠️ Error seeding holidays:', holidayErr.message);
    }

    // Normalize holiday dates and create index
    try {
      await AppDataSource.query(
        "UPDATE holidays SET date = (to_char(date, 'YYYY-MM-DD'))::date WHERE date IS NOT NULL"
      );
      await AppDataSource.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_name ON holidays ((date), lower(name));'
      );
      console.log('✅ Normalized holiday dates and created index.');
    } catch (normErr) {
      console.warn('⚠️ Error normalizing holiday dates:', normErr.message);
    }
  } catch (initErr) {
    const usingDatabaseUrl = !!process.env.DATABASE_URL;
    console.error('❌ Failed to initialize TypeORM.');
    console.error(
      'Database config source:',
      usingDatabaseUrl ? 'DATABASE_URL' : 'PGHOST/PG* env vars'
    );
    console.error(initErr);
    process.exit(1);
  }
}

// Setup API routes
app.use('/api', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/wfh', wfhRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Simple health check endpoint
app.get('/', (req, res) => {
  res.send('✅ Task Manager Backend is running');
});

// Initialize DB and start server
initializeTypeORM().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
});
