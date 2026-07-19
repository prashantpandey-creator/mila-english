# Mila iOS App Store release runbook

This is the app-specific witness and repeatable release procedure for Mila. It
inherits the proven PuranGPT release gate: an upload is not a submission.

## Definition of done

The release is complete only when:

- the signed IPA is accepted and the build finishes processing;
- version metadata, screenshots, pricing, availability, age rating, review
  details, and build relationship are complete;
- App Privacy answers match Mila's real account, chat, progress, transcript,
  and transient-audio behavior and are published;
- the App Review submission is `WAITING_FOR_REVIEW`;
- the App Store version is `WAITING_FOR_REVIEW`;
- all Apple resource IDs and timestamps are recorded in `PROJECT_LEDGER.md`.

`READY_FOR_REVIEW` is still a draft state.

## Checked-in submission packet

Do not reconstruct App Store Connect answers from chat history. Use the 1.0
packet checked into [`docs/app-store-assets/1.0/`](app-store-assets/1.0/metadata.md):

- [`metadata.md`](app-store-assets/1.0/metadata.md) — new app record, shared app
  information, version fields, screenshot order, pricing, content rights, age
  rating, and export-compliance wording;
- [`app-privacy-answers.md`](app-store-assets/1.0/app-privacy-answers.md) — exact
  retained data types, linked status, purposes, and tracking answers;
- [`app-store-connect/review_notes.txt`](app-store-assets/1.0/app-store-connect/review_notes.txt)
  — final plain-text App Review notes;
- [`submission-checklist.md`](app-store-assets/1.0/submission-checklist.md) — the
  straight upload-and-submit sequence and the few manual gates that remain;
- [`release-manifest.json`](app-store-assets/1.0/release-manifest.json) — fixed
  build identity, URLs, screenshot files, artifact checksum, and pending Apple
  resource IDs.

Run the repo preflight after every re-export. A stale IPA whose embedded privacy
manifest differs from the checked-in answer sheet must not be uploaded.

## Release manifest

```bash
export APP_NAME="Mila: English Speaking"
export BUNDLE_ID="com.purangpt.mila"
export VERSION="1.0"
export BUILD_NUMBER="1"
export XCODE_PROJECT="$PWD/ios/Mila.xcodeproj"
export XCODE_SCHEME="Mila"
export ARCHIVE_PATH="$PWD/ios/build/Mila.xcarchive"
export EXPORT_PATH="$PWD/ios/build/export"
export IPA_PATH="$EXPORT_PATH/Mila.ipa"
export PRIVACY_POLICY_URL="https://mila.purangpt.com/privacy"
export SUPPORT_URL="https://mila.purangpt.com/support"
```

Set `ASC_APP_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, and `ASC_PRIVATE_KEY` from the
current Apple account. Never commit the private key, JWT, cookies, password, or
recovery codes.

## Product and policy gate

1. Verify the native Home, Learn, Speak, Chat, Progress, and Account surfaces.
2. Verify a clean install can create an isolated guest without credentials.
3. On a physical iPhone, test microphone allow/deny/retry, private
   transcription, chat, TTS playback, account deletion, and guest deletion.
4. Confirm the web privacy and support URLs are publicly reachable.
5. Confirm the App Privacy answers include retained email/account data,
   learning/progress data, chat and transcript content, and any enabled model
   provider. Mila audio is transient and deleted after transcription.
6. Keep the reviewer path account-free; provide a demo account only if Apple
   needs to verify cross-device account behavior.

## Generate, archive, and export

```bash
cd ios
xcodegen generate --spec project.yml
cd ..

xcodebuild \
  -project "$XCODE_PROJECT" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  clean archive

xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$PWD/ios/ExportOptions.plist" \
  -allowProvisioningUpdates
```

Inspect the archive bundle ID, version, build, signing team, privacy manifest,
permission copy, and lack of development URLs before upload.

## Repo preflight

```bash
./scripts/verify-ios-app-store-release.sh "$IPA_PATH"
```

This is the local release gate. It checks App Store text limits, screenshot
format, public privacy/support URLs, source and embedded privacy manifests,
Apple Distribution signing, the bundle/version/build/team/minimum-iOS values,
production-only networking, export compliance, and the SHA-256 recorded in the
release manifest.

## Validate and upload

```bash
xcrun altool --validate-app "$IPA_PATH" \
  --api-key "$ASC_KEY_ID" \
  --api-issuer "$ASC_ISSUER_ID" \
  --p8-file-path "$ASC_PRIVATE_KEY"

xcrun altool --upload-app -f "$IPA_PATH" \
  --api-key "$ASC_KEY_ID" \
  --api-issuer "$ASC_ISSUER_ID" \
  --p8-file-path "$ASC_PRIVATE_KEY"
```

Wait for build processing. Record the delivery ID and build resource ID.

## Store record and submission

Create the app record in App Store Connect before upload. Confirm the name,
bundle ID, primary language, SKU, categories, content rights, age rating, free
price, availability, version localization, screenshots, review notes, contact,
and export compliance using the checked-in answer sheet. Publish App Privacy
rather than leaving it as a draft. The App Review contact phone number and the
account-level Digital Services Act trader status cannot be inferred from the
repo and must be confirmed by the owner.

Create or reuse one draft review submission, attach the intended version, and
submit it. Then read the two authoritative resources through the App Store
Connect API. Done means:

```text
review submission = WAITING_FOR_REVIEW
app version       = WAITING_FOR_REVIEW
```

## Evidence to record

```text
Apple app ID:
Bundle ID resource ID:
App Store version ID:
Build ID and processing state:
Upload/delivery ID:
Review submission ID:
Submitted timestamp UTC:
Verified submission state:
Verified version state:
Privacy publication summary:
Screenshot devices:
Physical-device tests:
App Review contact phone confirmed:
DSA trader status and eligible territories confirmed:
Release manifest IPA SHA-256:
Warnings or follow-ups:
```
