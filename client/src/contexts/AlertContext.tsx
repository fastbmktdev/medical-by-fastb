"use client";

import { createContext, useState, useContext, ReactNode } from "react";
import {Alert} from "@heroui/react";

type AlertStatus = "success" | "error" | "info" | "warning";
type HeroUIAlertColor = "success" | "danger" | "primary" | "warning";


interface AlertState {
  message: string;
  status: AlertStatus;
  isVisible: boolean;
}

interface AlertContextType {
  showAlert: (message: string, status: AlertStatus) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = (message: string, status: AlertStatus) => {
    setAlert({ message, status, isVisible: true });
    setTimeout(() => {
      setAlert((currentAlert) =>
        currentAlert ? { ...currentAlert, isVisible: false } : null
      );
    }, 4000); // Hide after 4 seconds
  };

  const mapStatusToColor = (status: AlertStatus): HeroUIAlertColor => {
    switch (status) {
      case "error":
        return "danger";
      case "info":
        return "primary";
      default:
        return status;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div
          className={`fixed top-5 right-5 z-100 transition-all duration-300 ${
            alert.isVisible
              ? "opacity-100 transform translate-x-0"
              : "opacity-0 transform translate-x-full"
          }`}
        >
          <Alert color={mapStatusToColor(alert.status)}>{alert.message}</Alert>
        </div>
      )}
    </AlertContext.Provider>
  );
};
