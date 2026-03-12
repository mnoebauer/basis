import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { setupIpcHandlers } from './ipcHandlers';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const _dirname = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

// Preload script path
const preload = join(_dirname, 'index.mjs');
// Renderer src path
const indexHtml = join(_dirname, '../dist/index.html');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        title: 'Note App',
        width: 1000,
        height: 700,
        titleBarStyle: 'hiddenInset',
        vibrancy: 'sidebar',
        visualEffectState: 'active',
        webPreferences: {
            preload,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(indexHtml);
    }
}

app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
