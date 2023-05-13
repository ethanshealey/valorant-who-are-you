/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import fs from 'node:fs'
import axios from 'axios'
const https = require('https')

// app.disableHardwareAcceleration()
let lockfile: any = undefined

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html')).then(() => {
    // wait for file
    const lockfilePath = `${process.env.LOCALAPPDATA}\\Riot Games\\Riot Client\\Config\\lockfile`
    let inter = setInterval(() => {
      if(fs.existsSync(lockfilePath)) {
        fs.readFile(lockfilePath, 'utf8', (err, data) => {
          if(err) {
            console.error(err)
            return
          }
          const lockfileDataArr = data.split(':')
          const lockfileData = {
            'name': lockfileDataArr[0],
            'pid': lockfileDataArr[1],
            'port': lockfileDataArr[2],
            'password': lockfileDataArr[3],
            'protocol': lockfileDataArr[4],
            '__force__': Math.random()
          }
          console.log(lockfileData)
          lockfile = lockfileData

          mainWindow?.webContents.send('lockfile', lockfileData)

        })
        clearInterval(inter)
      }
    }, 5000)
  });

















/****
 * 
 * =================================================================================================
 * VALORANT
 *   API
 * ENDPOINTS
 * =================================================================================================
 * 
 */

/**
 * HELPERS
 */
const createAxiosRequestWithPassword = () => {
  return axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('riot:' + lockfile.password)
    }
  })
}

/***
 * ENTITLEMENT
 */
const getEntitlement = async () => {

  const instance = createAxiosRequestWithPassword()
  const url = `https://127.0.0.1:${lockfile.port}/entitlements/v1/token`

  return instance.get(url).then((res) => {
      return res.data
  }).catch(e => console.log)
}
ipcMain.on('send-entitlement', async () => {
  const res = await getEntitlement()
  mainWindow?.webContents.send('get-entitlement', res)
})

/**
 * PLAYER INFO
 */
const getPlayerInfo = async () => {

  const entitlement = await getEntitlement()
  const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + entitlement.accessToken
    }
  })

  const url = `https://auth.riotgames.com/userinfo`

  return instance.get(url).then((res) => {
    return res.data
  }).catch(e => console.log)
}
ipcMain.on('send-player-info', async () => {
  const res = await getPlayerInfo()
  console.log(res)
  mainWindow?.webContents.send('get-player-info', res)
})

/**
 * RSO USER INFO
 */
const getRSOUserInfo = async () => {
    if(lockfile) {
      const instance = createAxiosRequestWithPassword()
      const url = `https://127.0.0.1:${lockfile.port}/rso-auth/v1/authorization/userinfo`
      return instance.get(url).then((res) => {
        return res.data
      }).catch(e => console.log)
    }
}
ipcMain.on('send-rso-user-info', async () => {
  const res = await getRSOUserInfo()
  mainWindow?.webContents.send('get-rso-user-info', res)
})

/****
 * 
 * =================================================================================================
 *   END
 * VALORANT
 *   API
 * ENDPOINTS
 * =================================================================================================
 * 
 */


































  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);