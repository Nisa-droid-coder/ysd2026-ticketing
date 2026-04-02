// api/create-booking.js
import { db } from './config.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://ysd2026-register.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Make sure we always return JSON, even on errors
  try {
    console.log('📥 Received booking request');
    
    // Check if db is initialized
    if (!db) {
      console.error('❌ Firestore db not initialized');
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const {
      contactPerson,
      contactEmail,
      contactPhone,
      totalAmount,
      ticketQuantity,
      participants,
    } = req.body;

    // Validate required fields
    if (!contactPerson || !contactEmail || !contactPhone || !totalAmount || !ticketQuantity || !participants) {
      console.log('❌ Missing fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique booking reference
    const bookingRef = `YSD${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const bookingData = {
      bookingRef,
      contactPerson,
      contactEmail,
      contactPhone,
      totalAmount: parseFloat(totalAmount),
      ticketQuantity: parseInt(ticketQuantity),
      participants,
      paymentMethod: 'UPM Payment Gateway',
      paymentStatus: 'pending',
      attendance: [],
      certificates: [],
      evidenceUploaded: false,
      evidenceFileName: null,
      evidenceData: null,
      evidenceUploadedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('📝 Saving booking to Firestore:', bookingRef);
    
    const docRef = await db.collection('bookings').add(bookingData);
    
    console.log(`✅ Booking created: ${bookingRef} (ID: ${docRef.id})`);

    return res.status(200).json({
      success: true,
      bookingId: docRef.id,
      bookingRef,
      totalAmount: bookingData.totalAmount,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    // Always return a proper JSON response
    return res.status(500).json({ 
      error: 'Failed to create booking', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}