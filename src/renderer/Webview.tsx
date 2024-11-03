
import React from 'react';

interface WebviewProps {
  src: string;
  id: string;
}

const Webview: React.FC<WebviewProps> = ({ src, id }) => {
  const partitionId = `persist:${id}`;

  const handleWebviewLoad = () => {
    const webview = document.getElementById(id) as any;
    if (webview) {
      webview.addEventListener('dom-ready', () => {
        webview.executeJavaScript(`localStorage.setItem('bcTokenSha', '95ad16528ee36510d580788ccf4123ca914e3498');`);
        window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
      });
    } else {
      console.error('Webview element not found');
    }
  };

  return (
    <div>
      <webview
        id={id}
        src={src}
        className="webview-content"
        data-partition={partitionId}
        data-useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        style={{ height: '100vh' }}
        data-preload="file:///Users/oleksiistupak/projects/spencer-chat/webSocket-App/maxaiapp/src/renderer/webview-preload.js"
        // preload="./webview-preload.js"
        ref={(webview) => {
          if (webview) {
            webview.addEventListener('did-start-loading', handleWebviewLoad);
          }
        }}
      />
    </div>
  );
};

export default Webview;
