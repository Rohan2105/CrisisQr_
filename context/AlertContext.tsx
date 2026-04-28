'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type AlertType = 'CRITICAL' | 'WARNING' | 'INFO' | null;

interface AlertContextType {
  alert: {
    type: AlertType;
    message: string | null;
  };
  setGlobalAlert: (type: AlertType, message: string | null) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<{ type: AlertType; message: string | null }>({
    type: null,
    message: null,
  });

  const setGlobalAlert = (type: AlertType, message: string | null) => {
    setAlert({ type, message });
    // In a real app, you might persist this to a DB or send via WebSocket
  };

  return (
    <AlertContext.Provider value={{ alert, setGlobalAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
