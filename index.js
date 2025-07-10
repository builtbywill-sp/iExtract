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
  if (!fileInput.files.length) {
    return alert("❌ No file selected.");
  }

  const outputPath = await window.electronAPI.selectOutputPath();
  if (!outputPath) {
    return alert("❌ No output path selected.");
  }

  const file = fileInput.files[0];
  const filePath = file.path || file.name;
  if (!filePath) {
    return alert("❌ Failed to retrieve file path.");
  }

  try {
    const result = await window.electronAPI.runExtractor({ dbPath: filePath, outputPath });

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
