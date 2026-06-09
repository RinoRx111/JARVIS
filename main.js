const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const kill = require('tree-kill');

let mainWindow;
let backendProcess;

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

  if (isDev) {
    // In dev, we might still want to use the dev server if it's running, 
    // but the instruction is to use production ready.
    // Let's assume we serve the static 'out' directory.
    const indexPath = path.join(__dirname, 'frontend', 'out', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.log('Static export not found, please run npm run build in frontend directory.');
    }
  } else {
    mainWindow.loadFile(path.join(process.resourcesPath, 'frontend', 'out', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  console.log('Starting Python backend...');
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
        windowsHide: true
      });
    } else {
      console.error("Backend executable not found at", executablePath);
    }
  }

  if (backendProcess) {
    backendProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`Backend Err: ${data}`));
  }
}

app.whenReady().then(() => {
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
    console.log('Killing backend process...');
    kill(backendProcess.pid);
  }
});
