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
  /\b(worr(y|ied|ies|ying)|afraid|scared|nervous|anxious|concern(ed|s)?|uncertain|unsure|not sure|risk(y)?|lose|losing|lost|loss|crash|downturn|recession|wait(ing)?|delay|hold off|too much|too risky|can't afford|afford|emergency|need (help|money|cash)|short of|run out|sister|brother|son|daughter|kids?|grandchild(ren)?|grandkids?|wife|husband|spouse|partner|parents?|mom|dad|mother|father|divorc(e|ed|ing)|married|marry(ing)?|wedding|engaged|baby|pregnant|expecting|adopt(ed|ing)?|sick|illness|health|diagnos(ed|is)|surgery|hospital|caregiv(er|ing)|job|new job|promot(ed|ion)|quit|fired|laid off|retir(e|ed|ing|ement)|inherit(ed|ance)?|house|home|mortgage|down payment|moved|moving|relocat(e|ed|ing)|sold|selling|bought|business|college|tuition|debt|loan|tax(es)?|lawsuit|died|passed away|widow(ed)?|funeral)\b/;

// A changed goal or a contradiction ("stop working at 65, not 70"), a buying
// signal ("let's go ahead"), or any figure the client says.
const CHANGE_CUES =
  /\b(i'd like|i would like|i want|i'd rather|i would rather|i need|we need|instead|actually|change(d)? my mind|stop working|earlier|sooner|not anymore|let's (do|go|start|move)|go ahead|move forward|ready to|sign)\b|\d/;

const words = (s: string) => s.toLowerCase().match(/[a-z0-9$,.']+/g)?.map((w) => w.replace(/[,.]+$/, "")) ?? [];

// True when the line is mostly the card's suggested phrasing: the advisor
// reading it aloud. Needs four words or more, so "okay" never matches.
export function echoesCard(text: string, phrasing: string | undefined): boolean {
  if (!phrasing) return false;
  const said = words(text);
  if (said.length < 4) return false;
  const card = new Set(words(phrasing));
  return said.filter((w) => card.has(w)).length / said.length >= 0.6;
}

// Live speech-to-text labels every line "client". A line the gate skips never
// reaches Claude's who-said-it judgement, so the advisor's own plain lines
// ("Let me walk you through the reserve") would stay labelled client. These
// are the cheap tells: the advisor steering or following up, or talking about
// the plan to the client ("you", "your") rather than about their own life.
const ADVISOR_MOVES =
  /\b(let me|let's (look|go back|review|walk|talk|turn|take a look|start with)|i'll (send|follow up|set up|check|get back|walk you|show you|email|put together)|i (recommend|suggest)|i'd (recommend|suggest)|my recommendation|we recommend|as we discussed|as i mentioned|here's (what|how)|if you look at|you can see|on page \d+|in the report)\b/;
const SECOND_PERSON = /\b(you|your|you're|you'll|you've|yours)\b/;
const PLAN_TALK = /\b(the|this|our) (plan|reserve|portfolio|strategy|allocation|tranches?|report|proposal)\b/;

export function soundsLikeAdvisor(raw: string): boolean {
  // Fillers that put "you" in a client's mouth.
  const text = raw.toLowerCase().replace(/\b(you know|thank you|you see|mind you)\b/g, " ");
  return ADVISOR_MOVES.test(text) || (SECOND_PERSON.test(text) && PLAN_TALK.test(text));
}

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
