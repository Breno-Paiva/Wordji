// Pool and round-queue construction, and answer checking. Pure functions
// over the data in data.js — no DOM. Mirrors Chordji's generator.js.

import { TENSE_OPTIONS, PRONOUN_OPTIONS, PRONOUN_LABELS, VERB_BANK, WORD_BANK } from "./data.js";

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The vocab pool for a session: every word at the chosen difficulty, filtered
// to single-token *answers*. Space submits, so a multi-word answer can never be
// typed — and a wrong-length submission is `tooShort`, which doesn't consume an
// attempt, so such a word would sit there unresolvable until skipped. Which
// side is the answer flips with the direction: "pt" shows Portuguese and asks
// for the English, "en" the reverse.
export function buildVocabPool({ difficulty, language }) {
  return WORD_BANK.filter(
    (w) =>
      w.difficulty === difficulty &&
      !/\s/.test(language === "pt" ? w.en : w.translations.pt[0]),
  );
}

// The verb pool for a translate-first round — filtered by the separate
// Translation Difficulty control, independent of the tense/pronoun checkboxes.
export function buildVerbTranslatePool({ verbDifficulty }) {
  return VERB_BANK.filter((v) => v.difficulty === verbDifficulty);
}

// Flat pool of every (verb, tense, form) triple allowed by the current
// tense/pronoun checkboxes — used directly as the round pool when
// translateFirst is off.
export function buildConjugationPool({ selectedTenses, selectedPronouns }) {
  const tenses = TENSE_OPTIONS.filter((t) => selectedTenses[t]);
  const forms = PRONOUN_OPTIONS.filter((p) => selectedPronouns[p]);
  const pool = [];
  VERB_BANK.forEach((verb) => {
    tenses.forEach((tense) => {
      forms.forEach((form) => {
        pool.push({ kind: "verbConjugate", verb, tense, form });
      });
    });
  });
  return pool;
}

// Translate-first round unit: a shuffled verb order where each verb expands
// into an adjacent [translate, conjugate] pair, so advancing through the
// queue one item at a time naturally alternates the two steps for the same
// verb before moving to the next.
export function buildVerbPassQueue({ selectedTenses, selectedPronouns, verbDifficulty }) {
  const tenses = TENSE_OPTIONS.filter((t) => selectedTenses[t]);
  const forms = PRONOUN_OPTIONS.filter((p) => selectedPronouns[p]);
  const verbPool = VERB_BANK.filter((v) => v.difficulty === verbDifficulty);
  const queue = [];
  shuffle(verbPool).forEach((verb) => {
    queue.push({ kind: "verbTranslate", verb });
    const tense = tenses[Math.floor(Math.random() * tenses.length)];
    const form = forms[Math.floor(Math.random() * forms.length)];
    queue.push({ kind: "verbConjugate", verb, tense, form });
  });
  return queue;
}

export function pickPronounLabel(form) {
  const aliases = PRONOUN_LABELS[form];
  return aliases[Math.floor(Math.random() * aliases.length)];
}

// Accepted answer(s) for a prompt entry, kind-aware:
// - vocab: "en" display shows the English word and expects Portuguese;
//   "pt" flips it — shows Portuguese and expects English.
// - verbConjugate: the conjugated form for the prompt's tense/person.
// - verbTranslate: the verb's Portuguese infinitive.
export function getAcceptedAnswers(promptEntry, language) {
  if (promptEntry.kind === "verbConjugate") {
    return [promptEntry.verb.conjugations[promptEntry.tense][promptEntry.form]];
  }
  if (promptEntry.kind === "verbTranslate") {
    return [promptEntry.verb.infinitive];
  }
  return language === "pt" ? [promptEntry.en] : promptEntry.translations.pt;
}

export function getPrimaryAnswer(promptEntry, language) {
  return getAcceptedAnswers(promptEntry, language)[0];
}

// Only used for the vocab kind's single-line word display — verb kinds are
// rendered from multiple fields (pronoun label / infinitive / tense badge).
export function getPromptText(wordEntry, language) {
  return language === "pt" ? wordEntry.translations.pt[0] : wordEntry.en;
}

export function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function isCorrect(input, promptEntry, language) {
  const normInput = normalize(input);
  return getAcceptedAnswers(promptEntry, language).some((ans) => normalize(ans) === normInput);
}
