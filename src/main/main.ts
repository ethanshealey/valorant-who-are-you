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

// Lets save some important information 
// for later API calls :)
let lockfile: any = undefined;
let puuid: string | undefined = undefined;
let session: any = undefined;
let clientVersion: string | undefined = undefined;
let region: string | undefined = undefined;
let shard: string | undefined = undefined;

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
    autoHideMenuBar: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'))

















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

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}



/**
 * CLIENT VERSION
 */
const getClientVersion = async () => {
  const clientVersionPath = `${process.env.LOCALAPPDATA}\\VALORANT\\Saved\\Logs\\ShooterGame.log`
  if(fs.existsSync(clientVersionPath)) {
    let target = fs.readFileSync(clientVersionPath, 'utf8')
    clientVersion = target.split('\n').find(line => line.includes('CI server version:'))?.split(' ').slice(-1)[0].replaceAll(/(\r\n|\r|\n)/gm, '')
  }
}

/**
 * LOCKFILE
 */
const getLockfile = async () => {
  await getClientVersion()
  await getRegionAndShard()
  const lockfilePath = `${process.env.LOCALAPPDATA}\\Riot Games\\Riot Client\\Config\\lockfile`
    let inter = setInterval(() => {
      if(fs.existsSync(lockfilePath)) {
        fs.readFile(lockfilePath, 'utf8', async (err, data) => {
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
          lockfile = lockfileData

          mainWindow?.webContents.send('lockfile', lockfileData)
          
          await getSession()
          await getPlayerMMR()
  
        })
        clearInterval(inter)
      }
    }, 1000)
}
ipcMain.on('lockfile', async () => {
  getLockfile()
})

/**
 * SESSION
 */
const getSession = async () => {
  const instance = createAxiosRequestWithPassword()
  const url = `https://127.0.0.1:${lockfile.port}/product-session/v1/external-sessions`

  await instance.get(url).then((res) => {
      // get key and pull client version from session data
      const key = Object.keys(res.data).filter(k => k !== 'host_app')[0]
      session = res.data[key]
  }).catch(e => console.log)

}

/**
 * REGION/SHARD
 */
const getRegionAndShard = async () => {
  const regionAndShardPath = `${process.env.LOCALAPPDATA}\\VALORANT\\Saved\\Logs\\ShooterGame.log`
  if(fs.existsSync(regionAndShardPath)) {
    let target: any = fs.readFileSync(regionAndShardPath, 'utf8')//, (err, data) => {
    target = target?.split('\n')?.find((line: any) => line.includes('https://glz-'))?.split(' ').find((line: any) => line.includes('https://glz-'))
    region = target?.split('-')[1]
    shard = target?.split('-')[2].split('.')[1]
  }
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
  puuid = JSON.parse(res.userInfo).sub
  mainWindow?.webContents.send('get-rso-user-info', res)
})

/**
 * PLAYER MMR
 */
const getPlayerMMR = async (id: string = '') => {

  // get entitlement tokens
  const entitlement = await getEntitlement()

  while(!clientVersion || !puuid)
    await sleep(500)

  if(id === '') id = puuid

  // Create Axios instance
  const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    headers: {
        'Content-Type': 'application/json',
        'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
        'X-Riot-ClientVersion': clientVersion,
        'X-Riot-Entitlements-JWT': entitlement.token,
        'Authorization': 'Bearer ' + entitlement.accessToken
    }
  })

  const url = `https://pd.${shard}.a.pvp.net/mmr/v1/players/${id}`

  return instance.get(url).then((res) => {
    return res.data
  }).catch(e => {
    console.log(e)
  })

}
ipcMain.on('request-mmr', async (mmr) => {
  const res = await getPlayerMMR(puuid)
  mainWindow?.webContents.send('get-mmr', res)
})

/**
 * MATCH HISTORY
 */
const getMatchHistory = async () => {
  // get entitlement tokens
  const entitlement = await getEntitlement()

  while(!entitlement || !puuid || !shard)
    await sleep(500)

  // Create Axios instance
  const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    headers: {
        'Content-Type': 'application/json',
        'X-Riot-Entitlements-JWT': entitlement.token,
        'Authorization': 'Bearer ' + entitlement.accessToken
    }
  })

  const url = `https://pd.${shard}.a.pvp.net/match-history/v1/history/${puuid}`

  return instance.get(url).then((res) => {
    return res.data
  })

}
ipcMain.on('request-match-history', async () => {
  const hist = await getMatchHistory()
  mainWindow?.webContents.send('get-match-history', hist)
})

/**
 * MATCH DETAILS
 */
const getMatchDetails = async () => {

  const entitlement = await getEntitlement()
  
  const match = await getMatchHistory()

  const newest_match = match.History?.reduce((prev: any, curr: any) => prev.GameStartTime > curr.GameStartTime ? prev : curr)

  while(!entitlement || !match || !shard)
    await sleep(500)

  // Create Axios instance
  const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    headers: {
        'Content-Type': 'application/json',
        'X-Riot-Entitlements-JWT': entitlement.token,
        'Authorization': 'Bearer ' + entitlement.accessToken
    }
  })

  const url = `https://pd.${shard}.a.pvp.net/match-details/v1/matches/${newest_match.MatchID}`

  return instance.get(url).then((res) => {

    console.log(res.data)
    if(res.data.matchInfo.isCompleted) return { error: 'No Live Game' }

    return res.data
  })

}
ipcMain.on('request-match-details', async () => {
  const match = await getMatchDetails()
  mainWindow?.webContents.send('get-match-details', match)
})

/**
 * CURRENT PLAYER
 */
const getCurrentPlayer = async () => {

  const entitlement = await getEntitlement()

  while(!entitlement || !region || !shard)
    await sleep(500)

  const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    headers: {
        'Content-Type': 'application/json',
        'X-Riot-Entitlements-JWT': entitlement.token,
        'Authorization': 'Bearer ' + entitlement.accessToken
    }
  })
  
  const url = `https://glz-${region}-1.${shard}.a.pvp.net/core-game/v1/players/${puuid}`

  return instance.get(url).then((res) => {
    return res.data
  })
  .catch(e => {
    return { error: "No Live Game" }
  })
}

/**
 * CURRENT MATCH DETAILS
 */
const getCurrentMatchDetails = async () => {

  const entitlement = await getEntitlement()

  while(!entitlement || !region || !shard)
    await sleep(500)

  const cp = await getCurrentPlayer()

  if(cp?.error === 'No Live Game') return { error: 'No Live Game' }

  const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    headers: {
        'Content-Type': 'application/json',
        'X-Riot-Entitlements-JWT': entitlement.token,
        'Authorization': 'Bearer ' + entitlement.accessToken
    }
  })

  const url = `https://glz-${region}-1.${shard}.a.pvp.net/core-game/v1/matches/${cp.MatchID}`

  return instance.get(url).then(async (res) => {

    /**
     * Parse Data
     */
    const players: Object = {'Red': [], 'Blue': []}

    for(const player of res.data.Players) {
      const playerObject = await getPlayerMMR(player.PlayerIdentity.Subject)
      let otherData: any = await fetch(`https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/${region}/${player.PlayerIdentity.Subject}`)
      otherData = await otherData.json()
      playerObject['name'] = otherData?.data?.name
      playerObject['tag'] = otherData?.data?.tag

      let rank = 0;

      if(playerObject?.QueueSkills?.competitive?.SeasonalInfoBySeasonID)
        if(Object.keys(playerObject?.QueueSkills?.competitive?.SeasonalInfoBySeasonID).includes(playerObject.LatestCompetitiveUpdate.SeasonID)) 
          rank = playerObject.QueueSkills.competitive.SeasonalInfoBySeasonID[playerObject.LatestCompetitiveUpdate.SeasonID].Rank
      
      console.log(otherData?.data?.name, playerObject.LatestCompetitiveUpdate.SeasonID, Object.keys(playerObject.QueueSkills.competitive.SeasonalInfoBySeasonID))

      // players.push(playerObject)
      players[player.TeamID].push({
        'name': otherData?.data?.name,
        'tag': otherData?.data?.tag,
        'rank': rank,
        'puuid': player.PlayerIdentity.Subject,
        'level': player.PlayerIdentity.AccountLevel,
        'character': player.CharacterID
      })
    }

    // console.log(players)
    return players
    
  }).catch(e => {
    console.log(e)
    return { error: "No Live Game" }
  })

}
ipcMain.on('request-current-match-details', async () => {
  const match = await getCurrentMatchDetails()
  mainWindow?.webContents.send('get-current-match-details', match)
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