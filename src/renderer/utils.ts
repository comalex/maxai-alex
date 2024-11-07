import { WebviewTag } from 'electron';
import { TbChevronCompactLeft } from 'react-icons/tb';
import { EXTENSION_MESSAGE_TYPES } from './extension/config/constants';

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


export const addListenerOnClicks = (webview) => {
        return executeJavaScriptWithCatch(webview, `
        if (!window.listenerAdded) {
          document.addEventListener('click', (event) => {
            window.electron.ipcRenderer.sendMessage('ipc-inject', ["${EXTENSION_MESSAGE_TYPES.FROM_FE}"]);
          });
          window.listenerAdded = true;
        }
      `);
}


export const saveCookies = (webview, creatorUUID) => {
  executeJavaScriptWithCatch(webview, `
        if (!window.bht) {
          const waitForHeader = () => {
            const headerElement = document.querySelector('.l-header');
            if (headerElement) {
              const bcTokenSha = localStorage.getItem("bcTokenSha");
              if (bcTokenSha) {
                window.electron.ipcRenderer.sendMessage('read-data', ['${creatorUUID}', bcTokenSha]);
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
      `);
}
