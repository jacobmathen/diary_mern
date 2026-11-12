import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import {store} from './store';
import UIProvider from './context/UIProvider';
import App from './App';
import './index.css';
createRoot(document.getElementById('root')).render(<StrictMode><Provider store={store}><UIProvider><BrowserRouter><App/></BrowserRouter></UIProvider></Provider></StrictMode>);
