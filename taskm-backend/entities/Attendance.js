const { EntitySchema } = require('typeorm');

const AttendanceSchema = new EntitySchema({
  name: 'Attendance',
  tableName: 'attendance',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    userId: {
      name: 'user_id',
      type: 'int',
      nullable: false,
    },
    date: {
      type: 'date',
      nullable: false,
    },
    checkIn: {
      name: 'check_in',
      type: 'time',
      nullable: true,
    },
    checkOut: {
      name: 'check_out',
      type: 'time',
      nullable: true,
    },
    breakStart: {
      name: 'break_start',
      type: 'time',
      nullable: true,
    },
    breakEnd: {
      name: 'break_end',
      type: 'time',
      nullable: true,
    },
    status: {
      type: 'varchar',
      length: 50,
      nullable: false,
      default: 'present',
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
});

module.exports = AttendanceSchema;
