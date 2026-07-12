const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 720,
    title: '戌無公众号排版工具',
    backgroundColor: '#f5f5f7',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', () => {
    isQuitting = true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (process.platform === 'win32' || isQuitting) {
      app.quit();
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
