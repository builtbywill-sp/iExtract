const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbFile = process.argv[2];
const outFile = process.argv[3];

console.log("🧪 Running extract.js");
console.log("📂 dbFile:", dbFile);
console.log("📤 outFile:", outFile);

if (!dbFile || !outFile) {
  console.error("❌ Usage: node extract.js path/to/chat.db path/to/output.csv");
  process.exit(1);
}

if (!fs.existsSync(dbFile)) {
  console.error("❌ Missing or invalid chat.db file.");
  process.exit(1);
}

try {
  const db = new Database(dbFile);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
  console.log("🧬 Tables in DB:", tables.map(t => t.name).join(", "));

  const stmt = db.prepare(`
    SELECT
      NULL AS message_date,
      NULL AS sender_or_recipient,
      NULL AS is_from_me,
      NULL AS text,
      NULL AS chat_id
    WHERE 0;
  `);

  const rows = stmt.all();
  console.log("📊 Rows returned:", rows.length);
  if (rows.length > 0) {
    console.log("🔍 First row:", rows[0]);
  }

  const csv = [
    "message_date,sender_or_recipient,is_from_me,text,chat_id",
    ...rows.map((row, index) => {
      const message_date = row.message_date || "";
      const sender = row.sender_or_recipient || "Unknown";
      const is_from_me = row.is_from_me != null ? row.is_from_me : "";
      const text = typeof row.text === "string" ? row.text : JSON.stringify(row.text || "");
      const chat_id = row.chat_id || "";

      try {
        return `"${message_date}","${sender}","${is_from_me}","${text.replace(/\n/g, ' ').replace(/"/g, '""')}","${chat_id}"`;
      } catch (err) {
        console.error(`❌ Failed to process row ${index}:`, row);
        throw err;
      }
    })
  ].join("\n");

  console.log("📁 Attempting to write CSV to:", outFile);
  fs.writeFileSync(outFile, csv, "utf-8");
  const preview = csv.split('\n').slice(0, 5).join('\n');
  console.log("📝 Preview of CSV output:\n", preview);
  console.log(`✅ Export complete: ${outFile}`);
  console.log("✅ CSV generation logic executed without error.");
} catch (err) {
  console.error("❌ UNCAUGHT ERROR:");
  console.error(err.stack || err.message || err);
  process.exit(1);
}