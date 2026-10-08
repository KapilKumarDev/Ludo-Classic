# Ludo

A static, dependency-free Ludo game: vs the computer, or pass-and-play for 2–4 players (teams at four).
Open `index.html` in a browser, or serve the folder with any static server.

## Layout

| Page | Script | Role |
|---|---|---|
| `index.html` | `home.js` | pick a mode |
| `setup.html` | `setup.js` | players, names, colour, teams |
| `game.html` | `game.js` | the board |
| `settings.html` | `settings.js` | piece style |

Scripts are classic (not modules) and share one `Ludo` namespace, so the game also runs from `file://`.
Each page lists the scripts it needs, in load order.

| File | Owns |
|---|---|
| `constants.js` | board geometry, timings, config. Everything else derives from it |
| `storage.js` | saving, loading and validating state and settings |
| `state.js` | setup config and `Ludo.newGame()` |
| `game-state.js` | queries over the running game |
| `rules.js` | the rules, as pure logic |
| `ai.js` | how the computer chooses a move |
| `board.js` | drawing the board and placing/walking pieces |
| `hud.js` | turn title, dice, winner overlay |
| `turn.js` | roll → move → end turn |

CSS: `base.css` is shared; each page adds its own sheet.

## Conventions

- `piece.steps`: `Ludo.IN_YARD` (-1), `0…HOME_ENTRY_STEP-1` on the shared ring, up to `FINISH_STEPS` (home).
- `state.roll`: `null` before a roll, `0` for a forfeited third six, otherwise the face.
- `Ludo.busy` is true while a roll or move plays out; input is ignored then. Games are saved only between moves.
- Bump `Ludo.STATE_KEY` when the saved-game shape changes.
- No inline styles in markup. JS sets only per-element values (`--x`, `--y`, seat order) through the CSSOM.

## Tests

```
node --test "tests/*.test.js"
```

Runs the game's own scripts in a bare Node context: rules, captures, computer choices, setup, saved-game validation,
and 200 simulated games. Needs Node 20+; no install step.

## Deploying

Each page carries a Content-Security-Policy `<meta>`. `frame-ancestors` cannot be set that way, so send
`Content-Security-Policy: frame-ancestors 'none'` (and `X-Content-Type-Options: nosniff`) from the server if you host it.