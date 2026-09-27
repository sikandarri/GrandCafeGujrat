import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import MotionEnhancer from './MotionEnhancer.jsx';
import './styles.css';
import './v687-fix.css';
import './motion-enhancements.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig
        reducedMotion="user"
        transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.72 }}
      >
        <MotionEnhancer />
        <App />
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);
