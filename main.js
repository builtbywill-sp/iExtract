const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { execFile } = require("child_process");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");
}

// App ready
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit on all windows closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handler
ipcMain.handle("run-extractor", async (event, dbPath, number, format) => {
  return new Promise((resolve, reject) => {
    const desktopDir = app.getPath("desktop");
    const timestamp = Date.now();
    const outFile = path.join(
      desktopDir,
      `iextract_output_${timestamp}.csv`
    );

    const args = [dbPath, outFile]; // Only pass db and output path

    execFile(
      "node",
      [path.join(__dirname, "extract.js"), ...args],
      (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: stderr || err.message });
        } else {
          const { shell } = require("electron");
          shell.showItemInFolder(outFile); // opens Desktop with file selected
          resolve({ success: true, filename: outFile });
        }
      }
    );
  });
});
