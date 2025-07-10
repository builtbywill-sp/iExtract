const { contextBridge, ipcRenderer } = require("electron");

try {
  contextBridge.exposeInMainWorld("electronAPI", {
    selectOutputPath: async () => {
      try {
        const path = await ipcRenderer.invoke("choose-output-path");
        if (path) {
          console.log("📂 Output path selected:", path);
          return { success: true, path };
        } else {
          console.warn("⚠️ No output path selected.");
          return { success: false, error: "No path selected." };
        }
      } catch (err) {
        console.error("❌ Error selecting output path:", err);
        return { success: false, error: err.message };
      }
    },
    runExtractor: (dbPath, phone, format, outputPath) => {
      console.log("📤 runExtractor payload:", { dbPath, phone, format, outputPath });
      return ipcRenderer.invoke("run-extractor", {
        dbPath,
        number: phone,
        format,
        outputPath
      });
    },
    finalizeDatabase: (paths) =>
      ipcRenderer.invoke("finalize-db", {
        dbPath: paths[0],
        extraFiles: paths.slice(1),
      }),
  });
} catch (preloadError) {
  console.error("❌ Preload script failed to initialize:", preloadError);
}