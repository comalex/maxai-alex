
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface WebviewProps {
  src: string;
  id: string;
}

const Webview: React.FC<WebviewProps> = ({ src, id }) => {
  const [dataFetched, setDataFetched] = useState(false);
  const [authData, setAuthData] = useState<{ bcTokenSha: string } | null>(null);
  const [ipcResponseReceived, setIpcResponseReceived] = useState(false);
  const partitionId = `persist:${id}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const response = await axios.get('http://127.0.0.1:8000/api/v2/app');
        const response = await axios.get('https://dev-api.trymax.ai/api/v2/app');
        const { auth } = response.data;
        setAuthData(auth);
        console.log(auth)
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
    const webview = document.getElementById(id) as any;
    if (webview && authData && authData.bcTokenSha) {
      const handleDomReady = () => {
        handleWebviewLoad(authData);
        webview.removeEventListener('dom-ready', handleDomReady);
      };
      webview.addEventListener('dom-ready', handleDomReady);
    }
  }, [authData, id]);

  const handleWebviewLoad = (auth: { bcTokenSha: string }) => {
    const webview = document.getElementById(id) as any;
    if (webview && auth.bcTokenSha) {
      console.log("set localsotre");
      webview.executeJavaScript(`
        localStorage.setItem('bcTokenSha', '${auth.bcTokenSha}');
      `);
      webview.executeJavaScript(`
        localStorage.setItem('test', 'alex');
      `);
      window.electron.ipcRenderer.sendMessage('ipc-example', [partitionId, auth]);
    } else {
      console.error('Webview element not found or bcTokenSha not set');
    }
  };

  return (
    <div>
      <webview
        id={id}
        src={dataFetched && ipcResponseReceived ? src : 'http://www.blankwebsite.com/'}
        className="webview-content"
        partition={partitionId}
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        style={{ height: '100vh' }}
      />
    </div>
  );
};

export default Webview;
