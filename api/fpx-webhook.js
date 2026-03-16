import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

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
  // ToyyibPay sends POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the webhook data for debugging
    console.log('FPX Webhook received:', JSON.stringify(req.body, null, 2));

    const {
      billcode,
      order_id,
      transaction_id,
      billpaymentStatus,
      billexternalReferenceno,
      amount,
      bill_name,
      bill_email,
      bill_phone
    } = req.body;

    // Verify the payment status
    const isSuccess = billpaymentStatus === '1'; // 1 = success, 0 = failed
    
    // Get booking reference
    const bookingRef = billexternalReferenceno || order_id;

    if (!bookingRef) {
      console.error('No booking reference in webhook');
      return res.status(400).json({ error: 'Missing booking reference' });
    }

    // Find the booking
    const bookingsRef = db.collection('bookings');
    const snapshot = await bookingsRef.where('bookingRef', '==', bookingRef).get();
    
    if (snapshot.empty) {
      console.error(`Booking not found: ${bookingRef}`);
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingDoc = snapshot.docs[0];

    // Update booking status
    await bookingDoc.ref.update({
      paymentStatus: isSuccess ? 'paid' : 'failed',
      transactionId: transaction_id || billcode,
      updatedAt: new Date().toISOString()
    });

    // Update or create payment record
    const paymentsRef = db.collection('payments');
    const paymentSnapshot = await paymentsRef.where('billCode', '==', billcode).get();

    if (!paymentSnapshot.empty) {
      const paymentDoc = paymentSnapshot.docs[0];
      await paymentDoc.ref.update({
        status: isSuccess ? 'paid' : 'failed',
        transactionId: transaction_id,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new payment record
      await paymentsRef.add({
        bookingRef: bookingRef,
        billCode: billcode,
        transactionId: transaction_id,
        amount: parseFloat(amount) / 100, // Convert from cents
        status: isSuccess ? 'paid' : 'failed',
        customerName: bill_name,
        customerEmail: bill_email,
        customerPhone: bill_phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // If payment successful, send confirmation email
    if (isSuccess) {
      await sendPaymentConfirmation(bookingRef, bookingDoc.data());
    }

    // Always return success to ToyyibPay
    res.status(200).json({ status: 'OK' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to acknowledge receipt
    res.status(200).json({ status: 'Received with errors' });
  }
}

async function sendPaymentConfirmation(bookingRef, bookingData) {
  try {
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; max-width: 600px; margin: 0 auto; }
          .booking-ref { font-size: 24px; color: #4CAF50; font-weight: bold; margin: 20px 0; }
          .details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>YSD2026 UPM</h1>
          <h2>Payment Confirmation</h2>
        </div>
        <div class="content">
          <p>Dear ${bookingData.contactPerson},</p>
          <p>Thank you for your payment! Your booking for YSD2026 has been confirmed.</p>
          
          <div class="booking-ref">${bookingRef}</div>
          
          <div class="details">
            <h3>Booking Details:</h3>
            <table>
              <tr>
                <th>Tickets:</th>
                <td>${bookingData.ticketQuantity} × Youth Sports Day Entry</td>
              </tr>
              <tr>
                <th>Total Paid:</th>
                <td><strong>RM ${bookingData.totalAmount.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <th>Payment Method:</th>
                <td>FPX (Online Banking)</td>
              </tr>
              <tr>
                <th>Payment Status:</th>
                <td><span style="color: #4CAF50; font-weight: bold;">PAID</span></td>
              </tr>
            </table>
          </div>
          
          <h3>Participants:</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              ${bookingData.participants.map(p => `
                <tr>
                  <td>${p.number}</td>
                  <td>${p.name}</td>
                  <td>${p.age}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p style="margin-top: 30px;">
            <strong>Event Details:</strong><br>
            📅 Date: 13th June 2026<br>
            ⏰ Time: 9:00 AM - 4:30 PM<br>
            📍 Venue: Universiti Putra Malaysia, Serdang<br>
          </p>
          
          <p>Please bring this confirmation (printed or digital) to the event for check-in.</p>
          <p>We look forward to seeing you at YSD2026!</p>
        </div>
        <div class="footer">
          <p>For inquiries: ysd@upm.edu.my | Tel: 03-1234 5678</p>
          <p>© 2026 Universiti Putra Malaysia</p>
        </div>
      </body>
      </html>
    `;

    await axios.post(`${process.env.APP_URL}/api/send-confirmation`, {
      to: bookingData.contactEmail,
      subject: `Payment Confirmed - YSD2026 Booking ${bookingRef}`,
      htmlContent: emailContent,
      bookingRef: bookingRef
    });

  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
  }
}