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

// Merge DB files handler
const fs = require("fs");

ipcMain.handle("merge-db-files", async (event, filePaths) => {
  try {
    const dbPath = filePaths.find(file => file.endsWith(".db"));
    const shmPath = filePaths.find(file => file.endsWith(".db-shm"));
    const walPath = filePaths.find(file => file.endsWith(".db-wal"));

    if (!dbPath || !shmPath || !walPath) {
      return { success: false, error: "All three files (.db, .db-shm, .db-wal) must be selected." };
    }

    console.log("Merging files:");
    console.log("DB:", dbPath);
    console.log("SHM:", shmPath);
    console.log("WAL:", walPath);

    const { execSync } = require("child_process");
    execSync(`sqlite3 "${dbPath}" "PRAGMA wal_checkpoint(FULL);"`, { stdio: 'inherit' });

    console.log("WAL checkpoint executed.");

    return { success: true, mergedPath: dbPath };
  } catch (err) {
    console.error("Merge failed:", err.message);
    return { success: false, error: err.message };
  }
});

// Finalize merged SQLite database handler
ipcMain.handle("finalize-db", async (event, filePaths) => {
  if (!filePaths || filePaths.length !== 3) {
    return { success: false, error: "Please provide chat.db, .shm, and .wal files." };
  }

  try {
    // No actual operation needed — accessing the DB causes WAL to commit
    const sqlite3 = require("sqlite3").verbose();
    const db = new sqlite3.Database(filePaths[0]);

    await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table';", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    db.close();

    return { success: true, message: "Database finalized successfully." };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
