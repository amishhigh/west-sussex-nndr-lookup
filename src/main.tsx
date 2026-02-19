import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CSVProvider } from './hooks/useCSVData';
import './styles.css';
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CSVProvider>
        <App />
      </CSVProvider>
    </BrowserRouter>
  </React.StrictMode>
);
