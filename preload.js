const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectOutputPath: () => ipcRenderer.invoke("choose-output-path"),

  runExtractor: ({ dbPath, outputPath }) =>
    ipcRenderer.invoke("run-extractor", { dbPath, outputPath }),

  finalizeDatabase: (paths) => ipcRenderer.invoke("finalizeDatabase", paths),
});