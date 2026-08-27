// Round state machine: pool/queue advancement, answer checking and scoring.
// Pure data in, pure data out — no DOM, no audio, no timers. Mirrors
// Chordji's game.js.

import { RESULT_TIERS } from "./data.js";
import {
  buildVerbPassQueue,
  getPrimaryAnswer,
  isCorrect,
  pickPronounLabel,
  shuffle,
} from "./generator.js";

const MAX_ATTEMPTS = 3;

// `settings` carries everything the queue needs to (re)build itself:
// { gameMode, language, selectedTenses, selectedPronouns, translateFirst, verbDifficulty }
export function createRound(pool, settings) {
  const round = {
    pool,
    settings,
    queue: [],
    queueIndex: 0,
    currentWord: null,
    currentWordResolved: false,
    currentPronounLabel: "",
    attemptCount: 0,
    score: 0,
    history: [],
  };
  rebuildQueue(round);
  return round;
}

export function rebuildQueue(round) {
  const { settings } = round;
  round.queue =
    settings.gameMode === "verb" && settings.translateFirst
      ? buildVerbPassQueue(settings)
      : shuffle(round.pool);
  round.queueIndex = 0;
}

export function advance(round) {
  if (round.queueIndex >= round.queue.length) rebuildQueue(round);
  round.currentWord = round.queue[round.queueIndex];
  round.queueIndex++;
  round.attemptCount = 0;
  round.currentWordResolved = false;
  round.currentPronounLabel =
    round.currentWord.kind === "verbConjugate" ? pickPronounLabel(round.currentWord.form) : "";
  return round.currentWord;
}

export function requiredAnswerLength(round) {
  return getPrimaryAnswer(round.currentWord, round.settings.language).length;
}

function buildHistoryEntry(round, correct) {
  const word = round.currentWord;
  if (word.kind === "verbConjugate") {
    return {
      type: "conjugate",
      pronounLabel: round.currentPronounLabel,
      infinitive: word.verb.infinitive,
      tense: word.tense,
      answer: getPrimaryAnswer(word, round.settings.language),
      correct,
    };
  }
  if (word.kind === "verbTranslate") {
    return { type: "translate", en: word.verb.en, infinitive: word.verb.infinitive, correct };
  }
  return { type: "vocab", en: word.en, pt: word.translations.pt[0], correct };
}

// Returns one of:
// { status: 'tooShort' }
// { status: 'correct', answer }
// { status: 'wrong', triesLeft }
// { status: 'revealed', answer, kind, pronounLabel }
export function submitAnswer(round, value) {
  const word = round.currentWord;
  const required = requiredAnswerLength(round);
  if (value.length !== required) return { status: "tooShort" };

  if (isCorrect(value, word, round.settings.language)) {
    round.score += 1;
    round.history.push(buildHistoryEntry(round, true));
    round.currentWordResolved = true;
    return { status: "correct", answer: getPrimaryAnswer(word, round.settings.language) };
  }

  round.attemptCount += 1;
  if (round.attemptCount >= MAX_ATTEMPTS) {
    round.history.push(buildHistoryEntry(round, false));
    round.currentWordResolved = true;
    return {
      status: "revealed",
      answer: getPrimaryAnswer(word, round.settings.language),
      kind: word.kind,
      pronounLabel: round.currentPronounLabel,
    };
  }
  return { status: "wrong", triesLeft: MAX_ATTEMPTS - round.attemptCount };
}

// Word-count rounds end once the target number of prompts has been resolved —
// every resolution (correct, revealed or skipped) pushes exactly one entry.
export function resolvedCount(round) {
  return round.history.length;
}

export function skipWord(round) {
  round.history.push(buildHistoryEntry(round, null));
  round.currentWordResolved = true;
}

// Called when the timer hits zero with a question still on screen.
export function resolveUnanswered(round) {
  if (round.currentWord && !round.currentWordResolved) {
    round.history.push(buildHistoryEntry(round, null));
    round.currentWordResolved = true;
  }
}

// Same words/sec bar regardless of round length — which is why the rate is
// measured over elapsed seconds rather than the configured duration: word-count
// and unlimited rounds have no configured duration, and a timed round that was
// quit early is fairly judged on the time actually played.
//
// `lastText` is the message the previous round showed; it's excluded from the
// draw so replaying doesn't repeat itself. Keeping it a parameter rather than
// module state leaves this function pure.
export function getResultTier(score, elapsedSeconds, lastText = null) {
  const wordsPerSecond = score / Math.max(elapsedSeconds, 1);
  const tier = RESULT_TIERS.find((t) => wordsPerSecond >= t.minRate);
  const choices = tier.messages.filter((m) => m !== lastText);
  const pool = choices.length > 0 ? choices : tier.messages;
  return { className: tier.className, text: pool[Math.floor(Math.random() * pool.length)] };
}
