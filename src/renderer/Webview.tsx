
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AuthData } from './types';
import { API_URL } from './config';
import { EXTENSION_MESSAGE_TYPES } from './extension/config/constants';
import { sendMessage } from "./extension/background/bus";

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
  const partitionId = `persist:${id}`;
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
        // const response = await axios.get(`http://127.0.0.1:8000/api/v2/app/${id}`);
        const response = await axios.get(`${API_URL}/api/v2/app/${id}`);
        setAuthData(response.data);
        console.log(response.data);
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [id]);

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
    if (webview && authData && authData.auth.bcTokenSha) {
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
      // console.log("set localsotre");
      webview.executeJavaScript(`
        localStorage.setItem('bcTokenSha', '${auth.auth.bcTokenSha}');
      `);
      // Inject a button into the webview and send an event on click

      window.electron.ipcRenderer.sendMessage('ipc-example', [partitionId, auth]);
    } else {
      console.error('Webview element not found or bcTokenSha not set');
    }
  };
  if (!config.path) {
    return;
  }
  return (
    <div>
      <button onClick={() => {
        const webview = document.getElementById(id) as HTMLWebViewElement | null;
        if (webview) {
          webview.executeJavaScript('localStorage.getItem("bcTokenSha");', false)
            .then((bcTokenSha: string | null) => {
              if (bcTokenSha) {
                window.electron.ipcRenderer.sendMessage('read-data', [partitionId, bcTokenSha]);
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
        Read Data
      </button>
      {/* <button onClick={() => handleWebviewLoad(authData)}>Load Webview</button> */}
      <webview
        id={id}
        src={isReadyToLoad ? src : 'https://portal.trymax.ai/spinner'}
        // src={src}
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
