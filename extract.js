const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dbFile = process.argv[2];
const outFile = path.join(
  require("os").homedir(),
  "Desktop",
  `iextract_output_${Date.now()}.csv`
);
const tmpFile = path.join(__dirname, `query_${Date.now()}.sql`);

if (!dbFile || !fs.existsSync(dbFile)) {
  console.error("❌ Missing or invalid chat.db file.");
  process.exit(1);
}

// 🔥 Full working SQL
const sql = `
.headers on
.mode csv
.output ${outFile}
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
.output stdout
`;

fs.writeFileSync(tmpFile, sql);

try {
  execFileSync("sqlite3", [dbFile, `.read "${tmpFile}"`], {
    stdio: "inherit",
  });

  if (fs.existsSync(outFile)) {
    console.log(`✅ Export complete: ${outFile}`);
  } else {
    console.error("❌ Export failed: Output file not created.");
  }
} catch (err) {
  console.error("❌ SQLite error:", err.message);
}

fs.unlinkSync(tmpFile);