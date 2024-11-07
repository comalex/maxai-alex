
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AuthData } from './types';
import { API_URL, X_API_KEY } from './config';
import { EXTENSION_MESSAGE_TYPES } from './extension/config/constants';
import ProxyModal from './components/ProxyModal';

interface WebviewProps {
  src: string;
  id: string;
}

const Webview: React.FC<WebviewProps> = ({ src, id }) => {
  const [config, setConfig] = useState('');
  const [dataFetched, setDataFetched] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [ipcResponseReceived, setIpcResponseReceived] = useState(false);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [blurLevel, setBlurLevel] = useState(10);
  const partitionId = `persist:${id}`;
  const creatorUUID = id;
  console.log("Data fetched:", dataFetched, "IPC response received:", ipcResponseReceived);
  const isReadyToLoad = dataFetched && ipcResponseReceived;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!ipcResponseReceived) {
        handleWebviewLoad(authData);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [ipcResponseReceived, authData]);

  useEffect(() => {
    const fetchPreloadPath = async () => {
      if (window.electron && window.electron.ipcRenderer && window.electron.getConfig) {
        const config = await window.electron.getConfig();
        console.log("config", config)
        setConfig(config);
      }
    };
    fetchPreloadPath();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/v2/creator/${creatorUUID}/settings`, {
          headers: {
            'X-API-KEY': `${X_API_KEY}`
          }
        });
        setAuthData(response.data);
        console.log(response.data);
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [creatorUUID]);

  useEffect(() => {
    const handleIpcResponse = (arg: any) => {
      console.log("handleIpcResponse", arg);
      setIpcResponseReceived(true);
    };

    return window.electron.ipcRenderer.on('ipc-example-response', handleIpcResponse);
  }, []);

  useEffect(() => {
    const handleIpcInjectResponse = (event: any, response: any) => {
      console.log("Received ipc-inject-response:", response, "Event:", event);
      sendMessage({ type: event, currentWebviewId: id, socketApi: true });
    };
    return window.electron.ipcRenderer.on('ipc-inject-response', handleIpcInjectResponse)
  }, []);

  useEffect(() => {
    const webview = document.getElementById(id) as any;
    if (isWebViewReady) {
      webview.executeJavaScript(`
        if (!window.listenerAdded) {
          document.addEventListener('click', (event) => {
            window.electron.ipcRenderer.sendMessage('ipc-inject', ["${EXTENSION_MESSAGE_TYPES.FROM_FE}"]);
          });
          window.listenerAdded = true;
        }
      `);
    }
  }, [isReadyToLoad, isWebViewReady]);

  useEffect(() => {
    const webview = document.getElementById(id) as any;
    if (webview && authData && authData?.app_settings?.bcTokenSha) {
      const handleDomReady = () => {
        setIsWebViewReady(true);
        handleWebviewLoad(authData);
        webview.setZoomLevel(0.7);
        webview.setZoomFactor(0.7);
        webview.removeEventListener('dom-ready', handleDomReady);
      };
      webview.addEventListener('dom-ready', handleDomReady);
    }
  }, [authData, id]);

  const handleWebviewLoad = (auth: AuthData) => {
    const webview = document.getElementById(id) as any;
    if (webview) {
      if (auth?.app_settings?.bcTokenSha) {
        webview.executeJavaScript(`
          localStorage.setItem('bcTokenSha', '${auth?.app_settings?.bcTokenSha}');
        `);
        window.electron.ipcRenderer.sendMessage('ipc-example', [partitionId, auth]);
      } else {
        setIpcResponseReceived(true);
      }
    } else {
      console.error('Webview element not found or bcTokenSha not set');
    }
    // if (webview) {
    //   window.electron.ipcRenderer.sendMessage('ipc-example', [partitionId, auth]);
    // }
  };

  const injectBlurScript = () => {
    const webview = document.getElementById(id) as any;
    if (webview) {
      webview.executeJavaScript(`
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
      `);
    }
  };

  if (!config.path) {
    return null;
  }

  return (
    <div>
      {/* <input
        type="range"
        min="0"
        max="20"
        value={blurLevel}
        onChange={(e) => setBlurLevel(Number(e.target.value))}
      /> */}
      <button onClick={injectBlurScript}>
        Blur Images
      </button>
      <button onClick={() => {
        const webview = document.getElementById(id) as HTMLWebViewElement | null;
        if (webview) {
          webview.executeJavaScript('localStorage.getItem("bcTokenSha");', false)
            .then((bcTokenSha: string | null) => {
              if (bcTokenSha) {
                window.electron.ipcRenderer.sendMessage('read-data', [creatorUUID, bcTokenSha]);
              } else {
                console.error('bcTokenSha is null');
              }
            })
            .catch((error: Error) => {
              console.error('Error executing JavaScript in webview:', error);
            });
        } else {
          console.error('Webview element not found');
        }
      }}>
        Save Cookies
      </button>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        <button
          style={{
            width: 'fit-content',
            backgroundColor: 'blue',
            color: 'white',
            padding: '1px 10px',
            borderRadius: '5px',
          }}
          onClick={() => {
            setIsModalOpen(!isModalOpen);
          }}
        >
          Proxy
        </button>
      </div>
      {isModalOpen && (
        <ProxyModal
          // isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          creatorUUID={creatorUUID}
          elem_id={id}
        />
      )}
      {/* <button onClick={() => handleWebviewLoad(authData)}>Load Webview</button> */}
      <webview
        id={id}
        src={isReadyToLoad ? src : 'https://portal.trymax.ai/spinner'}
        className="webview-content"
        partition={partitionId}
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        style={{ height: '100vh' }}
        preload={`file://${config.path}/preload.js`}
      />
    </div>
  );
};

export default Webview;
