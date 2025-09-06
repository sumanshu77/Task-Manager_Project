module.exports = class CreateUsers1759000000000 {
  name = 'CreateUsers1759000000000'

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar TEXT,
        refresh_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}


