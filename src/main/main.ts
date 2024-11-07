import path from 'path';
import { app, BrowserWindow, session, ipcMain, dialog } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import https from 'https';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { AuthData, Proxy } from './types';
import { API_URL, X_API_KEY } from '../renderer/config';

// const remoteMain = require('@electron/remote/main');
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

// remoteMain.initialize();

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
      webSecurity: false,
      sandbox: false,
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

// app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
//   console.warn(`Ignoring certificate error for URL: ${url}`);
//   event.preventDefault();
//   callback(true); // Allow the connection despite the certificate error
// });

let PROXIES: { [key: string]: Proxy } = {};

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

ipcMain.on('ipc-inject', async (event, [type]) => {
  console.log('ipc-inject event received with arguments:', type);
  mainWindow.webContents.send('ipc-inject-response', type);
});

ipcMain.on('ipc-example', async (event, [persistId, data]: [string, AuthData]) => {
  console.log(`Received message on channel 'ipc-example':`);
  console.log('Persist ID:', persistId);
  const { proxy, app_settings } = data;
  const auth = app_settings.cookies;
  console.log('Auth Data:', auth);
  console.log('Proxy:', proxy);
  const session = require('electron').session.fromPartition(persistId);
  // console.log('session', session);

  let proxyStatus = 'No proxy information provided in auth data';
  if (proxy && proxy.host) {
    const { host, port, type } = proxy;
    const proxyRules = type ? `${type}=${host}:${port}` : `http=${host}:${port};https=${host}:${port};socks5=${host}:${port}`;
    PROXIES[host] = { type, host, port, username: proxy.username, password: proxy.password }; // Add proxy to PROXIES
    console.log("proxyRules", proxyRules)
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
      name: 'auth_id',
      value: auth.auth_id,
      httpOnly: true,
      secure: true,
    },
    // {
    //   url: 'https://onlyfans.com',
    //   name: 'test',
    //   value: persistId,
    //   httpOnly: true,
    //   secure: true,
    // },
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




// Function to download a file and save it temporarily
function downloadFile(url, callback) {
  const tempFilePath = path.join(app.getPath('temp'), path.basename(url));

  const file = fs.createWriteStream(tempFilePath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      callback(tempFilePath);
    });
  }).on('error', (err) => {
    fs.unlink(tempFilePath);
    console.error('Error downloading file:', err);
    dialog.showErrorBox('Download Error', 'Could not download the file.');
  });
}

// Handle download request from renderer process
ipcMain.handle('download-file', async (event, url) => {
  console.log(`Download request received for URL: ${url}`);
  return new Promise((resolve) => {
    downloadFile(url, (filePath) => {
      console.log(`File downloaded to: ${filePath}`);
      resolve(filePath);
    });
  });
});

ipcMain.on('ondragstart', (event, filePath) => {
  const iconName = path.join(__dirname, '../../assets/arrows_14574301.png');
  try {
    event.sender.startDrag({
      // file: path.join(__dirname, filePath),
      file: filePath,
      icon: iconName
    });
  } catch (error) {
    console.error('Error starting drag operation:', error);
  }
})


ipcMain.on('read-data', async (event, [creatorUuid, bcTokenSha]) => {
  try {
    console.log(`Received request to read cookies and send to API for persistId: ${creatorUuid} and bcTokenSha: ${bcTokenSha}`);
    const url = 'https://onlyfans.com';
    const cookieNames = ['sess', '_cfuvid', 'auth_id'];

    // Retrieve cookies for the specified URL
    console.log(`Retrieving cookies for URL: ${url}`);
    const cookies = await require('electron').session.fromPartition(`persist:${creatorUuid}`).cookies.get({ url });
    console.log(`Retrieved cookies: ${JSON.stringify(cookies)}`);

    // Filter the cookies to only include the ones you need
    const filteredCookies = cookies.filter(cookie => cookieNames.includes(cookie.name));
    console.log(`Filtered cookies: ${JSON.stringify(filteredCookies)}`);

    // Convert cookies to a format suitable for API payload
    const cookieData = {};
    filteredCookies.forEach(cookie => {
      cookieData[cookie.name] = cookie.value;
    });
    console.log(`Cookie data prepared for API payload: ${JSON.stringify(cookieData)}`);

    // Prepare payload for the API
    const payload = {
      app_settings: {
        bcTokenSha,
        cookies: cookieData,
      },
    };
    console.log(`Payload prepared for API: ${JSON.stringify(payload)}`);

    // Send the payload to your API endpoint
    const response = await fetch(`${API_URL}/api/v2/creator/${creatorUuid}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': `${X_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send cookies to API');
      throw new Error('Failed to send cookies to API');
    }
    const result = await response.json();
    console.log('Data sent successfully:', result);
    event.reply('read-cookies-and-send-to-api-response', result);
  } catch (error) {
    console.error('Error reading cookies or sending to API:', error);
    event.reply('read-cookies-and-send-to-api-error', error.message);
  }
});

ipcMain.on(
  'save-proxy',
  async (
    event,
    [
      creatorUuid,
      bcTokenSha,
      proxyType,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    ],
  ) => {
    try {
      const payload = {
        bcTokenSha,
        of_account_uuid: creatorUuid,
        type: proxyType,
        host: proxyHost,
        port: proxyPort,
        username: proxyUsername,
        password: proxyPassword,
      };
      const response = await fetch(`${API_URL}/api/v2/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': `${X_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      console.log('Response:', response);

      if (!response.ok) {
        console.error('Failed to send cookies to API');
        throw new Error('Failed to send cookies to API');
      }
      const result = await response.json();
      console.log('Data sent successfully:', result);
      event.reply('read-cookies-and-send-to-api-response', result);
    } catch (error) {
      console.error('Error reading cookies or sending to API:', error);
      event.reply('read-cookies-and-send-to-api-error', error.message);
    }
  },
);

ipcMain.handle('get-config', () => {
  return {
    path: __dirname,
  }
});
