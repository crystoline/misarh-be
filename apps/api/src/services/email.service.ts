import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@misarh.com';

/**
 * Send email using SendGrid
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  try {
    const htmlContent = renderTemplate(emailData.template, emailData.data);

    const msg = {
      to: emailData.to,
      from: FROM_EMAIL,
      subject: emailData.subject,
      html: htmlContent
    };

    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      console.log(`Email sent to ${emailData.to}`);
    } else {
      console.log('SendGrid not configured. Email would be sent:', msg);
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

/**
 * Render email template
 */
function renderTemplate(template: string, data: any): string {
  switch (template) {
    case 'order-confirmation':
      return renderOrderConfirmation(data);
    case 'consultation-booking':
      return renderConsultationBooking(data);
    case 'shipping-notification':
      return renderShippingNotification(data);
    default:
      return '<p>Email content</p>';
  }
}

/**
 * Order confirmation email template
 */
function renderOrderConfirmation(data: any): string {
  const itemsHtml = data.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product_name || 'Product'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.size} × ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₦${item.total.toLocaleString()}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c2c2c; color: #b8985f; padding: 30px; text-align: center; }
        .content { background: #fff; padding: 30px; }
        .footer { background: #f8f5f0; padding: 20px; text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total { font-weight: bold; font-size: 18px; color: #b8985f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MISARH</h1>
          <p>Order Confirmation</p>
        </div>
        <div class="content">
          <h2>Thank you, ${data.customerName}!</h2>
          <p>Your order has been confirmed and will be processed shortly.</p>
          
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          
          <h3>Order Summary</h3>
          <table>
            <thead>
              <tr style="background: #f8f5f0;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: left;">Details</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding: 10px; border-top: 2px solid #2c2c2c;"><strong>Subtotal</strong></td>
                <td style="padding: 10px; border-top: 2px solid #2c2c2c; text-align: right;">₦${data.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px;">Shipping</td>
                <td style="padding: 10px; text-align: right;">₦${data.shippingFee.toLocaleString()}</td>
              </tr>
              <tr class="total">
                <td colspan="2" style="padding: 10px; border-top: 1px solid #eee;">Total</td>
                <td style="padding: 10px; border-top: 1px solid #eee; text-align: right;">₦${data.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <h3>Shipping Address</h3>
          <p>
            ${data.shippingAddress.full_name}<br>
            ${data.shippingAddress.address_line1}<br>
            ${data.shippingAddress.city}, ${data.shippingAddress.state}<br>
            ${data.shippingAddress.country}
          </p>
          
          <p>We'll send you another email when your order ships.</p>
        </div>
        <div class="footer">
          <p>© 2026 MISARH. All rights reserved.</p>
          <p>Questions? Contact us at hello@misarh.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Consultation booking email template
 */
function renderConsultationBooking(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c2c2c; color: #b8985f; padding: 30px; text-align: center; }
        .content { background: #fff; padding: 30px; }
        .footer { background: #f8f5f0; padding: 20px; text-align: center; font-size: 12px; }
        .highlight { background: #f8f5f0; padding: 15px; border-left: 4px solid #b8985f; margin: 20px 0; }
        .scent-profile { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MISARH</h1>
          <p>Consultation Confirmed</p>
        </div>
        <div class="content">
          <h2>Your scent journey begins, ${data.customerName}!</h2>
          <p>We're excited to craft your perfect fragrance.</p>
          
          <div class="highlight">
            <h3>📅 Your Appointment</h3>
            <p>
              <strong>Date:</strong> ${data.date}<br>
              <strong>Time:</strong> ${data.time}<br>
              <strong>Location:</strong> MISARH Studio, Ajah, Lagos<br>
              <strong>Booking ID:</strong> ${data.bookingId}
            </p>
          </div>
          
          <div class="scent-profile">
            <h3>Your Scent Profile</h3>
            <p><strong>Dominant Family:</strong> ${data.aiProfile.dominantFamily}</p>
            <p><strong>Top Notes:</strong> ${data.aiProfile.recommendedTop.join(', ')}</p>
            <p><strong>Heart Notes:</strong> ${data.aiProfile.recommendedHeart.join(', ')}</p>
            <p><strong>Base Notes:</strong> ${data.aiProfile.recommendedBase.join(', ')}</p>
            <p><em>${data.aiProfile.personality}</em></p>
          </div>
          
          <h3>What to Expect</h3>
          <ul>
            <li>Duration: 60-90 minutes</li>
            <li>We'll explore your scent preferences</li>
            <li>Create your custom fragrance formula</li>
            <li>Take home a sample to test</li>
          </ul>
          
          <p><strong>Please arrive 10 minutes early.</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 MISARH. All rights reserved.</p>
          <p>Need to reschedule? Contact us at hello@misarh.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Shipping notification email template
 */
function renderShippingNotification(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c2c2c; color: #b8985f; padding: 30px; text-align: center; }
        .content { background: #fff; padding: 30px; }
        .footer { background: #f8f5f0; padding: 20px; text-align: center; font-size: 12px; }
        .tracking { background: #f8f5f0; padding: 20px; text-align: center; margin: 20px 0; }
        .tracking-number { font-size: 24px; font-weight: bold; color: #b8985f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MISARH</h1>
          <p>Your Order Has Shipped! 📦</p>
        </div>
        <div class="content">
          <h2>Good news, ${data.customerName}!</h2>
          <p>Your MISARH fragrance is on its way to you.</p>
          
          <div class="tracking">
            <p><strong>Tracking Number</strong></p>
            <p class="tracking-number">${data.trackingNumber}</p>
          </div>
          
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
          
          <p>You can track your package using the tracking number above.</p>
        </div>
        <div class="footer">
          <p>© 2026 MISARH. All rights reserved.</p>
          <p>Questions? Contact us at hello@misarh.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
