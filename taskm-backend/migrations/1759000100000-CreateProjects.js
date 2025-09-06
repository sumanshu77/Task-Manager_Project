module.exports = class CreateProjects1759000100000 {
  name = 'CreateProjects1759000100000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try { await queryRunner.query(`ALTER TABLE projects ADD CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL`); } catch (e) {}
  }

  async down(queryRunner) {
    try { await queryRunner.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_owner`); } catch (e) {}
    await queryRunner.query(`DROP TABLE IF EXISTS projects`);
  }
}


