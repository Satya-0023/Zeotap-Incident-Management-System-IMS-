import { IncidentStatus } from "../../models/postgres/WorkItem";

/**
 * Incident State Machine — State Pattern
 *
 * Valid transitions:
 *   OPEN → INVESTIGATING
 *   INVESTIGATING → RESOLVED
 *   RESOLVED → CLOSED  (requires RCA)
 *
 * Invalid transitions are rejected at code level — not just business rules.
 */

const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN:          ["INVESTIGATING"],
  INVESTIGATING: ["RESOLVED"],
  RESOLVED:      ["CLOSED"],
  CLOSED:        [], // Terminal state
};

export class InvalidTransitionError extends Error {
  constructor(from: IncidentStatus, to: IncidentStatus) {
    super(`Invalid state transition: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
    (this as unknown as { status: number }).status = 400;
  }
}

export class RCARequiredError extends Error {
  constructor() {
    super("Cannot close incident: RCA must be submitted before transitioning to CLOSED");
    this.name = "RCARequiredError";
    (this as unknown as { status: number }).status = 400;
  }
}

export class IncidentStateMachine {
  private current: IncidentStatus;

  constructor(initialStatus: IncidentStatus) {
    this.current = initialStatus;
  }

  getStatus(): IncidentStatus {
    return this.current;
  }

  /**
   * Attempt a state transition.
   * @param next       Target status
   * @param hasRCA     Whether an RCA record exists for this incident
   */
  transition(next: IncidentStatus, hasRCA = false): IncidentStatus {
    const allowed = VALID_TRANSITIONS[this.current];

    if (!allowed.includes(next)) {
      throw new InvalidTransitionError(this.current, next);
    }

    if (next === "CLOSED" && !hasRCA) {
      throw new RCARequiredError();
    }

    this.current = next;
    return this.current;
  }

  /**
   * Check if a transition is valid without executing it.
   */
  canTransition(next: IncidentStatus): boolean {
    return VALID_TRANSITIONS[this.current].includes(next);
  }

  /**
   * Get allowed next states from current state.
   */
  getAllowedTransitions(): IncidentStatus[] {
    return VALID_TRANSITIONS[this.current];
  }
}
