// api/upload-evidence.js
import { db } from './config.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://ysd2026-register.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, evidenceFileBase64, fileName } = req.body;

    if (!bookingId || !evidenceFileBase64 || !fileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate file size (1MB limit)
    const base64Size = evidenceFileBase64.length * 0.75;
    if (base64Size > 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 1MB' });
    }

    // Update the booking
    const bookingRef = db.collection('bookings').doc(bookingId);
    await bookingRef.update({
      evidenceUploaded: true,
      evidenceFileName: fileName,
      evidenceData: evidenceFileBase64,
      evidenceUploadedAt: new Date().toISOString(),
      paymentStatus: 'evidence_uploaded',
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Evidence uploaded for booking: ${bookingId}`);

    res.status(200).json({ 
      success: true, 
      message: 'Evidence uploaded successfully' 
    });

  } catch (error) {
    console.error('Error uploading evidence:', error);
    res.status(500).json({ error: 'Failed to upload evidence', details: error.message });
  }
}