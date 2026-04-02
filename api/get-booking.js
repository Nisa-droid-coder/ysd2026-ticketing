// api/get-booking.js
import { db } from './config.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://ysd2026-register.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, bookingRef } = req.query;

    if (!bookingId && !bookingRef) {
      return res.status(400).json({ error: 'Missing booking identifier' });
    }

    let doc = null;
    
    if (bookingId) {
      const snapshot = await db.collection('bookings').doc(bookingId).get();
      if (snapshot.exists) {
        doc = { id: snapshot.id, ...snapshot.data() };
      }
    } else if (bookingRef) {
      const snapshot = await db.collection('bookings').where('bookingRef', '==', bookingRef).limit(1).get();
      if (!snapshot.empty) {
        const snapDoc = snapshot.docs[0];
        doc = { id: snapDoc.id, ...snapDoc.data() };
      }
    }

    if (!doc) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Remove sensitive data
    delete doc.evidenceData;

    res.status(200).json({ success: true, booking: doc });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}