(async () => {
  try {
    const fetch = globalThis.fetch || require('node-fetch');
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'dummyuser123@gmail.com', password: '123456' }),
    });
    console.log('login status', loginRes.status);
    const loginBody = await loginRes.json().catch(() => null);
    console.log('login body', loginBody);
    if (!loginBody || !loginBody.token) {
      console.error('No token returned; aborting');
      process.exit(1);
    }
    const token = loginBody.token;

    const endpoints = ['/api/reports/tasks','/api/reports/attendance','/api/reports/leaves','/api/reports/wfh'];
    for (const ep of endpoints) {
      try {
        const r = await fetch('http://localhost:5000' + ep, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
        const text = await r.text();
        console.log('GET', ep, 'status', r.status);
        try { console.log(JSON.stringify(JSON.parse(text), null, 2)); } catch (e) { console.log(text); }
      } catch (e) {
        console.error('error calling', ep, e.message || e);
      }
    }
  } catch (err) {
    console.error('script error', err.message || err);
  }
})();
