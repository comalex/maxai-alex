const DB_NAME = "filesDB";
const DB_VERSION = 1;
const STORE_NAME = "filesStore";

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

// Save file to IndexedDB
export async function saveFileToIndexedDB(id, file) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.put({ id, file });

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log("File saved to IndexedDB successfully");
      resolve();
    };
    request.onerror = () => {
      console.error("Error saving file to IndexedDB:", request.error);
      reject(request.error);
    };
  });
}

// Get file from IndexedDB
export async function getFileFromIndexedDB(id) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result?.file);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function streamFile({
  id,
  url,
  onLoad,
  onError,
  onFetchSuccess,
  chunkMultiple
}) {
  function handleError(error) {
    console.error(error);
    if (onError) onError(error, id);
  }

  try {
    let response = null;

    if (typeof url === "object") {
      if (url.url === url.fallbackUrl) delete url.fallbackUrl;
      if (!url.url) {
        if (!url.fallbackUrl)
          return handleError("At least a fallbackUrl must be provided", id);
        url.url = url.fallbackUrl;
        url.fallbackUrl = null;
      }
      response = await fetch(url.url);
      if (!response.ok && url.fallbackUrl)
        response = await fetch(url.fallbackUrl);
    } else {
      response = await fetch(url);
    }

    if (!response.ok)
      return handleError(
        `${response.status} error while fetching ${JSON.stringify(url)} from background script`,
        id
      );

    const mimeType = response.headers.get("content-type");
    if (onFetchSuccess) onFetchSuccess({ mimeType }, id);

    const contentLength = parseInt(response.headers.get("content-length"));
    let totalBytesRead = 0;
    let buffer = [];
    const reader = response.body.getReader();

    reader
      .read()
      .then(function processChunk({ done, value }) {
        const chunkLength = value?.length;
        for (let i = 0; i < chunkLength; i++) buffer.push(value[i]);

        let chunkToSend = null;
        if (chunkMultiple) {
          if (buffer.length >= chunkMultiple) {
            const chunkSize =
              parseInt(buffer.length / chunkMultiple) * chunkMultiple;
            chunkToSend = buffer.slice(0, chunkSize);
            buffer = buffer.slice(chunkSize);
          }
        } else {
          chunkToSend = buffer;
          buffer = [];
        }

        if (chunkToSend) {
          totalBytesRead += chunkToSend.length || 0;
          const progress =
            contentLength && !isNaN(totalBytesRead / contentLength)
              ? (totalBytesRead / contentLength).toFixed(2)
              : "0.00";
          if (onLoad)
            onLoad(
              totalBytesRead,
              progress,
              false,
              chunkToSend,
              chunkLength,
              id
            );
        }

        if (done) {
          if (buffer.length) {
            totalBytesRead += buffer.length;
            if (onLoad)
              onLoad(
                totalBytesRead,
                1,
                false,
                buffer,
                buffer.length,
                id,
                mimeType
              );
          }
          if (onLoad)
            onLoad(totalBytesRead, 1, true, [], buffer.length, id, mimeType);
        } else {
          reader.read().then(processChunk).catch(handleError);
        }
      })
      .catch(handleError);
  } catch (error) {
    handleError(error, id);
  }
}
