
import React, { useEffect } from 'react';
// import { remote } from 'electron';

const Webview = ({ src, id }) => {
  const partitionId = `persist:${id}`;

  const handleWebviewLoad = () => {
    // Get the webview element by its ID
    const webview = document.getElementById(id);
    if (webview) {
      webview.executeJavaScript(`localStorage.setItem('bcTokenSha', '95ad16528ee36510d580788ccf4123ca914e3498');`);
    } else {
      console.error('Webview element not found');
    }
    window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
  };

  return (
    <div>
      <button onClick={handleWebviewLoad}>Load Webview</button>
      <webview
        id={id}
        src={src}
        className="webview-content"
        partition={partitionId}
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
        style={{ height: '100vh' }}
        preload="./webview-preload.js"
        // onDidStartLoading={handleWebviewLoad} // Handle load start
      />
    </div>
  );
};

export default Webview;
