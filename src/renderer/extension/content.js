import { EXTENSION_MESSAGE_TYPES } from "./config/constants";
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

_onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  const { type, tab } = message;
  if (!tab) {
    debugger
  }
  switch (type) {
    case EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_MESSAGES:
      parseMessagesFromSelectedThread(tab).then(response => sendResponse(response));
      break;
    case EXTENSION_MESSAGE_TYPES.READ_CURRENT_VAULT:
      sendResponse(vaultParser());
      break;
    case EXTENSION_MESSAGE_TYPES.READ_HTML:
      parseHtml(tab).then(response => {
        console.log("Parsed HTML response:", response);
        sendResponse(response);
      });
      break;
    case EXTENSION_MESSAGE_TYPES.ADD_LISTENERS:
      sendResponse(attachListeners());
      break;
    case EXTENSION_MESSAGE_TYPES.ADD_URL_CHANGE_LISTENERS:
      sendResponse(attachUrlChangeListener());
      break;
    case EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE:
      sendResponse(isProcessingContentPresent());
      break;
    case EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_SUBS:
      sendResponse(parseSubsFun());
      break;
    case EXTENSION_MESSAGE_TYPES.REFRESH_OF_PAGE:
      refreshOfPage(tab);
      sendResponse("refreshed");
      break;
    default:
      sendResponse({ status: "Message received" });
  }
});

const attachUrlChangeListener = () => {
  let currentUrl = window.location.href;

  const handleUrlChange = () => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      console.log("URL changed to:", currentUrl);
      sendMessage({
        type: EXTENSION_MESSAGE_TYPES.URL_CHANGE_LISTENER,
        payload: { newUrl, currentUrl }
      });
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
    const target = event.target;
    if (target && target.closest(".b-chats__item")) {
      sendMessage({ type: EXTENSION_MESSAGE_TYPES.FROM_FE });
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

  const handleScroll = debounce(() => {
    console.log("Scroll event detected in chat messages container");
    sendMessage({
      type: EXTENSION_MESSAGE_TYPES.FROM_FE,
      payload: { event: "scroll" }
    });
  }, 500);

  const observer = new MutationObserver((mutations, obs) => {
    const chatScrollbar = document.querySelector(".b-chats__scrollbar");
    if (chatScrollbar) {
      chatScrollbar.addEventListener("scroll", handleScroll);
      obs.disconnect();
    }
  });

  observer.observe(document, { childList: true, subtree: true });
};

observeScrollbar();

const waitForMakePostTextarea = () => {
  console.log("Initializing listener setup");

  const targetSelector = ".b-make-post__wrapper.b-paid-post-content.m-textarea-post";
  const listenerAddedAttr = "data-listener-added";

  const handleElement = (element) => {
    if (!element.hasAttribute(listenerAddedAttr)) {
      element.addEventListener("drop", dropcbtest);
      element.setAttribute(listenerAddedAttr, "true");
      console.log("Listener added to makePostTextarea");
      observeParagraphChanges(element);
    }
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        const elements = document.querySelectorAll(targetSelector);
        elements.forEach((element) => handleElement(element));
      }
    });
  });

  observer.observe(document, { childList: true, subtree: true });

  const initialElements = document.querySelectorAll(targetSelector);
  if (initialElements.length > 0) {
    initialElements.forEach((element) => handleElement(element));
  } else {
    console.log("makePostTextarea not found, observer is set up");
  }
};

waitForMakePostTextarea();

const dropcbtest = async (event) => {
  event.preventDefault();

  const data = event.dataTransfer.getData("text/plain") || [event.dataTransfer.getData("URL")];

  let parsedData;
  try {
    parsedData = Array.isArray(data) ? data : JSON.parse(data);
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

        let textEditorParagraphs = getParagraphs(event);
        replaceUrlInParagraphs(textEditorParagraphs);

        setTimeout(() => {
          textEditorParagraphs = getParagraphs(event);
          replaceUrlInParagraphs(textEditorParagraphs);
        }, 500);

        const file = await fetchFromServiceWorker(url);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

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

const getParagraphs = (event) => {
  return event.target.tagName === "P" ? [event.target] : event.target.querySelectorAll("p");
};

const replaceUrlInParagraphs = (paragraphs) => {
  paragraphs?.forEach((paragraph) => {
    if (paragraph.textContent) {
      console.log("Before replacement:", paragraph.textContent);
      paragraph.textContent = paragraph.textContent.replace(/\[.*?\]/g, "");
      console.log("After replacement:", paragraph.textContent);
    }
  });
};

const observeParagraphChanges = (element) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" || mutation.type === "subtree") {
        const paragraphs = element.querySelectorAll("p");
        replaceUrlInParagraphs(paragraphs);
      }
    });
  });

  observer.observe(element, { childList: true, subtree: true });
};

const fetchFromServiceWorker = async (url) => {
  try {
    const fileFromDB = await getFileFromIndexedDB(url);
    if (fileFromDB) {
      return fileFromDB;
    }
  } catch (error) {
    console.error("Error retrieving file from IndexedDB:", error);
  }

  return new Promise((resolve, reject) => {
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
          console.log("fetchFromServiceWorker: __EM__ON_STREAM_CHUNK event received");
          const { chunk, done, fileMimeType } = data;
          chunks.push(new Uint8Array(chunk));
          if (done) {
            sendMessage({ type: "__EM__STREAM_FILE_DONE", payload: { streamId } });
            console.log("fetchFromServiceWorker: all chunks received");
            const blob = new Blob(chunks, { type: fileMimeType });
            const file = new File([blob], url.split("/").pop(), { type: fileMimeType });
            saveFileToIndexedDB(url, file);
            _onMessage.removeListener(onMessage);
            resolve(file);
          }
        } else if (type === "__EM__ON_STREAM_CHUNK_ERROR") {
          console.log("fetchFromServiceWorker: __EM__ON_STREAM_CHUNK_ERROR event received");
          _onMessage.removeListener(onMessage);
          reject(new Error(data.error));
        }
      }
    };

    console.log("fetchFromServiceWorker: adding onMessage listener");
    _onMessage.addListener(onMessage);
    console.log("fetchFromServiceWorker: sending __EM__STREAM_FILE message");
    sendMessage({ type: "__EM__STREAM_FILE", payload: { url, streamId } });
  });
};

function generateStreamId() {
  return Math.random().toString(36).substring(2, 15);
}
