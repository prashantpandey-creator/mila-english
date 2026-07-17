# Mila iOS

Mila is a native SwiftUI iPhone app backed by the production service at
`https://mila.purangpt.com`. It is not a full-screen website wrapper.

Native surfaces include:

- isolated guest bootstrap and optional account sign-in/registration;
- offline pocket phrases, vocabulary, and lesson reading;
- streaming Mila tutor chat;
- microphone recording, private transcription, controlled voice reply, and
  Piper neural voice playback;
- learner progress and pronunciation focus;
- in-app account and guest-data deletion.

The full web level check, listening lab, and grammar module are presented as
focused deep modules from the native home screen.

## Generate and build

```bash
cd ios
xcodegen generate --spec project.yml
xcodebuild \
  -project Mila.xcodeproj \
  -scheme Mila \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build/DerivedData \
  CODE_SIGNING_ALLOWED=NO \
  build
```

## Release manifest

```text
App Store name: Mila: English Speaking
Display name: Mila
Bundle ID: com.purangpt.mila
Version / build: 1.0 (1)
Team: 8U3RHGA83G
Platform: iPhone
Minimum iOS: 16.0
Production origin: https://mila.purangpt.com
Privacy URL: https://mila.purangpt.com/privacy
Support URL: https://mila.purangpt.com/support
```

The project file is generated from `project.yml`. Change the YAML first, then
regenerate; do not hand-edit the `.xcodeproj` as the source of truth.
