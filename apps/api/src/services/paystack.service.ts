import axios from 'axios';
// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️ PAYSTACK_SECRET_KEY not configured');
}

/**
 * Initialize Paystack payment
 */
export const initializePayment = async (paymentData: {
  email: string;
  amount: number; // Amount in kobo (multiply Naira by 100)
  reference: string;
  callback_url?: string;
  metadata?: any;
}) => {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: paymentData.email,
        amount: paymentData.amount,
        reference: paymentData.reference,
        callback_url: paymentData.callback_url,
        metadata: paymentData.metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    throw new Error('Failed to initialize payment');
  }
};

/**
 * Verify Paystack payment
 */
export const verifyPayment = async (reference: string) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    throw new Error('Failed to verify payment');
  }
};

/**
 * Create payment link for orders
 */
export const createPaymentLink = async (orderData: {
  orderId: string;
  customerEmail: string;
  amount: number; // Amount in Naira
  type: 'order' | 'consultation';
  metadata?: any;
}) => {
  const amountInKobo = Math.round(orderData.amount * 100); // Convert to kobo

  const paymentData = {
    email: orderData.customerEmail,
    amount: amountInKobo,
    reference: orderData.orderId,
    callback_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment/callback`,
    metadata: {
      type: orderData.type,
      order_id: orderData.orderId,
      ...orderData.metadata,
    },
  };

  const result = await initializePayment(paymentData);

  return {
    paymentUrl: result.data.authorization_url,
    reference: result.data.reference,
    accessCode: result.data.access_code,
  };
};

export default { initializePayment, verifyPayment, createPaymentLink };