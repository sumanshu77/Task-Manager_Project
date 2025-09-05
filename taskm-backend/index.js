require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
  const hasPgVars = process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE;
  if (!hasDatabaseUrl && !hasPgVars) {
    console.error('❌ Missing database configuration. Set either DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE env vars.');
    // exit so Render shows a clear failure reason instead of an opaque TypeORM error
    process.exit(1);
  }
}
validateDbConfig();

// ✅ Allow frontend origin from env (Render will set CLIENT_URL)
const clientUrls = process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'];
app.use(cors({ origin: clientUrls, credentials: true }));

// Log the DB host/port (without credentials) to help diagnose connection issues
try {
  if (process.env.DATABASE_URL) {
    const parsed = new URL(process.env.DATABASE_URL);
    console.log(`🔎 Attempting to connect to database host: ${parsed.hostname}:${parsed.port || '5432'}`);
  } else {
    console.log(`🔎 Attempting to connect to database host: ${process.env.PGHOST}:${process.env.PGPORT || '5432'}`);
  }
} catch (err) {
  console.warn('⚠️ Could not parse DATABASE_URL for debug logging.');
}

app.use(express.json());
app.use(cookieParser());

// ✅ TypeORM initialization
async function initializeTypeORM() {
  try {
    await AppDataSource.initialize();
    console.log('✅ TypeORM Data Source initialized.');

    // Run migrations with each migration in its own transaction so a single failing
    // migration doesn't abort the entire batch. Catch and handle common benign errors
    // (like duplicate inserts) to avoid crashing on redeploys where some data already
    // exists. For serious errors we still stop the process.
    try {
      const executed = await AppDataSource.runMigrations({ transaction: 'each' });
      console.log('✅ TypeORM migrations executed:', executed.map(m => m.name).join(', ') || 'none');
    } catch (mErr) {
      console.error('❌ Migration error:', mErr && mErr.stack ? mErr.stack : mErr);
      // Known Postgres duplicate error code (unique violation)
      const pgCode = mErr && (mErr.code || (mErr.driverError && mErr.driverError.code));
      const benignCodes = ['23505', '23514', '42710']; // unique_violation, check_violation, duplicate_object
      if (pgCode && benignCodes.includes(pgCode)) {
        console.warn('⚠️ Non-fatal migration error detected (code:', pgCode, '). Continuing startup.');
      } else if (String(mErr).toLowerCase().includes('already exists') || String(mErr).toLowerCase().includes('duplicate')) {
        console.warn('⚠️ Non-fatal migration message (already exists/duplicate). Continuing startup.');
      } else {
        // Unknown/serious error — surface and exit so deploy fails loudly.
        console.error('❌ Unknown migration error, aborting startup.');
        console.error(mErr && mErr.stack ? mErr.stack : mErr);
        process.exit(1);
      }
    }

    // Ensure optional columns exist (safe for dev)
    try {
      await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE`);
      await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT`);
      await AppDataSource.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER`);
      console.log('✅ Optional columns ensured.');
    } catch (err) {
      console.warn('⚠️ Optional column check failed:', err.message);
    }

    // ✅ Holiday seeding
    try {
      const Holiday = require('./entities/Holiday');
      const holidayRepo = AppDataSource.getRepository(Holiday);
      const year = new Date().getFullYear();

      try {
        const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
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
      } catch (apiErr) {
        console.warn('⚠️ API holiday fetch failed. Using fallback.');
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
    } catch (err) {
      console.warn('⚠️ Error seeding holidays:', err.message);
    }

    // ✅ Normalize holiday dates
    try {
      await AppDataSource.query("UPDATE holidays SET date = (to_char(date, 'YYYY-MM-DD'))::date WHERE date IS NOT NULL");
      await AppDataSource.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_name ON holidays ((date), lower(name));");
      console.log('✅ Normalized holiday dates and created index.');
    } catch (err) {
      console.warn('⚠️ Error normalizing holiday dates:', err.message);
    }

  } catch (err) {
    // Provide richer debugging output for deploy logs
    const usingDatabaseUrl = !!process.env.DATABASE_URL;
    console.error('❌ Failed to initialize TypeORM.');
    console.error('Database config source:', usingDatabaseUrl ? 'DATABASE_URL' : 'PGHOST/PG* env vars');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

// ✅ Routes
app.use('/api', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/wfh', wfhRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// ✅ Health check
app.get('/', (req, res) => {
  res.send('✅ Task Manager Backend is running');
});

// ✅ Start server
initializeTypeORM().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
});
