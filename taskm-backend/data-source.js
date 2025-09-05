require('dotenv').config();
const { DataSource } = require('typeorm');
const path = require('path');

// Entity imports
const UserSchema = require('./entities/User');
const TaskSchema = require('./entities/Task');
const AttendanceSchema = require('./entities/Attendance');
const LeaveSchema = require('./entities/Leave');
const HolidaySchema = require('./entities/Holiday');
const ProjectSchema = require('./entities/Project');
const WFHSchema = require('./entities/WFH');
const NotificationSchema = require('./entities/Notification');
const ProjectMemberSchema = require('./entities/ProjectMember');

const isRender = process.env.DATABASE_URL?.includes('render.com');

const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        ssl: isRender ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT, 10) || 5432,
        username: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
      }),
  synchronize: false, // Use migrations in production
  logging: false,
  entities: [
    UserSchema,
    TaskSchema,
    AttendanceSchema,
    LeaveSchema,
    HolidaySchema,
    ProjectSchema,
    WFHSchema,
    NotificationSchema,
    ProjectMemberSchema,
  ],
  migrations: [path.join(__dirname, 'migrations/**/*.js')],
  subscribers: [],
});

module.exports = AppDataSource;
