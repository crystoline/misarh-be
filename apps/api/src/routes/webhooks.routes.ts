import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../config/database';
import { sendEmail } from '../services/email.service';

const router = Router();

/**
 * Paystack Webhook Handler
 * Receives payment confirmations from Paystack
 */
router.post('/paystack', async (req, res) => {
  try {
    // Verify Paystack signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // Handle successful charge
    if (event.event === 'charge.success') {
      const { reference, customer,  metadata } = event.data;

      console.log('Payment successful:', reference);

      // Determine payment type (order or consultation)
      const paymentType = metadata?.type || 'order';

      if (paymentType === 'order') {
        // Create order from cart
        await handleOrderPayment(reference, customer.email);
      } else if (paymentType === 'consultation') {
        // Confirm consultation booking
        await handleConsultationPayment(reference, metadata);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleOrderPayment(reference: string, customerEmail: string) {
  try {
    // Update order payment status
    const orderResult = await query(
      `UPDATE orders
       SET payment_status = 'successful', status = 'processing', updated_at = CURRENT_TIMESTAMP
       WHERE order_number = $1
       RETURNING *`,
      [reference]
    );

    if (orderResult.rowCount === 0) {
      throw new Error(`Order ${reference} not found`);
    }

    const order = orderResult.rows[0];

    // Get order items for email
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    // Send order confirmation email
    await sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${reference}`,
      template: 'order-confirmation',
      data: {
        customerName: order.shipping_address?.full_name || 'Valued Customer',
        orderId: reference,
        items: itemsResult.rows.map((item: any) => ({
          product_name: item.product_name,
          size: item.size,
          quantity: item.quantity,
          total: item.total_price,
        })),
        subtotal: order.subtotal,
        shippingFee: 0, // Add shipping calculation if needed
        total: order.total,
        shippingAddress: order.shipping_address,
      },
    });

    console.log(`✅ Order ${reference} payment processed successfully`);
  } catch (error) {
    console.error('Order payment handling failed:', error);
    throw error;
  }
}

async function handleConsultationPayment(reference: string, metadata: any) {
  try {
    // Update consultation status to confirmed
    const consultationResult = await query(
      `UPDATE consultations
       SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE consultation_number = $1
       RETURNING *`,
      [reference]
    );

    if (consultationResult.rowCount === 0) {
      throw new Error(`Consultation ${reference} not found`);
    }

    const consultation = consultationResult.rows[0];

    // Get customer email from metadata or consultation
    const customerEmail = metadata?.customer_email || consultation.customer_email;

    // Send consultation confirmation email
    await sendEmail({
      to: customerEmail,
      subject: `Consultation Booking Confirmed - ${reference}`,
      template: 'consultation-booking',
      data: {
        customerName: 'Valued Customer', // You might want to get this from customer table
        consultationId: reference,
        date: consultation.date,
        timeSlot: consultation.time_slot,
        bookingFee: consultation.booking_fee,
        aiProfile: consultation.ai_profile, // This might be JSON, format accordingly
      },
    });

    console.log(`✅ Consultation ${reference} payment processed successfully`);
  } catch (error) {
    console.error('Consultation payment handling failed:', error);
    throw error;
  }
}

export default router;
