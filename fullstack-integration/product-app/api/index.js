// api/index.js
const express = require('express');
const cors = require('cors');

const app = express();

// Use CORS middleware to allow requests from the React app
app.use(cors());

// Sample product data
const products = [
  { id: 1, name: 'Laptop', price: 1200 },
  { id: 2, name: 'Mouse', price: 25 },
  { id: 3, name: 'Keyboard', price: 45 },
];

// Define the API endpoint
app.get('/api/products', (req, res) => {
  // Add a small delay to simulate a real network request
  setTimeout(() => {
    res.json(products);
  }, 500);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ API Server is running on http://localhost:${PORT}`);
});