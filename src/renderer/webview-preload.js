// // webview-preload.js
// const fs = require('fs');
// const path = require('path');
// console.log("Preload")
// // Read and evaluate content.js
// const contentScriptPath = path.join(__dirname, './extension/content.js');
// const contentScript = fs.readFileSync(contentScriptPath, 'utf8');
// alert("works???")
// // Run the content script
// eval(contentScript);

// const handleWebviewLoad = () => {
//   console.log("handleWebviewLoad")
//   try {
//     eval(`
//       localStorage.setItem('bcTokenSha', '95ad16528ee36510d580788ccf4123ca914e3498');
//       localStorage.setItem('test', '3nov');
//     `);
//   } catch (error) {
//     console.error('Error executing localStorage script:', error);
//   }
//   window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
// };

// handleWebviewLoad();


// preload.js
const { contextBridge, ipcRenderer, session } = require('electron');

console.log("Preload script loaded");

const electronHandler = {
  session,
  ipcRenderer: {
    sendMessage(channel, ...args) {
      console.log("Sending message on channel:", channel);
      ipcRenderer.send(channel, ...args);
    },
    on(channel, func) {
      const subscription = (_event, ...args) => {
        func(...args);
      };
      ipcRenderer.on(channel, subscription);
      console.log("Listening on channel:", channel);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel, func) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
