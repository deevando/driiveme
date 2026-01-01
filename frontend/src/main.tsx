console.log('Main.tsx executing...');
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('React imports loaded');

const root = document.getElementById('root');
if (!root) {
  console.error('FATAL: Root element not found');
} else {
  try {
    const rootNode = createRoot(root);
    rootNode.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('React render called successfully');
  } catch (e) {
    console.error('React render crashed:', e);
  }
}
