const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { execFile } = require("child_process");
const path = require("path");
ipcMain.handle("run-extractor", async (event, payload) => {
  const { dbPath, number, format, outputPath } = payload || {};
  console.log("🟡 IPC handler triggered with:", dbPath, number, format, outputPath);

  if (!dbPath || !outputPath || !format) {
    return { success: false, error: "Missing required input." };
  }

  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputPath, "iextract-report.csv");
    const args = [dbPath, outputFile]; // Pass db path and output file
    console.log("🟡 Executing extract.js with args:", args);

    execFile(
      process.execPath,
      [path.join(__dirname, "extract.js"), ...args],
      (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: stderr || err.message });
        } else {
          shell.showItemInFolder(outputFile); // Open location of output
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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
  });

  ipcMain.handle("choose-output-path", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return result.filePaths[0] || null;
  });

  win.loadFile('index.html');

});

// Handle finalization of DB and copying extra files
ipcMain.handle("finalize-db", async (event, chatDbPath, extraFiles) => {
  console.log("🛠️ Finalizing DB with:", chatDbPath, extraFiles);
  const fs = require("fs");

  try {
    const baseDir = path.dirname(Array.isArray(chatDbPath) ? chatDbPath[0] : chatDbPath);
    if (!Array.isArray(extraFiles)) {
      extraFiles = [];
    }
    console.log("📁 Attempting to copy files:", extraFiles);
    console.log("📦 Resolved full paths:", extraFiles.map(f => path.resolve(f)));
    for (const file of extraFiles.map(f => path.resolve(f))) {
      const targetPath = path.join(baseDir, path.basename(file));

      try {
        if (fs.existsSync(file)) {
          console.log(`✅ Copying from: ${file} to ${targetPath}`);
          fs.copyFileSync(file, targetPath);
        } else {
          console.warn(`⚠️ File not found during copy (full path missing): ${file}`);
        }
      } catch (copyErr) {
        console.error(`❌ Error copying file ${file}:`, copyErr);
      }
    }
    return { success: true };
  } catch (err) {
    console.error("❌ Finalize error:", err);
    return { success: false, error: err.message };
  }
});
