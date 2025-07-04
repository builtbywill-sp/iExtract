const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generate");
const fileLabel = document.getElementById("fileLabel");

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
