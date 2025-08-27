module.exports = class CreateProjectMembers1756300000000 {
  name = 'CreateProjectMembers1756300000000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(20) DEFAULT 'pending',
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP NULL,
        CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
      );
    `);
    // optional foreign keys (if projects/users exist)
    try {
      await queryRunner.query(`ALTER TABLE project_members ADD CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`);
    } catch (e) {
      // ignore if constraint exists or projects table missing
    }
    try {
      await queryRunner.query(`ALTER TABLE project_members ADD CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
    } catch (e) {
      // ignore
    }
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE project_members DROP CONSTRAINT IF EXISTS fk_pm_user`);
    await queryRunner.query(`ALTER TABLE project_members DROP CONSTRAINT IF EXISTS fk_pm_project`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_members`);
  }
}


