// preload.js
import { contextBridge, ipcRenderer, IpcRendererEvent, session } from 'electron';

export type Channels = 'ipc-example';
console.log("Preload script loaded");

const electronHandler = {
  session,
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      console.log("Sending message on channel:", channel);
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => {
        func(...args);
      };
      ipcRenderer.on(channel, subscription);
      console.log("Listening on channel:", channel);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  getWebviewHTML: async (event, webviewId) => {
    return ipcRenderer.invoke('get-webview-html', webviewId);
    // debugger
    // const webview = event.sender.webContents.getAllWebContents().find(w => w.id === webviewId);
    // if (webview) {
    //     const html = await webview.executeJavaScript('document.documentElement.outerHTML');
    //     return html;
    // }
    // return 'Webview not found';
  }
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
