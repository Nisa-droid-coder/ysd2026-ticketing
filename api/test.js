// api/test.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Check environment variables (safe - just shows if set, not values)
  const envStatus = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing',
  };
  
  // Try to initialize Firebase Admin and check if db works
  let firebaseStatus = 'Not initialized';
  try {
    const { db } = await import('./config.js');
    if (db) {
      firebaseStatus = '✅ Firebase working';
      // Try a simple test query
      const testQuery = await db.collection('bookings').limit(1).get();
      firebaseStatus += ' - Query successful';
    }
  } catch (error) {
    firebaseStatus = `❌ Firebase error: ${error.message}`;
  }
  
  res.status(200).json({
    success: true,
    environment: envStatus,
    firebase: firebaseStatus,
    timestamp: new Date().toISOString()
  });
}