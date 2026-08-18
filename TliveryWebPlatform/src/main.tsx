import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {I18nextProvider} from 'react-i18next';
import {QueryClientProvider} from '@tanstack/react-query';
import i18n from './i18n';
import {queryClient} from './config/queryClient';
import {LangProvider} from './i18n/LangContext';
import {CountryProvider} from './providers/CountryContext';
import {AuthProvider} from './auth/AuthContext';
import {ThemeProvider} from './theme/ThemeContext';
import App from './App';
import ToastHost from './components/ToastHost';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <ThemeProvider>
            <LangProvider>
              <CountryProvider>
                <AuthProvider>
                  <App />
                  <ToastHost />
                </AuthProvider>
              </CountryProvider>
            </LangProvider>
          </ThemeProvider>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
