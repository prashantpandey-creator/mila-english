# Mila 1.0 App Privacy answers

These answers describe the shipping iOS app and its first-party service. They
also match `ios/Mila/Resources/PrivacyInfo.xcprivacy`.

## Privacy links and top-level answer

| App Store Connect question | Answer |
|---|---|
| Privacy Policy URL | `https://mila.purangpt.com/privacy` |
| User Privacy Choices URL | `https://mila.purangpt.com/privacy` |
| Do you or your third-party partners collect data from this app? | Yes |
| Is any data used to track users? | No |

## Select these five data types

For every selected data type, answer **Yes, linked to the user's identity** and
**No, not used for tracking**.

| App Store data type | What Mila retains | Purposes to select |
|---|---|---|
| Name | Name entered during optional registration | App Functionality; Product Personalization |
| Email Address | Registered email address | App Functionality |
| User ID | Internal registered-account or isolated-guest identifier | App Functionality; Product Personalization |
| Other User Content | Chat messages, voice transcripts, tutor replies, and facts the learner explicitly asks Mila to remember | App Functionality; Product Personalization |
| Product Interaction | Lesson progress, answers, scores, vocabulary reviews, assessments, pronunciation measures, and study streaks | App Functionality; Product Personalization |

Do not select Analytics, Developer's Advertising or Marketing, Third-Party
Advertising, or Other Purposes for any of these data types.

## Do not select these data types

- **Audio Data:** a recording is transmitted only after the learner taps the
  microphone, processed to service that transcription request, and deleted
  after the request. The resulting transcript is retained and is already
  declared as Other User Content.
- **Device ID, Precise Location, Coarse Location, Browsing History, Search
  History, Purchases, Advertising Data, Crash Data, Performance Data, and Other
  Diagnostic Data:** the shipping native app does not retain these data types
  or include an advertising, tracking, analytics, or crash-reporting SDK.
- **Customer Support:** the in-app support link opens an optional email composed
  by the learner outside Mila. It is not an ongoing part of the app's primary
  data collection.

Free-form chat can contain information the learner chooses to type, but Apple
maps a generic free-form field to Other User Content; do not attempt to select
every possible category a learner could mention.

## Nutrition-label preview expected

The preview should show **Data Linked to You** for Contact Info, User Content,
Identifiers, and Usage Data. It should show no **Data Used to Track You**
section. Publish the answers and capture the publication summary in
`PROJECT_LEDGER.md`.

## Source behavior checked

- A clean install creates an isolated guest with an internal placeholder email.
- Optional registration retains name and email; passwords are stored only as a
  one-way hash.
- Chat and voice transcripts are associated with the learner's private thread.
- Learning and progress records are associated with the learner profile.
- The iOS app sends audio only to Mila's first-party origin; the transcription
  route forwards it to Mila's speech service and does not persist the audio.
- Permanent deletion removes the profile and associated progress, assessments,
  vocabulary reviews, chat history, and saved memories.
- The iOS app contains no advertising or cross-app tracking SDK.
