// webview-preload.js
const fs = require('fs');
const path = require('path');

// Read and evaluate content.js
const contentScriptPath = path.join(__dirname, './extension/content.js');
const contentScript = fs.readFileSync(contentScriptPath, 'utf8');

// Run the content script
eval(contentScript);
