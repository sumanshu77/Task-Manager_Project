const { EntitySchema } = require('typeorm');

const HolidaySchema = new EntitySchema({
  name: 'Holiday',
  tableName: 'holidays',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    date: {
      type: 'date',
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    type: {
      type: 'varchar',
      length: 50,
      nullable: false,
    },
  },
});

module.exports = HolidaySchema;
