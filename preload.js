const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runExtractor: (dbPath, number, format) =>
    ipcRenderer.invoke("run-extractor", dbPath, number, format),
});
