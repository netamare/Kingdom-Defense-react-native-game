# Kingdom Defense

A mobile tower defense game built with React Native, TypeScript, and Expo. The battlefield uses `react-native-svg`; progress and settings are stored locally with AsyncStorage.

## Requirements

- Node.js LTS and npm
- Android Studio with an Android emulator, or an Android phone with Expo Go

## Install

From the project directory, install the dependencies:

```bash
npm install
```

## Run with Expo

Start the development server:

```bash
npx expo start
```

Then:

- Press `a` in the terminal to launch the Android emulator, or
- Scan the QR code with Expo Go on an Android phone. Ensure the phone and development computer are on the same network.

To start directly on Android, use:

```bash
npm run android
```

## Gameplay

Use **Play** to continue the current defense, or open **Levels** to choose an unlocked map. During a battle, select a tower card and tap a clear patch of ground to place it. Tap a placed tower to inspect its stats and upgrade it. The battlefield controls pause/resume, change speed, and restart the campaign.

Campaign progress, achievements, settings, and the current battle are saved locally on the device.

## Core mechanics tests

Run the headless battle-engine test suite with Node.js 24 or later:

```bash
npm run test:engine
```

The tests cover movement, target selection, projectile impacts, armor and special attacks, placement, upgrades, rewards, boss waves, escapes, and wave completion.

## Build an Android APK

After installing dependencies and signing in to Expo Application Services, build the internal preview APK with:

```bash
npx eas-cli build --platform android --profile preview
```

The `preview` profile in `eas.json` produces an installable APK. The `production` profile produces an Android App Bundle.
