// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

contextBridge.exposeInMainWorld('bridge', {

  // lockfile
  getLockfile: (lockfile: any) => {
    ipcRenderer.on('lockfile', lockfile)
  },
  requestLockfile: (lockfile: any) => {
    ipcRenderer.send('lockfile', lockfile)
  },

  // entitlement
  requestEntitlement: (entitlement: any) => {
    ipcRenderer.send('send-entitlement', entitlement)
  },
  getEntitlement: (entitlement: any) => {
    ipcRenderer.on('get-entitlement', entitlement)
  },

  // player info
  requestPlayerInfo: (info: any) => {
    ipcRenderer.send('send-player-info', info)
  },
  getPlayerInfo: (info: any) => {
    ipcRenderer.on('get-player-info', info)
  },

  // rso info
  requestRSOUserInfo: (info: any) => {
    ipcRenderer.send('send-rso-user-info', info)
  },
  getRSOUserInfo: (info: any) => {
    ipcRenderer.on('get-rso-user-info', info)
  },

  // mmr
  requestPlayerMMR: (mmr: any) => {
    ipcRenderer.send('request-mmr', mmr)
  },
  getPlayerMMR: (mmr: any) => {
    ipcRenderer.on('get-mmr', mmr)
  }


})

export type ElectronHandler = typeof electronHandler;
