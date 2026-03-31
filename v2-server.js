import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8080

const frontendDir = existsSync(path.join(__dirname, 'trace', 'v2-frontend', 'index.html'))
  ? path.join(__dirname, 'trace', 'v2-frontend')
  : path.join(__dirname, 'v2-frontend')
const adminDir = existsSync(path.join(__dirname, 'trace', 'v2-frontend', 'src', 'features', 'admin', 'index.html'))
  ? path.join(__dirname, 'trace', 'v2-frontend', 'src', 'features', 'admin')
  : (existsSync(path.join(__dirname, 'trace', 'admin', 'index.html'))
    ? path.join(__dirname, 'trace', 'admin')
    : path.join(__dirname, 'admin'))

// Serve static files from v2-frontend
app.use(express.static(frontendDir))

// Serve static files from v2-frontend/public
app.use(express.static(path.join(frontendDir, 'public')))

// Serve Tailwind CSS
app.use('/styles', express.static(path.join(frontendDir, 'styles')))

// Serve admin panel from admin folder
app.use('/admin', express.static(adminDir))

// Handle all routes for SPA
app.get('*', (req, res) => {
  // Serve admin routes from admin folder
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(adminDir, 'index.html'))
  } else {
    // Serve v2 frontend for all other routes
    res.sendFile(path.join(frontendDir, 'index.html'))
  }
})

app.listen(PORT, () => {
  console.log(`🚀 V2 Frontend Server running on http://localhost:${PORT}`)
  console.log(`📱 Serving V2 frontend from: ${frontendDir}`)
  console.log(`🏠 Home route: /`)
  console.log(`🗺️ Map route: /map`)
  console.log(`📍 Checkin route: /checkin`)
  console.log(`📊 History route: /history`)
  console.log(`👤 User routes: /user/:userId`)
  console.log(`🐾 Pet routes: /user/:userId/pet/:petName`)
  console.log(`⚙️ Admin route: /admin`)
})

export default app 