// Быстрый смоук-тест API: health, add (без файла), list, stats, delete
const fs = require('fs');

(async () => {
  // Старт сервера в фоне через require
  process.env.PORT = '3999';
  require('./server/index.js');
  await new Promise(r => setTimeout(r, 800));

  const base = 'http://127.0.0.1:3999/api';

  const health = await fetch(base + '/health').then(r => r.json());
  console.log('HEALTH:', JSON.stringify(health));

  // Добавление элемента без постера (multipart с полем data)
  const fd = new FormData();
  fd.append('data', JSON.stringify({ title: 'Тестовый фильм', type: 'movie', year: 2024 }));
  const addRes = await fetch(base + '/items', { method: 'POST', body: fd });
  const addJson = await addRes.json();
  console.log('ADD status:', addRes.status, JSON.stringify(addJson).slice(0, 200));

  const list = await fetch(base + '/items').then(r => r.json());
  const items = Array.isArray(list) ? list : list.items;
  console.log('LIST count:', items.length);
  const testItem = items.find(i => i.title === 'Тестовый фильм');
  console.log('TEST ITEM keys:', Object.keys(testItem || {}).join(','));
  console.log('Has "upcoming" field?', testItem && ('upcoming' in testItem));

  const stats = await fetch(base + '/stats').then(r => r.json());
  console.log('STATS:', JSON.stringify(stats).slice(0, 200));

  if (testItem) {
    const delRes = await fetch(base + '/items/' + testItem.id, { method: 'DELETE' });
    console.log('DELETE status:', delRes.status);
  }

  process.exit(0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
