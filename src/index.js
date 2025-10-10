import React from 'react';
import ReactDOM from 'react-dom/client';
import ConvoCalcio from './ConvoCalcio';
import { NotificationProvider } from './NotificationContext'; // Import obbligatorio!

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <NotificationProvider>
    <ConvoCalcio />
  </NotificationProvider>
);
