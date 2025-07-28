const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Root route -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Default test route
app.get('/api', (req, res) => {
  res.send('Pi Guitar Backend is running!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
