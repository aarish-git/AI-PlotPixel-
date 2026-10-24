# PlotPixel AI Video Studio

React video-editor prototype with a dark theme, prompt workspace, video preview and timeline, visual effects, consent-gated face-reference tools, local project storage, and optional Android fingerprint locking.

## Run the web app

```bash
npm install
npm run dev
```

The Firebase Web app settings you supplied are already in the local, Git-ignored `.env`; `.env.example` documents the required variables for another checkout. Google sign-in uses Firebase Authentication. Enable the Google provider in Firebase Authentication and add your local and production website origins to its authorized domains.

Without Firebase Web settings, Google sign-in reports that it is not configured; it does not fake a successful login.

## Build the Android app

The Android app ID is `app.PlotPixel.com`, matching the Firebase Android app configuration you supplied. The supplied `google-services.json` is installed locally and ignored by Git. Enable the Google provider in Firebase Authentication and add your debug/release signing certificate SHA-1 and SHA-256 fingerprints; re-download the Android config from Firebase if a matching Android OAuth client is not listed.

```bash
npm run android:sync
npm run android:open
```

Build and run the native app from Android Studio. Google sign-in uses Firebase's native Android authentication flow. Android's fingerprint-lock switch appears only when the device has an enrolled, available fingerprint. Enabling and disabling it require fingerprint verification. When enabled, the app asks for authentication at launch and on return from the background; Android's system credential fallback is available to prevent lockout.

## Video size and duration

PlotPixel does not set a maximum duration or file size for local video imports. The sequence duration can be edited without an app-defined upper limit, and imported video duration is read from the media file. Actual playback and storage are still subject to browser, device memory, filesystem, and codec support. AI generation and rendered export are not connected, so any limits imposed by a future AI/rendering provider will depend on that provider.

Project metadata is saved in the current browser/device. Google sign-in is configured for authentication; cloud project syncing and video uploads still require a storage backend and are not implied by signing in.

## Development scripts

- `npm run dev` — web development server
- `npm run build` — production web build
- `npm run android:sync` — build web assets and sync Capacitor plugins to Android
- `npm run android:open` — open the Android project in Android Studio
