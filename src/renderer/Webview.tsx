import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AuthData } from './types';
import { API_URL, X_API_KEY } from './config';
import { sendMessage } from './extension/background/bus';
import ProxyModal from './components/ProxyModal';
import {
  addListenerOnClicks,
  executeJavaScriptWithCatch,
  saveCookies,
  autoSaveCookies,
  injectBlurScript,
  getMyIp,
} from './utils';

interface WebviewProps {
  src: string;
  id: string;
  creatorUUID: string;
  config: any,
}

const WebviewWrapper: React.FC<WebviewProps> = ({
  src,
  id,
  creatorUUID,
  config,
}) => {
  const [dataFetched, setDataFetched] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/v2/creator/${creatorUUID}/settings`,
          {
            headers: {
              'X-API-KEY': `${X_API_KEY}`,
            },
          },
        );
        setAuthData(response.data);
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [creatorUUID]);

  return dataFetched && authData ? (
    <Webview
      src={src}
      id={id}
      creatorUUID={creatorUUID}
      authData={authData}
      config={config}
    />
  ) : null;
};

const Webview: React.FC<WebviewProps & { authData: AuthData }> = ({
  id,
  creatorUUID,
  authData,
  config,
}) => {
  const [ipcResponseReceived, setIpcResponseReceived] = useState(false);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [blurLevel, setBlurLevel] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const partitionId = `persist:${id}`;
  const isReadyToLoad = true && ipcResponseReceived;
  const webviewRef = useRef(null);

  useEffect(() => {
    const handleIpcResponse = (arg: any) => {
      console.log('handleIpcResponse', arg);
      setIpcResponseReceived(true);
      webviewRef?.current.reload();
    };
    return window.electron.ipcRenderer.on(
      'authSync-response',
      handleIpcResponse,
    );
  }, []);

  useEffect(() => {
    const handleIpcInjectResponse = (event: any, response: any) => {
      console.log('Received ipc-inject-response:', response, 'Event:', event);
      sendMessage({ type: event, currentWebviewId: id, socketApi: true });
    };
    return window.electron.ipcRenderer.on(
      'ipc-inject-response',
      handleIpcInjectResponse,
    );
  }, []);

  useEffect(() => {
    if (isWebViewReady) {
      addListenerOnClicks(webviewRef?.current);
      autoSaveCookies(webviewRef?.current, partitionId, creatorUUID);
    }
  }, [isReadyToLoad, isWebViewReady]);

  useEffect(() => {
    const webview = webviewRef?.current;
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
        console.log(
          'auth?.app_settings?.bcTokenSha',
          auth?.app_settings?.bcTokenSha,
        );
        executeJavaScriptWithCatch(
          webview,
          `
          localStorage.setItem('bcTokenSha', '${auth?.app_settings?.bcTokenSha}');
        `,
        );
        window.electron.ipcRenderer.sendMessage('authSync', [
          partitionId,
          creatorUUID,
          auth,
        ]);
      } else {
        setIpcResponseReceived(true);
      }
    } else {
      console.error('Webview element not found or bcTokenSha not set');
    }
  };
  return (
    <div>
      <button
        className="btn"
        onClick={() => injectBlurScript(webviewRef?.current, blurLevel)}
      >
        Blur Images
      </button>
      <button
        className="btn"
        onClick={() =>
          saveCookies(webviewRef?.current, partitionId, creatorUUID)
        }
      >
        Save Cookies
      </button>
      <button
        className="btn"
        onClick={() => {
          getMyIp(webviewRef?.current);
        }}
      >
        Get My IP
      </button>
      <button
        className="btn"
        onClick={() => {
          setIsModalOpen(!isModalOpen);
        }}
      >
        Proxy
      </button>
      <button className="btn" onClick={() => handleWebviewLoad(authData)}>
        Sync Auth
      </button>
      {isModalOpen && (
        <ProxyModal
          onClose={() => setIsModalOpen(false)}
          creatorUUID={creatorUUID}
          elem_id={id}
        />
      )}
      <webview
        id={id}
        ref={webviewRef}
        src={'https://onlyfans.com/my/chats'}
        className="webview-content"
        partition={partitionId}
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        style={{ height: '100vh' }}
        preload={`file://${config.path}/preload.js`}
      />
    </div>
  );
};

export default WebviewWrapper;
