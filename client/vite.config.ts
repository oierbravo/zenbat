import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// SPA routes that must serve index.html for document requests (not be proxied to API)
const SPA_ROUTES = new Set([
  '/', '/reload', '/componentes', '/stock', '/importar-componentes', '/export-componentes',
  '/componentes-reload', '/armarios', '/generar-armario', '/pedidos', '/pedidos-proveedores',
  '/historial',
])

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-fallback-before-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? ''
          const isDocumentRequest = req.method === 'GET' && req.headers.accept?.includes('text/html')
          const isSpaRoute = SPA_ROUTES.has(url) || url.startsWith('/componentes/') || url.startsWith('/armarios/') || url.startsWith('/pedidos/') || url.startsWith('/pedidos-proveedores/')
          if (isDocumentRequest && isSpaRoute) {
            req.url = '/index.html'
          }
          next()
        })
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/get-home-data': { target: 'http://localhost:3000', changeOrigin: true },
      '/leyenda': { target: 'http://localhost:3000', changeOrigin: true },
      '/reload-cli': { target: 'http://localhost:3000', changeOrigin: true },
      '/armarios': { target: 'http://localhost:3000', changeOrigin: true },
      '/componentes': { target: 'http://localhost:3000', changeOrigin: true },
      '/stock': { target: 'http://localhost:3000', changeOrigin: true },
      '/pedidos': { target: 'http://localhost:3000', changeOrigin: true },
      '/pedidos-proveedores': { target: 'http://localhost:3000', changeOrigin: true },
      '/pedidos-proveedores-ultimo': { target: 'http://localhost:3000', changeOrigin: true },
      '/pedidos-proveedores-existe': { target: 'http://localhost:3000', changeOrigin: true },
      '/historial': { target: 'http://localhost:3000', changeOrigin: true },
      '/proveedores': { target: 'http://localhost:3000', changeOrigin: true },
      '/almacenes': { target: 'http://localhost:3000', changeOrigin: true },
      '/generar-armario': { target: 'http://localhost:3000', changeOrigin: true },
      '/import': { target: 'http://localhost:3000', changeOrigin: true },
      '/export-componentes': { target: 'http://localhost:3000', changeOrigin: true },
      '/add-to-pedido-proveedor': { target: 'http://localhost:3000', changeOrigin: true },
      '/importar-componentes': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
