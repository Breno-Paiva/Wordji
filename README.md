# Wordji

A browser vocabulary and verb-conjugation drill. Translate everyday words
between English and Portuguese, or conjugate Portuguese verbs across
pronouns and tenses — against the clock.

Part of the [Fantastic App Suite](https://brenopaiva.com/) alongside
[Funky Dancer](https://brenopaiva.com/FunkyDancer/),
[Codji](https://brenopaiva.com/Codji/) and
[Chordji](https://brenopaiva.com/Chordji/).

**Play it:** https://brenopaiva.com/Wordji/

## Modes

| Mode | Prompt | You do |
|---|---|---|
| **Vocabulário** | An English or Portuguese word, by difficulty | Type the translation, one letter box per letter |
| **Verbos** | A pronoun, a verb, and a tense | Type the conjugated form in a single wide box |

Vocabulário's difficulty (Turista / Morador / Nativo) picks the word pool
and the translation direction (English → Português or the reverse).
Verbos is driven directly by checkboxes instead of a difficulty tier —
which tenses and which pronouns are in play — plus an optional
"translate verb first" step that asks for the verb's English gloss before
its conjugated form, scoped by its own separate difficulty control.

Every prompt gets **3 tries**; the third miss reveals the answer. `Tab`
skips a prompt outright. Score is simply how many you resolve correctly.

## Round length

Both modes offer the same three ways to end a round:

| Type | Ends when | Clock |
|---|---|---|
| **⏱️ Timed** | 10, 30 or 60 seconds are up | Counts down |
| **🔢 Words** | 10, 25 or 50 wordjis have been resolved | Counts up |
| **♾️ Unlimited** | You quit | Counts up |

**Quit** (or `Esc`) ends any round early and goes straight to the score.
What you scored still counts — quitting can only ever lower it — which is
also what makes Unlimited scoreable at all. The clock stops while the
confirmation is up, so deciding costs nothing.

The result tier is a words-per-second bar measured over the time actually
played, so it reads the same whether the round was 10 seconds, 50 words or
an open-ended session cut short. Each tier draws from six rotating
messages, never repeating the one the previous round showed:

| Tier | Rate | Roughly |
|---|---|---|
| 🔥 | ≥ 0.50 w/s | A word every 2s — fast and accurate |
| 👏 | ≥ 0.25 w/s | A word every 4s — steady |
| 💪 | ≥ 0.12 w/s | A word every 8s — still learning |
| 🌱 | below | Just getting started |

Thresholds are calibrated against measured play rather than guessed: a
very fast round runs ~1.7s per word, an ordinary one ~2.5s, a learner's
4–6s. Every correct answer also costs a fixed 600ms result pause, which
caps the ceiling near 1.67 w/s even with instant typing — so the top tier
has to sit well under that to be reachable at all.

## Controls

`Enter` or `Space` submits, `Tab` skips, `Esc` quits. **Skip** and **Quit**
also sit as buttons at either end of the play header — a phone keyboard has
neither `Tab` nor `Esc`. They're kept at opposite ends deliberately: Skip
gets pressed every few seconds, Quit ends the round.

Typing goes into an offscreen input so the on-screen letter boxes stay
purely visual (and so a phone's keyboard pops up automatically). Tapping
Skip doesn't take focus off that input, since a phone won't reopen its
keyboard for a focus restored after the fact. Answers are matched
accent-insensitively — `ferias` and `férias` both count.

## Persistence

`localStorage` only — no accounts, no analytics, no shared leaderboard:
your display name, your light/dark preference, and your best score per
settings combination. Vocabulário's best is keyed by
difficulty × language × round length; Verbos' by translate-first ×
round length, since the tense/pronoun checkboxes are too combinatorial to
bucket exactly. The round-length segment of a key is a bare number for a
timed round (`easy_en_30`), suffixed for the newer types (`easy_en_25w`,
`easy_en_unlimited`) — so scores saved before word-count and unlimited
rounds existed still land in the same buckets. Every access is wrapped in
`try`/`catch` — private-mode browsers throw on `localStorage`, and the
game runs fine without it.

## Visual design

Skinned to match brenopaiva.com, the same system [Chordji](https://brenopaiva.com/Chordji/)
uses: `VT323` for display type, `Share Tech Mono` for body text, and the
portfolio's own color tokens copied verbatim into `css/styles.css` (Wordji
is a separate repo and doesn't depend on the portfolio's `main.css`). The
one deliberate divergence from Chordji is that Wordji keeps its own
light/dark toggle — real, pre-existing functionality — by giving only the
page backdrop and the nav/header/footer bands a dark variant; every panel,
button and letter box keeps the exact same color in both themes.

## Structure

No framework, no build step, no backend. Plain static files and vanilla ES
modules; hosting is just serving the repo.

```
index.html
css/styles.css
js/
  main.js       bootstrap, screen routing, keyboard shortcuts
  game.js       round state machine: advancing, scoring, answer checking
  generator.js  pool/queue construction, accent-insensitive matching
  data.js       word bank, verb bank, and every option/label constant
  audio.js      synthesized sound effects (Web Audio API, no audio files)
  input.js      the letter-box answer component
  ui.js         DOM rendering helpers (answers list, high scores, popup)
  storage.js    localStorage
images/         favicons, OG image
```

[`js/data.js`](js/data.js) is pure data — no DOM, no logic — and
[`js/generator.js`](js/generator.js) and [`js/game.js`](js/game.js) are
pure functions over it, no DOM either; `main.js` is the only module that
touches the page.

## Development

Any static server works; ES modules need HTTP rather than `file://`:

```sh
python3 -m http.server 8765
```

Then open http://localhost:8765/. All asset paths are relative, so the
game works both at the domain root and under the `/Wordji/` subpath it
ships on.
