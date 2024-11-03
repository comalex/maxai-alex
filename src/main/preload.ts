// preload.js
import { contextBridge, ipcRenderer, IpcRendererEvent, session } from 'electron';



export type Channels = 'ipc-example';
console.log("Preload script loaded");

const electronHandler = {
  session,
  ipcRenderer: {
    getEnv: () => {
      console.log("getEnv");
      console.log(process.env);
      // return process.env;
    },
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
  }
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
