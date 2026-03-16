import axios from 'axios';

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
      to, 
      subject, 
      htmlContent, 
      bookingRef,
      contactPerson,
      totalAmount,
      ticketQuantity
    } = req.body;

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email fields'
      });
    }

    // Email configuration for Brevo
    const emailData = {
      sender: {
        name: process.env.FROM_NAME || 'YSD2026 UPM',
        email: process.env.FROM_EMAIL || 'ysd@upm.edu.my'
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
      headers: {
        'X-Booking-Ref': bookingRef || ''
      }
    };

    // Add reply-to if needed
    if (process.env.REPLY_TO_EMAIL) {
      emailData.replyTo = { email: process.env.REPLY_TO_EMAIL };
    }

    // Send via Brevo API
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Log for monitoring
    console.log(`Email sent to ${to} for booking ${bookingRef}: ${response.data.messageId}`);

    res.status(200).json({
      success: true,
      messageId: response.data.messageId,
      bookingRef: bookingRef,
      message: 'Confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Brevo API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.response?.data || error.message
    });
  }
}