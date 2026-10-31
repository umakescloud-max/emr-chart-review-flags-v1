import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  MetricPanel,
  StatusPill,
  useActivity,
  type DataTableColumn,
  type StatTileProps,
} from "@kit";
import { PROVIDERS, YESTERDAY, isSameDay, type Chart } from "../seed";
import { ScreenChrome } from "./chrome";
import { useCharts } from "./store";

const ALL = "all";

function reviewTone(status: string) {
  if (status === "flagged") return "accent" as const;
  if (status === "pending") return "muted" as const;
  return "primary" as const;
}

export default function Tracker() {
  const charts = useCharts();
  const { logAction } = useActivity();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [appliedProvider, setAppliedProvider] = useState(ALL);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const reviewed = charts.filter((c) => c.reviewStatus !== "pending");
  const flagged = charts.filter((c) => c.flagReason !== "");
  const flaggedYesterday = charts.filter(
    (c) => isSameDay(c.visitDate, YESTERDAY) && c.reviewStatus !== "pending"
  );
  const pastDeadline = charts.filter(
    (c) =>
      (c.correctionStatus === "open" || c.correctionStatus === "in_correction") &&
      c.correctionDeadline !== null &&
      c.correctionDeadline.getTime() < Date.now()
  );
  const released = charts.filter(
    (c) => c.correctionStatus === "released" && c.flaggedAt && c.resolvedAt
  );
  const avgHours =
    released.length === 0
      ? 0
      : released.reduce((sum, c) => {
          const ms = (c.resolvedAt as Date).getTime() - (c.flaggedAt as Date).getTime();
          return sum + ms / (60 * 60 * 1000);
        }, 0) / released.length;

  const metrics: StatTileProps[] = [
    {
      label: "Charts reviewed yesterday",
      value: String(flaggedYesterday.length),
      hint: "First-pass review done on every closed visit",
    },
    {
      label: "Flag rate",
      value: `${((flagged.length / reviewed.length) * 100).toFixed(1)}%`,
      hint: `${flagged.length} flags across ${reviewed.length} reviewed charts`,
    },
    {
      label: "Open flags past deadline",
      value: String(pastDeadline.length),
      hint: "Open or in correction, deadline already passed",
    },
    {
      label: "Average hours to resolve a flag",
      value: `${avgHours.toFixed(1)} h`,
      hint: `Across ${released.length} released corrections`,
    },
  ];

  const rows = charts.filter((c) => {
    if (appliedProvider !== ALL && c.provider !== appliedProvider) return false;
    if (flaggedOnly && c.flagReason === "") return false;
    return true;
  });

  function openChart(chart: Chart) {
    logAction("Opened chart on the chart screen");
    navigate(`/chart?case=${chart.id}`);
  }

  function filterByProvider() {
    setAppliedProvider(provider);
    logAction("Filtered charts to one provider");
  }

  function showFlaggedOnly() {
    setFlaggedOnly(true);
    logAction("Showing flagged charts only");
  }

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
    { key: "provider", header: "Provider", render: (c) => c.provider },
    { key: "location", header: "Location", render: (c) => c.location },
    { key: "visitType", header: "Visit type", render: (c) => c.visitType },
    {
      key: "visitDate",
      header: "Visit date",
      render: (c) =>
        c.visitDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    },
    {
      key: "status",
      header: "Review status",
      render: (c) => (
        <StatusPill
          label={c.reviewStatus === "flagged" ? "Flagged" : c.reviewStatus === "pending" ? "Pending" : "Clean"}
          tone={reviewTone(c.reviewStatus)}
        />
      ),
    },
    {
      key: "flag",
      header: "Flag reason",
      render: (c) => (
        <span className={c.flagReason ? "text-[var(--pf-ink)]" : "text-[var(--pf-muted)]"}>
          {c.flagReason || "No flag"}
        </span>
      ),
    },
  ];

  return (
    <ScreenChrome>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Chart review
          </h1>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            Every chart from the last three business days, plus today's visits still waiting for
            the nightly pass, with the flag reason shown next to each visit.
          </p>
        </div>

        <MetricPanel metrics={metrics} dataTour="metric-panel" />

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--pf-muted)]">Provider</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="min-h-[40px] rounded-lg border border-[var(--pf-muted)]/30 bg-[var(--pf-surface)] px-3 py-1.5 text-sm"
            >
              <option value={ALL}>All providers</option>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={filterByProvider}
            className="min-h-[40px] rounded-lg border border-[var(--pf-muted)]/30 px-4 py-2 text-sm"
          >
            Filter by provider
          </button>
          <button
            type="button"
            onClick={showFlaggedOnly}
            className="min-h-[40px] rounded-lg border border-[var(--pf-muted)]/30 px-4 py-2 text-sm"
          >
            Show flagged only
          </button>
          <p className="ml-auto text-sm text-[var(--pf-muted)]">
            Showing {rows.length} of {charts.length} charts
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          onRowClick={openChart}
          dataTour="tracker-table"
          mobileStatusKey="status"
          mobileUrgencyKey="flag"
        />
      </div>
    </ScreenChrome>
  );
}
