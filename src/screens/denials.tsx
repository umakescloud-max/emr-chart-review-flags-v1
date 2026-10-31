import { useState } from "react";
import {
  DataTable,
  RecordDrawer,
  ScenarioBanner,
  StatusPill,
  formatDate,
  useActivity,
  type DataTableColumn,
} from "@kit";
import { type Chart } from "../seed";
import { ScreenChrome } from "./chrome";
import {
  attachAddendum,
  countdownLabel,
  daysLeft,
  denialCharts,
  getChart,
  moveToSignOff,
  useCharts,
} from "./store";

const EDGE_CASE_ID = "5182";

function correctionTone(chart: Chart) {
  if (chart.correctionStatus === "released") return "primary" as const;
  if (chart.correctionStatus === "open" || chart.correctionStatus === "in_correction") {
    return "accent" as const;
  }
  return "muted" as const;
}

function correctionLabel(chart: Chart) {
  if (chart.correctionStatus === "released") return "Released";
  if (chart.correctionStatus === "in_correction") return "In correction";
  return "Open";
}

export default function Denials() {
  useCharts();
  const { logAction } = useActivity();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = denialCharts();
  const edgeChart = getChart(EDGE_CASE_ID);
  const selected = selectedId ? getChart(selectedId) : undefined;

  const columns: DataTableColumn<Chart>[] = [
    {
      key: "chart",
      header: "Chart",
      render: (c) => (
        <span className="block">
          <span className="block font-medium">{c.patientName}</span>
          <span className="block text-xs text-[var(--pf-muted)]">#{c.id}</span>
        </span>
      ),
    },
    {
      key: "reason",
      header: "Flag reason",
      render: (c) => <span>{c.flagReason}</span>,
    },
    { key: "provider", header: "Provider", render: (c) => c.provider },
    {
      key: "countdown",
      header: "Correction deadline",
      render: (c) => <span className="text-sm">{countdownLabel(c)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusPill label={correctionLabel(c)} tone={correctionTone(c)} />,
    },
  ];

  function handleAttach() {
    if (!selected) return;
    attachAddendum(selected.id);
    logAction("Attached provider addendum; chart ready for sign-off");
  }

  function handleMove() {
    if (!selected) return;
    moveToSignOff(selected.id);
    logAction("Moved chart to correction sign-off");
    setSelectedId(null);
  }

  return (
    <ScreenChrome>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Flagged charts
          </h1>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            Every chart the nightly review flagged, with the plain-language reason, the conflicting
            lines, and the days left before the correction deadline.
          </p>
        </div>

        <ScenarioBanner
          title="Chart #5182, medication list conflicts with note"
          body={
            "The visit note says: 'Stop lisinopril due to persistent dry cough; start losartan 50 mg daily'. " +
            "The active medication list says: 'Lisinopril 20 mg daily, 90-day refill queued'. " +
            "A 90-day lisinopril refill is queued to the pharmacy and has not gone out yet."
          }
        />

        {edgeChart && (
          <div
            data-tour="correction-countdown"
            className="rounded-xl border border-[var(--pf-accent)]/40 bg-[var(--pf-accent)]/10 p-4"
          >
            <p className="text-sm font-medium">
              Correction deadline for chart #{edgeChart.id}
            </p>
            <p data-tour="appeal-countdown" className="mt-1 text-sm text-[var(--pf-ink)]">
              {countdownLabel(edgeChart)}
            </p>
            <p className="mt-1 text-xs text-[var(--pf-muted)]">
              Computed live from the visit date and the correction deadline, not typed in.
            </p>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          dataTour="denial"
          edgeCaseRow={(c) => c.id === EDGE_CASE_ID}
          onRowClick={(c) => setSelectedId(c.id)}
          mobileStatusKey="status"
          mobileUrgencyKey="countdown"
        />

        <RecordDrawer
          open={selectedId !== null}
          title={selected ? `Chart #${selected.id}, ${selected.patientName}` : "Chart"}
          onClose={() => setSelectedId(null)}
        >
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={correctionLabel(selected)} tone={correctionTone(selected)} />
                <StatusPill label={selected.flagReason} tone="accent" />
              </div>

              <dl className="space-y-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">MRN</dt>
                  <dd>{selected.mrn}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Provider</dt>
                  <dd>{selected.provider}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Location</dt>
                  <dd>{selected.location}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Visit</dt>
                  <dd>
                    {selected.visitType}, {formatDate(selected.visitDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--pf-muted)]">Coding</dt>
                  <dd className="text-right">
                    {selected.cptCode}, ICD-10 {selected.icd10Code}
                  </dd>
                </div>
              </dl>

              <div className="rounded-lg border border-[var(--pf-muted)]/20 p-3">
                <p className="font-medium">Why this was flagged</p>
                <p className="mt-1 text-[var(--pf-muted)]">{selected.flagDetail}</p>
                <p className="mt-2">Missing: {selected.missingItem}</p>
              </div>

              {selected.noteLine && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--pf-muted)]/20 p-3">
                    <p className="text-xs text-[var(--pf-muted)]">Visit note</p>
                    <p className="mt-1">"{selected.noteLine}"</p>
                  </div>
                  <div className="rounded-lg border border-[var(--pf-accent)]/40 p-3">
                    <p className="text-xs text-[var(--pf-muted)]">Active medication list</p>
                    <p className="mt-1">"{selected.medListLine}"</p>
                  </div>
                </div>
              )}

              {selected.queuedRefill && (
                <div className="rounded-lg bg-[var(--pf-accent)] px-3 py-2 text-[var(--pf-ink)]">
                  <p className="font-medium">Queued refill, not yet sent</p>
                  <p>{selected.queuedRefill}</p>
                </div>
              )}

              <div className="rounded-lg border border-[var(--pf-muted)]/20 p-3">
                <p className="text-xs text-[var(--pf-muted)]">Correction deadline</p>
                <p className="mt-1">{countdownLabel(selected)}</p>
                {daysLeft(selected) < 0 && (
                  <p className="mt-1 text-[var(--pf-ink)]">This flag is past its deadline.</p>
                )}
              </div>

              {selected.addendumReceived && (
                <p className="rounded-lg bg-[var(--pf-primary)]/10 px-3 py-2 text-[var(--pf-primary)]">
                  Provider addendum attached and ready for sign-off.
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAttach}
                  className="min-h-[40px] rounded-lg border border-[var(--pf-muted)]/30 px-4 py-2 text-sm"
                >
                  Attach provider addendum
                </button>
                <button
                  type="button"
                  onClick={handleMove}
                  className="min-h-[40px] rounded-lg bg-[var(--pf-primary)] px-4 py-2 text-sm font-medium text-[var(--pf-surface)]"
                >
                  Move to sign-off
                </button>
              </div>
            </div>
          )}
        </RecordDrawer>
      </div>
    </ScreenChrome>
  );
}
