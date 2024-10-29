import { useState, useEffect, useCallback } from "react";

export const sendToBackground = () => {
  return { success: true, data: {
    accountId: "394757173",
    accountName: "Alex"
  } };
}

export type PlasmoMessaging = {
  MessageHandler: (req: any, res: any) => Promise<void>
}



export const useStorage = (key: string, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage key:", key, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: any) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error setting localStorage key:", key, error);
    }
  }, [key, storedValue]);

  const removeItem = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error("Error removing localStorage key:", key, error);
    }
  }, [key, initialValue]);

  useEffect(() => {
    setStoredValue(() => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error("Error reading localStorage key:", key, error);
        return initialValue;
      }
    });
  }, [key, initialValue]);

  return [storedValue, setValue, removeItem];
};
