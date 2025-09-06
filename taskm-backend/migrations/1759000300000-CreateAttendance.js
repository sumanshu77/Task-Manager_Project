module.exports = class CreateAttendance1759000300000 {
  name = 'CreateAttendance1759000300000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        break_start TIME,
        break_end TIME,
        status VARCHAR(50) DEFAULT 'present',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try { await queryRunner.query(`ALTER TABLE attendance ADD CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`); } catch (e) {}
  }

  async down(queryRunner) {
    try { await queryRunner.query(`ALTER TABLE attendance DROP CONSTRAINT IF EXISTS fk_attendance_user`); } catch (e) {}
    await queryRunner.query(`DROP TABLE IF EXISTS attendance`);
  }
}


