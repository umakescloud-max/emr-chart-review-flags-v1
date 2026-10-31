import {
  ApprovalQueue,
  AuditLog,
  DocumentViewer,
  useActivity,
  type ApprovalItem,
} from "@kit";
import { ScreenChrome } from "./chrome";
import { approveAndRelease, chartsForSignOff, returnToProvider, useCharts } from "./store";

const EDGE_CASE_ID = "5182";

export default function Appeals() {
  useCharts();
  const { logAction } = useActivity();
  const queue = chartsForSignOff();
  const edge = queue.find((c) => c.id === EDGE_CASE_ID);

  const items: ApprovalItem[] = queue.map((c) => ({
    id: c.id,
    title: `Chart #${c.id}, ${c.patientName}`,
    subtitle:
      c.id === EDGE_CASE_ID
        ? "Medication list conflicts with note. Proposed fix: remove lisinopril 20 mg, add losartan 50 mg, cancel the queued refill."
        : c.flagReason,
    edgeCase: c.id === EDGE_CASE_ID,
  }));

  function handlePrimary(item: ApprovalItem) {
    approveAndRelease(item.id);
    logAction("Approved correction and released chart to billing");
  }

  function handleSecondary(item: ApprovalItem) {
    returnToProvider(item.id);
    logAction("Returned chart to provider for correction");
  }

  return (
    <ScreenChrome>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Correction sign-off
          </h1>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            Charts with a proposed correction waiting for a nurse to approve. The chart is not
            updated, the queued refill is not cancelled, and nothing is released to billing until
            you click.
          </p>
        </div>

        {items.length > 0 ? (
          <ApprovalQueue
            items={items}
            primaryLabel="Approve and release"
            secondaryLabel="Return to provider"
            onPrimary={handlePrimary}
            onSecondary={handleSecondary}
            dataTour="approval-queue"
          />
        ) : (
          <p className="rounded-xl border border-[var(--pf-muted)]/20 p-4 text-sm text-[var(--pf-muted)]">
            No charts are waiting for sign-off right now.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <DocumentViewer
            title="Provider addendum, Dr. Elena Brooks"
            missing={!edge?.addendumReceived}
            lines={[
              "Signed by Dr. Elena Brooks, same business day as the flag.",
              "Confirms lisinopril was stopped for a persistent dry cough.",
              "Confirms losartan 50 mg daily was started in its place.",
              "Asks that the queued lisinopril refill be cancelled.",
            ]}
          />
          <DocumentViewer
            title="Proposed medication list change"
            lines={[
              "Remove: lisinopril 20 mg daily.",
              "Add: losartan 50 mg daily.",
              "Cancel: the 90-day lisinopril refill queued to the pharmacy.",
              "Release the chart to billing only after this is approved.",
            ]}
          />
        </div>

        {edge && (
          <p className="text-sm text-[var(--pf-muted)]">
            Chart #{edge.id} is the conflict caught in yesterday's review. Approving the proposed fix
            is the only thing that updates the medication list and releases the chart.
          </p>
        )}

        <div>
          <h2 className="text-lg" style={{ fontFamily: "var(--pf-font-heading)" }}>
            Actions taken in this session
          </h2>
          <div className="mt-2">
            <AuditLog />
          </div>
        </div>
      </div>
    </ScreenChrome>
  );
}
