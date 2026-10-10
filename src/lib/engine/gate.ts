// The gate in front of the live call: is this utterance a question, a plain
// statement, or filler? Questions always get a card. Plain statements and
// filler ("okay", "got it") do not run, which saves a Claude call and keeps
// the advisor's screen quiet. One exception: a statement carrying a worry,
// hesitation, life event, changed goal, buying signal or figure ("Maybe I
// should just wait six months", "stop working at 65, not 70") still runs,
// because that is what the product exists to catch.
//
// Deterministic and instant. Live speech-to-text often drops the "?", so a
// question is also recognized by how it opens.

export type UtteranceKind = "question" | "statement" | "filler";
export type Gate = { kind: UtteranceKind; concern: boolean; run: boolean };

const QUESTION_OPENERS =
  /^(what|what's|whats|how|how's|why|when|where|who|whom|whose|which|can|could|would|should|will|won't|do|does|did|don't|doesn't|didn't|is|isn't|are|aren't|am|was|wasn't|were|have|haven't|has|hasn't|may|might|shall|any|anything)\b/;
const QUESTION_PHRASES =
  /\b(i wonder|wondering|tell me|explain|walk me through|what if|what about|how about|is it possible|do you think|can you|could you|would you|should i|should we|am i|are we)\b/;

const FILLER =
  /^(ok(ay)?|yeah|yes|yep|yup|no|nope|sure|right|alright|all right|got it|i see|mm+-?hm+|uh-?huh|hmm+|thanks?|thank you|great|good|cool|fine|makes sense|that makes sense|sounds good|perfect|exactly|true|of course)\b[\s.!,]*$/;

// Cues that a client statement carries something worth a card: worry,
// hesitation, loss, a new need or a life event.
const CONCERN_CUES =
  /\b(worr(y|ied|ies|ying)|afraid|scared|nervous|anxious|concern(ed|s)?|uncertain|unsure|not sure|risk(y)?|lose|losing|lost|loss|crash|downturn|recession|wait(ing)?|delay|hold off|too much|too risky|can't afford|afford|emergency|need (help|money|cash)|short of|run out|sister|brother|son|daughter|kids?|grandchild(ren)?|wife|husband|spouse|partner|divorce|sick|illness|health|hospital|job|laid off|retire(ment)?|inherit(ance)?|house|home|mortgage|down payment|college|tuition|debt|loan|tax(es)?|lawsuit|died|passed away|funeral)\b/;

// A changed goal or a contradiction ("stop working at 65, not 70"), a buying
// signal ("let's go ahead"), or any figure the client says.
const CHANGE_CUES =
  /\b(i'd like|i would like|i want|i'd rather|i would rather|i need|we need|instead|actually|change(d)? my mind|stop working|earlier|sooner|not anymore|let's (do|go|start|move)|go ahead|move forward|ready to|sign)\b|\d/;

export function classifyUtterance(raw: string): Gate {
  const text = raw.trim().toLowerCase();
  if (!text) return { kind: "filler", concern: false, run: false };
  const concern = CONCERN_CUES.test(text) || CHANGE_CUES.test(text);
  // Judge the last sentence: "Okay, that helps. But what if rates fall?" is a question.
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const last = sentences.at(-1) ?? text;
  const isQuestion =
    text.includes("?") || QUESTION_OPENERS.test(last) || sentences.some((s) => QUESTION_PHRASES.test(s));
  if (isQuestion) return { kind: "question", concern, run: true };
  if (FILLER.test(text)) return { kind: "filler", concern: false, run: false };
  return { kind: "statement", concern, run: concern };
}
