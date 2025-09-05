require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
// bcrypt replaced with bcryptjs for portability on Linux hosts
const bcrypt = require('bcryptjs');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const attendanceRoutes = require('./routes/attendance');
const wfhRoutes = require('./routes/wfh');
const notificationRoutes = require('./routes/notification');
const reportRoutes = require('./routes/report');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const AppDataSource = require('./data-source'); // Import TypeORM Data Source

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Database initialization with TypeORM
async function initializeTypeORM() {
  try {
    await AppDataSource.initialize();
    console.log('TypeORM Data Source initialized.');
    await AppDataSource.runMigrations();
    console.log('TypeORM migrations executed successfully.');

    // Ensure required columns exist (safe for development)
    try {
      await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE`);
      await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT`);
      await AppDataSource.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER`);
      console.log('Ensured optional columns exist.');
    } catch (err) {
      console.warn('Error ensuring optional columns:', err.message);
    }

    // Seed common Indian holidays for the current year if not present
    try {
      const Holiday = require('./entities/Holiday');
      const holidayRepo = AppDataSource.getRepository(Holiday);
      const year = new Date().getFullYear();
      // Use Nager.Date public API to fetch holidays for India
      try {
        const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
        const apiHolidays = res.data; // array of { date, localName, name, countryCode, fixed, global, counties, launchYear, types }
        for (const h of apiHolidays) {
          const date = h.date; // already in YYYY-MM-DD
          const name = h.localName || h.name;
          const existing = await holidayRepo.findOneBy({ date });
          if (!existing) {
            const rec = holidayRepo.create({ date, name, type: 'national' });
            await holidayRepo.save(rec);
            console.log('Seeded holiday from API:', name, date);
          }
        }
      } catch (apiErr) {
        console.warn('Failed to fetch holidays from API, falling back to manual list:', apiErr.message);
        const holidays = [
          { date: `${year}-01-14`, name: 'Makar Sankranti', type: 'national' },
          { date: `${year}-01-26`, name: 'Republic Day', type: 'national' },
          { date: `${year}-05-01`, name: 'Labor Day', type: 'national' },
          { date: `${year}-08-15`, name: 'Independence Day', type: 'national' },
          { date: `${year}-10-02`, name: 'Gandhi Jayanti', type: 'national' },
          { date: `${year}-12-25`, name: 'Christmas', type: 'national' },
        ];
        for (const h of holidays) {
          const existing = await holidayRepo.findOneBy({ date: h.date });
          if (!existing) {
            const rec = holidayRepo.create(h);
            await holidayRepo.save(rec);
            console.log('Seeded fallback holiday:', h.name, h.date);
          }
        }
      }
    } catch (err) {
      console.warn('Error seeding holidays:', err.message);
    }

    // Normalize holiday dates to date-only and create unique index to avoid duplicates
    try {
      // convert any timestamp columns to date-only
      await AppDataSource.query("UPDATE holidays SET date = (to_char(date, 'YYYY-MM-DD'))::date WHERE date IS NOT NULL");
      // create unique index on date and lower(name)
      await AppDataSource.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_name ON holidays ((date), lower(name));");
      console.log('Normalized holiday dates and ensured unique index.');
    } catch (err) {
      console.warn('Error normalizing holidays or creating index:', err.message);
    }

  } catch (err) {
    console.error('Error initializing TypeORM Data Source or running migrations:', err.message);
    process.exit(1);
  }
}

// Routes
app.use('/api', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/wfh', wfhRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Task Manager Backend is running');
});

// Start server after TypeORM initialization and migrations
initializeTypeORM().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
