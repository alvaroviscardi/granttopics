// Builds the GrantTopics site from data/*.json into dist/.
//   dist/index.html    full HTML document for any static host
//   dist/preview.html  page body only, for the claude.ai preview
// Facts are carried over exactly; only formatting changes (HTML tags stripped, entities decoded).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(root, p), "utf8");
const json = p => JSON.parse(read(p));

const decode = s => String(s ?? "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&rsquo;|&lsquo;/g, "'").replace(/&rdquo;|&ldquo;/g, '"')
  .replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const plain = html => decode(String(html ?? "").replace(/<br\s*\/?>/gi, " ").replace(/<\/p>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(" ", n)) + "…" : s);
const listOf = s => { try { return JSON.parse(String(s).replace(/'/g, '"')); } catch { return s ? [s] : []; } };
const money = v => (!v || v === "0" || v.toLowerCase() === "none" ? "" : "$" + v);

// Relevance: Grants.gov keyword search also returns broad research calls that merely mention SBIR.
// Keep only titles that name the program or its NIH activity codes.
const RELEVANT = /SBIR|STTR|Small Business Innovation|Small Business Technology Transfer|\bR4[1-4]\b|\bSB[01]\b/i;

const usDate = s => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ""); return m ? `${m[3]}-${m[1]}-${m[2]}` : ""; };

const gg = json("data/grantsgov.json");
const ggKept = gg.filter(r => RELEVANT.test(decode(r.title)));
const items = [
  ...ggKept.map(r => ({
    id: "gg-" + r.id,
    title: decode(r.title),
    agency: decode(r.agency).trim(),
    group: decode(r.agency).trim(),
    code: r.number,
    program: /STTR|R41|R42/i.test(r.title) ? "STTR" : "SBIR",
    status: r.status === "posted" ? "Open" : "Forecast",
    closeDay: usDate(r.closeDate),       // agency's date, no time given
    closeAt: "",
    closeNote: decode(r.closeDateNote),
    estClose: r.estimatedCloseDate || "",
    openDay: usDate(r.openDate),
    award: money(r.awardCeiling),
    summary: clip(plain(r.eligibility), 360),
    summaryLabel: "Eligibility (from the listing)",
    tags: [],
    itar: null,
    source: "Grants.gov",
    url: r.sourceUrl,
    how: "",
  })),
  ...json("data/dod.json").map(r => ({
    id: "dod-" + r.id,
    title: decode(r.title),
    agency: `DoD · ${r.component}`,
    group: "Department of Defense",
    code: r.topicCode,
    program: r.program,
    status: r.status === "Open" ? "Open" : "Pre-release",
    closeDay: "",
    closeAt: r.closeDate,                // exact instant from DoD
    closeNote: "",
    estClose: "",
    openDay: "",
    openAt: r.openDate,
    award: "",
    summary: clip(plain(r.objectiveHtml), 360),
    summaryLabel: "Objective (from the topic)",
    tags: listOf(r.technologyAreas).slice(0, 4),
    itar: r.itar,
    source: "DoD SBIR/STTR portal",
    url: r.sourceUrl,
    how: `Search for ${r.topicCode}`,
  })),
];

const fetched = [...gg, ...json("data/dod.json")].map(r => r.fetchedAt).sort().pop();
const data = { items, checkedAt: fetched, excluded: gg.length - ggKept.length };
const body = read("src/page.html").replace("__GT_DATA__", JSON.stringify(data).replace(/</g, "\\u003c"));

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/preview.html"), body);
const split = body.indexOf("<header");
writeFileSync(join(root, "dist/index.html"),
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${body.slice(0, split)}</head>\n<body style="margin:0">\n${body.slice(split)}\n</body>\n</html>\n`);
console.log(`Built page with ${items.length} opportunities (${ggKept.length} Grants.gov, ${items.length - ggKept.length} DoD); ${data.excluded} broad calls left out.`);
