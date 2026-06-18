import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendDonationConfirmationEmail = async (
  donorName: string, 
  email: string, 
  amount: number | string, 
  paymentMethod: string, 
  confirmedAt: string,
  receiptNumber?: string,
  projectTitle?: string
) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
  
  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Donation Receipt - ${receiptNumber || 'Confirmed'} - IOCA`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #1a5632; margin: 0; font-size: 24px;">Donation Receipt</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">International Organization For Community Advancement (IOCA)</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 16px; color: #333;">Dear <strong>${donorName}</strong>,</p>
          <p style="font-size: 14px; color: #555; line-height: 1.5;">Thank you for your generous contribution. We are pleased to confirm that your donation has been successfully processed and verified. Below are your receipt details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px;">
            <tbody>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #666; font-weight: 500; width: 40%;">Receipt Number</td>
                <td style="padding: 10px 0; color: #111; font-family: monospace; font-weight: bold; font-size: 15px;">${receiptNumber || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #666; font-weight: 500;">Project / Cause</td>
                <td style="padding: 10px 0; color: #111; font-weight: 500;">${projectTitle || 'General Fund'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #666; font-weight: 500;">Amount</td>
                <td style="padding: 10px 0; color: #1a5632; font-weight: bold; font-size: 16px;"><strong>PKR ${Number(amount).toLocaleString('en-PK')}</strong></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #666; font-weight: 500;">Payment Method</td>
                <td style="padding: 10px 0; color: #111;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-weight: 500;">Confirmed On</td>
                <td style="padding: 10px 0; color: #111;">${new Date(confirmedAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} PKT</td>
              </tr>
            </tbody>
          </table>

          <div style="background-color: #f4fcf6; border-left: 4px solid #1a5632; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #1a5632; line-height: 1.5; font-style: italic;">"Your support plays a vital role in our community projects. Together, we are creating sustainable advancements."</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
          <div style="text-align: center; color: #888; font-size: 11px;">
            <p style="margin: 0 0 5px 0;">This is an automatically generated receipt for your donation.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} IOCA. All rights reserved.</p>
          </div>
        </div>
      `
    });
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send donation confirmation email: ${errorMessage}`);
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

export async function sendContactNotification(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
  try {
    await resend.emails.send({
      from: fromEmail,
      to: fromEmail,
      subject: `New Contact Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #1a5632; margin-top: 0;">New Contact Form Message</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #1a5632; margin-top: 10px; white-space: pre-wrap;">${message}</div>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send contact notification email:', error);
  }
}
