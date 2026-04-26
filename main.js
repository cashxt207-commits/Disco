require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog, screen, session } = require('electron');
const path = require('path');
const { Pool } = require('pg');

let mainWindow, splashWindow;
let db = null;

// Database connection
function initDB() {
  if (!process.env.DATABASE_URL) return null;
  try {
    db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT, tag TEXT, email TEXT UNIQUE, password TEXT,
        avatar_url TEXT, banner_url TEXT, avatar_color TEXT, status TEXT DEFAULT 'online',
        custom_status TEXT DEFAULT '', nitro_type TEXT, nitro_expires BIGINT,
        is_admin BOOLEAN DEFAULT false, created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY, name TEXT, icon_url TEXT, owner_id TEXT,
        invite_code TEXT, custom_invite TEXT, is_verified BOOLEAN DEFAULT false,
        is_community BOOLEAN DEFAULT false, boost_count INT DEFAULT 0, created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS server_members (
        server_id TEXT, user_id TEXT, joined_at BIGINT, roles TEXT[] DEFAULT '{}',
        PRIMARY KEY(server_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, server_id TEXT, name TEXT, position INT DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY, server_id TEXT, category_id TEXT, name TEXT,
        type TEXT DEFAULT 'text', position INT DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY, channel_id TEXT, server_id TEXT, author_id TEXT,
        content TEXT, type TEXT DEFAULT 'text', attachments JSONB DEFAULT '[]',
        reply_to TEXT, edited BOOLEAN DEFAULT false, created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS dm_messages (
        id TEXT PRIMARY KEY, dm_id TEXT, author_id TEXT, content TEXT,
        type TEXT DEFAULT 'text', attachments JSONB DEFAULT '[]', created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY, from_id TEXT, to_id TEXT, status TEXT DEFAULT 'pending',
        blocked_by TEXT, created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS group_dms (
        id TEXT PRIMARY KEY, name TEXT, owner_id TEXT, members TEXT[], created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS server_boosts (
        id TEXT PRIMARY KEY, server_id TEXT, user_id TEXT, boosted_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS nitro_purchases (
        id TEXT PRIMARY KEY, user_id TEXT, type TEXT, purchased_at BIGINT, expires_at BIGINT
      );
    `).catch(() => {}); // Hata logu gizlendi
    db.on('error', () => {}); // Beklenmeyen hata logu gizlendi
    console.log('Local/Offline mode (DB checked)');
    return db;
  } catch (err) {
    return null;
  }
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 300, height: 350, frame: false, transparent: true,
    alwaysOnTop: true, resizable: false, skipTaskbar: true,
    webPreferences: { contextIsolation: true }
  });
  splashWindow.loadFile('splash.html');
  splashWindow.center();
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.min(1400, width), height: Math.min(900, height),
    minWidth: 940, minHeight: 500, frame: false, show: false,
    backgroundColor: '#1e1f22',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  mainWindow.loadFile('login.html');
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) { splashWindow.destroy(); splashWindow = null; }
      mainWindow.show();
    }, 2800);
  });
}

app.whenReady().then(() => {
  initDB();
  createSplash();
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// Window controls
ipcMain.on('win-minimize', () => mainWindow?.minimize());
ipcMain.on('win-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('win-close', () => mainWindow?.close());
ipcMain.on('navigate', (_, page) => mainWindow?.loadFile(page));

// File dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Tüm Dosyalar', extensions: ['*'] },
      { name: 'Resimler', extensions: ['png','jpg','jpeg','gif','webp','bmp','svg'] },
      { name: 'Arşivler', extensions: ['zip','rar','7z','tar','gz'] },
      { name: 'Uygulamalar', extensions: ['exe','msi','dmg'] }
    ]
  });
  if (result.canceled) return null;
  const fs = require('fs');
  return result.filePaths.map(fp => ({
    name: path.basename(fp), path: fp, size: fs.statSync(fp).size,
    data: fs.readFileSync(fp).toString('base64'),
    ext: path.extname(fp).toLowerCase()
  }));
});

// Image dialog for avatar/icon
ipcMain.handle('open-image-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Resimler', extensions: ['png','jpg','jpeg','gif','webp'] }]
  });
  if (result.canceled) return null;
  const fs = require('fs');
  const fp = result.filePaths[0];
  const ext = path.extname(fp).replace('.','');
  const data = fs.readFileSync(fp).toString('base64');
  return `data:image/${ext};base64,${data}`;
});

// Audio devices
ipcMain.handle('get-media-devices', async () => {
  try {
    const devices = await mainWindow.webContents.executeJavaScript(`
      navigator.mediaDevices.enumerateDevices().then(d =>
        d.map(dev => ({deviceId:dev.deviceId, kind:dev.kind, label:dev.label}))
      )
    `);
    return devices;
  } catch { return []; }
});

// DB operations
ipcMain.handle('db-query', async (_, { text, params }) => {
  if (!db) return { rows: [], error: 'No database connection' };
  try {
    const result = await db.query(text, params);
    return { rows: result.rows };
  } catch (err) {
    return { rows: [], error: err.message };
  }
});

ipcMain.handle('db-status', () => ({ connected: !!db }));
