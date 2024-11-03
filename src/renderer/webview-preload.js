// webview-preload.js
const fs = require('fs');
const path = require('path');
console.log("Preload")
// Read and evaluate content.js
const contentScriptPath = path.join(__dirname, './extension/content.js');
const contentScript = fs.readFileSync(contentScriptPath, 'utf8');
alert("works???")
// Run the content script
eval(contentScript);

const handleWebviewLoad = () => {
  console.log("handleWebviewLoad")
  try {
    eval(`
      localStorage.setItem('bcTokenSha', '95ad16528ee36510d580788ccf4123ca914e3498');
      localStorage.setItem('test', '3nov');
    `);
  } catch (error) {
    console.error('Error executing localStorage script:', error);
  }
  window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
};

handleWebviewLoad();
