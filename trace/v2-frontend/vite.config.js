import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/messaging']
        }
      }
    }
  },
  server: {
    port: 8016,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
    middlewareMode: false,
    setupMiddlewares: (middlewares, devServer) => {
      middlewares.use('/admin', (req, res, next) => {
        const url = req.url.split('?')[0]
        const adminPath = resolve(__dirname, './src/features/admin')
        let filePath = adminPath + url.replace(/^\/admin/, '')
        if (url === '/' || url === '') filePath = adminPath + '/index.html'
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Cache-Control', 'no-cache')
          fs.createReadStream(filePath).pipe(res)
        } else if (fs.existsSync(adminPath + '/index.html')) {
          res.setHeader('Cache-Control', 'no-cache')
          fs.createReadStream(adminPath + '/index.html').pipe(res)
        } else {
          next()
        }
      })
      return middlewares
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/messaging']
  },
  plugins: []
}) 