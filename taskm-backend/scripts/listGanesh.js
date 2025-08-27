(async () => {
  try {
    const ds = require('../data-source');
    await ds.initialize();
    const rows = await ds.query("SELECT id, date, name FROM holidays WHERE name ILIKE '%Ganesh%' ORDER BY date");
    console.log('Ganesh entries:', rows);
    await ds.destroy();
  } catch (err) {
    console.error('Error listing Ganesh holidays:', err.message || err);
    process.exit(1);
  }
})();
