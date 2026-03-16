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

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const {
      contactPerson,
      contactEmail,
      contactPhone,
      totalAmount,
      ticketQuantity,
      participants,
      bookingRef
    } = req.body;

    // Validate required fields
    if (!contactPerson || !contactEmail || !contactPhone || !totalAmount || !ticketQuantity || !participants) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Generate booking reference if not provided
    const finalBookingRef = bookingRef || `YSD-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create booking document
    const bookingData = {
      bookingRef: finalBookingRef,
      contactPerson,
      contactEmail,
      contactPhone,
      totalAmount: parseFloat(totalAmount),
      ticketQuantity: parseInt(ticketQuantity),
      participants,
      paymentMethod: 'FPX',
      paymentStatus: 'pending',
      selectedBank: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore
    const docRef = await db.collection('bookings').add(bookingData);

    // Return success
    res.status(200).json({
      success: true,
      bookingId: docRef.id,
      bookingRef: finalBookingRef,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      details: error.message
    });
  }
}