import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <div>
    <App />
  </div>
);

// // calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   console.log("log pong")
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
