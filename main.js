const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const kill = require('tree-kill');

// Setup file-based logging
const logDir = app.getPath('userData');
const logPath = path.join(logDir, 'jarvis-os.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message.toString().trim()}\n`;
  console.log(formatted.trim());
  try {
    logStream.write(formatted);
  } catch (err) {
    // Ignore log write errors
  }
}

let mainWindow;
let backendProcess;
let frontendProcess;

const isDev = !app.isPackaged;
const basePath = isDev ? __dirname : path.dirname(app.getPath('exe'));

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1536,
    height: 864,
    title: 'JARVIS - AI Operating System',
    autoHideMenuBar: true, // Hides the standard window menu
    show: false, // Don't show until loaded
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.maximize();

  const loadServer = () => {
    if (!mainWindow) return;
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
      log('Next.js server not ready yet, retrying in 1s...');
      setTimeout(loadServer, 1000);
    });
  };
  loadServer();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startFrontend() {
  if (isDev) {
    // In dev mode, Next.js dev server is run externally via bat/terminal
    return;
  }
  log('Starting Next.js production server...');
  const frontendCwd = path.join(process.resourcesPath, 'frontend');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  frontendProcess = spawn(npmCmd, ['run', 'start'], {
    cwd: frontendCwd,
    shell: true,
    windowsHide: true
  });

  if (frontendProcess) {
    frontendProcess.stdout.on('data', (data) => log(`Frontend: ${data}`));
    frontendProcess.stderr.on('data', (data) => log(`Frontend Err: ${data}`));
  }
}

function startBackend() {
  log('Starting Python backend...');
  if (isDev) {
    backendProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: path.join(basePath, 'backend'),
      shell: true,
      windowsHide: true
    });
  } else {
    // In production, run the PyInstaller generated executable
    const executablePath = path.join(process.resourcesPath, 'backend', 'dist', 'jarvis-backend.exe');
    if (fs.existsSync(executablePath)) {
      backendProcess = spawn(executablePath, [], {
        cwd: path.dirname(executablePath),
        windowsHide: true
      });
    } else {
      log(`Backend executable not found at: ${executablePath}`);
    }
  }

  if (backendProcess) {
    backendProcess.stdout.on('data', (data) => log(`Backend: ${data}`));
    backendProcess.stderr.on('data', (data) => log(`Backend Err: ${data}`));
  }
}

app.whenReady().then(() => {
  startFrontend();
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup processes on quit
app.on('will-quit', () => {
  if (backendProcess && backendProcess.pid) {
    log('Killing backend process...');
    kill(backendProcess.pid);
  }
  if (frontendProcess && frontendProcess.pid) {
    log('Killing frontend process...');
    kill(frontendProcess.pid);
  }
});
