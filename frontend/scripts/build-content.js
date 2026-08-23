/**
 * build-content.js
 *
 * Decap CMS menyimpan tiap entry sebagai file JSON terpisah di dalam
 * folder src/data/{collection}_items/*.json (satu file per artikel/anime/dst).
 *
 * Script ini menggabungkan semua file itu menjadi satu array
 * (src/data/{collection}.json) yang langsung di-import oleh App.js.
 *
 * Jalan otomatis sebelum "npm run build" (lihat package.json -> "prebuild").
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "src", "data");
const COLLECTIONS = ["articles", "anime", "destinations", "artists", "words"];

for (const name of COLLECTIONS) {
  const folder = path.join(DATA_DIR, `${name}_items`);
  const outputFile = path.join(DATA_DIR, `${name}.json`);

  if (!fs.existsSync(folder)) {
    console.warn(`[build-content] Folder tidak ditemukan: ${folder}, skip.`);
    continue;
  }

  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".json"));
  const items = files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(folder, f), "utf-8"))
  );

  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2), "utf-8");
  console.log(`[build-content] ${name}: ${items.length} item -> ${outputFile}`);
}
