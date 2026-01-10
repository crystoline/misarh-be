import { Router } from 'express';
import crypto from 'crypto';
import { createOrder } from '../controllers/orders.controller';

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
      const { reference, customer, amount, metadata } = event.data;

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

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleOrderPayment(reference: string, customerEmail: string) {
  try {
    // Get cart items for this customer
    // Create order
    // Clear cart
    // Send email confirmation
    console.log(`Processing order payment: ${reference} for ${customerEmail}`);
  } catch (error) {
    console.error('Order payment handling failed:', error);
    throw error;
  }
}

async function handleConsultationPayment(reference: string, metadata: any) {
  try {
    // Update consultation status to confirmed
    // Send booking confirmation email
    console.log(`Processing consultation payment: ${reference}`);
  } catch (error) {
    console.error('Consultation payment handling failed:', error);
    throw error;
  }
}

export default router;
