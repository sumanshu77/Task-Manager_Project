const { EntitySchema } = require('typeorm');

const ProjectSchema = new EntitySchema({
  name: 'Project',
  tableName: 'projects',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    ownerId: {
      name: 'owner_id',
      type: 'int',
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
});

module.exports = ProjectSchema;
