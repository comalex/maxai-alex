import { WebviewTag } from 'electron';
import { API_URL, EXTENSION_MESSAGE_TYPES } from './extension/config/constants';

export const getWebviewHTML = async (
  webviewId: string,
): Promise<string | null> => {
  console.log('webviewId', webviewId);
  const webview = document.getElementById(webviewId) as any;
  if (webview && typeof webview.executeJavaScript === 'function') {
    try {
      const html = await webview.executeJavaScript(
        'document.documentElement.outerHTML',
      );
      return html;
    } catch (error) {
      console.error('Error executing JavaScript in webview:', error);
      return null;
    }
  } else {
    console.error(
      'Webview not found or executeJavaScript method is not available',
    );
    return null;
  }
};

export const getWebviewCurrentURL = async (
  webviewId: string,
): Promise<string | null> => {
  console.log('webviewId', webviewId);
  const webview = document.getElementById(webviewId) as any;
  if (webview && typeof webview.executeJavaScript === 'function') {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 3 seconds
      const url = await webview.executeJavaScript('window.location.href');
      console.log('Current URL:', url);
      return url;
    } catch (error) {
      console.error('Error executing JavaScript in webview:', error);
      return null;
    }
  } else {
    console.error(
      'Webview not found or executeJavaScript method is not available',
    );
    return null;
  }
};

export const executeJavaScriptWithCatch = (webview: any, script: string) => {
  try {
    return webview.executeJavaScript(script);
  } catch (error) {
    console.error('Error executing JavaScript in webview:', error);
  }
};

export const injectBlurScript = (webview: WebviewTag, blurLevel: number) => {
  executeJavaScriptWithCatch(
    webview,
    `
        function blurImage(image) {
          image.style.filter = "blur(${blurLevel}px)";
        }

        document.querySelectorAll("img").forEach(blurImage);

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.tagName === "IMG") {
                blurImage(node);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                node.querySelectorAll("img").forEach(blurImage);
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      `,
  );
};


export const addScrollListener = (webview: WebviewTag) => {
  return executeJavaScriptWithCatch(
    webview,
    `
      let observeScrollbar = () => {
        const debounce = (func, wait) => {
          let timeout;
          return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
          };
        };

        const handleScroll = debounce(() => {
          console.log("Scroll event detected in chat messages container");
          window.electron.ipcRenderer.sendMessage('ipc-inject', ["${EXTENSION_MESSAGE_TYPES.FROM_FE}", { event: "scroll" }]);
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
    `,
  );
};


export const addListenerOnClicks = (webview) => {
  return executeJavaScriptWithCatch(
    webview,
    `
        if (!window.listenerAdded) {
          document.addEventListener('click', (event) => {
            window.electron.ipcRenderer.sendMessage('ipc-inject', ["${EXTENSION_MESSAGE_TYPES.FROM_FE}"]);
          });
          window.listenerAdded = true;
        }
      `,
  );
};

export const autoSaveCookies = (webview, partitionId, creatorUUID) => {
  executeJavaScriptWithCatch(
    webview,
    `
        if (!window.bht) {
          const waitForHeader = () => {
            const headerElement = document.querySelector('.l-header');
            if (headerElement) {
              const bcTokenSha = localStorage.getItem("bcTokenSha");
              if (bcTokenSha) {
                window.electron.ipcRenderer.sendMessage('read-data', ['${partitionId}', '${creatorUUID}', bcTokenSha]);
              } else {
                console.error('bcTokenSha is null');
              }
            } else {
              setTimeout(waitForHeader, 1000);
            }
          };

          waitForHeader();
          window.bht = true;
        }
      `,
  );
};

export const getMyIp = (webview: any) => {
  if (webview) {
    executeJavaScriptWithCatch(webview, `fetch('${API_URL}/v1/api/get-my-ip')
        .then(response => response.json())
        .then(data => alert('Your IP is: ' + data.ip))
        .catch(error => console.error('Error fetching IP:', error));`)
        .catch(error => console.error('Error executing JavaScript in webview:', error));
  } else {
    console.error('Webview element not found');
  }
};

export const saveCookies = (
  webview: any,
  partitionId: string,
  creatorUUID: string,
) => {
  if (webview) {
    executeJavaScriptWithCatch(webview, 'localStorage.getItem("bcTokenSha");')
      .then((bcTokenSha: string | null) => {
        if (bcTokenSha) {
          window.electron.ipcRenderer.sendMessage('read-data', [
            partitionId,
            creatorUUID,
            bcTokenSha,
          ]);
        } else {
          console.error('bcTokenSha is null');
        }
      })
      .catch((error: any) => {
        console.error('Error executing JavaScript in webview:', error);
      });
  } else {
    console.error('Webview element not found');
  }
};
