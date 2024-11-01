import path from 'path';
import { app, BrowserWindow, session, ipcMain } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.allowPrerelease = true;  // Enable this if testing with pre-releases
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('error', (error) => {
      log.error('Error fetching updates:', error);
    });
  }
}

let mainWindow = null;

ipcMain.handle('create-session', async (event, cookies) => {
    const newSession = session.fromPartition(`persist:my-partition-${Date.now()}`);

    // Set cookies for the new session
    for (const cookie of cookies) {
        await newSession.cookies.set(cookie).catch(err => {
            console.error('Error setting cookie:', err);
        });
    }

    return newSession; // Return the new session
});

ipcMain.handle('set-cookies', async (event, cookies) => {
  try {
    // Set cookies in both the default and custom sessions
    const defaultSession = session.defaultSession;
    const customSession = session.fromPartition('persist:tab-1', { cache: true });

    await Promise.all(
      cookies.map(async (cookie) => {
        await defaultSession.cookies.set(cookie);
        await customSession.cookies.set(cookie);
        console.log(`Cookie set: ${cookie.name}`);
      })
    );

    return 'Cookies set successfully';
  } catch (error) {
    console.error('Error setting cookies:', error);
    throw error; // This will return an error to the renderer process
  }
});

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const createWindow = async () => {
  const customSession = session.fromPartition('persist:tab-1', { cache: true });

  const cookies = [
    { url: 'https://onlyfans.com', name: 'sess', value: '2fbcilfq7a7e0ms68h3jd95n7b', httpOnly: true, secure: true },
    { url: 'https://onlyfans.com', name: '_cfuvid', value: 'R6Cy8f.ASQAuacdwq9sVyV08W4ix_Tw0dco0OgSUBqs-1730013197638-0.0.1.1-604800000', httpOnly: true, secure: true },
    { url: 'https://onlyfans.com', name: 'lang', value: 'en', httpOnly: true, secure: true },
    { url: 'https://onlyfans.com', name: 'auth_id', value: '394757173', httpOnly: true, secure: true },
  ];

  cookies.forEach(cookie => {
    customSession.cookies.set(cookie).catch(error => {
      console.error('Error setting cookie:', error);
    });
  });

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // enableRemoteModule: true,
      webviewTag: true,
      sandbox: false,
      // partition: 'persist:tab-1',
    },
  });



  mainWindow.loadURL(resolveHtmlPath('index.html'));


  // mainWindow.webContents.on('did-finish-load', async () => {
  //   const cookies = [
  //     { url: 'https://onlyfans.com', name: 'sess', value: '2fbcilfq7a7e0ms68h3jd95n7b', httpOnly: true, secure: true },
  //     { url: 'https://onlyfans.com', name: '_cfuvid', value: 'R6Cy8f.ASQAuacdwq9sVyV08W4ix_Tw0dco0OgSUBqs-1730013197638-0.0.1.1-604800000', httpOnly: true, secure: true },
  //     { url: 'https://onlyfans.com', name: 'lang', value: 'en', httpOnly: true, secure: true },
  //     { url: 'https://onlyfans.com', name: 'auth_id', value: '394757173', httpOnly: true, secure: true },
  //   ];

  //   // Send cookies to IPC handler
  //   mainWindow.webContents.send('set-cookies', cookies);

  //   // Set localStorage after loading
  //   mainWindow.webContents.executeJavaScript(`
  //     localStorage.setItem('bcTokenSha', '95ad16528ee36510d580788ccf4123ca914e3498');
  //   `);
  // });

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  // remoteMain.enable(mainWindow.webContents);

  new AppUpdater();
};


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(createWindow).catch(console.log);
ipcMain.on('ipc-example', async (event, ...args) => {
  console.log(`Received message on channel 'ipc-example':`, ...args);

  const session = require('electron').session.fromPartition('persist:tab-1');
  console.log("session", session)
  const cookies = [
    {
      url: 'https://onlyfans.com',
      name: 'sess',
      value: '42i1g4qtg99el52uki0vcghc1d',
      httpOnly: true,
      secure: true,
    },
    {
      url: 'https://onlyfans.com',
      name: '_cfuvid',
      value: '6j0Vm.IsWq9VRx7fq8wVVKsSCWpjJrIsvWbUm3RV93M-1730407033603-0.0.1.1-604800000',
      httpOnly: true,
      secure: true,
    },
    {
      url: 'https://onlyfans.com',
      name: 'lang',
      value: 'en',
      httpOnly: true,
      secure: true,
    },
    {
      url: 'https://onlyfans.com',
      name: 'auth_id',
      value: '394757173',
      httpOnly: true,
      secure: true,
    },
  ];

  try {
    await Promise.all(cookies.map(cookie => session.cookies.set(cookie)));
    cookies.forEach(cookie => console.log(`Cookie set: ${cookie.name}`));
  } catch (error) {
    console.error('Error setting cookies:', error);
  }
});
