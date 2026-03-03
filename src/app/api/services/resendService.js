import { Resend } from 'resend';

const FROM_EMAIL = 'Premarket <no-reply@mail.premarket.homes>';

let _resend;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendEmail({ to, subject, html }) {
  return getResend().emails.send({ from: FROM_EMAIL, to, subject, html });
}

export async function sendPropertyApprovalEmail(userEmail, userFirstName, propertyAddress) {
  const html = `<body>Hi ${userFirstName || 'there'}, great news — your property at <b>${propertyAddress}</b> is now live on Premarket.</body>`;
  return sendEmail({ to: userEmail, subject: 'Your property is now live', html });
}

export async function sendPropertyAgentEmail(userEmail, userFirstName, propertyAddress) {
  const html = `
  <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <div style="background-color: #E11D48; color: #fff; text-align: center; padding: 20px 0;">
        <h2 style="margin: 0; font-size: 22px;">New Prospect Added</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Hi ${userFirstName || 'there'},</p>
        <p style="font-size: 16px; color: #333;">A new prospect has added their home at <strong>${propertyAddress}</strong> to your Premarket profile.</p>
        <p style="font-size: 16px; color: #333;">You'll find this property in your <b>Prospects tab</b> inside the Premarket app.</p>
        <p style="font-size: 16px; color: #333;">From there, you can review and edit the listing details, then activate your AI Agent to generate video content. Once everything looks good, take the property live and start attracting buyers.</p>
        <p style="font-size: 16px; color: #333;">Need more campaign slots? Our team can help.</p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://calendly.com/knockknock-premarket" style="background-color: #E11D48; color: #fff; text-decoration: none; padding: 14px 26px; font-size: 16px; border-radius: 8px; font-weight: bold; display: inline-block;">Chat with Sales</a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">— The Premarket Team</p>
      </div>
    </div>
  </body>`;
  return sendEmail({ to: userEmail, subject: `New Prospect Added: ${propertyAddress}`, html });
}

export async function sendInviteLink(email, firstName, agentFirstName, link) {
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8" /><title>You're Invited – Premarket</title></head>
  <body style="margin:0; padding:0; background-color:#f6f9fc; font-family:Arial, Helvetica, sans-serif; color:#333;">
    <table align="center" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
      <tr><td style="padding:20px; text-align:center; background:#ffffff;"><img src="https://premarketvideos.b-cdn.net/assets/logo.png" alt="Premarket" style="max-width:180px;"/></td></tr>
      <tr><td style="padding:25px; text-align:left;">
        <h2 style="color:#111; font-size:22px; margin-top:0;">Hi ${firstName},</h2>
        <p style="font-size:15px; color:#444; line-height:1.6;">You've been invited by your agent to use <strong>Premarket</strong> — a simple way to test buyer interest in your property before deciding whether to take it to market.</p>
        <p style="font-size:15px; color:#444; line-height:1.6;">Premarket is a secure platform your agent uses to manage premarket campaigns. By uploading your property details, your agent can quietly introduce it to active buyers and buyer's agents, gather feedback, and track interest — without public advertising or any obligation to sell.</p>
        <h3 style="color:#111; font-size:16px; margin-top:25px; margin-bottom:12px;">Once your property is added:</h3>
        <ul style="color:#444; font-size:15px; line-height:1.8; margin:0; padding-left:18px;">
          <li>Your agent manages the campaign through their Premarket dashboard</li>
          <li>Buyer interest and enquiries are tracked</li>
          <li>Your agent will contact you with updates and a summary report</li>
          <li>You'll have clearer information to help decide what (if anything) you want to do next</li>
        </ul>
        <p style="font-size:15px; color:#444; line-height:1.6; margin-top:25px;"><strong>Getting started is free.</strong><br/>Simply scan the QR code or click the link below to upload your property details. Your property will appear directly in your agent's Premarket profile.</p>
        <div style="text-align:center; margin:25px 0;"><img src="${qrImage}" alt="Join Premarket QR" style="max-width:200px; border:1px solid #eee; border-radius:8px;"/></div>
        <div style="text-align:center; margin:20px 0;"><a href="${link}" style="background-color:#00897b; color:#fff; padding:14px 30px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:15px; display:inline-block;">Upload your property</a></div>
        <div style="text-align:center; margin:20px 0; background:#f0fdf9; border:1px solid #d6f5e8; border-radius:8px; padding:15px;"><a href="${link}" style="word-break:break-all; font-size:14px; color:#00897b; text-decoration:none;">${link}</a></div>
        <div style="background:#f8f9fa; border-radius:8px; padding:20px; margin-top:30px;">
          <h3 style="color:#111; font-size:16px; margin-top:0; margin-bottom:8px;">Tips for uploading your property photos</h3>
          <p style="font-size:14px; color:#666; line-height:1.5; margin:0 0 12px 0; font-style:italic;">(Don't stress — simple photos are fine)</p>
          <p style="font-size:14px; color:#555; line-height:1.6; margin-bottom:12px;">To help buyers get a feel for your home, we recommend uploading at least <strong>5 clear photos</strong>. These don't need to be professional — quick phone photos work well.</p>
          <p style="font-size:14px; color:#555; line-height:1.6; margin-bottom:8px;"><strong>A few easy tips:</strong></p>
          <ul style="color:#555; font-size:14px; line-height:1.8; margin:0 0 15px 0; padding-left:18px;">
            <li>Take photos during the day using natural light</li>
            <li>Open blinds and curtains</li>
            <li>Capture main living areas, kitchen, exterior and outdoor spaces</li>
            <li>Use landscape mode on your phone</li>
            <li>Tidy surfaces and remove obvious clutter</li>
          </ul>
          <p style="font-size:14px; color:#555; line-height:1.6; margin:0;">And don't worry about getting them perfect — Premarket includes AI photo touch-ups in the agent dashboard, so your agent can enhance brightness, clarity and presentation as part of the campaign.</p>
        </div>
        <p style="font-size:14px; color:#555; line-height:1.6; margin-top:20px;">If you need help at any stage, your agent can guide you through the process.</p>
        <p style="font-size:15px; color:#444; line-height:1.6; margin-top:30px;">Kind regards,<br/><strong>Your Agent</strong><br/><span style="font-size:13px; color:#666;">via Premarket</span></p>
      </td></tr>
      <tr><td style="padding:20px; text-align:center; font-size:12px; color:#999; background:#fafafa; border-top:1px solid #eee;"><p style="margin:0;">&copy; ${new Date().getFullYear()} Premarket Australia. All rights reserved.</p></td></tr>
    </table>
  </body>
  </html>`;
  return sendEmail({ to: email, subject: `You've been invited to join Premarket`, html });
}

export async function sendLink(link, email) {
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8" /><title>Premarket Property Link</title></head>
  <body style="margin:0; padding:0; background-color:#f6f9fc; font-family:Arial, Helvetica, sans-serif; color:#333;">
    <table align="center" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
      <tr><td style="padding:20px; text-align:center; background:#ffffff;"><img src="https://premarketvideos.b-cdn.net/assets/logo.png" alt="Premarket" style="max-width:180px;"/></td></tr>
      <tr><td style="padding:20px; text-align:center;">
        <h2 style="color:#111; margin:0 0 10px; font-size:22px;">Your Premarket Property Link</h2>
        <p style="margin:0; font-size:15px; color:#555;">Scan the QR code or use the link below to share your property with buyers:</p>
        <div style="margin:20px 0;"><img src="${qrImage}" alt="Property QR Code" style="max-width:200px; border:1px solid #eee; border-radius:8px;"/></div>
        <div style="margin:20px 0; background:#f0fdf9; border:1px solid #d6f5e8; border-radius:8px; padding:15px;"><a href="${link}" style="word-break:break-all; font-size:16px; font-weight:bold; color:#00897b; text-decoration:none;">${link}</a></div>
      </td></tr>
      <tr><td style="padding:20px;">
        <h3 style="margin-top:0; color:#111;">How to Send This Link to Your Buyers</h3>
        <p style="font-size:14px; color:#666;">Follow the instructions for your CRM or mailing platform:</p>
        <div style="margin:20px 0;"><h4 style="margin:0 0 8px; color:#00897b;">Reapit CRM</h4><ol style="margin:0; padding-left:18px; color:#555; font-size:14px; line-height:1.6;"><li>Log into <strong>Reapit</strong> and go to the <em>Contacts</em> tab.</li><li>Filter buyers by criteria (location, budget, property type).</li><li>Click <em>Save as List</em> and name your buyer group.</li><li>Choose <em>Email Buyers</em> and create a new email campaign.</li><li>Paste the Premarket link above into your email template and send.</li></ol></div>
        <div style="margin:20px 0;"><h4 style="margin:0 0 8px; color:#00897b;">Agentbox CRM</h4><ol style="margin:0; padding-left:18px; color:#555; font-size:14px; line-height:1.6;"><li>Log into <strong>Agentbox</strong> and open the <em>Contacts</em> section.</li><li>Use filters (suburb, price, property type) to segment your buyers.</li><li>Select <em>Add to Mailing List</em> and create a new buyer group.</li><li>Go to <em>Email Marketing</em>, choose the buyer group, and start a new campaign.</li><li>Insert the Premarket link above in your email body and send to buyers.</li></ol></div>
        <div style="margin:20px 0;"><h4 style="margin:0 0 8px; color:#00897b;">Mailchimp or Other Mailing Lists</h4><ol style="margin:0; padding-left:18px; color:#555; font-size:14px; line-height:1.6;"><li>Log into <strong>Mailchimp</strong> (or your email tool) and create/import your buyer list.</li><li>Create a new <em>Campaign</em> and select your buyer list.</li><li>Design the email template and add the Premarket link above as a call-to-action button or hyperlink.</li><li>Preview, test, and send the email to your buyers.</li></ol></div>
      </td></tr>
      <tr><td style="padding:20px; text-align:center; font-size:12px; color:#999; background:#fafafa; border-top:1px solid #eee;"><p style="margin:0;">&copy; ${new Date().getFullYear()} Premarket Australia. All rights reserved.</p></td></tr>
    </table>
  </body>
  </html>`;
  return sendEmail({ to: email, subject: `Here's your property link to share with buyers`, html });
}

export { getResend as resend };
