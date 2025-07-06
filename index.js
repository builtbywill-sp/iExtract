const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generate");
const outputBtn = document.getElementById("outputBtn");
const fileLabel = document.getElementById("fileLabel");
const mergeBtn = document.getElementById("mergeFiles");
const mergeInput = document.getElementById("mergeInput");

let selectedOutputPath = "";

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

  const outputPath = selectedOutputPath;
  console.log("📦 Final output path used for export:", outputPath);
  if (!outputPath) {
    return alert("❌ No output location selected.");
  }

  const file = fileInput.files[0];

  if (!file) {
    console.error("❌ No file selected (fileInput.files[0] is null).");
    return alert("❌ File input missing.");
  }

  const filePath = file.path || file.webkitRelativePath || file.name;
  if (!filePath || (!filePath.includes("chat.db") && !file.name.includes("chat.db"))) {
    alert("❌ Invalid file path. Please select the actual chat.db file.");
    return;
  }

  console.log("🧠 Resolved file path:", filePath, "file object:", file);

  if (!filePath || !outputPath || !format) {
    console.error("❌ Missing required input:", { filePath, outputPath, format });
    return alert("❌ Missing input. Please check file, output location, and format.");
  }

  console.log("📤 Extractor input:", { filePath, phone, format, outputPath });

  try {
    const result = await window.electronAPI.runExtractor(filePath, phone, format, outputPath);

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
  const paths = allFiles.map((file) => file.path || file.webkitRelativePath || file.name);

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

outputBtn.addEventListener("click", async () => {
  try {
    const outputPath = await window.electronAPI.selectOutputPath();
    if (!outputPath) {
      alert("❌ No output location selected.");
      return;
    }
    console.log("📂 Output folder selected:", outputPath);
    selectedOutputPath = outputPath;
    const outputPathDisplay = document.getElementById("outputPathDisplay");
    if (outputPathDisplay) {
      outputPathDisplay.textContent = outputPath;
      outputPathDisplay.style.display = "inline";
    }
  } catch (err) {
    console.error("❌ Error selecting output path:", err);
    alert("❌ Failed to select output path.");
  }
});