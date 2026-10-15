// Checks data/opportunities.json before anything is published.
// A record that fails is listed as held; the run fails so a person or the next run looks at it.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(readFileSync(join(root, "data/opportunities.json"), "utf8"));
const DATE = /^\d{2}\/\d{2}\/\d{4}$/; // Grants.gov search dates: MM/DD/YYYY
const held = [];
const seen = new Set();

for (const r of records) {
  const why = [];
  if (!r.id || !r.title || !r.agency) why.push("missing id, title or agency");
  if (seen.has(r.id)) why.push("duplicate id");
  seen.add(r.id);
  if (r.sourceUrl !== `https://www.grants.gov/search-results-detail/${r.id}`) why.push("source link doesn't match id");
  if (!["posted", "forecasted"].includes(r.status)) why.push(`unexpected status ${r.status}`);
  if (r.status === "posted" && !DATE.test(r.closeDate) && !r.closeDateNote) why.push("open but no close date or note");
  for (const k of ["openDate", "closeDate"]) if (r[k] && !DATE.test(r[k])) why.push(`${k} not MM/DD/YYYY: ${r[k]}`);
  if (Number.isNaN(Date.parse(r.fetchedAt))) why.push("bad fetchedAt");
  if (why.length) held.push(`${r.id} ${r.title?.slice(0, 60)}: ${why.join("; ")}`);
}

if (held.length) { console.error(`${held.length} record(s) held:\n` + held.map(h => "  - " + h).join("\n")); process.exit(1); }
console.log(`Validated ${records.length} opportunities: none held.`);
