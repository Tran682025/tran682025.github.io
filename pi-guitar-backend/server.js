// server.js  (BACKEND – đặt trong pi-guitar-backend hoặc repo backend mà Trẫm muốn)
// Chức năng: nhận paymentId từ frontend, gọi Pi API để approve + complete.

const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

const PI_API_URL = 'https://api.minepi.com/v2';
const PI_API_KEY = process.env.PI_API_KEY;   // Server API Key từ Pi Dev Portal
const PI_APP_ID  = process.env.PI_APP_ID;    // App ID của Musickingdom

if (!PI_API_KEY || !PI_APP_ID) {
  console.error('Thiếu PI_API_KEY hoặc PI_APP_ID trong .env');
}

// Helper gọi API Pi
async function callPi(endpoint, method = 'POST', body = null) {
  const res = await fetch(`${PI_API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // TÙY DOC PI MỚI: có thể là "Key" hoặc "Bearer". Trẫm check lại docs và sửa cho đúng.
      'Authorization': `Key ${PI_API_KEY}`,
      'X-APP-ID': PI_APP_ID
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pi API ${endpoint} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Endpoint: APPROVE + COMPLETE một payment
app.post('/pay/approve-complete', async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'missing paymentId' });
    }

    console.log('▶ approve-complete cho payment', paymentId);

    // 1) APPROVE
    const approved = await callPi(`/payments/${paymentId}/approve`, 'POST');
    console.log('✔ approved', approved.identifier);

    // 2) COMPLETE
    const completed = await callPi(`/payments/${paymentId}/complete`, 'POST');
    console.log('✔ completed', completed.identifier);

    res.json({
      ok: true,
      approved: approved.identifier,
      completed: completed.identifier
    });
  } catch (err) {
    console.error('❌ approve-complete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Backend Pi payment listening on port', PORT);
});
