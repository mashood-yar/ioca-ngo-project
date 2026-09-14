const https = require('https');
https.get('https://www.iocaworld.org/assets/index-Bew4HlKX.js', (res) => {
  let js = '';
  res.on('data', d => js += d);
  res.on('end', () => {
    console.log('testimonials', js.includes('testimonials'));
    console.log('Voices from Our Community', js.includes('Voices from Our Community'));
    console.log('TestimonialGallery', js.includes('TestimonialGallery'));
  });
});
