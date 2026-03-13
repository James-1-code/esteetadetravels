const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  // Verify connection on creation (log any issues)
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Connection Error:', error.message);
    } else {
      console.log('✅ SMTP Server is ready to take our messages');
    }
  });
  
  return transporter;
};

// Email templates
const templates = {
  welcome: (data) => ({
    subject: `Welcome to Esteetade Travels, ${data.firstName}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px; }
          .content h2 { color: #0f172a; margin-top: 0; }
          .content p { color: #64748b; line-height: 1.6; }
          .button { display: inline-block; background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .features { background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; }
          .features li { color: #475569; margin: 8px 0; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ Esteetade Travels</h1>
          </div>
          <div class="content">
            <h2>Welcome aboard, ${data.firstName}!</h2>
            <p>Thank you for joining Esteetade Travels. We're excited to help you achieve your travel dreams!</p>
            
            <div class="features">
              <h3 style="margin-top: 0; color: #0f172a;">What you can do:</h3>
              <ul>
                <li>🎓 Apply for study abroad programs</li>
                <li>💼 Process work visas</li>
                <li>✈️ Book flights worldwide</li>
                <li>🏨 Reserve hotels</li>
                <li>📄 Create professional CVs</li>
              </ul>
            </div>
            
            <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
            
            <p style="margin-top: 24px;">If you have any questions, our support team is here to help 24/7.</p>
          </div>
          <div class="footer">
            <p>Esteetade Travels | Your Global Travel Partner</p>
            <p style="font-size: 12px;">This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  applicationSubmitted: (data) => ({
    subject: `Application Submitted - ${data.applicationType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 40px; }
          .details { background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #64748b; }
          .detail-value { color: #0f172a; font-weight: 600; }
          .button { display: inline-block; background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Application Received</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.firstName},</h2>
            <p>Your application has been submitted successfully! Here are the details:</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Application ID</span>
                <span class="detail-value">${data.applicationId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service Type</span>
                <span class="detail-value">${data.applicationType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="detail-value">${data.currency} ${data.amount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value" style="color: #f59e0b;">Pending</span>
              </div>
            </div>
            
            <p>You can track your application progress anytime:</p>
            <a href="${data.trackUrl}" class="button">Track Application</a>
            
            <p style="margin-top: 24px;">We'll notify you of any updates.</p>
          </div>
          <div class="footer">
            <p>Esteetade Travels | Your Global Travel Partner</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  applicationStatusUpdate: (data) => ({
    subject: `Application Update - ${data.status.toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: ${data.status === 'approved' || data.status === 'completed' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : data.status === 'rejected' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #0a9396 0%, #005f73 100%)'}; padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 40px; }
          .status-badge { display: inline-block; padding: 12px 24px; border-radius: 24px; font-weight: 600; text-transform: uppercase; font-size: 14px; margin: 16px 0; ${data.status === 'approved' || data.status === 'completed' ? 'background: #d1fae5; color: #065f46;' : data.status === 'rejected' ? 'background: #fee2e2; color: #991b1b;' : 'background: #fef3c7; color: #92400e;'} }
          .button { display: inline-block; background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Update</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.firstName},</h2>
            <p>There's an update on your application:</p>
            
            <div style="text-align: center;">
              <div class="status-badge">${data.status}</div>
            </div>
            
            <p><strong>Application:</strong> ${data.applicationType}</p>
            <p><strong>Progress:</strong> ${data.progress}%</p>
            
            ${data.notes ? `<p style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;"><strong>Note:</strong> ${data.notes}</p>` : ''}
            
            <a href="${data.trackUrl}" class="button">View Details</a>
          </div>
          <div class="footer">
            <p>Esteetade Travels | Your Global Travel Partner</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  paymentReceipt: (data) => ({
    subject: `Payment Receipt - ${data.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 40px; }
          .receipt { background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px dashed #cbd5e1; }
          .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
          .receipt-row:last-child { border-bottom: none; }
          .total { font-size: 24px; font-weight: 700; color: #0f172a; }
          .button { display: inline-block; background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful</h1>
          </div>
          <div class="content">
            <h2>Thank you, ${data.firstName}!</h2>
            <p>Your payment has been received. Here's your receipt:</p>
            
            <div class="receipt">
              <div class="receipt-row">
                <span>Invoice Number</span>
                <span style="font-weight: 600;">${data.invoiceNumber}</span>
              </div>
              <div class="receipt-row">
                <span>Service</span>
                <span style="font-weight: 600;">${data.applicationType}</span>
              </div>
              <div class="receipt-row">
                <span>Payment Method</span>
                <span style="font-weight: 600;">${data.paymentMethod || 'Card'}</span>
              </div>
              <div class="receipt-row">
                <span>Date</span>
                <span style="font-weight: 600;">${new Date(data.paidAt).toLocaleDateString()}</span>
              </div>
              <div class="receipt-row" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #0a9396;">
                <span class="total">Total Paid</span>
                <span class="total" style="color: #0a9396;">${data.currency} ${data.amount.toLocaleString()}</span>
              </div>
            </div>
            
            <a href="${data.receiptUrl}" class="button">Download Receipt</a>
          </div>
          <div class="footer">
            <p>Esteetade Travels | Your Global Travel Partner</p>
            <p style="font-size: 12px;">Transaction Reference: ${data.paymentReference}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  agentApproved: (data) => ({
    subject: '🎉 Your Agent Account is Approved!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #d4af37 0%, #b8941d 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 40px; }
          .referral-code { background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
          .referral-code h3 { margin: 0 0 8px 0; font-size: 14px; opacity: 0.9; }
          .referral-code .code { font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 2px; }
          .button { display: inline-block; background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.firstName},</h2>
            <p>Great news! Your agent account has been approved. You can now start referring clients and earning commissions.</p>
            
            <div class="referral-code">
              <h3>YOUR REFERRAL CODE</h3>
              <div class="code">${data.referralCode}</div>
            </div>
            
            <p>Share this code with clients to earn commissions on their applications.</p>
            
            <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>Esteetade Travels | Your Global Travel Partner</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 40px; }
          .button { display: inline-block; background: linear-gradient(135deg, #0a9396 0%, #005f73 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .warning { background: #fef3c7; padding: 16px; border-radius: 8px; color: #92400e; margin: 16px 0; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.firstName},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>⚠️ This link expires in 1 hour.</strong>
            </div>
            
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>Esteetade Travels | Your Global Travel Partner</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email - supports both formats:
// 1. sendEmail(to, template, data) - using templates
// 2. sendEmail({ to, subject, html }) - direct content
const sendEmail = async (to, template, data) => {
  // Check if SMTP credentials are set
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    console.error('❌ SMTP credentials not configured!');
    console.error('   SMTP_USER:', smtpUser ? '✓ set' : '✗ MISSING');
    console.error('   SMTP_PASS:', smtpPass ? '✓ set' : '✗ MISSING');
    console.error('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
  }
  
  // Check if first argument is an object (direct content format)
  if (typeof to === 'object' && to.to && (to.subject || to.html)) {
    const emailOptions = to;
    try {
      const transporter = createTransporter();

      console.log(`📧 Sending email to: ${emailOptions.to}`);
      console.log(`   Subject: ${emailOptions.subject}`);

      const info = await transporter.sendMail({
        from: `"Esteetade Travels" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
      });

      console.log(`✅ Email sent successfully: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error response:', error.response);
      return { success: false, error: error.message };
    }
  }

  // Original template-based format
  try {
    const transporter = createTransporter();
    const emailContent = templates[template](data);

    const info = await transporter.sendMail({
      from: `"Esteetade Travels" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
const sendBulkEmails = async (recipients, template, dataGenerator) => {
  const results = [];
  
  for (const recipient of recipients) {
    const data = dataGenerator(recipient);
    const result = await sendEmail(recipient.email, template, data);
    results.push({ email: recipient.email, ...result });
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  templates,
};
