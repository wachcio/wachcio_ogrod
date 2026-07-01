import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// server.host: true - żeby Vite nasłuchiwał na 0.0.0.0, a nie tylko
// localhost wewnątrz kontenera (inaczej port 5173 nie byłby osiągalny
// spoza kontenera mimo przekierowania portu w docker-compose).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
