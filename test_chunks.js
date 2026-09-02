const https = require('https');
https.get('https://www.iocaworld.org/', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const matches = [...html.matchAll(/href="(\/assets\/Home.*?\.js)"/g)];
    if(matches.length > 0) {
      console.log('Home chunk:', matches[0][1]);
      https.get('https://www.iocaworld.org' + matches[0][1], (res2) => {
        let js = '';
        res2.on('data', d => js += d);
        res2.on('end', () => {
          console.log('Voices from Our Community', js.includes('Voices from Our Community'));
          console.log('-100px', js.includes('-100px'));
          console.log('0px', js.includes('0px'));
        });
      });
    } else {
      console.log('No Home chunk found in HTML. Check preload links.');
      // try matching all JS
      const allMatches = [...html.matchAll(/href="(\/assets\/.*?\.js)"/g)];
      console.log('All JS:', allMatches.map(m => m[1]));
    }
  });
});
