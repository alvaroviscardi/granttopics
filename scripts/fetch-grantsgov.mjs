// Pulls open and forecasted SBIR/STTR opportunities from the Grants.gov API
// into data/grantsgov.json. Values are copied exactly as Grants.gov returns them;
// nothing is reworded or inferred. Every record keeps its official source link.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.grants.gov/v1/api";
const KEYWORDS = ["SBIR", "STTR"];
const PAGE = 100;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function post(path, body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const json = await res.json();
      if (json.errorcode === 0) return json.data;
      throw new Error(`${path}: ${json.msg}`);
    }
    if (attempt >= 4) throw new Error(`${path}: HTTP ${res.status}`);
    await sleep(2000 * 2 ** (attempt - 1));
  }
}

// 1. Search: collect every matching opportunity id.
const hits = new Map();
for (const keyword of KEYWORDS) {
  for (let start = 0; ; start += PAGE) {
    const data = await post("search2", { keyword, oppStatuses: "forecasted|posted", rows: PAGE, startRecordNum: start });
    for (const h of data.oppHits) hits.set(h.id, h);
    if (start + PAGE >= data.hitCount) break;
  }
}

// 2. Detail: fetch each one. Forecasts and posted synopses use different field names.
const text = v => (v === null || v === undefined ? "" : String(v));
const records = [];
for (const h of hits.values()) {
  const d = await post("fetchOpportunity", { opportunityId: Number(h.id) });
  const s = d.synopsis || {};
  const f = d.forecast || {};
  const posted = h.oppStatus === "posted";
  records.push({
    id: h.id,
    number: h.number,
    title: h.title,
    agency: h.agency,
    agencyCode: h.agencyCode,
    status: h.oppStatus,
    openDate: h.openDate,
    closeDate: h.closeDate,
    closeDateNote: text(posted ? s.responseDateDesc : f.estApplicationResponseDateDesc),
    estimatedCloseDate: posted ? "" : text(f.estApplicationResponseDateStr),
    awardCeiling: text(posted ? s.awardCeilingFormatted ?? s.awardCeiling : f.awardCeilingFormatted ?? f.awardCeiling),
    awardFloor: text(posted ? s.awardFloorFormatted ?? s.awardFloor : f.awardFloorFormatted ?? f.awardFloor),
    estimatedFunding: text(posted ? s.estimatedFundingFormatted ?? s.estimatedFunding : f.estimatedFundingFormatted ?? f.estimatedFunding),
    eligibility: text(posted ? s.applicantEligibilityDesc : f.applicantEligibilityDesc),
    lastUpdated: text(posted ? s.lastUpdatedDate : f.lastUpdatedDate),
    sourceUrl: `https://www.grants.gov/search-results-detail/${h.id}`,
    source: "Grants.gov",
    fetchedAt: new Date().toISOString(),
  });
  await sleep(250); // be polite to a free public API
}

records.sort((a, b) => a.agency.localeCompare(b.agency) || a.title.localeCompare(b.title));
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data/grantsgov.json"), JSON.stringify(records, null, 2) + "\n");
console.log(`Saved ${records.length} opportunities (${records.filter(r => r.status === "posted").length} open, ${records.filter(r => r.status === "forecasted").length} forecasted).`);
