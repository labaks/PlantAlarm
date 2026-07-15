<p align="center"><img src="docs/icon.png" alt="Plant Alarm" width="96"></p>

# Plant Alarm

**English | [Русский](README.md)**

A small Windows widget and Android app for plant-watering reminders — synced between your phone and desktop over the local network.

**[→ Project site](https://labaks.github.io/PlantAlarm/en/)**

<p align="center">
  <img src="docs/screenshots/desktop.png" alt="Desktop widget" height="380">
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/mobile.png" alt="Android app" height="380">
</p>

## What it is

Plant Alarm is two separate but compatible apps:

- **Desktop widget** (WPF, .NET 7) — always in view, stays on top of other windows, shows your plant list and droplet indicators for when it's time to water.
- **Mobile app** (React Native / Expo, Android) — the same thing in your pocket, with push notifications.

Both keep their data independently, but can sync with each other over the local Wi-Fi network — no cloud, no accounts.

## Features

- A per-plant watering interval; the droplet shows how much "water" is left until the next watering, gradually emptying as the due date approaches.
- The "Water" button works at any time — watering early just prompts a confirmation instead of being blocked.
- The last-watered date can be corrected both when adding a plant and later while editing it.
- Push notifications on the phone when it's time to water.
- Temporary phone ↔ desktop sync over the local network (two-way merge of changes, including deletions).
- Russian and English interface (switchable in settings, no restart needed).

The full changelog is in [CHANGELOG.md](CHANGELOG.md); the roadmap is in [TODO.md](TODO.md).

## Download

Ready-to-run builds are on the **[Releases](https://github.com/labaks/PlantAlarm/releases)** page:

- Desktop (Windows) — `.exe`, no .NET install required.
- Mobile (Android) — `.apk`.

## Tech stack

- Desktop: C#, WPF, .NET 7
- Mobile: React Native, Expo, TypeScript
- Sync: an HTTP server on the desktop + the phone polling it periodically over the local network
