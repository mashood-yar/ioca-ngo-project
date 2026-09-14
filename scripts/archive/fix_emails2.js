const fs = require('fs');
let miscPath = 'd:\\NGO Website\\backend\\misc\\[...path].ts';
let miscData = fs.readFileSync(miscPath, 'utf8');

miscData = miscData.replace(
  /sendApplicationApproved\([\s\S]*?expiryDate\n\s*\)\.catch\(console\.error\)/,
  `await sendApplicationApproved(application.email, application.full_name, application.tiers?.name || 'Membership', expiryDate).catch(console.error)`
);
fs.writeFileSync(miscPath, miscData);

let donPath = 'd:\\NGO Website\\backend\\donations\\[...path].ts';
let donData = fs.readFileSync(donPath, 'utf8');
console.log(donData.includes('await sendDonationThankYouEmail'));
