import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AuditLog,
  DocumentViewer,
  StatusPill,
  Timeline,
  formatDateTime,
  useActivity,
  type TimelineEntry,
} from "@kit";
import { ScreenChrome } from "./chrome";
import { addChartNote, getChart, timelineFor, useCharts } from "./store";

const EDGE_CASE_ID = "5182";

export default function Case() {
  const [searchParams] = useSearchParams();
  useCharts();
  const { logAction } = useActivity();
  const [noteText, setNoteText] = useState("");

  const requested = searchParams.get("case") ?? EDGE_CASE_ID;
  const chart = getChart(requested) ?? getChart(EDGE_CASE_ID);

  if (!chart) {
    return (
      <ScreenChrome>
        <p className="text-sm">This chart is not in the review list.</p>
      </ScreenChrome>
    );
  }

  const entries: TimelineEntry[] = timelineFor(chart.id).map((e) => ({
    id: e.id,
    timestamp: formatDateTime(e.timestamp),
    author: e.author,
    text: e.noteText,
  }));

  const reviewTone =
    chart.reviewStatus === "flagged" ? "accent" : chart.reviewStatus === "pending" ? "muted" : "primary";
  const correctionTone =
    chart.correctionStatus === "released"
      ? "primary"
      : chart.correctionStatus === "open" || chart.correctionStatus === "in_correction"
        ? "accent"
        : "muted";

  function handleAddNote() {
    addChartNote(chart!.id, noteText);
    setNoteText("");
    logAction("Added a note to the chart timeline");
  }

  return (
    <ScreenChrome>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm text-[var(--pf-muted)]">
            Chart #{chart.id}, {chart.patientName} ({chart.mrn})
          </p>
          <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            {chart.visitType}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill
              label={
                chart.reviewStatus === "flagged"
                  ? "Flagged"
                  : chart.reviewStatus === "pending"
                    ? "Pending review"
                    : "Clean"
              }
              tone={reviewTone}
            />
            {chart.flagReason && <StatusPill label={chart.flagReason} tone="accent" />}
            {chart.correctionStatus && (
              <StatusPill
                label={
                  chart.correctionStatus === "released"
                    ? "Released to billing"
                    : chart.correctionStatus === "in_correction"
                      ? "In correction"
                      : "Open"
                }
                tone={correctionTone}
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DocumentViewer
            title="Visit summary"
            lines={[
              `Provider: ${chart.provider}`,
              `Location: ${chart.location}`,
              `Visit type: ${chart.visitType}`,
              `Coding: ${chart.cptCode} (${chart.cptLabel}), ICD-10 ${chart.icd10Code} (${chart.icd10Label})`,
            ]}
          />
          <DocumentViewer
            title="Visit note excerpt"
            lines={[
              chart.noteLine
                ? chart.noteLine
                : "Assessment and plan documented for this visit; no medication change noted.",
              `Follow-up scheduled with ${chart.provider}.`,
            ]}
          />
          <DocumentViewer
            title="Active medication list"
            lines={[
              chart.medListLine
                ? chart.medListLine
                : "Medication list reviewed at this visit.",
              ...(chart.queuedRefill ? [`Queued refill: ${chart.queuedRefill}`] : []),
            ]}
          />
          <DocumentViewer
            title="Automated review finding"
            lines={
              chart.flagReason
                ? [chart.flagReason, chart.flagDetail, `Missing: ${chart.missingItem}`]
                : ["No documentation gaps found on the automated first pass."]
            }
          />
          {chart.addendumReceived && (
            <DocumentViewer
              title="Provider addendum"
              lines={[
                `Signed by ${chart.provider}`,
                "Confirms losartan 50 mg daily replaces lisinopril 20 mg daily.",
                "Cancels the queued lisinopril refill.",
              ]}
            />
          )}
        </div>

        <div>
          <h2 className="text-lg" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Chart history
          </h2>
          <div className="mt-3">
            <Timeline entries={entries} dataTour="case-timeline" />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--pf-muted)]/20 p-4">
          <label className="block text-sm font-medium" htmlFor="chart-note">
            Add a note to this chart
          </label>
          <textarea
            id="chart-note"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            placeholder="What did you check, and what did you find?"
            className="mt-2 w-full rounded-lg border border-[var(--pf-muted)]/30 bg-[var(--pf-surface)] p-3 text-sm"
          />
          <button
            type="button"
            onClick={handleAddNote}
            className="mt-3 min-h-[40px] rounded-lg bg-[var(--pf-primary)] px-4 py-2 text-sm font-medium text-[var(--pf-surface)]"
          >
            Add note
          </button>
        </div>

        <div>
          <h2 className="text-lg" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Actions on this chart
          </h2>
          <div className="mt-2">
            <AuditLog />
          </div>
        </div>
      </div>
    </ScreenChrome>
  );
}
