const { EntitySchema } = require('typeorm');

const LeaveSchema = new EntitySchema({
  name: 'Leave',
  tableName: 'leave_requests',
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
    startDate: {
      name: 'start_date',
      type: 'date',
      nullable: false,
    },
    endDate: {
      name: 'end_date',
      type: 'date',
      nullable: false,
    },
    reason: {
      type: 'text',
      nullable: false,
    },
    hoursPerDay: {
      name: 'hours_per_day',
      type: 'int',
      nullable: true,
    },
    workLocation: {
      name: 'work_location',
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    type: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
    status: {
      type: 'varchar',
      length: 50,
      default: 'pending',
    },
    appliedAt: {
      name: 'applied_at',
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
});

module.exports = LeaveSchema;
