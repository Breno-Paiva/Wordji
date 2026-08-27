// Bootstrap, screen routing, and global keyboard shortcuts.

import * as audio from "./audio.js";
import * as storage from "./storage.js";
import * as generator from "./generator.js";
import * as game from "./game.js";
import * as ui from "./ui.js";
import { createLetterInput } from "./input.js";
import {
  TENSE_LABELS,
  MODE_OPTIONS,
  ROUND_OPTIONS,
  ROUND_TYPE_NOTES,
  WORD_COUNT_OPTIONS,
} from "./data.js";

const els = {
  screens: {
    title: document.getElementById("screen-title"),
    "mode-select": document.getElementById("screen-mode-select"),
    "vocab-settings": document.getElementById("screen-vocab-settings"),
    "verb-settings": document.getElementById("screen-verb-settings"),
    game: document.getElementById("screen-game"),
    score: document.getElementById("screen-score"),
    "high-scores": document.getElementById("screen-high-scores"),
    help: document.getElementById("screen-help"),
    settings: document.getElementById("screen-settings"),
    "name-entry": document.getElementById("screen-name-entry"),
  },

  greetingLine: document.getElementById("greeting-line"),
  startBtn: document.getElementById("start-btn"),
  quickStartBtn: document.getElementById("quick-start-btn"),

  modeGroup: document.getElementById("mode-group"),
  modeContinueBtn: document.getElementById("mode-continue-btn"),
  modeBackBtn: document.getElementById("mode-back-btn"),

  languageGroup: document.getElementById("language-group"),
  vocabDifficultyGroup: document.getElementById("vocab-difficulty-group"),
  vocabRoundTypeGroup: document.getElementById("vocab-round-type-group"),
  vocabLengthGroup: document.getElementById("vocab-length-group"),
  vocabLengthNote: document.getElementById("vocab-length-note"),
  vocabBeginBtn: document.getElementById("vocab-begin-btn"),
  vocabBackBtn: document.getElementById("vocab-back-btn"),

  verbCustomToggleBtn: document.getElementById("verb-custom-toggle-btn"),
  verbCustomFields: document.getElementById("verb-custom-fields"),
  tensesGroup: document.getElementById("tenses-group"),
  pronounsGroup: document.getElementById("pronouns-group"),
  translateFirstCheckbox: document.getElementById("translate-first-checkbox"),
  verbDifficultyField: document.getElementById("verb-difficulty-field"),
  verbDifficultyGroup: document.getElementById("verb-difficulty-group"),
  verbRoundTypeGroup: document.getElementById("verb-round-type-group"),
  verbLengthGroup: document.getElementById("verb-length-group"),
  verbLengthNote: document.getElementById("verb-length-note"),
  verbBeginBtn: document.getElementById("verb-begin-btn"),
  verbBackBtn: document.getElementById("verb-back-btn"),

  progressPill: document.getElementById("progress-pill"),
  timerPill: document.getElementById("timer-pill"),
  skipBtn: document.getElementById("skip-btn"),
  quitBtn: document.getElementById("quit-btn"),
  gamePanel: document.getElementById("game-panel"),
  categoryTag: document.getElementById("category-tag"),
  wordDisplay: document.getElementById("word-display"),
  infinitiveLabel: document.getElementById("infinitive-label"),
  boxRow: document.getElementById("box-row"),
  statusLine: document.getElementById("status-line"),
  answerInput: document.getElementById("answer-input"),

  scoreTitle: document.getElementById("score-title"),
  scoreValue: document.getElementById("score-value"),
  roundDetail: document.getElementById("round-detail"),
  highScoreLine: document.getElementById("high-score-line"),
  resultMessage: document.getElementById("result-message"),
  answersList: document.getElementById("answers-list"),
  replayBtn: document.getElementById("replay-btn"),
  restartBtn: document.getElementById("restart-btn"),

  highScoresTitle: document.getElementById("high-scores-title"),
  highScoresList: document.getElementById("high-scores-list"),
  highScoresBackBtn: document.getElementById("high-scores-back-btn"),

  helpBackBtn: document.getElementById("help-back-btn"),

  settingsNameValue: document.getElementById("settings-name-value"),
  settingsEditNameBtn: document.getElementById("settings-edit-name-btn"),
  settingsClearScoresBtn: document.getElementById("settings-clear-scores-btn"),
  settingsBackBtn: document.getElementById("settings-back-btn"),

  nameEntryTitle: document.getElementById("name-entry-title"),
  nameInput: document.getElementById("name-input"),
  nameError: document.getElementById("name-error"),
  nameSaveBtn: document.getElementById("name-save-btn"),
  nameCancelBtn: document.getElementById("name-cancel-btn"),

  quitModal: document.getElementById("quit-modal"),
  quitCancelBtn: document.getElementById("quit-cancel-btn"),
  quitConfirmBtn: document.getElementById("quit-confirm-btn"),

  clearScoresModal: document.getElementById("clear-scores-modal"),
  clearScoresCancelBtn: document.getElementById("clear-scores-cancel-btn"),
  clearScoresConfirmBtn: document.getElementById("clear-scores-confirm-btn"),

  muteBtn: document.getElementById("mute-btn"),
  settingsBtn: document.getElementById("settings-btn"),
  darkModeBtn: document.getElementById("dark-mode-btn"),
  highScoreBtn: document.getElementById("high-score-btn"),
  helpBtn: document.getElementById("help-btn"),
};

const letterInput = createLetterInput(els.boxRow);

// ---------- Session-only settings (never persisted, matching the original —
// only name, theme, and high scores survive a reload) ----------

let gameMode = null; // 'vocab' | 'verb'
let displayLanguage = null; // 'en' | 'pt'
let selectedDifficulty = null;
// Round length is two-tier: `roundType` picks which of the two values below is
// in play, and unlimited rounds use neither.
let roundType = "timed"; // 'timed' | 'count' | 'unlimited'
let selectedDuration = null;
let selectedWordCount = null;
let selectedTenses = { presente: true, preterito_perfeito: false, preterito_imperfeito: false, futuro_presente: false };
let selectedPronouns = { eu: true, voce: true, nos: true, eles: true };
let translateFirst = false;
let selectedVerbDifficulty = "medium";
let verbCustomExpanded = false;

let userName = storage.loadUserName();
let darkMode = storage.loadDarkMode();

let round = null;
let inputLocked = false;
let isNewHighScore = false;
let timerHandle = null;
let timeRemaining = 0;
let elapsedSeconds = 0;
let endReason = null; // 'timeup' | 'complete' | 'quit'
let lastResultMessage = null; // so Replay doesn't draw the same praise twice

let currentScreen = "title";
let nameEntryReturnState = "title";
let highScoresReturnState = "title";
let helpReturnState = "title";
let settingsReturnState = "title";

// ---------- Icon stack ----------

// The corner icons carry both a tooltip and a screen-reader label, and the two
// toggles relabel themselves — so they always move together.
function setIconLabel(button, label) {
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}

// ---------- Theme ----------

function applyDarkMode() {
  document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  document.getElementById("theme-color-meta").setAttribute("content", darkMode ? "#1f2937" : "#A3C1E1");
  els.darkModeBtn.textContent = darkMode ? "🌙" : "☀️";
  setIconLabel(els.darkModeBtn, darkMode ? "Switch to light mode" : "Switch to dark mode");
}

els.darkModeBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  storage.saveDarkMode(darkMode);
  applyDarkMode();
  audio.playClick();
});

els.muteBtn.addEventListener("click", () => {
  audio.setMuted(!audio.isMuted());
  els.muteBtn.textContent = audio.isMuted() ? "🔇" : "🔊";
  setIconLabel(els.muteBtn, audio.isMuted() ? "Unmute sound" : "Mute sound");
});

// ---------- Screen routing ----------

function showScreen(name) {
  currentScreen = name;
  Object.entries(els.screens).forEach(([key, el]) => {
    el.classList.toggle("hidden", key !== name);
  });
  document.body.classList.toggle("is-playing", name === "game");
  // Settings, high scores and help all navigate away from a live round while
  // its clock keeps running, so they're pulled during play — Quit is the one
  // deliberate way out.
  const playing = name === "game";
  els.settingsBtn.classList.toggle("hidden", playing || name === "settings");
  els.highScoreBtn.classList.toggle("hidden", playing || name === "high-scores");
  els.helpBtn.classList.toggle("hidden", playing || name === "help");
  window.scrollTo(0, 0);

  if (name === "mode-select") syncModeSelect();
  if (name === "vocab-settings") syncVocabSettings();
  if (name === "verb-settings") syncVerbSettings();
  if (name === "title") syncTitle();
  if (name === "settings") syncSettings();
  if (name === "high-scores") renderHighScores();
  if (name === "name-entry") {
    els.nameInput.focus();
    els.nameInput.select();
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function syncTitle() {
  if (userName) {
    els.greetingLine.textContent = `${getGreeting()}, ${userName}!`;
    els.greetingLine.classList.remove("hidden");
  } else {
    els.greetingLine.classList.add("hidden");
  }
}

// ---------- Generic single-select toggle group ----------
// Unlike Chordji's bindToggleGroup, these groups may start with nothing
// active — the player hasn't picked a value yet — and Continue/Begin stay
// disabled until they do.

function bindSingleSelect(container, onChange) {
  const buttons = Array.from(container.querySelectorAll(".toggle-btn, .mode-btn"));

  function setActive(value) {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === value);
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.playClick();
      setActive(btn.dataset.value);
      onChange(btn.dataset.value);
    });
  });

  return setActive;
}

const setModeActive = bindSingleSelect(els.modeGroup, (value) => {
  gameMode = value;
  els.modeContinueBtn.disabled = false;
});

const setLanguageActive = bindSingleSelect(els.languageGroup, (value) => {
  displayLanguage = value;
  syncVocabBeginEnabled();
});

const setVocabDifficultyActive = bindSingleSelect(els.vocabDifficultyGroup, (value) => {
  selectedDifficulty = value;
  syncVocabBeginEnabled();
});

const setVerbDifficultyActive = bindSingleSelect(els.verbDifficultyGroup, (value) => {
  selectedVerbDifficulty = value;
});

// ---------- Round length (shared by both settings screens) ----------

// Two-tier: the type picks whether the row underneath offers seconds, word
// counts, or nothing at all. Both settings screens drive the same shared
// state, so each gets its own control that re-renders from that state.
function createRoundLengthControl(typeGroup, valueGroup, noteEl, onChange) {
  const setTypeActive = bindSingleSelect(typeGroup, (value) => {
    roundType = value;
    render();
    onChange();
  });

  function render() {
    setTypeActive(roundType);
    noteEl.textContent = ROUND_TYPE_NOTES[roundType];
    valueGroup.classList.toggle("hidden", roundType === "unlimited");
    valueGroup.innerHTML = "";
    if (roundType === "unlimited") return;

    const timed = roundType === "timed";
    const values = timed ? ROUND_OPTIONS : WORD_COUNT_OPTIONS;
    const selected = timed ? selectedDuration : selectedWordCount;
    valueGroup.setAttribute("aria-label", timed ? "Round duration" : "How many wordjis");

    values.forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = value === selected ? "toggle-btn active" : "toggle-btn";
      btn.dataset.value = String(value);
      btn.textContent = timed ? `${value}s` : `${value} words`;
      btn.addEventListener("click", () => {
        audio.playClick();
        if (timed) selectedDuration = value;
        else selectedWordCount = value;
        render();
        onChange();
      });
      valueGroup.appendChild(btn);
    });
  }

  return render;
}

// Unlimited needs no value picked; the other two do.
function roundLengthChosen() {
  if (roundType === "unlimited") return true;
  if (roundType === "count") return selectedWordCount !== null;
  return selectedDuration !== null;
}

const renderVocabRoundLength = createRoundLengthControl(
  els.vocabRoundTypeGroup,
  els.vocabLengthGroup,
  els.vocabLengthNote,
  () => syncVocabBeginEnabled(),
);

const renderVerbRoundLength = createRoundLengthControl(
  els.verbRoundTypeGroup,
  els.verbLengthGroup,
  els.verbLengthNote,
  () => syncVerbBeginEnabled(),
);

function syncVocabBeginEnabled() {
  els.vocabBeginBtn.disabled = !(displayLanguage && selectedDifficulty && roundLengthChosen());
}

function syncVerbBeginEnabled() {
  els.verbBeginBtn.disabled = !roundLengthChosen();
}

function syncModeSelect() {
  setModeActive(gameMode);
  els.modeContinueBtn.disabled = gameMode === null;
}

function syncVocabSettings() {
  setLanguageActive(displayLanguage);
  setVocabDifficultyActive(selectedDifficulty);
  renderVocabRoundLength();
  syncVocabBeginEnabled();
}

function syncVerbSettings() {
  els.verbCustomFields.classList.toggle("hidden", !verbCustomExpanded);
  els.verbCustomToggleBtn.textContent = verbCustomExpanded ? "Hide Custom Settings ▴" : "Custom Settings ▾";

  els.tensesGroup.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.checked = selectedTenses[input.dataset.value];
  });
  els.pronounsGroup.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.checked = selectedPronouns[input.dataset.value];
  });
  els.translateFirstCheckbox.checked = translateFirst;
  els.verbDifficultyField.classList.toggle("hidden", !translateFirst);
  setVerbDifficultyActive(selectedVerbDifficulty);
  renderVerbRoundLength();
  syncVerbBeginEnabled();
}

els.verbCustomToggleBtn.addEventListener("click", () => {
  verbCustomExpanded = !verbCustomExpanded;
  audio.playClick();
  syncVerbSettings();
});

function checkedCount(map) {
  return Object.values(map).filter(Boolean).length;
}

// At least one tense/pronoun must stay checked — an empty pool can't build
// a round — so a toggle that would empty the group is reverted.
els.tensesGroup.querySelectorAll("input[type=checkbox]").forEach((input) => {
  input.addEventListener("change", () => {
    const key = input.dataset.value;
    if (!input.checked && checkedCount(selectedTenses) <= 1 && selectedTenses[key]) {
      input.checked = true;
      return;
    }
    selectedTenses[key] = input.checked;
    audio.playClick();
  });
});

els.pronounsGroup.querySelectorAll("input[type=checkbox]").forEach((input) => {
  input.addEventListener("change", () => {
    const key = input.dataset.value;
    if (!input.checked && checkedCount(selectedPronouns) <= 1 && selectedPronouns[key]) {
      input.checked = true;
      return;
    }
    selectedPronouns[key] = input.checked;
    audio.playClick();
  });
});

els.translateFirstCheckbox.addEventListener("change", () => {
  translateFirst = els.translateFirstCheckbox.checked;
  els.verbDifficultyField.classList.toggle("hidden", !translateFirst);
  audio.playClick();
});

// ---------- Navigation ----------

els.startBtn.addEventListener("click", () => { audio.playClick(); showScreen("mode-select"); });

els.quickStartBtn.addEventListener("click", () => { audio.playClick(); quickStartVocab(); });

els.modeBackBtn.addEventListener("click", () => { audio.playClick(); showScreen("title"); });
els.modeContinueBtn.addEventListener("click", () => {
  if (gameMode === null) return;
  audio.playClick();
  showScreen(gameMode === "verb" ? "verb-settings" : "vocab-settings");
});

els.vocabBackBtn.addEventListener("click", () => { audio.playClick(); showScreen("mode-select"); });
els.vocabBeginBtn.addEventListener("click", () => {
  if (els.vocabBeginBtn.disabled) return;
  audio.playClick();
  startGame();
});

els.verbBackBtn.addEventListener("click", () => { audio.playClick(); showScreen("mode-select"); });
els.verbBeginBtn.addEventListener("click", () => {
  if (els.verbBeginBtn.disabled) return;
  audio.playClick();
  startGame();
});

els.replayBtn.addEventListener("click", () => { audio.playClick(); startGame(); });
els.restartBtn.addEventListener("click", () => { audio.playClick(); showScreen("title"); });

els.settingsBtn.addEventListener("click", () => {
  audio.playClick();
  settingsReturnState = currentScreen;
  showScreen("settings");
});
els.settingsBackBtn.addEventListener("click", () => { audio.playClick(); showScreen(settingsReturnState); });

els.highScoreBtn.addEventListener("click", () => {
  audio.playClick();
  highScoresReturnState = currentScreen;
  showScreen("high-scores");
});
els.highScoresBackBtn.addEventListener("click", () => { audio.playClick(); showScreen(highScoresReturnState); });

els.helpBtn.addEventListener("click", () => {
  audio.playClick();
  helpReturnState = currentScreen;
  showScreen("help");
});
els.helpBackBtn.addEventListener("click", () => { audio.playClick(); showScreen(helpReturnState); });

// ---------- Name entry ----------

function syncSettings() {
  els.settingsNameValue.textContent = userName || "Not set";
}

els.settingsEditNameBtn.addEventListener("click", () => {
  audio.playClick();
  nameEntryReturnState = "settings";
  els.nameEntryTitle.textContent = userName ? "Change Your Name" : "What's Your Name?";
  els.nameInput.value = userName || "";
  els.nameError.textContent = "";
  showScreen("name-entry");
});

function trySaveName() {
  const value = els.nameInput.value.trim();
  if (!value) {
    els.nameError.textContent = "Please enter a name.";
    ui.shakeElement(els.nameInput);
    return;
  }
  userName = value.slice(0, storage.MAX_NAME_LENGTH);
  storage.saveUserName(userName);
  audio.playClick();
  showScreen(nameEntryReturnState);
}

els.nameSaveBtn.addEventListener("click", trySaveName);
els.nameCancelBtn.addEventListener("click", () => { audio.playClick(); showScreen(nameEntryReturnState); });
els.nameInput.addEventListener("keydown", (e) => {
  // Stop propagation so this key never reaches the document-level handler —
  // trySaveName() can change the screen synchronously, and letting the same
  // event bubble up would let the *new* screen's Enter-handling fire too.
  if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); trySaveName(); }
});

// ---------- Clear high scores ----------

function openClearScoresModal() {
  els.clearScoresModal.classList.remove("hidden");
  els.clearScoresCancelBtn.focus();
}
function closeClearScoresModal() {
  els.clearScoresModal.classList.add("hidden");
}

els.settingsClearScoresBtn.addEventListener("click", () => { audio.playClick(); openClearScoresModal(); });
els.clearScoresCancelBtn.addEventListener("click", () => { audio.playClick(); closeClearScoresModal(); });
els.clearScoresConfirmBtn.addEventListener("click", () => {
  storage.clearAllHighScores();
  audio.playClick();
  closeClearScoresModal();
});
els.clearScoresModal.addEventListener("click", (e) => {
  if (e.target === els.clearScoresModal) closeClearScoresModal();
});

function isClearScoresModalOpen() {
  return !els.clearScoresModal.classList.contains("hidden");
}

// ---------- High scores screen ----------

function renderHighScores() {
  els.highScoresTitle.textContent = userName ? `${userName} High Score` : "High Scores";
  ui.renderHighScores(els.highScoresList);
}

// ---------- Game ----------

function highScoreSettings() {
  const length = { roundType, duration: selectedDuration, wordCount: selectedWordCount };
  return gameMode === "verb"
    ? { translateFirst, ...length }
    : { difficulty: selectedDifficulty, language: displayLanguage, ...length };
}

function quickStartVocab() {
  gameMode = "vocab";
  selectedDifficulty = "easy";
  roundType = "timed";
  selectedDuration = 30;
  displayLanguage = "en";
  startGame();
}

function startGame() {
  const settings =
    gameMode === "verb"
      ? { gameMode, language: null, selectedTenses, selectedPronouns, translateFirst, verbDifficulty: selectedVerbDifficulty }
      : { gameMode, language: displayLanguage };

  const pool =
    gameMode === "verb"
      ? translateFirst
        ? generator.buildVerbTranslatePool({ verbDifficulty: selectedVerbDifficulty })
        : generator.buildConjugationPool({ selectedTenses, selectedPronouns })
      : generator.buildVocabPool({ difficulty: selectedDifficulty, language: displayLanguage });

  round = game.createRound(pool, settings);
  setInputLocked(false);
  isNewHighScore = false;
  endReason = null;

  showScreen("game");
  nextWord();
  focusAnswerInput();
  startTimer();
}

function nextWord() {
  const word = game.advance(round);
  els.answerInput.value = "";
  els.statusLine.textContent = "";
  els.statusLine.classList.remove("reveal-text");

  if (word.kind === "verbConjugate") {
    els.categoryTag.className = "category-tag tense-badge";
    els.categoryTag.textContent = TENSE_LABELS[word.tense];
    els.wordDisplay.textContent = round.currentPronounLabel;
    els.infinitiveLabel.textContent = word.verb.infinitive;
    els.infinitiveLabel.classList.remove("hidden");
  } else if (word.kind === "verbTranslate") {
    els.categoryTag.className = "category-tag";
    els.categoryTag.textContent = "";
    els.wordDisplay.textContent = word.verb.en;
    els.infinitiveLabel.classList.add("hidden");
  } else {
    els.categoryTag.className = "category-tag";
    els.categoryTag.textContent = word.category.replace("_", " ");
    els.wordDisplay.textContent = generator.getPromptText(word, displayLanguage);
    els.infinitiveLabel.classList.add("hidden");
  }

  letterInput.render(generator.getPrimaryAnswer(word, displayLanguage).length, {
    wide: word.kind === "verbConjugate",
  });

  updateProgressPill();
}

// Only a word-count round has a position to report; timed and unlimited rounds
// are told everything they need by the clock.
function updateProgressPill() {
  els.progressPill.classList.toggle("hidden", roundType !== "count");
  if (roundType !== "count") return;
  const position = Math.min(game.resolvedCount(round) + 1, selectedWordCount);
  els.progressPill.textContent = `${position} / ${selectedWordCount}`;
}

// Skip is dead during a result pause, so the button says so rather than
// silently swallowing the press.
function setInputLocked(locked) {
  inputLocked = locked;
  els.skipBtn.disabled = locked;
}

function focusAnswerInput() {
  if (currentScreen === "game" && !isQuitModalOpen()) els.answerInput.focus();
}

els.answerInput.addEventListener("input", () => letterInput.update(els.answerInput.value));
els.answerInput.addEventListener("blur", () => {
  if (currentScreen === "game") setTimeout(focusAnswerInput, 0);
});
// A mobile browser only reopens its on-screen keyboard for a focus() call
// made directly inside a real user gesture, not one deferred via
// setTimeout — so if the keyboard was dismissed, tapping the play area is
// what actually brings it back.
els.gamePanel.addEventListener("click", () => focusAnswerInput());

// Every resolved prompt — right, revealed or skipped — pauses on its result
// before the round either moves on or, in a word-count round, ends.
function advanceAfterResolution(delay) {
  setInputLocked(true);
  setTimeout(() => {
    setInputLocked(false);
    if (currentScreen !== "game") return;
    if (roundType === "count" && game.resolvedCount(round) >= selectedWordCount) {
      endRound("complete");
      return;
    }
    nextWord();
    focusAnswerInput();
  }, delay);
}

function submitAnswer() {
  if (inputLocked || !round.currentWord) return;
  const value = els.answerInput.value;
  const result = game.submitAnswer(round, value);

  if (result.status === "tooShort") {
    letterInput.shake();
    audio.playBlip();
    return;
  }

  if (result.status === "correct") {
    letterInput.flash("flash-correct");
    letterInput.update(result.answer);
    ui.showBonusPopup();
    audio.playCorrect();
    advanceAfterResolution(600);
    return;
  }

  // Wrong and revealed both start the same way: flash red, shake, clear.
  letterInput.flash("flash-wrong");
  letterInput.shake();
  audio.playWrong();
  els.answerInput.value = "";
  setTimeout(() => letterInput.update(""), 150);

  if (result.status === "revealed") {
    setTimeout(() => {
      // Conjugation prompts test the pronoun too, so the reveal shows both.
      const label = result.kind === "verbConjugate" ? result.pronounLabel : null;
      els.statusLine.textContent = letterInput.reveal(result.answer, label);
      els.statusLine.classList.add("reveal-text");
      audio.playReveal();
    }, 200);
    advanceAfterResolution(1700);
  } else {
    els.statusLine.textContent = result.triesLeft === 1 ? "1 more try" : `${result.triesLeft} more tries`;
  }
}

function requestSkip() {
  if (inputLocked || !round.currentWord) return;
  game.skipWord(round);
  letterInput.flash("flash-skip");
  audio.playSkip();
  advanceAfterResolution(800);
}

// ---------- Timer ----------

// A timed round counts its clock down and ends at zero; word-count and
// unlimited rounds count elapsed time up instead, which is also what the result
// tier is measured against.
function tick() {
  elapsedSeconds += 1;
  if (roundType !== "timed") {
    updateTimerDisplay();
    return;
  }
  timeRemaining -= 1;
  updateTimerDisplay();
  if (timeRemaining > 0 && timeRemaining <= 5) audio.playTick();
  if (timeRemaining <= 0) endRound("timeup");
}

function pauseTimer() {
  clearInterval(timerHandle);
}

function resumeTimer() {
  clearInterval(timerHandle);
  timerHandle = setInterval(tick, 1000);
}

function startTimer() {
  elapsedSeconds = 0;
  timeRemaining = selectedDuration;
  updateTimerDisplay();
  resumeTimer();
}

function updateTimerDisplay() {
  const timed = roundType === "timed";
  els.timerPill.textContent = ui.formatTime(timed ? Math.max(timeRemaining, 0) : elapsedSeconds);
  els.timerPill.classList.toggle("low", timed && timeRemaining <= 5);
}

// `reason` is 'timeup', 'complete' (a word-count round hit its target) or
// 'quit'. All three bank the score — quitting early can only ever lower it.
function endRound(reason) {
  pauseTimer();
  endReason = reason;
  closeQuitModal({ resume: false });
  if (reason !== "quit") audio.playTimesUp();
  game.resolveUnanswered(round);
  setInputLocked(true);
  els.answerInput.blur();

  isNewHighScore =
    gameMode === "verb"
      ? storage.recordVerbHighScore(highScoreSettings(), round.score)
      : storage.recordVocabHighScore(highScoreSettings(), round.score);

  renderScoreScreen();
  showScreen("score");
}

const SCORE_TITLES = { timeup: "Time's Up!", complete: "Round Complete!", quit: "Round Over" };

function renderScoreScreen() {
  els.scoreTitle.textContent = SCORE_TITLES[endReason];

  // A word-count round is scored out of the prompts actually seen, so quitting
  // one part-way reads honestly rather than as a shortfall against the target.
  els.scoreValue.textContent =
    roundType === "count"
      ? `${round.score} / ${game.resolvedCount(round)}`
      : `${round.score} ${round.score === 1 ? "wordji" : "wordjis"}`;

  // The clock already said it for a round that ran out of time.
  els.roundDetail.textContent = endReason === "timeup" ? "" : `in ${ui.formatTime(elapsedSeconds)}`;
  els.roundDetail.classList.toggle("hidden", endReason === "timeup");

  const best =
    gameMode === "verb" ? storage.getVerbHighScore(highScoreSettings()) : storage.getVocabHighScore(highScoreSettings());
  els.highScoreLine.textContent = isNewHighScore ? "New High Score! 🏆" : `High Score: ${best}`;
  els.highScoreLine.classList.toggle("new-high-score", isNewHighScore);

  const tier = game.getResultTier(round.score, elapsedSeconds, lastResultMessage);
  lastResultMessage = tier.text;
  els.resultMessage.textContent = tier.text;
  els.resultMessage.className = `result-message ${tier.className}`;

  ui.renderAnswersList(els.answersList, round.history, displayLanguage);
}

// ---------- Quit ----------

function isQuitModalOpen() {
  return !els.quitModal.classList.contains("hidden");
}

// The clock stops while the modal is up, so deciding whether to stop doesn't
// cost the player any of the round they might keep playing.
function openQuitModal() {
  if (currentScreen !== "game" || isQuitModalOpen()) return;
  pauseTimer();
  els.answerInput.blur();
  els.quitModal.classList.remove("hidden");
  els.quitCancelBtn.focus();
}

// `resume` is false only when the round is ending anyway and there's nothing
// left to hand the clock or the input back to.
function closeQuitModal({ resume = true } = {}) {
  if (!isQuitModalOpen()) return;
  els.quitModal.classList.add("hidden");
  if (!resume) return;
  resumeTimer();
  focusAnswerInput();
}

// Skipping keeps the player in the typing flow, so the press must not steal
// focus from the answer input: a focus() restored from a timeout won't reopen a
// phone's keyboard, and preventing the mousedown means it never closes.
els.skipBtn.addEventListener("mousedown", (event) => event.preventDefault());
els.skipBtn.addEventListener("click", () => requestSkip());

els.quitBtn.addEventListener("click", () => { audio.playClick(); openQuitModal(); });
els.quitCancelBtn.addEventListener("click", () => { audio.playClick(); closeQuitModal(); });
els.quitConfirmBtn.addEventListener("click", () => { audio.playClick(); endRound("quit"); });
els.quitModal.addEventListener("click", (e) => {
  if (e.target === els.quitModal) closeQuitModal();
});

// ---------- Global keyboard shortcuts ----------

document.addEventListener("keydown", (event) => {
  if (isClearScoresModalOpen()) {
    if (event.key === "Escape") { audio.playClick(); closeClearScoresModal(); }
    return;
  }
  // Enter/Space are left to whichever modal button has focus.
  if (isQuitModalOpen()) {
    if (event.key === "Escape") { audio.playClick(); closeQuitModal(); }
    return;
  }

  if (currentScreen === "title") {
    if (event.key === "Enter" || event.key === "1") { els.startBtn.click(); return; }
    if (event.key === "Escape" || event.key === "2") { els.quickStartBtn.click(); return; }
    return;
  }
  if (currentScreen === "mode-select") {
    if (event.key === "Enter") { els.modeContinueBtn.click(); return; }
    if (event.key === "Escape") { els.modeBackBtn.click(); return; }
    if (event.key === "1") { audio.playClick(); gameMode = "vocab"; syncModeSelect(); return; }
    if (event.key === "2") { audio.playClick(); gameMode = "verb"; syncModeSelect(); return; }
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
      const idx = MODE_OPTIONS.indexOf(gameMode);
      const dir = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      gameMode = MODE_OPTIONS[(idx + dir + MODE_OPTIONS.length) % MODE_OPTIONS.length];
      audio.playClick();
      syncModeSelect();
      return;
    }
    return;
  }
  if (currentScreen === "vocab-settings") {
    if (event.key === "Enter") { els.vocabBeginBtn.click(); return; }
    if (event.key === "Escape") { els.vocabBackBtn.click(); return; }
    return;
  }
  if (currentScreen === "verb-settings") {
    if (event.key === "Enter") { els.verbBeginBtn.click(); return; }
    if (event.key === "Escape") { els.verbBackBtn.click(); return; }
    return;
  }
  if (currentScreen === "game") {
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); submitAnswer(); return; }
    if (event.key === "Tab") { event.preventDefault(); requestSkip(); return; }
    if (event.key === "Escape") { event.preventDefault(); audio.playClick(); openQuitModal(); return; }
    return;
  }
  if (currentScreen === "score") {
    if (event.key === "Enter") { els.replayBtn.click(); return; }
    if (event.key === "Escape") { els.restartBtn.click(); return; }
    return;
  }
  if (currentScreen === "high-scores") {
    if (event.key === "Escape" || event.key === "Enter") { els.highScoresBackBtn.click(); }
    return;
  }
  if (currentScreen === "help") {
    if (event.key === "Escape" || event.key === "Enter") { els.helpBackBtn.click(); }
    return;
  }
  if (currentScreen === "settings") {
    if (event.key === "Escape") { els.settingsBackBtn.click(); }
    return;
  }
  if (currentScreen === "name-entry") {
    // Enter is handled on the input itself (see above).
    if (event.key === "Escape") { els.nameCancelBtn.click(); }
    return;
  }
});

// ---------- Boot ----------

applyDarkMode();
showScreen("title");
