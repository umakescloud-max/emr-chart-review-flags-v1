import { useEffect, useState } from "react";
import { businessDaysBetween, rel } from "@kit";
import { type Chart, chartEvents, charts as seedCharts, eventsForChart as seedEventsForChart } from "../seed";

// In-memory session state shared by every screen. Nothing is written to
// storage and nothing changes without an explicit click.

let version = 0;
const listeners = new Set<() => void>();

const charts: Chart[] = seedCharts.map((c) => ({ ...c }));
const chartById = new Map(charts.map((c) => [c.id, c]));
const events = chartEvents.map((e) => ({ ...e }));
const notes: { id: string; chartId: string; author: string; timestamp: Date; text: string }[] = [];

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

export function useCharts(): Chart[] {
  const [, setVersion] = useState(version);
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return charts;
}

export function getChart(id: string): Chart | undefined {
  return chartById.get(id);
}

export function chartsForSignOff(): Chart[] {
  return charts.filter((c) => c.inSignOff);
}

export function denialCharts(): Chart[] {
  return charts.filter((c) => c.reviewStatus === "flagged");
}

export function trackerCharts(): Chart[] {
  return charts;
}

export function timelineFor(chartId: string) {
  const seeded = seedEventsForChart(chartId);
  const added = notes
    .filter((n) => n.chartId === chartId)
    .map((n) => ({ id: n.id, chartId: n.chartId, author: n.author, timestamp: n.timestamp, eventType: "note", noteText: n.text }));
  return [...seeded, ...added]
    .map((e) => ({ ...e }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function eventsFor(chartId: string) {
  return events.filter((e) => e.chartId === chartId);
}

export function attachAddendum(id: string) {
  const chart = chartById.get(id);
  if (!chart) return;
  chart.addendumReceived = true;
  chart.proposedFix = true;
  emit();
}

export function moveToSignOff(id: string) {
  const chart = chartById.get(id);
  if (!chart) return;
  chart.correctionStatus = "in_correction";
  chart.inSignOff = true;
  chart.proposedFix = true;
  emit();
}

export function approveAndRelease(id: string) {
  const chart = chartById.get(id);
  if (!chart) return;
  chart.correctionStatus = "released";
  chart.inSignOff = false;
  chart.resolvedAt = new Date();
  if (chart.queuedRefill) {
    chart.medListLine = "Losartan 50 mg daily";
    chart.queuedRefill = "";
  }
  emit();
}

export function returnToProvider(id: string) {
  const chart = chartById.get(id);
  if (!chart) return;
  chart.correctionStatus = "in_correction";
  chart.inSignOff = false;
  chart.proposedFix = false;
  emit();
}

export function addChartNote(id: string, text: string) {
  const chart = chartById.get(id);
  if (!chart) return;
  const trimmed = text.trim();
  const noteText = trimmed.length > 0
    ? trimmed
    : `Note added during chart review at ${new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  notes.push({
    id: `note-${notes.length + 1}`,
    chartId: id,
    author: "Priya Raman",
    timestamp: new Date(),
    text: noteText,
  });
  emit();
}

/** Business days from today to the chart's correction deadline. */
export function daysLeft(chart: Chart): number {
  if (!chart.correctionDeadline) return 0;
  return businessDaysBetween(rel(0), chart.correctionDeadline);
}

export function countdownLabel(chart: Chart): string {
  if (!chart.correctionDeadline) return "No deadline set";
  const left = daysLeft(chart);
  const formatted = chart.correctionDeadline.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (left < 0) return `Past deadline by ${Math.abs(left)} business days (${formatted})`;
  if (left === 0) return `Due today (${formatted})`;
  return `${left} business days left (${formatted})`;
}
