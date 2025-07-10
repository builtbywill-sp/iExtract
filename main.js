const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { execFile } = require("child_process");
const { dialog } = require("electron");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// 🔁 Run extractor with db + output
ipcMain.handle("run-extractor", async (event, { dbPath, outputPath }) => {
  return new Promise((resolve) => {
    if (!dbPath || !outputPath) {
      resolve({ success: false, error: "❌ Missing database or output path." });
      return;
    }
    const timestamp = Date.now();
    const outFile = path.join(outputPath, `iextract_output_${timestamp}.csv`);
    const scriptPath = path.join(__dirname, "extract.js");

    execFile("node", [scriptPath, dbPath, outFile], (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Extractor execution error:", err);
        resolve({ success: false, error: stderr || err.message });
      } else {
        const { shell } = require("electron");
        shell.showItemInFolder(outFile);
        resolve({ success: true, filename: outFile });
      }
    });
  });
});

// 🔁 Merge .db + .shm + .wal
ipcMain.handle("merge-db-files", async (event, filePaths) => {
  try {
    const dbPath = filePaths.find(file => file.endsWith(".db"));
    const shmPath = filePaths.find(file => file.endsWith(".db-shm"));
    const walPath = filePaths.find(file => file.endsWith(".db-wal"));

    if (!dbPath || !shmPath || !walPath) {
      return { success: false, error: "All three files must be selected." };
    }

    const { execSync } = require("child_process");
    execSync(`sqlite3 "${dbPath}" "PRAGMA wal_checkpoint(FULL);"`, { stdio: 'inherit' });

    return { success: true, mergedPath: dbPath };
  } catch (err) {
    console.error("❌ Merge error:", err);
    return { success: false, error: err.message };
  }
});

// 🔁 Finalize (optional integrity check)
ipcMain.handle("finalizeDatabase", async (event, filePaths) => {
  if (!filePaths || filePaths.length !== 3) {
    return { success: false, error: "Please provide all 3 files." };
  }

  try {
    const sqlite3 = require("sqlite3").verbose();
    const db = new sqlite3.Database(filePaths[0]);

    await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table';", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    db.close();
    return { success: true, message: "DB validated." };
  } catch (err) {
    console.error("❌ Finalize error:", err);
    return { success: false, error: err.message };
  }
});

// Handler for selecting the output path
ipcMain.handle("choose-output-path", async () => {
  const result = await dialog.showOpenDialog({
    title: "Choose Output Folder",
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});