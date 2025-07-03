const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dbFile = process.argv[2];
const number = process.argv[3] || "";
const format = (process.argv[4] || "csv").toLowerCase();
const outFile = process.argv[4]
  ? path.resolve(process.argv[4])
  : path.join(__dirname, `iextract_output_${Date.now()}.${format}`);
const tmpFile = path.join(__dirname, `query_${Date.now()}.sql`);

if (!dbFile || !fs.existsSync(dbFile)) {
  console.error("❌ Missing or invalid chat.db file.");
  process.exit(1);
}

// 🔥 Build WHERE logic
let whereClause = `WHERE m.text IS NOT NULL`;

if (number) {
  whereClause += ` AND (
    h.id LIKE '%${number}%' OR
    h2.id LIKE '%${number}%' OR
    c.chat_identifier LIKE '%${number}%'
  )`;
}

// 🔥 Full working SQL
const sql = `
.headers on
.mode ${format}
.output ${outFile}
SELECT
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
LEFT JOIN chat_handle_join chj ON c.ROWID = chj.chat_id
LEFT JOIN handle h2 ON chj.handle_id = h2.ROWID
${whereClause}
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
