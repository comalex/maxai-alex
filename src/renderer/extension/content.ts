// import type { PlasmoCSConfig } from "plasmo";
import { EXTENSION_MESSAGE_TYPES } from "./config/constants";
import type { ExtensionMessage } from "./config/types";
import {
  isProcessingContentPresent,
  parseMessagesFromSelectedThread,
  parseSubsFun,
  refreshOfPage
} from "./services/only_fans_parser";
import { parseHtml } from "./services/parseHtml";
import { vaultParser } from "./services/vault_parser";

import { onMessage as _onMessage, sendMessage } from "./background/bus";

import { saveFileToIndexedDB, getFileFromIndexedDB } from "./background/utils";

// export const config: PlasmoCSConfig = {
//   matches: ["<all_urls>"],
//   world: "MAIN"
// }

_onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    console.log("Message received:", message);
    const { type } = message;
    switch (type) {
      case EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_MESSAGES: {
        parseMessagesFromSelectedThread().then(response => sendResponse(response));
        break;
      }
      case EXTENSION_MESSAGE_TYPES.READ_CURRENT_VAULT: {
        sendResponse(vaultParser());
        break;
      }
      case EXTENSION_MESSAGE_TYPES.READ_HTML: {
        parseHtml().then(response => {
          console.log("Parsed HTML response:", response);
          sendResponse(response);
        });
        break;
      }
      case EXTENSION_MESSAGE_TYPES.ADD_LISTENERS: {
        sendResponse(attachListeners());
        break;
      }
      case EXTENSION_MESSAGE_TYPES.ADD_URL_CHANGE_LISTENERS: {
        sendResponse(attachUrlChangeListener());
        break;
      }
      case EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE: {
        sendResponse(isProcessingContentPresent());
        break;
      }
      case EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_SUBS: {
        sendResponse(parseSubsFun());
        break;
      }
      case EXTENSION_MESSAGE_TYPES.REFRESH_OF_PAGE: {
        refreshOfPage();
        sendResponse("refreshed");
        break;
      }
      default: {
        sendResponse({ status: "Message received" });
      }
    }
  }
);
//
// export const config: PlasmoCSConfig = {
//   matches: ["https://onlyfans.com/*"]
// };

const attachUrlChangeListener = () => {
  let currentUrl = window.location.href;

  const handleUrlChange = () => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      console.log("URL changed to:", currentUrl);
      sendMessage({
        type: EXTENSION_MESSAGE_TYPES.URL_CHANGE_LISTENER,
        payload: {
          newUrl,
          currentUrl
        }
      });
      // You can add any additional logic you want to execute on URL change here
    }
  };

  const observer = new MutationObserver(handleUrlChange);
  observer.observe(document, { subtree: true, childList: true });

  window.addEventListener("popstate", handleUrlChange);
  window.addEventListener("hashchange", handleUrlChange);

  return currentUrl;
};

const attachListeners = () => {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target && target.closest(".b-chats__item")) {
      sendMessage({
        type: EXTENSION_MESSAGE_TYPES.FROM_FE
      });
    }
  });

  return 1;
};

const observeScrollbar = () => {
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const handleScroll = debounce((event) => {
    console.log("Scroll event detected in chat messages container");
    sendMessage({
      type: EXTENSION_MESSAGE_TYPES.FROM_FE,
      payload: {
        event: "scroll"
      }
    });
  }, 500);

  const observer = new MutationObserver((mutations, obs) => {
    const chatScrollbar = document.querySelector(".b-chats__scrollbar");
    if (chatScrollbar) {
      chatScrollbar.addEventListener("scroll", handleScroll);
      obs.disconnect(); // Stop observing once the element is found and the event listener is attached
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
};

// Call the function to start observing
observeScrollbar();

// window.addEventListener("load", () => {
//   setInterval(() => {
//     sendMessage({
//       type: EXTENSION_MESSAGE_TYPES.FROM_FE,
//       payload: {
//         event: "online"
//       }
//     });
//   }, 2000);
// });

// window.addEventListener("load", () => {
//   let newUrl = window.location.href;

//   const checkUrlChange = () => {
//     const currentUrl = window.location.href;

//     if (currentUrl !== newUrl) {
//       newUrl = currentUrl;

//       sendMessage({
//         type: EXTENSION_MESSAGE_TYPES.CHECK_URL,
//         payload: {
//           event: "online",
//           newUrl
//         }
//       });
//     }
//   };

//   setInterval(checkUrlChange, 2000);
// });

const waitForMakePostTextarea = () => {
  console.log("Initializing listener setup");

  const targetSelector =
    ".b-make-post__wrapper.b-paid-post-content.m-textarea-post";
  const listenerAddedAttr = "data-listener-added";

  const handleElement = (element: HTMLElement) => {
    if (!element.hasAttribute(listenerAddedAttr)) {
      element.addEventListener("drop", dropcbtest);
      element.setAttribute(listenerAddedAttr, "true");
      console.log("Listener added to makePostTextarea");
      observeParagraphChanges(element);
    } else {
      // console.log("Listener already added to makePostTextarea");
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const elements = document.querySelectorAll(targetSelector);
        elements.forEach((element) => handleElement(element as HTMLElement));
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  // Initial check in case the element is already present
  const initialElements = document.querySelectorAll(targetSelector);
  if (initialElements.length > 0) {
    initialElements.forEach((element) => handleElement(element as HTMLElement));
  } else {
    console.log("makePostTextarea not found, observer is set up");
  }
};

waitForMakePostTextarea();

const dropcbtest = async (event) => {
  event.preventDefault();

  // Ensure the dropped data is handled
  const data = event.dataTransfer.getData("text/plain") || [
    event.dataTransfer.getData("URL")
  ];

  let parsedData;
  try {
    if (!Array.isArray(data)) {
      parsedData = JSON.parse(data);
    } else {
      parsedData = data;
    }
  } catch (error) {
    console.error("Error parsing the data:", error);
    return;
  }

  if (!Array.isArray(parsedData)) {
    console.error("Expected an array of URLs");
    return;
  }

  for (const url of parsedData) {
    if (url) {
      try {
        console.log("Processing URL:", url);

        // First run: Check paragraphs immediately for URL replacement
        let textEditorParagraphs = getParagraphs(event);
        replaceUrlInParagraphs(textEditorParagraphs);

        // Delay replacement to handle late additions
        setTimeout(() => {
          textEditorParagraphs = getParagraphs(event);
          replaceUrlInParagraphs(textEditorParagraphs);
        }, 500); // Adjust delay if needed

        // Fetch the file from the URL
        const file = await fetchFromServiceWorker(url);
        const dataTransfer = new DataTransfer();
        {
          /* @ts-ignore */
        }
        dataTransfer.items.add(file);

        // Simulate the new drop event
        const updatedEvent = new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer
        });
        event.target.dispatchEvent(updatedEvent);
      } catch (error) {
        console.error("Error fetching the URL:", url, error);
      }
    } else {
      console.warn("Encountered an empty URL in parsed data");
    }
  }
};

// Function to get paragraphs to check or modify
const getParagraphs = (event) => {
  let textEditorParagraphs;
  if (event.target.tagName === "P") {
    textEditorParagraphs = [event.target];
  } else {
    textEditorParagraphs = event.target.querySelectorAll("p");
  }
  return textEditorParagraphs;
};

// Function to replace the URL in paragraph text
const replaceUrlInParagraphs = (paragraphs) => {
  paragraphs?.forEach((paragraph) => {
    if (paragraph.textContent) {
      console.log("Before replacement:", paragraph.textContent);
      paragraph.textContent = paragraph.textContent.replace(/\[.*?\]/g, "");
      console.log("After replacement:", paragraph.textContent);
    }
  });
};

// Set up a MutationObserver to monitor for content changes in the paragraphs
const observeParagraphChanges = (element) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      {
        /* @ts-ignore */
      }
      if (mutation.type === "childList" || mutation.type === "subtree") {
        const paragraphs = element.querySelectorAll("p");
        replaceUrlInParagraphs(paragraphs);
      }
    });
  });

  // Observe changes in the element and its descendants
  observer.observe(element, {
    childList: true,
    subtree: true
  });
};

const fetchFromServiceWorker = async (url) => {
  try {
    const fileFromDB = await getFileFromIndexedDB(url);
    if (fileFromDB) {
      // If the file is found in IndexedDB, resolve with it immediately
      return fileFromDB;
    }
  } catch (error) {
    console.error("Error retrieving file from IndexedDB:", error);
  }

  return new Promise(async (resolve, reject) => {
    const streamId = generateStreamId();
    const chunks = [];
    console.log("fetchFromServiceWorker: start");

    const onMessage = (message) => {
      console.log("fetchFromServiceWorker: onMessage event received", message);
      const { type, data } = message;
      if (data.streamId === streamId) {
        if (type === "__EM__ON_STREAM_CHUNK") {
          sendMessage({
            type: "__EM__STREAM_FILE_PROGRESS",
            payload: { streamId, progress: data.progress }
          });
          console.log(
            "fetchFromServiceWorker: __EM__ON_STREAM_CHUNK event received"
          );
          const { chunk, done, mimeType, fileMimeType } = data;
          chunks.push(new Uint8Array(chunk));
          if (done) {
            sendMessage({
              type: "__EM__STREAM_FILE_DONE",
              payload: { streamId }
            });
            console.log("fetchFromServiceWorker: all chunks received");
            const blob = new Blob(chunks, { type: fileMimeType });
            const file = new File([blob], url.split("/").pop(), {
              type: fileMimeType
            });
            saveFileToIndexedDB(url, file);
            _onMessage.removeListener(onMessage);
            resolve(file);
          }
        } else if (type === "__EM__ON_STREAM_CHUNK_ERROR") {
          console.log(
            "fetchFromServiceWorker: __EM__ON_STREAM_CHUNK_ERROR event received"
          );
          _onMessage.removeListener(onMessage);
          reject(new Error(data.error));
        }
      }
    };

    console.log("fetchFromServiceWorker: adding onMessage listener");
    _onMessage.addListener(onMessage);
    console.log("fetchFromServiceWorker: sending __EM__STREAM_FILE message");
    sendMessage({
      type: "__EM__STREAM_FILE",
      payload: { url, streamId }
    });
  });
};

function generateStreamId() {
  return Math.random().toString(36).substring(2, 15);
}
