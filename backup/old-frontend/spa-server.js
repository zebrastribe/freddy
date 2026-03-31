import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8016;

// Serve static files with correct MIME types
app.use(express.static('.', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// SPA routing - serve index.html for all routes except static assets
app.get('*', (req, res) => {
  const requestPath = req.path;
  
  // Check if this is a request for a static asset
  const staticAssetExtensions = ['.js', '.css', '.json', '.png', '.ico', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticAsset = staticAssetExtensions.some(ext => requestPath.endsWith(ext));
  
  if (isStaticAsset) {
    // For static assets, try to serve from the root directory
    const filePath = path.join(__dirname, requestPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    } else {
      // If not found, return 404
      return res.status(404).send('File not found');
    }
  }
  
  // For all other routes (SPA routes), serve index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Node.js SPA Server running on http://localhost:${PORT}`);
  console.log(`📱 Multi-user routes: /uid123/freddy/, /uid456/anna/, etc.`);
  console.log(`🏠 Home route: /`);
  console.log(`📁 Serving static files from: ${__dirname}`);
});

export default app; 