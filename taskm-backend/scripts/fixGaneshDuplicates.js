const AppDataSource = require('../data-source');

(async () => {
  try {
    await AppDataSource.initialize();
    const holidayRepo = AppDataSource.getRepository(require('../entities/Holiday'));

    // Desired canonical date for Ganesh Chaturthi (adjust if needed)
    const canonicalDate = '2025-08-29';

    const rows = await holidayRepo.find({ where: { name: AppDataSource.driver.options.type ? undefined : undefined } });
    // Find all entries with name like Ganesh
    const ganeshRows = await AppDataSource.query("SELECT id, date, name FROM holidays WHERE name ILIKE '%Ganesh%' ORDER BY date");

    if (ganeshRows.length <= 1) {
      console.log('No duplicates found for Ganesh. Rows:', ganeshRows);
    } else {
      console.log('Found Ganesh entries:', ganeshRows);
      // Delete entries whose date !== canonicalDate
      let deleted = 0;
      for (const r of ganeshRows) {
        const dateStr = (r.date instanceof Date) ? r.date.toISOString().split('T')[0] : r.date;
        if (dateStr !== canonicalDate) {
          await AppDataSource.query('DELETE FROM holidays WHERE id = $1', [r.id]);
          console.log('Deleted duplicate holiday id', r.id, 'date', dateStr);
          deleted++;
        }
      }
      console.log(`Deleted ${deleted} duplicate(s).`);
    }

    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error fixing Ganesh duplicates:', err.message || err);
    try { await AppDataSource.destroy(); } catch(e){}
    process.exit(1);
  }
})();
