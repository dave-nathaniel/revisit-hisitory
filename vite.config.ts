import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 8765 in both dev and preview: the Playwright harnesses in the repo root
// (snap_test.py and the port baseline probe) hard-code http://localhost:8765/.
// /api/* is the mail server (server/index.js, run separately with `npm run
// server`); proxied here so the contact/enquiry forms work under `vite dev`
// too, not just against the production build it serves directly.
const apiProxy = { '/api': { target: 'http://localhost:8787', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { port: 8765, strictPort: true, proxy: apiProxy },
  preview: { port: 8765, strictPort: true, proxy: apiProxy },
  build: {
    // The stylesheet is one hand-tuned 1359-line file; leave it as one file so
    // its cascade order can never be reshuffled by chunking.
    cssCodeSplit: false,
  },
});
