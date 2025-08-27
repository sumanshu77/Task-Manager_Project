const { EntitySchema } = require('typeorm');

const NotificationSchema = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    userId: { name: 'user_id', type: 'int', nullable: false },
    message: { type: 'text', nullable: false },
    data: { type: 'text', nullable: true },
    read: { type: 'boolean', default: false },
    createdAt: { name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
  },
});

module.exports = NotificationSchema;
