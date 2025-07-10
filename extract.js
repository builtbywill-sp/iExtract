const fs = require("fs");
const path = require("path");
const { dialog, app } = require("electron");
const Database = require("better-sqlite3");

const rawDbFile = process.argv[2];
const rawOutFile = process.argv[3];
const dbFile = rawDbFile ? path.resolve(rawDbFile) : "";
const outFile = rawOutFile ? path.resolve(rawOutFile) : "";

console.log("🧪 Running extract.js...");
console.log("🗂️  DB path received:", rawDbFile);
console.log("📁 Output path received:", rawOutFile);
console.log("🧭 Resolved DB path:", dbFile);
console.log("📤 Resolved Output path:", outFile);

function fail(message) {
  console.error("❌", message);
  process.exit(1);
}

if (!outFile) fail("No output path received from args.");
if (!rawDbFile) fail("No DB path passed in args.");
if (!dbFile || typeof dbFile !== "string" || !fs.existsSync(dbFile)) {
  fail("chat.db not found or invalid path. Check that dbFile exists at: " + dbFile);
}

try {
  const db = new Database(dbFile, { readonly: true, fileMustExist: true });
  const stmt = db.prepare(`
    SELECT DISTINCT
      datetime(m.date/1000000000 + strftime('%s','2001-01-01'), 'unixepoch') AS message_date,
      h.id AS sender_or_recipient,
      m.is_from_me,
      m.text,
      c.chat_identifier AS chat_id
    FROM
      message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
    LEFT JOIN chat c ON cmj.chat_id = c.ROWID
    WHERE m.text IS NOT NULL
    ORDER BY message_date ASC;
  `);

  const rows = stmt.all();
  const csv = [
    "message_date,sender_or_recipient,is_from_me,text,chat_id",
    ...rows.map(row =>
      `"${row.message_date}","${row.sender_or_recipient}","${row.is_from_me}","${(row.text || "").replace(/"/g, '""')}","${row.chat_id}"`
    )
  ].join("\n");

  fs.writeFileSync(outFile, csv, "utf-8");
  const preview = csv.split("\n").slice(0, 5).join("\n");
  console.log("📝 Preview of CSV output:\n", preview);
  console.log(`✅ Export complete: ${outFile}`);
  console.log("🚀 Extraction complete. CSV saved successfully.");
} catch (err) {
  fail("SQLite or write error: " + err.message);
}

process.exit(0);