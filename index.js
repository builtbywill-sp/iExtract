const path = require("path");
const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generate");
const outputBtn = document.getElementById("outputBtn");
const fileLabel = document.getElementById("fileLabel");
const mergeBtn = document.getElementById("mergeFiles");
const mergeInput = document.getElementById("mergeInput");

let selectedOutputPath = "";
const outputPathDisplay = document.getElementById("outputPathDisplay");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    fileLabel.innerHTML = "📁 <span class='uploaded'>chat.db ready ✅</span>";
  } else {
    fileLabel.innerHTML = "📂 Select <code>chat.db</code>";
  }
});

generateBtn.addEventListener("click", async () => {
  const phone = "";
  const format = "csv";

  if (!fileInput.files.length) {
    return alert("❌ No file selected.");
  }

  const outputPath = selectedOutputPath;
  if (!outputPath || outputPath === "") {
    outputPathDisplay.textContent = "❌ No output folder selected.";
    outputPathDisplay.style.color = "red";
    outputPathDisplay.style.display = "block";
    return alert("❌ No output location selected.");
  }

  const file = fileInput.files[0];
  let filePath = file.path || file.name;

  if (!filePath || !filePath.endsWith(".db")) {
    return alert(`❌ Invalid file selected: ${filePath}`);
  }

  console.log("📤 Extracting:", { filePath, outputPath });

  try {
    const result = await window.electronAPI.runExtractor(filePath, phone, format, outputPath);
    alert("✅ Export complete.");
    console.log(result);
  } catch (err) {
    console.error("❌ Error:", err);
    alert("❌ Extraction failed.");
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
  const paths = allFiles.map((file) => file.path || file.name);

  try {
    const result = await window.electronAPI.finalizeDatabase(paths);
    alert("✅ Merge complete.");
    console.log(result);
  } catch (err) {
    console.error("❌ Merge error:", err);
    alert("❌ Merge failed.");
  }
});

outputBtn.addEventListener("click", async () => {
  try {
    console.log("📂 Requesting output path...");
    const outputPath = await window.electronAPI.selectOutputPath();
    console.log("🧾 Received output path:", outputPath);

    if (!outputPath || outputPath.trim() === "") {
      outputPathDisplay.textContent = "❌ No output folder selected.";
      outputPathDisplay.style.color = "red";
      outputPathDisplay.style.display = "block";
      return alert("❌ No output location selected.");
    }

    selectedOutputPath = outputPath.trim();
    outputPathDisplay.textContent = `✅ Output folder:\n${selectedOutputPath}`;
    outputPathDisplay.style.color = "lime";
    outputPathDisplay.style.display = "block";
  } catch (err) {
    console.error("❌ Output selection error:", err);
    alert("❌ Failed to select output path.");
  }
});