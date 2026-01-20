import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// CRITICAL FIX: Don't disable console.log in production - it breaks AuthContext
// Performance optimization can be done at build level instead
if (import.meta.env.PROD) {
  // Keep console methods intact for proper execution flow
  console.info('🚀 SOC Central - Production Mode');
  console.info('🌐 Browser:', navigator.userAgent.split(' ')[0]);
  console.info('⚡ API URL:', import.meta.env.VITE_API_URL);
}

const root = document.getElementById("root")!;

createRoot(root).render(<App />);
