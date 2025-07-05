const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectOutputPath: () => ipcRenderer.invoke("choose-output-path"),
  runExtractor: (dbPath, phone, format, outputPath) =>
    ipcRenderer.invoke("run-extractor", {
      dbPath,
      number: phone,
      format,
      outputPath
    }),
  finalizeDatabase: (paths) =>
    ipcRenderer.invoke("finalize-db", paths[0], paths.slice(1)),
});