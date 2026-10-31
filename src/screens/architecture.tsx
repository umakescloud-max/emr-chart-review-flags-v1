import { ArchitectureView, type ArchEdge, type ArchNode } from "@kit";
import { ScreenChrome } from "./chrome";

const NODES: ArchNode[] = [
  { id: "emr", label: "Practice EMR (existing)", kind: "system" },
  { id: "review-ui", label: "Chart review app (this prototype)", kind: "app" },
  { id: "claude", label: "Claude (chart review)", kind: "model" },
  { id: "staff", label: "Priya (quality nurse)", kind: "human" },
  { id: "provider", label: "Treating provider", kind: "human" },
  { id: "billing", label: "Billing queue (in the EMR)", kind: "system" },
];

const EDGES: ArchEdge[] = [
  { from: "emr", to: "review-ui", label: "Closed encounters, notes, medication lists" },
  { from: "review-ui", to: "claude", label: "Minimum-necessary note text for review" },
  { from: "claude", to: "review-ui", label: "Suggested flags with reasons" },
  { from: "review-ui", to: "staff", label: "Surfaces flagged charts" },
  { from: "staff", to: "provider", label: "Requests addendum" },
  { from: "staff", to: "emr", label: "Approved chart correction" },
  { from: "staff", to: "billing", label: "Releases chart, human-approved" },
];

const COMPLIANCE_NOTES = [
  "Patient data would be stored encrypted at rest and in transit",
  "AI review runs only under a signed BAA; no PHI is sent to a model without one",
  "Only the note sections needed for each check are sent for review, not the full record",
  "AI flags are suggestions only; no chart, medication list, or refill changes without staff approval",
  "Access is role-restricted to clinical quality staff and providers, with every view and action audit-logged",
];

export default function Architecture() {
  return (
    <ScreenChrome>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--pf-font-heading)" }}>
            How this would work
          </h1>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            The prototype stands in for a nightly review that reads closed encounters from the
            practice's existing EMR and writes flags back. Chart changes reach the EMR only after a
            person approves them.
          </p>
        </div>

        <ArchitectureView nodes={NODES} edges={EDGES} complianceNotes={COMPLIANCE_NOTES} />
      </div>
    </ScreenChrome>
  );
}
