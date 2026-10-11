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
  /\b(worr(y|ied|ies|ying)|afraid|scared|nervous|anxious|concern(ed|s)?|uncertain|unsure|not sure|risk(y)?|lose|losing|lost|loss|crash|downturn|recession|wait(ing)?|delay|hold off|too much|too risky|can't afford|afford|emergency|need (help|money|cash)|short of|run out|sister|brother|son|daughter|kids?|grandchild(ren)?|grandkids?|wife|husband|spouse|partner|divorc(e|ed|ing)|married|marry(ing)?|wedding|engaged|baby|pregnant|adopt(ed|ing)?|sick|illness|health|diagnos(ed|is)|surgery|hospital|caregiv(er|ing)|job|new job|promot(ed|ion)|fired|laid off|retir(e|ed|ing|ement)|inherit(ed|ance)?|house|home|mortgage|down payment|moved|moving to|relocat(e|ed|ing)|(sold|selling|sell) (my|our|the) (business|company|practice|house|home)|bought (a|our|my) (house|home|place|condo)|college|tuition|debt|loan|tax(es)?|lawsuit|died|passed away|(mom|mother|dad|father|husband|wife|partner|son|daughter|brother|sister) passed|widow(ed)?|funeral|dementia|taking care of (him|her|them|my)|splitting up|separat(ed|ing)|twins|downsiz(e|ed|ing)|rental property|stepping down|starting my own (firm|business|company|practice)|(company|business|firm|practice) (got |was )?(acquired|bought out|sold)|sale of (my|our|the) (company|business|practice|firm))\b/;

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
  /\b(let me (walk|show|explain|go over|pull up|take you)|let's (look|review|walk|turn|take a look)|i'll (send you|follow up|set up|walk you|show you|put together)|i (recommend|suggest)|i'd (recommend|suggest)|my recommendation|we recommend|as we discussed|as i mentioned|here's (what|how)|if you look at (page|the)|you can see (the|how|that|here))\b/;
// The client talks about their own life in the first person; the advisor
// talks about "your plan".
const MINE = /\b(i|i'm|i've|i'll|i'd|me|my)\b/;
const YOUR_PLAN = /\byour (plan|reserve|portfolio|strategy|allocation|tranches?|income|proposal)\b/;

export function soundsLikeAdvisor(raw: string): boolean {
  const text = raw.toLowerCase().replace(/[\u2018\u2019]/g, "'");
  return ADVISOR_MOVES.test(text) || (YOUR_PLAN.test(text) && !MINE.test(text));
}

export function classifyUtterance(raw: string): Gate {
  const text = raw.trim().toLowerCase().replace(/[\u2018\u2019]/g, "'");
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
