import React, { createContext, useState, useContext, useCallback } from 'react';
import CustomAlert, { AlertOptions } from './CustomAlert';

interface GlobalAlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const GlobalAlertContext = createContext<GlobalAlertContextType | undefined>(undefined);

export function GlobalAlertProvider({ children }: { children: React.ReactNode }) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
    // don't clear options immediately to allow exit animation to finish smoothly
    setTimeout(() => {
      setAlertOptions(null);
    }, 200);
  }, []);

  return (
    <GlobalAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert visible={alertVisible} options={alertOptions} onClose={hideAlert} />
    </GlobalAlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(GlobalAlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within a GlobalAlertProvider');
  }
  return context;
}
