const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runExtractor: (dbPath, outFile) =>
    ipcRenderer.invoke("run-extractor", dbPath, outFile),

  finalizeDatabase: (paths) =>
    ipcRenderer.invoke("finalize-db", paths),
});