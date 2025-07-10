const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generate");
const fileLabel = document.getElementById("fileLabel");
const mergeBtn = document.getElementById("mergeFiles");
const mergeInput = document.getElementById("mergeInput");

if (!window.electronAPI) {
  console.warn("⚠️ window.electronAPI is not available. Check preload.js exposure.");
}

fileInput.addEventListener("change", () => {
  fileLabel.innerHTML = fileInput.files.length
    ? "📁 <span class='uploaded'>chat.db ready ✅</span>"
    : "📂 Select <code>chat.db</code>";
});

generateBtn.addEventListener("click", async () => {
  const filePath = await window.electronAPI.chooseChatDb();
  if (!filePath) {
    return alert("❌ No chat.db file selected.");
  }

  console.log("📦 Selected file path:", filePath);

  console.log("🚀 Sending to extractor:", { dbPath: filePath });

  try {
    const result = await window.electronAPI.runExtractor({ dbPath: filePath });

    alert(`✅ Export complete.\nCheck terminal or output folder.`);
    console.log(result);
  } catch (err) {
    console.error("❌ Extractor error:", err);
    alert(`❌ Unexpected error:\n${err?.message || err}`);
  }
});

mergeBtn.addEventListener("click", async () => {
  if (!mergeInput.files.length || !fileInput.files.length) {
    return alert("❌ Select both: .shm/.wal AND main .db file.");
  }

  const dbFile = fileInput.files[0];
  const otherFiles = Array.from(mergeInput.files);

  if (otherFiles.length !== 2) {
    return alert("❌ Select exactly 2 companion files: .shm and .wal");
  }

  const allFiles = [dbFile, ...otherFiles];
  const paths = allFiles.map((file) => file.path);

  console.log("🧪 Paths to merge:", paths);

  try {
    const result = await window.electronAPI.finalizeDatabase(paths);
    alert("✅ Merge complete.\nNow generate your report.");
    console.log(result);

    if (!result.success) {
      console.error("❌ Merge process failed with error:", result.error);
    }
  } catch (err) {
    console.error("❌ Merge failed:", err);
    alert(`❌ Merge error:\n${err?.message || err}`);
  }
});
