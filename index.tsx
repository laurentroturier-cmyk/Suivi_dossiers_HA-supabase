
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './dark-theme.css';
import './design-system/theme/theme.css';
import { ThemeProvider } from './design-system/theme/ThemeProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
