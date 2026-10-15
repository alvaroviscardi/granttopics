// Checks every data file before anything is published.
// A record that fails is listed as held; the run fails so a person or the next run looks at it.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = f => (existsSync(join(root, "data", f)) ? JSON.parse(readFileSync(join(root, "data", f), "utf8")) : null);
const US_DATE = /^\d{2}\/\d{2}\/\d{4}$/; // Grants.gov search dates: MM/DD/YYYY
const isIso = s => typeof s === "string" && !Number.isNaN(Date.parse(s)) && /^\d{4}-\d{2}-\d{2}T/.test(s);
const held = [];
let total = 0;

function check(file, records, rules) {
  const seen = new Set();
  for (const r of records) {
    total++;
    const why = [];
    if (!r.id || !r.title) why.push("missing id or title");
    if (seen.has(r.id)) why.push("duplicate id");
    seen.add(r.id);
    if (!isIso(r.fetchedAt)) why.push("bad fetchedAt");
    rules(r, why);
    if (why.length) held.push(`${file} ${r.id} ${String(r.title).slice(0, 60)}: ${why.join("; ")}`);
  }
}

const grantsgov = load("grantsgov.json");
if (!grantsgov) held.push("data/grantsgov.json missing");
else check("grantsgov", grantsgov, (r, why) => {
  if (!r.agency) why.push("missing agency");
  if (r.sourceUrl !== `https://www.grants.gov/search-results-detail/${r.id}`) why.push("source link doesn't match id");
  if (!["posted", "forecasted"].includes(r.status)) why.push(`unexpected status ${r.status}`);
  if (r.status === "posted" && !US_DATE.test(r.closeDate) && !r.closeDateNote) why.push("open but no close date or note");
  for (const k of ["openDate", "closeDate"]) if (r[k] && !US_DATE.test(r[k])) why.push(`${k} not MM/DD/YYYY: ${r[k]}`);
});

const dod = load("dod.json");
if (!dod) held.push("data/dod.json missing");
else check("dod", dod, (r, why) => {
  if (!r.topicCode || !r.component) why.push("missing topic code or component");
  if (!["Open", "Pre-Release"].includes(r.status)) why.push(`unexpected status ${r.status}`);
  if (!["SBIR", "STTR"].includes(r.program)) why.push(`unexpected program ${r.program}`);
  if (!isIso(r.closeDate)) why.push("no valid close date");
  if (r.openDate && !isIso(r.openDate)) why.push("bad open date");
  if (isIso(r.closeDate) && isIso(r.openDate) && r.closeDate < r.openDate) why.push("closes before it opens");
  if (r.closeDateMs !== null && new Date(r.closeDateMs).toISOString() !== r.closeDate) why.push("close date doesn't match raw value");
  if (!r.sourceUrl.startsWith("https://www.dodsbirsttr.mil/")) why.push("source link not on the DoD portal");
});

if (held.length) { console.error(`${held.length} record(s) held:\n` + held.map(h => "  - " + h).join("\n")); process.exit(1); }
console.log(`Validated ${total} opportunities (Grants.gov ${grantsgov.length}, DoD ${dod.length}): none held.`);
