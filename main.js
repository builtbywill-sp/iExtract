let dbPath = null;
let extraPaths = [];
let outputPath = null;

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require("path");
const { execFile } = require("child_process");
const fs = require("fs");

ipcMain.handle("choose-output-path", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  return result.filePaths[0] || null;
});

ipcMain.handle("finalize-db", async (event, payload) => {
  const { dbPath, extraFiles } = payload || {};
  if (!dbPath || !extraFiles || !Array.isArray(extraFiles)) {
    return { success: false, error: "Invalid inputs" };
  }

  const baseDir = path.dirname(dbPath);
  try {
    for (const file of extraFiles) {
      const targetPath = path.join(baseDir, path.basename(file));
      fs.copyFileSync(file, targetPath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("run-extractor", async (event, payload) => {
  const { dbPath, number, format, outputPath } = payload || {};
  if (!dbPath || !outputPath || !format) {
    return { success: false, error: "Missing required input." };
  }

  const outputFile = path.join(outputPath, "iextract-report.csv");

  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(__dirname, "extract.js"), dbPath, outputFile],
      (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: stderr || err.message });
        } else {
          resolve({ success: true, filename: outputFile });
        }
      }
    );
  });
});

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");
});
