require('dotenv').config();
const AppDataSource = require('../data-source');

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized');

    // create sample users if not exist
    const users = [
      { name: 'Alice Admin', email: 'admin1@example.com', password: 'pass' },
      { name: 'Bob Member', email: 'bob@example.com', password: 'pass' },
      { name: 'Carol Member', email: 'carol@example.com', password: 'pass' },
    ];

    for (const u of users) {
      const exists = await AppDataSource.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (!exists.length) {
        await AppDataSource.query('INSERT INTO users (name, email, password, role, created_at) VALUES ($1,$2,$3,$4,NOW())', [u.name, u.email, u.password, u.email.includes('admin') ? 'admin' : 'user']);
      }
    }

    // create sample projects
    const projects = [
      { name: 'Fizvizz', description: 'Analytics Dashboard', status: 'Active', start: '2021-01-10', end: '2021-03-30' },
      { name: 'Sprint Planning', description: 'Planning the next Sprint', status: 'On Hold', start: '2021-05-05', end: '2021-05-18' },
      { name: 'Website Redesign', description: "Redesign the company's website", status: 'Completed', start: '2021-02-01', end: '2021-07-01' },
    ];

    for (const p of projects) {
      const exists = await AppDataSource.query('SELECT id FROM projects WHERE name = $1', [p.name]);
      let pid;
      if (!exists.length) {
        const res = await AppDataSource.query('INSERT INTO projects (name, description, start_date, end_date, status, created_at, owner_id) VALUES ($1,$2,$3,$4,$5,NOW(), (SELECT id FROM users WHERE email=$6 LIMIT 1)) RETURNING id', [p.name, p.description, p.start, p.end, p.status, 'admin1@example.com']);
        pid = res[0].id;
      } else pid = exists[0].id;

      // tasks
      const tExists = await AppDataSource.query('SELECT id FROM tasks WHERE project_id = $1', [pid]);
      if (!tExists.length) {
        for (let i=1;i<=5;i++) {
          await AppDataSource.query('INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, created_at) VALUES ($1,$2,$3,$4,$5,(SELECT id FROM users WHERE email=$6 LIMIT 1),NOW())', [pid, `${p.name} Task ${i}`, 'Auto-generated', i%2===0?'completed':'todo', i%3===0?'high':'medium', i%2===0 ? 'bob@example.com' : 'carol@example.com']);
        }
      }

      // members
      const mExists = await AppDataSource.query('SELECT id FROM project_members WHERE project_id = $1', [pid]);
      if (!mExists.length) {
        const usersRows = await AppDataSource.query("SELECT id,email FROM users WHERE email IN ('admin1@example.com','bob@example.com','carol@example.com')");
        for (const ur of usersRows) {
          await AppDataSource.query('INSERT INTO project_members (project_id, user_id, role, status, invited_at, accepted_at) VALUES ($1,$2,$3,$4,NOW(),NOW())', [pid, ur.id, ur.email.includes('admin')?'owner':'member', 'accepted']);
        }
      }
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();


