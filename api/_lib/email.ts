import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendDonationConfirmationEmail = async (
  donorName: string, 
  email: string, 
  amount: number | string, 
  paymentMethod: string, 
  confirmedAt: string
) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
  
  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Donation Confirmation',
      html: `
        <h1>Thank you for your donation, ${donorName}!</h1>
        <p>We have successfully received and confirmed your donation.</p>
        <p><strong>Amount:</strong> PKR ${amount}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p><strong>Confirmation Date:</strong> ${new Date(confirmedAt).toLocaleString()}</p>
        <p>Your support makes a huge difference!</p>
      `
    });
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send contact notification email: ${errorMessage}`);
  }
}

export async function sendApplicationConfirmation(to: string, name: string, zoneName: string, tierName: string): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: 'Your IOCA membership application has been received',
      text: `Hi ${name},\n\nThank you for applying to become a member of IOCA.\n\nYour application details:\n- Zone: ${zoneName}\n- Tier: ${tierName}\n- Submitted: ${new Date().toLocaleDateString()}\n\nOur admin team will review your application within 3–5 business days.\nYou will receive an email notification once a decision has been made.\n\nYou can track your application status at:\n${process.env.CLIENT_URL}/membership/waiting\n\nBest regards,\nIOCA Team`,
    });
  } catch (error) {
    console.error('Failed to send application confirmation:', error);
  }
}

export async function sendNewApplicationNotification(adminEmail: string, applicantName: string, zoneName: string, tierName: string): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: adminEmail,
      subject: `New membership application — ${applicantName}`,
      text: `A new membership application has been submitted.\n\nApplicant: ${applicantName}\nZone: ${zoneName}\nTier: ${tierName}\nSubmitted: ${new Date().toLocaleDateString()}\n\nReview it at:\n${process.env.CLIENT_URL}/admin/applications`,
    });
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

export async function sendApplicationApproved(to: string, name: string, tierName: string, endDate: string): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: 'Your IOCA membership has been approved! 🎉',
      text: `Hi ${name},\n\nGreat news! Your IOCA membership application has been approved.\n\nMembership details:\n- Tier: ${tierName}\n- Valid until: ${new Date(endDate).toLocaleDateString()}\n\nYou can view your membership at:\n${process.env.CLIENT_URL}/dashboard\n\nWelcome to IOCA!`,
    });
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }
}

export async function sendApplicationRejected(to: string, name: string, adminNotes?: string): Promise<void> {
  try {
    const notesStr = adminNotes ? `\nReason: ${adminNotes}\n` : '';
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: 'Update on your IOCA membership application',
      text: `Hi ${name},\n\nThank you for your interest in IOCA. After careful review,\nwe are unable to approve your membership application at this time.\n${notesStr}\nYou are welcome to reapply in the future. If you have questions,\nplease contact us at ${process.env.RESEND_FROM_EMAIL}.\n\nBest regards,\nIOCA Team`,
    });
  } catch (error) {
    console.error('Failed to send rejection email:', error);
  }
}
