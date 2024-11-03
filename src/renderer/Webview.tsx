
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface WebviewProps {
  src: string;
  id: string;
}

const Webview: React.FC<WebviewProps> = ({ src, id }) => {
  const [dataFetched, setDataFetched] = useState(false);
  const [authData, setAuthData] = useState<{ bcTokenSha: string } | null>(null);
  const partitionId = `persist:${id}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/v2/app');
        const { auth } = response.data;
        setAuthData(auth);
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [id]);

  const handleWebviewLoad = (auth: { bcTokenSha: string }) => {
    const webview = document.getElementById(id) as any;
    if (webview && auth.bcTokenSha) {
      console.log("set localsotre")
      webview.addEventListener('dom-ready', () => {

        webview.executeJavaScript(`
          localStorage.setItem('bcTokenSha', '${auth.bcTokenSha}');
        `);
        webview.executeJavaScript(`
          localStorage.setItem('test', 'alex');
        `);
        window.electron.ipcRenderer.sendMessage('ipc-example', [partitionId, auth]);
      });
      try {
        webview.executeJavaScript(`
          localStorage.setItem('bcTokenSha', '${auth.bcTokenSha}');
        `);
        window.electron.ipcRenderer.sendMessage('ipc-example', [partitionId, auth]);
      } catch (error) {
        console.error('Error executing JavaScript or sending IPC message:', error);
      }
    } else {
      console.error('Webview element not found or bcTokenSha not set');
    }
  };

  if (!dataFetched) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <button onClick={() => handleWebviewLoad(authData)}>
        Load Webview
      </button>
      <webview
        id={id}
        src={src}
        className="webview-content"
        data-partition={partitionId}
        data-useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        style={{ height: '100vh' }}
        // data-preload="file:///Users/oleksiistupak/projects/spencer-chat/webSocket-App/maxaiapp/src/renderer/webview-preload.js"
        // preload="./webview-preload.js"
        ref={(webview) => {
          if (webview && authData) {
            webview.addEventListener('did-start-loading', () =>
              handleWebviewLoad(authData)
            );
          }
        }}
      />
    </div>
  );
};

export default Webview;
