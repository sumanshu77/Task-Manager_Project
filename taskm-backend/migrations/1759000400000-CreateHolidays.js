module.exports = class CreateHolidays1759000400000 {
  name = 'CreateHolidays1759000400000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL
      );
    `);
    // Clean up any exact duplicate holiday dates (keep lowest id) before creating unique index
    try {
      await queryRunner.query(`
        DELETE FROM holidays a
        USING holidays b
        WHERE a.id > b.id AND a.date = b.date
      `);
    } catch (e) {}
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_name ON holidays ((date))`);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_holidays_date_name`);
    await queryRunner.query(`DROP TABLE IF EXISTS holidays`);
  }
}


