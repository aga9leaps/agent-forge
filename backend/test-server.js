import express from 'express';
const app = express();

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test successful' });
});

// Start server without problematic routes
app.listen(3000, () => {
  console.log('Test server running on port 3000');
});