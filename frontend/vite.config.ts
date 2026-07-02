import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite domyślnie blokuje requesty z nagłówkiem Host innym niż
// localhost/127.0.0.1/skonfigurowany host (ochrona przed DNS rebinding) -
// przy dostępie spod własnej domeny/hostname (np. ogrod.wachcio.dom
// wskazujący na kontener LXC) trzeba go jawnie dopisać do allowedHosts.
// Nieustawione VITE_ALLOWED_HOSTS = zachowanie domyślne Vite (localhost/IP).
const rawAllowedHosts = process.env.VITE_ALLOWED_HOSTS?.trim()
const allowedHosts = rawAllowedHosts
  ? rawAllowedHosts.split(',').map((host) => host.trim()).filter(Boolean)
  : undefined

// server.host: true - żeby Vite nasłuchiwał na 0.0.0.0, a nie tylko
// localhost wewnątrz kontenera (inaczej port 5173 nie byłby osiągalny
// spoza kontenera mimo przekierowania portu w docker-compose).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts,
  },
})
