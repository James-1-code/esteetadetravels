// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App'; // ✅ Remove .tsx extension
import ErrorBoundary from './components/ErrorBoundary';

// Note: StrictMode is disabled because it causes double-rendering in development
// which can appear as the app resetting. Remove this comment in production.
// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <ErrorBoundary>
//       <App />
//     </ErrorBoundary>
//   </StrictMode>
// );

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
