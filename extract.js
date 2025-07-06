const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { dialog, app } = require("electron");
const Database = require("better-sqlite3");

const dbFile = process.argv[2];
const outFile = process.argv[3];

console.log("🧪 Running extract.js");
console.log("📂 dbFile:", dbFile);
console.log("📤 outFile:", outFile);


if (!outFile) {
  console.error("❌ No output path received from args.");
  process.exit(1);
}

if (!dbFile || !fs.existsSync(dbFile)) {
  console.error("❌ Missing or invalid chat.db file.");
  process.exit(1);
}

try {
  const db = new Database(dbFile);
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

  try {
    fs.writeFileSync(outFile, csv, "utf-8");
    const preview = csv.split('\n').slice(0, 5).join('\n');
    console.log("📝 Preview of CSV output:\n", preview);
    console.log(`✅ Export complete: ${outFile}`);
  } catch (writeErr) {
    console.error("❌ Failed to write CSV:", writeErr.message);
    process.exit(1);
  }
} catch (err) {
  console.error("❌ SQLite error:", err.message);
}