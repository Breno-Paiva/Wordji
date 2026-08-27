// DOM rendering helpers for content that isn't the letter-box input. No app
// state lives here — callers pass data in. Mirrors Chordji's ui.js.

import { DIFFICULTY_LABELS, LANGUAGE_LABELS, TENSE_LABELS } from "./data.js";
import { loadVocabHighScores, loadVerbHighScores } from "./storage.js";

export function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- Score screen: per-question answers list ----------

function describeHistoryEntry(entry, language) {
  if (entry.type === "conjugate") {
    return `${entry.pronounLabel} ${entry.infinitive} (${TENSE_LABELS[entry.tense]}) → ${entry.answer}`;
  }
  if (entry.type === "translate") {
    return `${entry.en} → ${entry.infinitive}`;
  }
  return language === "pt" ? `${entry.pt} → ${entry.en}` : `${entry.en} → ${entry.pt}`;
}

export function renderAnswersList(container, history, language) {
  container.innerHTML = "";
  if (history.length === 0) {
    container.appendChild(el("div", "answers-empty", "No wordjis were resolved this round."));
    return;
  }
  history.forEach((entry) => {
    const rowClass = entry.correct === true ? "correct" : entry.correct === false ? "wrong" : "neutral";
    const mark = entry.correct === true ? "✓" : entry.correct === false ? "✗" : "–";
    const row = el("div", `answers-row ${rowClass}`);
    row.appendChild(el("div", "answers-words", describeHistoryEntry(entry, language)));
    row.appendChild(el("div", "answers-mark", mark));
    container.appendChild(row);
  });
}

// ---------- High scores screen ----------

// Inverse of storage.roundKeyPart: a bare number is a timed round, `25w` a
// word-count round, `unlimited` an open-ended one.
export function formatRoundLength(part) {
  if (part === "unlimited") return "Unlimited";
  if (part.endsWith("w")) return `${part.slice(0, -1)} words`;
  return `${part}s`;
}

function buildVocabHighScoreRows() {
  const scores = loadVocabHighScores();
  return Object.keys(scores)
    .map((key) => {
      const [difficulty, lang, length] = key.split("_");
      return {
        label: `${DIFFICULTY_LABELS[difficulty]} · ${LANGUAGE_LABELS[lang]} · ${formatRoundLength(length)}`,
        score: scores[key],
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildVerbHighScoreRows() {
  const scores = loadVerbHighScores();
  return Object.keys(scores)
    .map((key) => {
      const [mode, length] = key.split("_");
      return {
        label: `${mode === "translate" ? "Translate First" : "Direct"} · ${formatRoundLength(length)}`,
        score: scores[key],
      };
    })
    .sort((a, b) => b.score - a.score);
}

function renderHighScoreSection(container, title, rows) {
  container.appendChild(el("div", "settings-section-label", title));
  if (rows.length === 0) {
    container.appendChild(el("div", "answers-empty", "No high scores yet."));
    return;
  }
  rows.forEach((row) => {
    const rowEl = el("div", "answers-row");
    rowEl.appendChild(el("div", "answers-words", row.label));
    rowEl.appendChild(el("div", "answers-mark", String(row.score)));
    container.appendChild(rowEl);
  });
}

export function renderHighScores(container) {
  container.innerHTML = "";
  renderHighScoreSection(container, "Vocabulário", buildVocabHighScoreRows());
  renderHighScoreSection(container, "Verbos", buildVerbHighScoreRows());
}

// ---------- Bonus popup (game screen, correct answer) ----------

export function showBonusPopup() {
  const popup = el("div", "bonus-popup", "Muito bom!");
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 900);
}

// ---------- Small shared shake helper (name input, letter boxes) ----------

export function shakeElement(element) {
  element.classList.remove("shake");
  void element.offsetWidth; // force reflow so the animation can retrigger
  element.classList.add("shake");
}
