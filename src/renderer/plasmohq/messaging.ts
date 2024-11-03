import { useState, useEffect, useCallback } from "react";
import { sendMessage } from "../extension/background/bus";
import { EXTENSION_MESSAGE_TYPES } from "../extension/config/constants";


export const sendToBackground = async ({ currentWebviewId, name, body }) => {
  const TAB_CONSTANT = currentWebviewId;
  if (!TAB_CONSTANT) {
    debugger
  }
  const payload = body;
  console.log("sendToBackground", name, payload)
  let content;
  switch (name) {
    case "retrieve-thread-messages":
      content = await sendMessage({
        ...payload,
        type: EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_MESSAGES,
        tab: TAB_CONSTANT,
      });

      break;
    case "retrieve-data":
      await new Promise(resolve => setTimeout(resolve, 2000));
      switch (payload.type) {
        case EXTENSION_MESSAGE_TYPES.ADD_LISTENERS:
          content = await sendMessage({
            ...payload,
            type: EXTENSION_MESSAGE_TYPES.ADD_LISTENERS,
            tab: TAB_CONSTANT,
          });
          break;
        case EXTENSION_MESSAGE_TYPES.READ_HTML:
          console.log("content start, READ_HTML");
          content = await sendMessage({
            ...payload,
            type: EXTENSION_MESSAGE_TYPES.READ_HTML,
            tab: TAB_CONSTANT,
          });
          console.log("content end READ_HTML", content);
          break;
        case EXTENSION_MESSAGE_TYPES.ADD_URL_CHANGE_LISTENERS:
          content = await sendMessage({
            ...payload,
            type: EXTENSION_MESSAGE_TYPES.ADD_URL_CHANGE_LISTENERS,
            tab: TAB_CONSTANT,
          });
          break;
        case EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE:
          content = await sendMessage({
            ...payload,
            type: EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE,
            tab: TAB_CONSTANT,
          });
          break;
        case EXTENSION_MESSAGE_TYPES.REFRESH_OF_PAGE:
          content = await sendMessage({
            ...payload,
            type: EXTENSION_MESSAGE_TYPES.REFRESH_OF_PAGE,
            tab: TAB_CONSTANT,
          });
          break;
        default:
          console.error("Unsupported message type:", payload.type);
      }
      break;
    default:
      // throw new Error("Unsupported message type");
      break;
  }

  console.log({ success: true, data: content });
  return { success: true, data: content };
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
