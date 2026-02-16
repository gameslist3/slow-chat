import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './initFirebase.ts'

// Diagnostic: Force show any mount errors
try {
    console.log('[Main] Starting React Mount...');
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Root element not found');

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
    console.log('[Main] Mount call completed');
} catch (error: any) {
    console.error('[Main] Mount Crash:', error);
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `<div style="padding: 20px; color: #ff5555; font-family: sans-serif; background: #1a1a1a; border: 2px solid red; margin: 20px; border-radius: 10px;">
            <h1 style="color: white; margin-top: 0;">⚠️ Gapes Launch Failure</h1>
            <p><strong>Error:</strong> ${error?.message || 'Unknown Error'}</p>
            <pre style="background: #000; padding: 10px; border-radius: 5px; overflow: auto; max-height: 200px; font-size: 12px;">${error?.stack || ''}</pre>
            <p style="font-size: 10px; color: #888;">Check browser console (F12) for details.</p>
        </div>`;
    }
}

// Global error listener for good measure
window.onerror = function (msg, url, line, col, error) {
    console.log('[Global Error]', { msg, url, line, col, error });
    return false;
};
