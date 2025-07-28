const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Dẫn đến các file tĩnh như CSS, JS, ảnh
app.use(express.static(path.join(__dirname)));

// Trả về file index.html khi truy cập root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Cho phép truy cập thư mục con (vd: /guitar/)
app.get('/guitar/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'guitar', req.params.file));
});

app.listen(PORT, () => {
  console.log(`>>> Server is running at http://localhost:${PORT}`);
});
