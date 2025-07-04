const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generate");
const fileLabel = document.getElementById("fileLabel");
const mergeBtn = document.getElementById("mergeFiles");
const mergeInput = document.getElementById("mergeInput");

fileInput.addEventListener("change", () => {
  fileLabel.innerHTML = fileInput.files.length
    ? "📁 <span class='uploaded'>chat.db ready ✅</span>"
    : "📂 Select <code>chat.db</code>";
});

generateBtn.addEventListener("click", async () => {
  const phone = "";
  const format = "csv";

  if (!fileInput.files.length) {
    return alert("❌ No file selected.");
  }

  const file = fileInput.files[0];
  const filePath = file.path;

  try {
    const result = await window.electronAPI.runExtractor(filePath, phone, format);

    alert(`✅ Export complete.\nCheck terminal or output folder.`);
    console.log(result);
  } catch (err) {
    console.error("❌ Extractor error:", err);
    alert("❌ Unexpected error: " + err.message);
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
    alert("❌ Merge error: " + err.message);
  }
});
