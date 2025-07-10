const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  chooseChatDb: () => ipcRenderer.invoke("choose-chat-db"),

  runExtractor: ({ dbPath, shmPath, walPath }) => {
    console.log("Running extractor with:", { dbPath, shmPath, walPath });
    return ipcRenderer.invoke("run-extractor", {
      dbPath: String(dbPath),
      shmPath: String(shmPath),
      walPath: String(walPath),
    });
  },

  finalizeDatabase: (paths) => ipcRenderer.invoke("finalizeDatabase", paths),

  selectFiles: () => ipcRenderer.invoke("dialog:openFiles"),
});