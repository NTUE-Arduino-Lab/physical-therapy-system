import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './global.scss';

import { StoreProvider } from './store';
import AppRoutes from './routes';
import AppProvider from './layouts/App';

ReactDOM.render(
    <React.StrictMode>
        <StoreProvider>
            <BrowserRouter>
                <AppProvider>
                    <Routes>
                        <Route path="/*" element={<AppRoutes />} />
                    </Routes>
                </AppProvider>
            </BrowserRouter>
        </StoreProvider>
    </React.StrictMode>,
    document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
