# Mila iOS 1.0 upload-and-submit checklist

This list starts only after the checked-in release packet passes
`scripts/verify-ios-app-store-release.sh`. It deliberately separates work that
is complete in the repo from actions that require an authenticated App Store
Connect account or a physical iPhone.

## Repo-side release packet — complete

- [x] Bundle ID, team, version, build, deployment target, production origin,
  microphone copy, and export-compliance key are fixed in the Xcode project.
- [x] Privacy manifest declares the five retained data types, linked status,
  no tracking, App Functionality, and applicable Product Personalization.
- [x] Final English (U.S.) metadata is available as plain text in
  [`app-store-connect/`](app-store-connect/).
- [x] App Review notes give an account-free test path, voice steps, permanent
  deletion path, web-view boundary, network needs, and data-retention summary.
- [x] App Privacy answers are mapped field-by-field in
  [`app-privacy-answers.md`](app-privacy-answers.md).
- [x] Age-rating, content-rights, pricing, tax, availability, and release
  selections are mapped in [`metadata.md`](metadata.md).
- [x] Five 6.9-inch screenshots are ordered and meet Apple's pixel and alpha
  requirements.
- [x] Public privacy and support pages and live reviewer screenshots exist.
- [x] A locally exported Apple Distribution IPA exists and can be preflighted.

## Manual blockers that cannot be completed from the repo

- [ ] On a physical iPhone, verify microphone allow, deny, retry, transcription,
  tutor reply, TTS playback, registered-account deletion, and guest deletion.
- [ ] Confirm the App Store review contact phone number.
- [ ] Complete or confirm the Apple account's Digital Services Act trader status
  and any agreements required for the selected territories.
- [ ] Sign in to App Store Connect with password and two-factor authentication,
  or supply an App Store Connect API key with sufficient access.

Do not submit before these four items are resolved. The physical-device item is
a product release gate even though App Store Connect will not enforce it.

## Straight upload-and-submit sequence

1. Run the local preflight from the release checkout:

   ```bash
   ./scripts/verify-ios-app-store-release.sh ios/build/export/Mila.ipa
   ```

2. Create the iOS app record using the **New app record** table in
   [`metadata.md`](metadata.md). Record the generated Apple app ID.
3. Validate and upload `ios/build/export/Mila.ipa` with the commands in
   [`../../IOS_APP_STORE_RELEASE_RUNBOOK.md`](../../IOS_APP_STORE_RELEASE_RUNBOOK.md),
   then wait for processing to finish. Record the delivery and build IDs.
4. In **App Information**, paste the shared fields, finish Content Rights and
   Age Rating, and keep Apple's standard EULA.
5. In **Pricing and Availability**, choose Free, App Store software, the
   eligible public territories, no pre-order, and automatic release after
   approval.
6. In the iOS 1.0 version, paste the English (U.S.) text files, upload the five
   screenshots in numbered order, enter copyright, and attach the processed
   build.
7. In **App Review Information**, choose no sign-in requirement, paste
   [`review_notes.txt`](app-store-connect/review_notes.txt), and enter the
   reachable contact phone number.
8. In **App Privacy**, enter and **publish** every answer from
   [`app-privacy-answers.md`](app-privacy-answers.md). Verify the preview has no
   tracking section.
9. Resolve any export-compliance prompt using the exempt operating-system HTTPS
   answer recorded in [`metadata.md`](metadata.md).
10. Click **Add for Review**, open the draft submission, and click **Submit for
    Review**. `Ready for Review` is not submitted.
11. Verify and record both authoritative states:

    ```text
    review submission = WAITING_FOR_REVIEW
    app version       = WAITING_FOR_REVIEW
    ```

12. Fill every pending Apple identifier and UTC timestamp in
    `PROJECT_LEDGER.md`.

## Stop conditions

Stop rather than guessing if the processed build reports a different bundle ID,
version, build, signing team, privacy manifest, or minimum iOS than the release
manifest. Stop if the App Privacy preview shows tracking or omits a declared
data category. Stop if either final state remains `READY_FOR_REVIEW`.
