import { useState, useEffect } from "react";
import { React } from "react";

const useFileLoading = (): {
  fileLoading: { status: string; progress: number | null };
} => {
  const [fileLoading, setFileLoading] = useState<{
    status: string;
    progress: number | null;
  }>({
    status: "idle",
    progress: null
  });

  useEffect(() => {
    const handleMessage = async (message: {
      type: string;
      payload?: { progress?: number };
    }) => {
      if (message.type === "__EM__STREAM_FILE_DONE") {
        setFileLoading({ status: "done", progress: 1 });
      }
      if (message.type === "__EM__STREAM_FILE") {
        setFileLoading({ status: "loading", progress: 0 });
      }
      if (
        message.type === "__EM__STREAM_FILE_PROGRESS" &&
        message.payload?.progress !== undefined
      ) {
        setFileLoading({
          status: "loading",
          progress: message.payload.progress * 100
        });
      }
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.onMessage
    ) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    return () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.onMessage
      ) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, []);

  return { fileLoading };
};

export default useFileLoading;
