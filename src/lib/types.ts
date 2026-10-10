// Shared contract for all four tracks. Frozen after Stage 0: change it only
// through the engine track, and tell the team before pushing.
import { z } from "zod";

// Every figure on a card carries one of these. Colours: PREPARED_FACT green
// (traced to the advisor's materials), CALCULATED amber (math shown),
// SUGGESTION red (framing or an assumption-bearing idea), DO_NOT_CLAIM grey.
export const PROVENANCE = ["PREPARED_FACT", "CALCULATED", "SUGGESTION", "DO_NOT_CLAIM"] as const;
export const Provenance = z.enum(PROVENANCE);
export type Provenance = z.infer<typeof Provenance>;

export const MOMENT_TYPES = [
  "question",
  "objection",
  "hesitation",
  "contradiction",
  "misunderstanding",
  "buying_signal",
  "disclosure",
  "emotional_concern",
  "priority_change",
  "commitment",
  "unresolved_concern",
] as const;
export const MomentType = z.enum(MOMENT_TYPES);
export type MomentType = z.infer<typeof MomentType>;

export const PrepSource = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["plan", "client_file", "deck", "note"]),
  text: z.string(),
});
export type PrepSource = z.infer<typeof PrepSource>;

export const ClientFile = z.object({
  name: z.string(),
  age: z.number(),
  horizonYears: z.number(),
  cashOnHand: z.number(),
  investable: z.number(),
  riskTolerance: z.enum(["low", "moderate", "high"]),
  statedGoals: z.array(z.string()),
  statedConcerns: z.array(z.string()),
});
export type ClientFile = z.infer<typeof ClientFile>;

// The bounds improvised answers must stay inside. A question outside the
// Mandate gets a defer suggestion, not an answer.
export const Mandate = z.object({
  thesis: z.string(),
  assumptions: z.array(z.string()),
  riskStance: z.string(),
  disclaimers: z.array(z.string()),
  outOfScope: z.array(z.string()),
});
export type Mandate = z.infer<typeof Mandate>;

export const Prep = z.object({
  clientFile: ClientFile,
  sources: z.array(PrepSource),
  mandate: Mandate,
  confirmed: z.boolean(),
});
export type Prep = z.infer<typeof Prep>;

export const TranscriptTurn = z.object({
  id: z.string(),
  speaker: z.enum(["client", "advisor"]),
  text: z.string(),
  t: z.number(), // seconds from meeting start
});
export type TranscriptTurn = z.infer<typeof TranscriptTurn>;

export const CardFact = z.object({
  text: z.string(),
  label: Provenance,
  sourceId: z.string().optional(), // required in practice for PREPARED_FACT
  math: z.string().optional(), // required in practice for CALCULATED
});
export type CardFact = z.infer<typeof CardFact>;

export const Card = z.object({
  id: z.string(),
  turnId: z.string(),
  moment: MomentType,
  concern: z.string(), // what is underneath, in one line
  facts: z.array(CardFact),
  recommendedMove: z.string(),
  phrasing: z.string(), // always a SUGGESTION
  why: z.string(),
  doNotClaim: z.array(z.string()),
  defer: z.boolean(),
  deferReason: z.string().optional(),
});
export type Card = z.infer<typeof Card>;

export const Concern = z.object({
  id: z.string(),
  topic: z.string(),
  status: z.enum(["open", "resolved"]),
  raisedAtTurn: z.string(),
  resolvedAtTurn: z.string().optional(),
});
export type Concern = z.infer<typeof Concern>;

export const ConversationState = z.object({
  concerns: z.array(Concern),
  cards: z.array(Card),
});
export type ConversationState = z.infer<typeof ConversationState>;

// POST /api/moment
export const MomentRequest = z.object({
  prep: Prep,
  turns: z.array(TranscriptTurn), // recent window, newest last
  state: ConversationState,
});
export type MomentRequest = z.infer<typeof MomentRequest>;

export const MomentResponse = z.object({
  card: Card.nullable(), // null when nothing decision-relevant happened
  state: ConversationState,
});
export type MomentResponse = z.infer<typeof MomentResponse>;

export const emptyState = (): ConversationState => ({ concerns: [], cards: [] });
