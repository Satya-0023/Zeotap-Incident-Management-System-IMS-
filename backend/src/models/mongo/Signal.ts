import mongoose, { Schema, Document } from "mongoose";

/**
 * Raw Signal — stored in MongoDB (append-only, NoSQL)
 *
 * Signal payload schema:
 * {
 *   "componentId":   "CACHE_CLUSTER_01",
 *   "componentType": "CACHE",
 *   "timestamp":     "2026-05-01T10:00:00Z",
 *   "message":       "Latency spike detected"
 * }
 */
export interface ISignal extends Document {
  componentId: string;
  componentType: string;
  timestamp: Date;
  message: string;
  incidentId: string | null; // linked work item (PostgreSQL ID)
  streamMessageId: string;   // Redis Stream message ID for traceability
  receivedAt: Date;
}

const SignalSchema = new Schema<ISignal>(
  {
    componentId:     { type: String, required: true, index: true },
    componentType:   { type: String, required: true, index: true },
    timestamp:       { type: Date,   required: true, index: true },
    message:         { type: String, required: true },
    incidentId:      { type: String, default: null,  index: true },
    streamMessageId: { type: String, required: true },
    receivedAt:      { type: Date,   default: Date.now },
  },
  {
    collection: "signals",
    // TTL index — auto-expire raw signals after 30 days (storage hygiene)
    expireAfterSeconds: undefined,
  }
);

// Compound index for aggregation queries (signals per minute per component)
SignalSchema.index({ componentId: 1, timestamp: -1 });
SignalSchema.index({ timestamp: -1 });

export const Signal = mongoose.model<ISignal>("Signal", SignalSchema);
