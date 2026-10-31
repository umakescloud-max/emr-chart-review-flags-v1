import {
  rng,
  rel,
  addBusinessDays,
  createNameGenerator,
  fakeMrn,
  pickWeighted,
} from "@kit";

// Deterministic seed data for the chart review prototype. Every date is
// derived from rel()/addBusinessDays() at render time — never a literal
// calendar date — so "today" in the demo is always today.

export type ReviewStatus = "clean" | "flagged" | "pending";
export type CorrectionStatus = "open" | "in_correction" | "released" | null;
export type Location = "Westgate" | "Riverbend" | "Old Mill";

export interface Chart {
  id: string;
  patientName: string;
  mrn: string;
  provider: string;
  location: Location;
  visitDate: Date;
  visitType: string;
  cptCode: string;
  cptLabel: string;
  icd10Code: string;
  icd10Label: string;
  reviewStatus: ReviewStatus;
  flagReason: string;
  flagDetail: string;
  missingItem: string;
  flaggedAt: Date | null;
  correctionDeadline: Date | null;
  correctionStatus: CorrectionStatus;
  resolvedAt: Date | null;
  noteLine: string;
  medListLine: string;
  queuedRefill: string;
  addendumReceived: boolean;
  inSignOff: boolean;
  proposedFix: boolean;
}

export interface ChartEvent {
  id: string;
  chartId: string;
  author: string;
  timestamp: Date;
  eventType: string;
  noteText: string;
}

export interface ChartNote {
  id: string;
  chartId: string;
  author: string;
  timestamp: Date;
  text: string;
}

const SLUG = "emr-chart-review-flags-v1";
const rand = rng(SLUG);
const nameGen = createNameGenerator(rand);

export const PRACTICE = {
  name: "Northfield Family Medicine",
  type: "Family medicine group, adult and pediatric primary care",
  personaName: "Priya Raman",
  personaRole: "Clinical quality nurse (RN)",
  size: "8 providers, 3 locations, about 100 patient visits per business day",
};

export const PROVIDERS = [
  "Dr. Elena Brooks",
  "Dr. Marcus Whitfield",
  "Dr. Aisha Rahman",
  "Dr. Samuel Oduya",
  "Dr. Lena Kowalski",
  "Dr. Victor Haddad",
  "Dr. Nadia Lindqvist",
  "Dr. Owen Baptiste",
];

export const LOCATIONS: Location[] = ["Westgate", "Riverbend", "Old Mill"];

export const VISIT_TYPES = [
  "Chronic care follow-up",
  "Acute visit",
  "Annual wellness",
  "Pediatric well-child",
];

const CPT_BY_TYPE: Record<string, { code: string; label: string }> = {
  "Chronic care follow-up": { code: "99214", label: "Office visit, established patient, 30 minutes" },
  "Acute visit": { code: "99213", label: "Office visit, established patient, 20 minutes" },
  "Annual wellness": { code: "99396", label: "Preventive visit, established patient, 40 minutes" },
  "Pediatric well-child": { code: "99392", label: "Preventive visit, child, age 1 to 4" },
};

export const ICD10 = [
  { code: "I10", label: "Essential hypertension" },
  { code: "E11.9", label: "Type 2 diabetes without complications" },
  { code: "J06.9", label: "Acute upper respiratory infection" },
  { code: "Z00.00", label: "General adult medical exam" },
  { code: "M54.50", label: "Low back pain, unspecified" },
  { code: "F41.1", label: "Generalized anxiety disorder" },
];

export const FLAG_REASONS = {
  medConflict: "medication list conflicts with note",
  unsigned: "unsigned note past 24 hours",
  diagnosis: "diagnosis not supported by note",
  vitals: "missing vitals",
  medRec: "medication reconciliation not documented",
};

const FLAG_DETAIL: Record<string, string> = {
  [FLAG_REASONS.medConflict]:
    "The visit note and the active medication list name different medications for the same patient.",
  [FLAG_REASONS.unsigned]:
    "The visit note was still unsigned 24 hours after the encounter closed.",
  [FLAG_REASONS.diagnosis]:
    "The coded diagnosis does not appear to be supported by the documented assessment.",
  [FLAG_REASONS.vitals]:
    "A required vital sign was not recorded at this visit.",
  [FLAG_REASONS.medRec]:
    "No medication reconciliation was documented for this visit.",
};

const MISSING_ITEM: Record<string, string> = {
  [FLAG_REASONS.medConflict]: "Provider addendum confirming medication change",
  [FLAG_REASONS.unsigned]: "Provider signature on the visit note",
  [FLAG_REASONS.diagnosis]: "Provider clarification of the documented diagnosis",
  [FLAG_REASONS.vitals]: "Recorded blood pressure and weight",
  [FLAG_REASONS.medRec]: "Medication reconciliation entry",
};

function atTime(d: Date, time: `${number}:${number}`): Date {
  const copy = new Date(d);
  const [h, m] = time.split(":").map(Number);
  copy.setHours(h, m, 0, 0);
  return copy;
}

// The automated review flags a chart the morning after the visit. If that
// morning would still be in the future (for example a Friday visit seen on a
// Saturday), the flag is timestamped this morning instead, so nothing in the
// demo claims to have happened tomorrow.
function flagMorning(visit: Date): Date {
  const next = atTime(addBusinessDays(visit, 1), "06:10");
  const thisMorning = atTime(new Date(), "06:10");
  return next.getTime() > thisMorning.getTime() ? thisMorning : next;
}

// The last three closed business days, most recent first.
export const TODAY = rel(0);
export const DAY_MINUS_1 = addBusinessDays(TODAY, -1);
export const DAY_MINUS_2 = addBusinessDays(TODAY, -2);
export const DAY_MINUS_3 = addBusinessDays(TODAY, -3);

const DAYS = [DAY_MINUS_1, DAY_MINUS_2, DAY_MINUS_3];
// 104 visits yesterday, 98 the business day before, 88 three business days
// back, and 10 visits from today that are still waiting for the nightly pass.
const DAY_COUNTS = [104, 98, 88, 10];
const DAY_OFFSETS = [1, 2, 3, 0];

// Chart ids: 5182 is reserved for the edge case and always first.
function buildChartIds(total: number): string[] {
  const ids: string[] = ["5182"];
  let n = 5000;
  while (ids.length < total) {
    const id = String(n);
    if (id !== "5182") ids.push(id);
    n += 1;
  }
  return ids;
}

const CHART_IDS = buildChartIds(300);

// 24 flagged charts spread across the three closed days: 9 from yesterday,
// 8 from two business days ago, 7 from three business days ago. Ordinal 0 is
// the edge case; ordinal 1 is the second medication-list conflict.
const FLAGGED_GLOBAL_INDEXES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  104, 105, 106, 107, 108, 109, 110, 111,
  202, 203, 204, 205, 206, 207, 208,
];
const FLAG_ORDINAL = new Map(FLAGGED_GLOBAL_INDEXES.map((globalIndex, ordinal) => [globalIndex, ordinal]));

function reasonForOrdinal(ordinal: number): string {
  if (ordinal === 0 || ordinal === 1) return FLAG_REASONS.medConflict;
  if (ordinal <= 9) return FLAG_REASONS.unsigned;
  if (ordinal <= 15) return FLAG_REASONS.diagnosis;
  if (ordinal <= 19) return FLAG_REASONS.vitals;
  return FLAG_REASONS.medRec;
}

// 6 open, 5 in correction, 13 released. Ordinals 22 and 23 (oldest visit day)
// are the only open ones that can cross their deadline.
const OPEN_ORDINALS = new Set([0, 1, 2, 3, 22, 23]);
const IN_CORRECTION_ORDINALS = new Set([4, 5, 6, 7, 8]);

function idSetByGlobalIndex(globalIndex: number, counts: number[]): number {
  let remaining = globalIndex;
  for (let d = 0; d < counts.length; d += 1) {
    if (remaining < counts[d]) return d;
    remaining -= counts[d];
  }
  return counts.length - 1;
}

function dayOffsetForIndex(globalIndex: number): number {
  const day = idSetByGlobalIndex(globalIndex, DAY_COUNTS);
  return DAY_OFFSETS[day];
}

function buildCharts(): Chart[] {
  const charts: Chart[] = [];

  for (let i = 0; i < CHART_IDS.length; i += 1) {
    const id = CHART_IDS[i];
    const dayOffset = dayOffsetForIndex(i);
    const visitBase = addBusinessDays(TODAY, -dayOffset);
    const visitDate = atTime(visitBase, dayOffset === 0 ? "08:30" : "16:40");
    const ordinal = FLAG_ORDINAL.get(i);
    const flagged = ordinal !== undefined;
    const reason = ordinal !== undefined ? reasonForOrdinal(ordinal) : "";
    const isEdge = id === "5182";

    const visitType = isEdge
      ? "Chronic care follow-up"
      : pickWeighted<string>(rand, [
          ["Chronic care follow-up", 40],
          ["Acute visit", 30],
          ["Annual wellness", 20],
          ["Pediatric well-child", 10],
        ]);
    const cpt = isEdge ? { code: "99214", label: "Office visit, established patient, 30 minutes" } : CPT_BY_TYPE[visitType];
    const icd = isEdge ? ICD10[0] : ICD10[(i * 5 + dayOffset) % ICD10.length];

    const correctionStatus: CorrectionStatus =
      ordinal !== undefined
        ? OPEN_ORDINALS.has(ordinal)
          ? "open"
          : IN_CORRECTION_ORDINALS.has(ordinal)
            ? "in_correction"
            : "released"
        : null;

    const flaggedAt = flagged ? flagMorning(visitBase) : null;
    const correctionDeadline = flagged ? atTime(addBusinessDays(visitBase, 3), "17:00") : null;
    const resolvedAt =
      correctionStatus === "released" && flaggedAt
        ? new Date(
            Math.max(
              flaggedAt.getTime() + 60 * 60 * 1000,
              Math.min(flaggedAt.getTime() + (18 + ((i * 7) % 40)) * 60 * 60 * 1000, Date.now() - 5 * 60 * 1000)
            )
          )
        : null;

    const provider = isEdge ? "Dr. Elena Brooks" : PROVIDERS[(i * 3 + dayOffset) % PROVIDERS.length];
    const location: Location = isEdge ? "Westgate" : LOCATIONS[(i + dayOffset) % LOCATIONS.length];

    const noteLine = isEdge
      ? "Stop lisinopril due to persistent dry cough; start losartan 50 mg daily"
      : "";
    const medListLine = isEdge ? "Lisinopril 20 mg daily, 90-day refill queued" : "";
    const queuedRefill = isEdge ? "Lisinopril 20 mg, 90-day supply, queued to the pharmacy" : "";

    charts.push({
      id,
      patientName: isEdge ? "T. Nguyen" : nameGen.next(),
      mrn: isEdge ? "DEMO-005182" : fakeMrn(rand),
      provider,
      location,
      visitDate,
      visitType,
      cptCode: cpt.code,
      cptLabel: cpt.label,
      icd10Code: icd.code,
      icd10Label: icd.label,
      reviewStatus: dayOffset === 0 ? "pending" : flagged ? "flagged" : "clean",
      flagReason: reason,
      flagDetail: reason ? FLAG_DETAIL[reason] : "",
      missingItem: reason ? MISSING_ITEM[reason] : "",
      flaggedAt,
      correctionDeadline,
      correctionStatus,
      resolvedAt,
      noteLine,
      medListLine,
      queuedRefill,
      addendumReceived: false,
      inSignOff: isEdge,
      proposedFix: isEdge,
    });
  }

  return charts;
}

export const charts: Chart[] = buildCharts();

export const chartById = new Map(charts.map((c) => [c.id, c]));

// The visit-day metric counts charts whose visit is one business day ago.
export const YESTERDAY = DAY_MINUS_1;

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildEvents(): ChartEvent[] {
  const events: ChartEvent[] = [];
  let n = 0;

  for (const chart of charts) {
    const push = (author: string, timestamp: Date, eventType: string, noteText: string) => {
      n += 1;
      events.push({
        id: `event-${n}`,
        chartId: chart.id,
        author,
        timestamp,
        eventType,
        noteText,
      });
    };

    if (chart.id === "5182") {
      push("Automated review", atTime(chart.visitDate, "16:40"), "visit", "Visit closed.");
      push(
        "Automated review",
        chart.flaggedAt ?? flagMorning(chart.visitDate),
        "flag",
        "Flagged: medication list conflicts with note. The note stops lisinopril and starts losartan; the active list still shows lisinopril 20 mg with a 90-day refill queued."
      );
      push(
        "Automated review",
        new Date((chart.flaggedAt ?? flagMorning(chart.visitDate)).getTime() + 2 * 60 * 1000),
        "notify",
        "Messaged Dr. Brooks about the lisinopril line and the queued refill."
      );
      continue;
    }

    if (chart.reviewStatus === "pending") {
      push(
        "Front desk",
        chart.visitDate,
        "visit",
        "Visit opened; the nightly review runs once the chart closes."
      );
    } else {
      push("Automated review", atTime(chart.visitDate, "16:40"), "visit", "Visit closed.");
    }

    if (chart.reviewStatus === "flagged") {
      const flagDay = chart.flaggedAt ?? addBusinessDays(chart.visitDate, 1);
      push(
        "Automated review",
        flagDay,
        "flag",
        `Flagged: ${chart.flagReason}. ${chart.flagDetail}`
      );
      push(
        "Automated review",
        new Date(flagDay.getTime() + 2 * 60 * 1000),
        "notify",
        `Messaged ${chart.provider} about the ${chart.flagReason}.`
      );
      if (chart.correctionStatus === "in_correction") {
        push(
          "Priya Raman",
          new Date(flagDay.getTime() + 4 * 60 * 60 * 1000),
          "correction",
          "Moved the chart to correction sign-off with the provider's addendum attached."
        );
      }
      if (chart.correctionStatus === "released" && chart.resolvedAt) {
        push(
          "Priya Raman",
          chart.resolvedAt,
          "release",
          "Approved the correction and released the chart to billing."
        );
      }
    }
  }

  return events;
}

export const chartEvents: ChartEvent[] = buildEvents();

export function eventsForChart(chartId: string): ChartEvent[] {
  return chartEvents
    .filter((e) => e.chartId === chartId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
