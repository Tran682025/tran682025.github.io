// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.PI_API_KEY; // Lấy từ Pi Developer Portal
const BASE_URL = "https://api.minepi.com/v2/payments";

// 1. Approve Payment
app.post('/approve', async (req, res) => {
  const { paymentId } = req.body;
  try {
    const response = await fetch(`${BASE_URL}/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Complete Payment
app.post('/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  try {
    const response = await fetch(`${BASE_URL}/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send("Pi Guitar Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
