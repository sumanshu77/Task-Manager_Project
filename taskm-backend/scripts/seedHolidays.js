const axios = require('axios');
const AppDataSource = require('../data-source');

(async () => {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized');
    const Holiday = require('../entities/Holiday');
    const holidayRepo = AppDataSource.getRepository(Holiday);
    const year = new Date().getFullYear();
    console.log('Fetching holidays for year', year);

    let apiHolidays = [];

    const calendarificKey = process.env.CALENDARIFIC_KEY;
    const country = process.env.HOLIDAYS_COUNTRY || 'IN';
    const location = process.env.HOLIDAYS_LOCATION; // optional, e.g., state

    if (calendarificKey) {
      try {
        const params = {
          api_key: calendarificKey,
          country,
          year,
        };
        if (location) params.location = location;
        const url = 'https://calendarific.com/api/v2/holidays';
        const res = await axios.get(url, { params });
        if (res.data && res.data.response && Array.isArray(res.data.response.holidays)) {
          apiHolidays = res.data.response.holidays.map(h => ({ date: h.date.iso, localName: h.name || h.localName }));
        } else {
          console.warn('Calendarific returned unexpected shape, falling back');
        }
      } catch (apiErr) {
        console.warn('Calendarific API fetch failed:', apiErr.message);
        apiHolidays = [];
      }
    }

    if (apiHolidays.length === 0) {
      // try Nager.Date
      try {
        const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
        apiHolidays = (res.data || []).map(h => ({ date: h.date, localName: h.localName || h.name }));
      } catch (nagerErr) {
        console.warn('Nager.Date fetch failed:', nagerErr.message);
        // fallback manual small list
        apiHolidays = [
          { date: `${year}-01-14`, localName: 'Makar Sankranti' },
          { date: `${year}-01-26`, localName: 'Republic Day' },
          { date: `${year}-03-29`, localName: 'Holi' },
          { date: `${year}-05-01`, localName: 'Labour Day' },
          { date: `${year}-08-15`, localName: 'Independence Day' },
          { date: `${year}-10-24`, localName: 'Diwali' },
          { date: `${year}-10-02`, localName: 'Gandhi Jayanti' },
          { date: `${year}-12-25`, localName: 'Christmas' },
        ];
      }
    }

    let inserted = 0;

    for (const h of apiHolidays) {
      const date = h.date;
      const name = h.localName || h.name;
      const existing = await holidayRepo.findOneBy({ date });
      if (!existing) {
        const rec = holidayRepo.create({ date, name, type: 'national' });
        await holidayRepo.save(rec);
        console.log('Inserted', name, date);
        inserted++;
      }
    }
    const rows = await holidayRepo.find({ order: { date: 'ASC' } });
    console.log(`Total holidays in DB: ${rows.length}, inserted: ${inserted}`);
    console.log(rows.map(r => ({ date: r.date, name: r.name })).slice(0,50));
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error in seeding holidays:', err.message || err);
    try { await AppDataSource.destroy(); } catch(e){}
    process.exit(1);
  }
})();
