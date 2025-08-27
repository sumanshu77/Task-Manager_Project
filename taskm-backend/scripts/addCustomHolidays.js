 const AppDataSource = require('../data-source');

const holidays = [
  { name: 'Republic Day', date: '2025-01-26', type: 'national' },
  { name: 'Maha Shivaratri', date: '2025-02-26', type: 'religious' },
  { name: 'Holi', date: '2025-03-14', type: 'religious' },
  { name: 'Good Friday', date: '2025-04-18', type: 'religious' },
  { name: 'Eid-ul-Fitr', date: '2025-03-31', type: 'religious' },
  { name: 'Independence Day', date: '2025-08-15', type: 'national' },
  { name: 'Raksha Bandhan', date: '2025-08-09', type: 'religious' },
  { name: 'Ganesh Chaturthi', date: '2025-08-29', type: 'religious' },
  { name: 'Janmashtami', date: '2025-08-16', type: 'religious' },
  { name: 'Gandhi Jayanti', date: '2025-10-02', type: 'national' },
  { name: 'Dussehra', date: '2025-10-02', type: 'religious' },
  { name: 'Diwali', date: '2025-10-20', type: 'religious' },
  { name: 'Christmas Day', date: '2025-12-25', type: 'religious' },
];

(async () => {
  try {
    await AppDataSource.initialize();
    const Holiday = require('../entities/Holiday');
    const repo = AppDataSource.getRepository(Holiday);
    let inserted = 0;
    for (const h of holidays) {
      // check by date and name
      const existing = await repo.findOne({ where: { date: h.date, name: h.name } });
      if (!existing) {
        const rec = repo.create({ date: h.date, name: h.name, type: h.type });
        await repo.save(rec);
        inserted++;
        console.log('Inserted', h.name, h.date);
      } else {
        console.log('Exists', h.name, h.date);
      }
    }
    const rows = await repo.find({ order: { date: 'ASC' } });
    console.log(`Total holidays in DB: ${rows.length}, inserted: ${inserted}`);
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error adding holidays:', err);
    try { await AppDataSource.destroy(); } catch(e){}
    process.exit(1);
  }
})();
