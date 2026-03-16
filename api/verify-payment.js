import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { bookingRef, billCode } = req.query || req.body;

    if (!bookingRef && !billCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing booking reference or bill code'
      });
    }

    let bookingData = null;
    let paymentData = null;

    // Find booking
    if (bookingRef) {
      const bookingsRef = db.collection('bookings');
      const snapshot = await bookingsRef.where('bookingRef', '==', bookingRef).get();
      
      if (!snapshot.empty) {
        bookingData = snapshot.docs[0].data();
      }
    }

    // Find payment
    if (billCode) {
      const paymentsRef = db.collection('payments');
      const snapshot = await paymentsRef.where('billCode', '==', billCode).get();
      
      if (!snapshot.empty) {
        paymentData = snapshot.docs[0].data();
      }
    }

    // If we have billCode but no payment data, check with ToyyibPay
    if (billCode && !paymentData) {
      try {
        const response = await axios.post(
          `${process.env.TOYYIBPAY_API_URL}index.php/api/getBillTransactions`,
          {
            userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
            billCode: billCode
          }
        );

        if (response.data && response.data.length > 0) {
          const transaction = response.data[0];
          paymentData = {
            status: transaction.billpaymentStatus === '1' ? 'paid' : 'pending',
            amount: parseFloat(transaction.billAmount) / 100,
            transactionId: transaction.transaction_id
          };
        }
      } catch (error) {
        console.error('Error checking ToyyibPay:', error);
      }
    }

    res.status(200).json({
      success: true,
      booking: bookingData ? {
        bookingRef: bookingData.bookingRef,
        contactPerson: bookingData.contactPerson,
        contactEmail: bookingData.contactEmail,
        totalAmount: bookingData.totalAmount,
        ticketQuantity: bookingData.ticketQuantity,
        paymentStatus: bookingData.paymentStatus,
        participants: bookingData.participants
      } : null,
      payment: paymentData ? {
        status: paymentData.status,
        amount: paymentData.amount,
        transactionId: paymentData.transactionId
      } : null
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      details: error.message
    });
  }
}