import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRouter = express.Router();

// Serve static files from frontend build directory
const frontendBuildPath = path.join(__dirname, '../../../frontend/dist');

// Serve static assets
frontendRouter.use(express.static(frontendBuildPath));

// Serve index.html for all non-API routes (SPA support)
frontendRouter.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

export default frontendRouter;