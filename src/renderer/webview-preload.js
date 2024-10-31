// webview-preload.js
const fs = require('fs');
const path = require('path');

// Read and evaluate content.js
const contentScriptPath = path.join(__dirname, './extension/content.js');
const contentScript = fs.readFileSync(contentScriptPath, 'utf8');

// Run the content script
eval(contentScript);


// function setLocalStorageItem(key, value) {
//   localStorage.setItem(key, value);
// }

// Expose the function to the WebView
// window.setLocalStorageItem = setLocalStorageItem;

// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
