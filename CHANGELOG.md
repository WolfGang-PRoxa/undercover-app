# Changelog

[Français](CHANGELOG.fr.md)

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions use the `X.Y.Z` format.

## [Unreleased]

### Changed

- Version in `X.Y.Z` format (`APP_VERSION = "1.2.0"`).

## [1.2.0] - 2026-11-21

### Fixed

- Updated the repository URL (formerly undercover-scriptable).

## [1.1.0] - 2026-10-24

### Added

- A log of every game in `Scriptable/Undercover/logs/` and a "Game history" screen.
- "Pop culture" word list (`culture_pop_fr.json`, `pop_culture_en.json`).
- `lists/index.json` and an "Update official lists" button.
- "Reset used words" and the number of remaining groups per list.

### Fixed

- **Word draw**: the active list was never present on the device (not downloaded in FR, wrong URL in EN), so the game fell back to a 2-group backup list (Cat/Dog/Wolf/Fox and Sun/Moon/Star/Planet). The built-in list now embeds the full default list and the official lists are downloaded automatically.
- Unbiased word shuffle (Fisher-Yates instead of a random sort).
- A word group that has already been played can no longer come out again; when the whitelist is exhausted, the game says so and offers to reset it instead of silently clearing it.
- Duplicate words between two groups of the default lists.
- On-screen distribution: the word was shown right away. The game now announces who to hand the phone to and waits for their confirmation before showing the word.
- The title of the word window showed the role's emoji, revealing to each player whether they were a Civilian or an Undercover.
- Mr. White could speak first.
- A game could start with fewer than 2 Civilians, or with a negative number of Undercovers / Mr. White.
- iCloud files that were not downloaded were not awaited before reading.
- Installers' download URL.

## [1.0.0]

### Added

- Initial release.
