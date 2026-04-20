import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver loop limit exceeded error
const isResizeObserverError = (message: string) => {
  return (
    message.includes("ResizeObserver loop completed with undelivered notifications") ||
    message.includes("ResizeObserver loop limit exceeded") ||
    message.includes("ResizeObserver loop")
  );
};

window.addEventListener("error", (e) => {
  if (isResizeObserverError(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Also handle unhandledrejection just in case
window.addEventListener("unhandledrejection", (e) => {
  const message = e.reason?.message || String(e.reason);
  if (isResizeObserverError(message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Patch console.error to suppress these errors from showing up in the console as well
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string' && isResizeObserverError(args[0])) {
    return;
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
