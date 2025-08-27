require('dotenv').config();
const { DataSource } = require('typeorm');
const path = require('path');

const UserSchema = require('./entities/User');
const TaskSchema = require('./entities/Task');
const AttendanceSchema = require('./entities/Attendance');
const LeaveSchema = require('./entities/Leave');
const HolidaySchema = require('./entities/Holiday');
const ProjectSchema = require('./entities/Project');
const WFHSchema = require('./entities/WFH');
const NotificationSchema = require('./entities/Notification');
const ProjectMemberSchema = require('./entities/ProjectMember');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  synchronize: true, // temporarily enable for development to create new tables (switch to false and use migrations later)
  logging: false,
  entities: [UserSchema, TaskSchema, AttendanceSchema, LeaveSchema, HolidaySchema, ProjectSchema, ProjectMemberSchema, WFHSchema, NotificationSchema],
  migrations: [path.join(__dirname, 'migrations/**/*.js')], // Absolute path to migration files
  subscribers: [],
});

module.exports = AppDataSource;
