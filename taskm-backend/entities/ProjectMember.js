const { EntitySchema } = require('typeorm');

const ProjectMemberSchema = new EntitySchema({
  name: 'ProjectMember',
  tableName: 'project_members',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    projectId: { name: 'project_id', type: 'int', nullable: false },
    userId: { name: 'user_id', type: 'int', nullable: false },
    role: { type: 'varchar', length: 50, nullable: true, default: 'member' },
    status: { type: 'varchar', length: 20, default: 'pending' }, // pending | accepted
    invitedAt: { name: 'invited_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
    acceptedAt: { name: 'accepted_at', type: 'timestamp', nullable: true },
  },
  uniques: [
    {
      name: 'uq_project_user',
      columns: ['projectId', 'userId'],
    },
  ],
});

module.exports = ProjectMemberSchema;


