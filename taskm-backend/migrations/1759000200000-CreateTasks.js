module.exports = class CreateTasks1759000200000 {
  name = 'CreateTasks1759000200000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        assignee_id INTEGER,
        assignee_name VARCHAR(255),
        due_date TIMESTAMP,
        github_link VARCHAR(255),
        project_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try { await queryRunner.query(`ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL`); } catch (e) {}
    try { await queryRunner.query(`ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL`); } catch (e) {}
  }

  async down(queryRunner) {
    try { await queryRunner.query(`ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_assignee`); } catch (e) {}
    try { await queryRunner.query(`ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_project`); } catch (e) {}
    await queryRunner.query(`DROP TABLE IF EXISTS tasks`);
  }
}


