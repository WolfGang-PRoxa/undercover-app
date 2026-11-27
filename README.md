# Undercover

[Français](README.fr.md)

Undercover is a party game for the iOS **[Scriptable](https://scriptable.app)** app. Everyone gets a secret word: the Civilians share the same word, the Undercovers get a close but different one, and Mr. White gets no word at all. Players describe their word in turn, then vote to eliminate whoever they suspect. The script handles the whole game for you:

- drawing a group of related words and assigning the roles (Civilian, Undercover, Mr. White);
- handing out the words on screen (pass the phone around) or by SMS;
- speaking order, eliminations, Mr. White's last guess and victory conditions;
- a player leaderboard with points and per-role statistics;
- downloadable word lists, plus your own lists;
- a text log of every game.

The game exists in English (`undercover_en.js`) and in French (`undercover_fr.js`).

## Installation

1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) on your iPhone or iPad.
2. In Scriptable, create a new script, name it `Installer Undercover` and paste the content of [`undercover_installer_en.js`](undercover_installer_en.js) (or [`undercover_installer_fr.js`](undercover_installer_fr.js) for the French version).
3. Run it: it downloads the game from the `main` branch of this repository, saves it as the `Undercover_en` script (`Undercover_fr` in French) and offers to launch it.

On first launch, the game creates its data folder and downloads the official word lists.

## Updating

- **Game**: run `Installer Undercover` again. It downloads the latest version and replaces the script.
- **Word lists**: in the game, *Advanced settings > Change word list > Update official lists*.

## Data location

Data is stored in `Scriptable/Undercover/`, on **iCloud Drive** when available (synchronized between your devices), otherwise *On My iPhone*. You can open it from the Files app.

| Path | Content |
| --- | --- |
| `players.json` | Player profiles, cumulative scores and per-role statistics (`played`, `won`, `lost`) |
| `config.json` | Debug mode and session settings (role or nickname in SMS, active word list) |
| `lists/` | Official lists downloaded from the repository and your own lists |
| `lists/*__used_words.json` | Word groups already played with each list |
| `logs/` | One text log per game, also available in the *Game history* screen |

### Word lists

Word lists are JSON files made of groups of 4 to 5 related words:

```json
[
  ["Word A", "Word B", "Word C", "Word D"],
  ["Dog", "Cat", "Wolf", "Fox"]
]
```

The legacy pair format (`[{ "civil": "...", "undercover": "..." }]`) is still supported.

At each game, a group that has **never been played** with the active list is drawn at random: two of its words become the Civilians' and the Undercovers' words, and the whole group is marked as used. When every group has been played, the game offers to reset the list (also available in *Advanced settings > Reset used words*).

Official lists live in the [`lists/`](lists) folder and are referenced in [`lists/index.json`](lists/index.json):

| File | Content |
| --- | --- |
| `default_en.json` / `default_fr.json` | Default list (50 groups), also embedded in the script |
| `pop_culture_en.json` / `culture_pop_fr.json` | Pop culture: movies, series, video games, brands... (64 groups) |

To use your own list, drop a `.json` file in `Scriptable/Undercover/lists/` and select it in *Advanced settings > Change word list*. To publish a new official list, add the file to `lists/` and its name to `lists/index.json`.

## How it works

Each script is a single-page application inside one Scriptable `UITable`:

- `main()` runs an endless loop around `startApp()`, which shows the interface and resolves a `Promise` when the user launches a game or quits.
- `render()` clears the table and rebuilds the current view (`appState.view`: main menu, leaderboard, game in progress, rules...).
- `sessionConfig` holds the persistent preferences; `appState` holds the players (saved in `players.json`) and the current game.
- `launchGame()` computes the number of Undercovers (25% of the players rounded up, or a manual value) and Mr. White, draws a group with `pickPair()`, assigns the roles with `assignRoles()` and builds the speaking order with `buildTurnOrder()` (Mr. White never speaks first).
- `executeElimination()` removes a player, lets Mr. White guess the Civilians' word and checks the victory conditions: no Undercover or Mr. White left means the Civilians win; only one Civilian left means the Undercovers and Mr. White win.
- `computeEndGameStats()` updates the statistics and awards points to the winners: `+2` per Civilian, `+10` per Undercover, `+6` for Mr. White.

## Development

The scripts run in Scriptable; Node.js (version 22) is only used for development tools.

```sh
npm install      # install the development tools
npm test         # run the tests (fake Scriptable environment in tests/)
npm run format   # format the code with Prettier
npm run lint     # check the code with ESLint
npm run check    # Prettier check + ESLint, as in CI
```

Work happens on the `dev` branch. The installers read `main`, so only tested versions are merged into it. The version is the `APP_VERSION` constant at the top of each script (`X.Y.Z` format) and changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © 2026 WolfGang-PRoxa
