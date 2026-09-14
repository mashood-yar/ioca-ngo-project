const fs = require('fs');

// Fix misc/[...path].ts
let miscPath = 'd:\\NGO Website\\backend\\misc\\[...path].ts';
let miscData = fs.readFileSync(miscPath, 'utf8');

miscData = miscData.replace(
  /sendApplicationConfirmation\(user\.email!, validatedData\.fullName, zoneName, tierName\)\.catch\(console\.error\)/,
  `try { await sendApplicationConfirmation(user.email!, validatedData.fullName, zoneName, tierName) } catch(e) { console.error(e) }`
);
miscData = miscData.replace(
  /sendNewApplicationNotification\(adminEmail, validatedData\.fullName, zoneName, tierName\)\.catch\(console\.error\)/,
  `try { await sendNewApplicationNotification(adminEmail, validatedData.fullName, zoneName, tierName) } catch(e) { console.error(e) }`
);
miscData = miscData.replace(
  /sendApplicationApproved\(\n\s*application\.email,\n\s*application\.full_name,\n\s*application\.tiers\?\.name \|\| 'Membership',\n\s*expiryDate\n\s*\)\.catch\(console\.error\)/,
  `try { await sendApplicationApproved(application.email, application.full_name, application.tiers?.name || 'Membership', expiryDate) } catch(e) { console.error(e) }`
);
// In case the catch is missing on the original string
miscData = miscData.replace(
  /sendApplicationApproved\([\s\S]*?expiryDate\n\s*\)/,
  `await sendApplicationApproved(application.email, application.full_name, application.tiers?.name || 'Membership', expiryDate)`
);
miscData = miscData.replace(
  /sendApplicationRejected\([\s\S]*?validatedData\.adminNotes\n\s*\)/,
  `await sendApplicationRejected(application.email, application.full_name, validatedData.adminNotes)`
);

fs.writeFileSync(miscPath, miscData);

// Fix donations/[...path].ts
let donPath = 'd:\\NGO Website\\backend\\donations\\[...path].ts';
let donData = fs.readFileSync(donPath, 'utf8');

donData = donData.replace(
  /sendDonationThankYouEmail\([\s\S]*?validatedData\.message\n\s*\)/,
  `await sendDonationThankYouEmail(updated.email, updated.donor_name, updated.amount, updated.currency, updated.receipt_number, updated.projects?.title || 'General Fund', updated.payment_method, validatedData.message)`
);

donData = donData.replace(
  /sendAdminDonationNotification\([\s\S]*?updated\.projects\?\.title \|\| 'General Fund'\n\s*\)/,
  `await sendAdminDonationNotification(process.env.RESEND_FROM_EMAIL || 'admin@iocaworld.org', updated.donor_name, updated.amount, updated.projects?.title || 'General Fund')`
);

fs.writeFileSync(donPath, donData);

console.log('Fixed email awaits');
