import axios from 'axios';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      bookingRef,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      bank,
      returnUrl
    } = req.body;

    // Validate required fields
    if (!bookingRef || !amount || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get booking from Firebase to verify it exists
    const bookingsRef = db.collection('bookings');
    const snapshot = await bookingsRef.where('bookingRef', '==', bookingRef).get();
    
    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const bookingDoc = snapshot.docs[0];
    const bookingData = bookingDoc.data();

    // Create bill with ToyyibPay
    const billData = {
      userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
      categoryCode: process.env.TOYYIBPAY_CATEGORY,
      billName: `YSD2026 Booking ${bookingRef}`,
      billDescription: `Tickets for YSD2026 UPM (${bookingData.ticketQuantity} tickets)`,
      billPriceSetting: 1,
      billPayorInfo: 1,
      billAmount: Math.round(amount * 100), // Convert to cents
      billReturnUrl: returnUrl || `${process.env.APP_URL}/payment-status.html`,
      billCallbackUrl: `${process.env.APP_URL}/api/fpx-webhook`,
      billExternalReferenceNo: bookingRef,
      billTo: customerName,
      billEmail: customerEmail,
      billPhone: customerPhone || '',
      billSplitPayment: 0,
      billSplitPaymentArgs: '',
      billPaymentChannel: 2, // 0 = all, 1 = FPX only, 2 = FPX + others
      billContentType: 'application/json',
      billChargeToCustomer: 1
    };

    // Call ToyyibPay API
    const response = await axios.post(
      `${process.env.TOYYIBPAY_API_URL || 'https://toyyibpay.com/'}index.php/api/createBill`,
      billData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data[0] || !response.data[0].BillCode) {
      throw new Error('Invalid response from ToyyibPay');
    }

    const billCode = response.data[0].BillCode;
    const paymentUrl = `${process.env.TOYYIBPAY_API_URL || 'https://toyyibpay.com/'}${billCode}`;

    // Save payment record to Firebase
    await db.collection('payments').add({
      bookingRef: bookingRef,
      amount: amount,
      bank: bank || 'FPX',
      billCode: billCode,
      paymentUrl: paymentUrl,
      status: 'pending',
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update booking with payment info
    await bookingDoc.ref.update({
      selectedBank: bank || 'FPX',
      paymentStatus: 'processing',
      billCode: billCode,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      paymentUrl: paymentUrl,
      billCode: billCode,
      bookingRef: bookingRef,
      message: 'FPX payment created successfully'
    });

  } catch (error) {
    console.error('FPX payment creation error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Payment creation failed',
      details: error.response?.data || error.message
    });
  }
}