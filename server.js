const express = require('express');
const path = require('path');
const app = express();

// Dùng thư mục 'public' để chứa các file HTML, JS, CSS
app.use(express.static(path.join(__dirname, 'public')));

// Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Port 10000 hoặc theo môi trường
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
