import https from 'https';

const testApi = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', err => resolve({ error: err.message }));
  });
};

(async () => {
  console.log('Testing /api/programs...');
  const res1 = await testApi('https://iocaworld.org/api/programs');
  console.log('Programs:', res1.status, res1.data.substring(0, 200));

  console.log('Testing /api/news...');
  const res2 = await testApi('https://iocaworld.org/api/news');
  console.log('News:', res2.status, res2.data.substring(0, 200));

  console.log('Testing /api/gallery...');
  const res3 = await testApi('https://iocaworld.org/api/gallery');
  console.log('Gallery:', res3.status, res3.data.substring(0, 200));
})();
