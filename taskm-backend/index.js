
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const AppDataSource = require('./data-source');
const axios = require('axios');

// Import Routes
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

// ======= CORS =======
const clientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: clientUrls,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ======= Health Check =======
app.get('/', (req, res) => {
  res.send('✅ Task Manager Backend is running');
});

// ======= API Routes =======
app.use('/api', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/wfh', wfhRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// ======= DB Initialization =======
async function initializeTypeORM() {
  try {
    await AppDataSource.initialize();
    console.log('✅ DB connected');

    const executed = await AppDataSource.runMigrations({ transaction: 'each' });
    console.log('✅ Migrations:', executed.map(m => m.name).join(', ') || 'None');

    // Add optional columns
    await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE`);
    await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT`);
    await AppDataSource.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER`);
    
    console.log('✅ Optional columns ensured');

    // Seed holidays
    const Holiday = require('./entities/Holiday');
    const holidayRepo = AppDataSource.getRepository(Holiday);
    const year = new Date().getFullYear();

    try {
      const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
      for (const h of res.data) {
        const existing = await holidayRepo.findOneBy({ date: h.date });
        if (!existing) {
          const record = holidayRepo.create({ date: h.date, name: h.name, type: 'national' });
          await holidayRepo.save(record);
        }
      }
      console.log('✅ Holidays seeded');
    } catch (e) {
      console.warn('⚠️ Holiday API fallback used');
    }

  } catch (err) {
    console.error('❌ DB Init error:', err.message);
    process.exit(1);
  }
}

// ======= Start Server =======
initializeTypeORM().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
});
