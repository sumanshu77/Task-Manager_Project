const { EntitySchema } = require('typeorm');

const UserSchema = new EntitySchema({
  name: 'User',
  tableName: 'users',
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
    username: {
      type: 'varchar',
      length: 100,
      unique: true,
      nullable: true,
    },
    email: {
      type: 'varchar',
      length: 255,
      unique: true,
      nullable: false,
    },
    password: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    role: {
      type: 'varchar',
      length: 50,
      default: 'user',
    },
    avatar: {
      type: 'text',
      nullable: true,
    },
    refreshToken: {
      name: 'refresh_token',
      type: 'text',
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
});

module.exports = UserSchema;
