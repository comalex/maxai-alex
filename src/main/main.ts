import path from 'path';
import { app, BrowserWindow, session, ipcMain } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { AuthData } from './types';

const remoteMain = require('@electron/remote/main');
// const Sentry = require('@sentry/node');
// const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Sentry.init({
//   dsn: 'https://56a4b37f6792ac0d7741ab34af123ed9@o4507266847539200.ingest.us.sentry.io/4508223070797824',
//   integrations: [
//     nodeProfilingIntegration(),
//   ],
//   // Tracing
//   tracesSampleRate: 1.0, // Capture 100% of the transactions

//   // Set sampling rate for profiling - this is relative to tracesSampleRate
//   profilesSampleRate: 1.0,
// });

remoteMain.initialize();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.allowPrerelease = true; // Enable this if testing with pre-releases
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.setFeedURL('https://api.trymax.ai/updates/production');
    // autoUpdater.setFeedURL('http://localhost:8000/updates/production');
    autoUpdater.on('error', (error) => {
      log.error('Error fetching updates:', error);
      // Sentry.captureException(error); // Log error to Sentry
    });
    autoUpdater.on('update-available', () => {
      log.info('Update available.');
      // Sentry.captureMessage('Update available'); // Log update available to Sentry
    });
    autoUpdater.on('update-not-available', () => {
      log.info('No updates available.');
      // Sentry.captureMessage('No updates available'); // Log no updates available to Sentry
    });
    autoUpdater.on('update-downloaded', () => {
      log.info('Update downloaded.');
      // Sentry.captureMessage('Update downloaded'); // Log update downloaded to Sentry
    });
  }
}

let mainWindow = null;

ipcMain.handle('create-session', async (event, cookies) => {
  const newSession = session.fromPartition(
    `persist:my-partition-${Date.now()}`,
  );

  // Set cookies for the new session
  for (const cookie of cookies) {
    await newSession.cookies.set(cookie).catch((err) => {
      console.error('Error setting cookie:', err);
    });
  }

  return newSession; // Return the new session
});

ipcMain.handle('set-cookies', async (event, cookies) => {
  try {
    // Set cookies in both the default and custom sessions
    const { defaultSession } = session;
    const customSession = session.fromPartition('persist:tab-1', {
      cache: true,
    });

    await Promise.all(
      cookies.map(async (cookie) => {
        await defaultSession.cookies.set(cookie);
        await customSession.cookies.set(cookie);
        console.log(`Cookie set: ${cookie.name}`);
      }),
    );

    return 'Cookies set successfully';
  } catch (error) {
    console.error('Error setting cookies:', error);
    throw error; // This will return an error to the renderer process
  }
});

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const createWindow = async () => {

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

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  console.warn(`Ignoring certificate error for URL: ${url}`);
  event.preventDefault();
  callback(true); // Allow the connection despite the certificate error
});

let PROXIES: { [key: string]: { type: string; ip: string; port: string; username: string; password: string } } = {};

app.on('login', (event, webContents, request, authInfo, callback) => {
  event.preventDefault();
  console.log('Global login event triggered', PROXIES);
  if (authInfo.isProxy) {
    const proxy = PROXIES[authInfo.host];
    if (proxy) {
      callback(proxy.username, proxy.password);
    } else {
      console.warn('Proxy authentication required but no proxy found for host:', authInfo.host);
    }
  } else {
    // Handle other authentication scenarios if needed
    console.warn('Non-proxy authentication required');
  }
});

app.whenReady().then(createWindow).catch(console.log);

ipcMain.on('ipc-example', async (event, [persistId, auth]: [string, AuthData]) => {
  console.log(`Received message on channel 'ipc-example':`);
  console.log('Persist ID:', persistId);
  console.log('Auth Data:', auth);
  const session = require('electron').session.fromPartition(persistId);
  // console.log('session', session);

  let proxyStatus = 'No proxy information provided in auth data';
  if (auth.proxy) {
    const { type, ip, port } = auth.proxy;
    const proxyRules = `http=${ip}:${port};https=${ip}:${port};socks5=${ip}:${port}`;
    PROXIES[ip] = { type, ip, port, username: auth.proxy.username, password: auth.proxy.password }; // Add proxy to PROXIES
    try {
      await session.setProxy({ proxyRules });
      console.log('Proxy set successfully');
      proxyStatus = 'Proxy set successfully';
    } catch (error) {
      console.error('Error setting proxy:', error);
      proxyStatus = 'Error setting proxy';
    }
  } else {
    console.warn(proxyStatus);
  }

  const cookies = [
    {
      url: 'https://onlyfans.com',
      name: 'sess',
      value: auth.sess,
      httpOnly: true,
      secure: true,
    },
    {
      url: 'https://onlyfans.com',
      name: '_cfuvid',
      value: auth._cfuvid,
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
      value: auth.auth_id,
      httpOnly: true,
      secure: true,
    },
    {
      url: 'https://onlyfans.com',
      name: 'test',
      value: 'alex',
      httpOnly: true,
      secure: true,
    },
  ];

  let cookiesStatus = 'Cookies set successfully';
  try {
    await Promise.all(cookies.map((cookie) => session.cookies.set(cookie)));
    // cookies.forEach((cookie) => console.log(`Cookie set: ${cookie.name}, Value: ${cookie.value}`));
  } catch (error) {
    console.error('Error setting cookies:', error);
    cookiesStatus = 'Error setting cookies';
  }

  const result = {
    persistId,
    proxyStatus,
    cookiesStatus,
  };

  event.reply('ipc-example-response', result);
  return result;
});
