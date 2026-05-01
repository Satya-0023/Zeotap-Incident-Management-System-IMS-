/**
 * MTTR (Mean Time to Resolve) Calculator
 *
 * MTTR = RCA submission timestamp − first signal timestamp (for the incident)
 * Stored in seconds. Displayed in human-readable format.
 */

export function calculateMTTR(firstSignalTime: Date, rcaSubmissionTime: Date): number {
  const diffMs = rcaSubmissionTime.getTime() - firstSignalTime.getTime();
  return Math.max(0, Math.floor(diffMs / 1000)); // seconds
}

export function formatMTTR(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m ${secs}s`;
}
