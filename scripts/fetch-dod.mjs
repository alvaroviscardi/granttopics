// Pulls open and pre-release SBIR/STTR topics from DoD's SBIR/STTR portal (DSIP)
// into data/dod.json. Values are copied exactly as the portal returns them.
// Dates come as epoch milliseconds; we keep the raw value and add the same instant in ISO form.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://www.dodsbirsttr.mil/topics/api/public/topics";
const UA = "Mozilla/5.0 GrantTopics/0.1 (+https://github.com/alvaroviscardi/granttopics)";
const PAGE = 100;
const sleep = ms => new Promise(r => setTimeout(r, ms));
// 591/592 are the portal's codes for "Pre-Release" and "Open"; the fetch checks that only those come back.
const SEARCH = { searchText: null, components: null, programYear: null, solicitationCycleNames: ["openTopics"], releaseNumbers: [], topicReleaseStatus: [591, 592], modernizationPriorities: [], sortBy: "finalTopicCode,asc", technologyAreaIds: [], component: null, program: null };

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.ok) return res.json();
    if (attempt >= 4) throw new Error(`${url}: HTTP ${res.status}`);
    await sleep(2000 * 2 ** (attempt - 1));
  }
}
const iso = ms => (typeof ms === "number" ? new Date(ms).toISOString() : "");
const text = v => (v === null || v === undefined ? "" : String(v));

const topics = [];
for (let page = 0; ; page++) {
  const q = new URLSearchParams({ searchParam: JSON.stringify(SEARCH), size: String(PAGE), page: String(page) });
  const data = await get(`${API}/search?${q}`);
  topics.push(...data.data);
  if (topics.length >= data.total || data.data.length === 0) break;
}

const records = [];
for (const t of topics) {
  const d = await get(`${API}/${encodeURIComponent(t.topicId)}/details`);
  records.push({
    id: t.topicId,
    topicCode: t.topicCode,
    title: t.topicTitle,
    program: t.program,
    component: t.component,
    command: text(t.command),
    status: t.topicStatus,
    solicitationNumber: t.solicitationNumber,
    solicitationTitle: t.solicitationTitle,
    preReleaseStart: iso(t.topicPreReleaseStartDate),
    openDate: iso(t.topicStartDate),
    closeDate: iso(t.topicEndDate),
    closeDateMs: t.topicEndDate ?? null,
    qaEndDate: iso(t.topicQAEndDate),
    objectiveHtml: text(d.objective),
    keywords: text(d.keywords),
    technologyAreas: text(d.technologyAreas),
    itar: d.itar ?? null,
    awardAmount: "", // not in the portal's topic data; see the solicitation documents
    sourceUrl: "https://www.dodsbirsttr.mil/topics-app/",
    sourceNote: `Search the DoD SBIR/STTR topics page for topic ${t.topicCode}`,
    source: "DoD SBIR/STTR portal",
    fetchedAt: new Date().toISOString(),
  });
  await sleep(250);
}

records.sort((a, b) => a.topicCode.localeCompare(b.topicCode));
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data/dod.json"), JSON.stringify(records, null, 2) + "\n");
const by = k => Object.entries(records.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {})).map(([a, n]) => `${a} ${n}`).join(", ");
console.log(`Saved ${records.length} DoD topics (${by("status")}; ${by("program")}).`);
