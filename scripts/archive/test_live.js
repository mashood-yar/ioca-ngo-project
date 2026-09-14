const https = require('https');
https.get('https://iocaworld.org/', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const regex = /<script type="module" crossorigin src="(.*?)"><\/script>/g;
    let match;
    while((match = regex.exec(html)) !== null) {
      console.log('Found JS:', match[1]);
      https.get('https://iocaworld.org' + match[1], (res2) => {
        let js = '';
        res2.on('data', d => js += d);
        res2.on('end', () => {
          console.log('JS length:', js.length);
          console.log('Contains TestimonialGallery?', js.includes('TestimonialGallery') || js.includes('testimonials'));
          console.log('Contains margin 0px?', js.includes('margin:"0px"') || js.includes('margin:"-100px"'));
        });
      });
    }
  });
});
