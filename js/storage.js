// localStorage persistence. No backend, no accounts, no analytics. Every
// access is wrapped: private-mode browsers throw on localStorage, and the
// game has to keep working with persistence unavailable.
//
// Key names are unchanged from the original single-file build so existing
// players don't lose their saved name, theme, or high scores on this rebuild.

const DARK_MODE_KEY = "wordjiDarkMode";
const USER_NAME_KEY = "wordjiUserName";
const VOCAB_HIGH_SCORE_KEY = "wordjiHighScores";
const VERB_HIGH_SCORE_KEY = "wordjiVerbHighScores";
const NAME_MAX_LENGTH = 20;

function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readJSON(key, fallback) {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
}

// ---------- Dark mode ----------

export function loadDarkMode() {
  return readRaw(DARK_MODE_KEY) === "1";
}

export function saveDarkMode(isDark) {
  writeRaw(DARK_MODE_KEY, isDark ? "1" : "0");
}

// ---------- User name ----------

export const MAX_NAME_LENGTH = NAME_MAX_LENGTH;

export function loadUserName() {
  return readRaw(USER_NAME_KEY) || null;
}

export function saveUserName(name) {
  writeRaw(USER_NAME_KEY, name);
}

// ---------- High scores ----------
// Vocab bucket is keyed `difficulty_language_roundLength`. Verb bucket uses a
// separate key scheme scoped only by translate-first x round length — the
// checkbox settings are too combinatorial to bucket exactly the way vocab
// buckets by difficulty x language x length.

// The round-length segment of a bucket key. A timed round stays a bare number
// so scores saved before word-count and unlimited rounds existed still land in
// the same bucket; the newer types get their own suffixed segments.
export function roundKeyPart({ roundType, duration, wordCount }) {
  if (roundType === "unlimited") return "unlimited";
  if (roundType === "count") return `${wordCount}w`;
  return String(duration);
}

export function vocabHighScoreKey(settings) {
  return `${settings.difficulty}_${settings.language}_${roundKeyPart(settings)}`;
}

export function verbHighScoreKey(settings) {
  return `${settings.translateFirst ? "translate" : "notranslate"}_${roundKeyPart(settings)}`;
}

export function loadVocabHighScores() {
  return readJSON(VOCAB_HIGH_SCORE_KEY, {});
}

export function loadVerbHighScores() {
  return readJSON(VERB_HIGH_SCORE_KEY, {});
}

function getHighScore(scores, key) {
  return scores[key] || 0;
}

export function getVocabHighScore(settings) {
  return getHighScore(loadVocabHighScores(), vocabHighScoreKey(settings));
}

export function getVerbHighScore(settings) {
  return getHighScore(loadVerbHighScores(), verbHighScoreKey(settings));
}

// Returns true if this score set a new high score for its bucket.
export function recordVocabHighScore(settings, score) {
  const scores = loadVocabHighScores();
  const key = vocabHighScoreKey(settings);
  const prevBest = scores[key] || 0;
  if (score <= prevBest) return false;
  scores[key] = score;
  writeRaw(VOCAB_HIGH_SCORE_KEY, JSON.stringify(scores));
  return true;
}

export function recordVerbHighScore(settings, score) {
  const scores = loadVerbHighScores();
  const key = verbHighScoreKey(settings);
  const prevBest = scores[key] || 0;
  if (score <= prevBest) return false;
  scores[key] = score;
  writeRaw(VERB_HIGH_SCORE_KEY, JSON.stringify(scores));
  return true;
}

export function clearAllHighScores() {
  writeRaw(VOCAB_HIGH_SCORE_KEY, JSON.stringify({}));
  writeRaw(VERB_HIGH_SCORE_KEY, JSON.stringify({}));
}
