# Mila 1.0 App Store Connect metadata

This is the copy/paste answer sheet for the iOS 1.0 record. The field bodies
also live as plain text under [`app-store-connect/`](app-store-connect/) so the
submitter does not need to copy formatting characters from Markdown.

## New app record

| App Store Connect field | Value |
|---|---|
| Platforms | iOS |
| Name | `Mila: English Speaking` |
| Primary language | English (U.S.) |
| Bundle ID | `com.purangpt.mila` |
| SKU | `MILA-IOS-001` |
| User access | Full Access |

The Bundle ID is already registered to team `8U3RHGA83G`; its Apple resource
ID is `54MZM2T7K9`.

## Shared app information

| App Store Connect field | Value |
|---|---|
| Subtitle | `Private AI English coach` |
| Primary category | Education |
| Secondary category | Productivity |
| Content rights | No, the app does not contain, show, or access third-party content |
| License agreement | Apple's standard EULA |

The generated AI tutor reply is a first-party app feature, not user-to-user
content or a library of third-party media. Mila's embedded web modules are
fixed first-party routes on `mila.purangpt.com`.

## iOS version 1.0

| App Store Connect field | Value |
|---|---|
| Version | `1.0` |
| Copyright | `2026 Prashant Pandey` |
| Promotional text | [`promotional_text.txt`](app-store-connect/en-US/promotional_text.txt) |
| Description | [`description.txt`](app-store-connect/en-US/description.txt) |
| Keywords | [`keywords.txt`](app-store-connect/en-US/keywords.txt) |
| Support URL | `https://mila.purangpt.com/support` |
| Marketing URL | `https://mila.purangpt.com` |
| Privacy Policy URL | `https://mila.purangpt.com/privacy` |

The finalized name, subtitle, and URLs are also available as individual text
files in [`app-store-connect/en-US/`](app-store-connect/en-US/).

## Screenshots

Upload these five files, in this order, to the **6.9-inch iPhone** well:

1. [`01-home.png`](screenshots-6.9-inch/01-home.png)
2. [`02-learn.png`](screenshots-6.9-inch/02-learn.png)
3. [`03-speak.png`](screenshots-6.9-inch/03-speak.png)
4. [`04-progress.png`](screenshots-6.9-inch/04-progress.png)
5. [`05-live-tutor.png`](screenshots-6.9-inch/05-live-tutor.png)

All five are `1320 x 2868`, portrait PNG, without alpha. Because the target is
iPhone-only, no iPad screenshots are required.

## App Review information

| App Store Connect field | Value |
|---|---|
| Sign-in required | No |
| Demo username | Leave blank |
| Demo password | Leave blank |
| Contact first name | `Prashant` |
| Contact last name | `Pandey` |
| Contact email | `fcpuru95@gmail.com` |
| Contact phone | **Owner must enter a reachable phone number** |
| Notes | [`review_notes.txt`](app-store-connect/review_notes.txt) |
| Attachment | None required; live privacy/support proof remains in [`live-reviewer-proof/`](live-reviewer-proof/) |

## Pricing, availability, and release

| App Store Connect field | Recommended value |
|---|---|
| Price | Free |
| Tax category | App Store software |
| Distribution | Public |
| Availability | All countries or regions where the account is eligible |
| Pre-order | Off |
| Release setting | Automatically release after approval |
| Phased release | Not applicable to first release |

The account holder must finish any account-level agreements and Digital
Services Act trader-status declaration before EU availability can be confirmed.

## Age rating answer sheet

Answer against the shipping iOS app, not against arbitrary topics a learner
might type into a free-form tutor prompt.

| Questionnaire item | Answer |
|---|---|
| Parental Controls | No |
| Age Assurance | No |
| Unrestricted Web Access | No |
| User-Generated Content | No |
| Social Media | No |
| Social Media Disabled for Users Under 13 | No |
| Messaging and Chat | No; the learner communicates with an AI tutor, not another user |
| Advertising | No |
| Profanity or Crude Humor | None |
| Horror/Fear Themes | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Medical or Treatment Information | None |
| Health or Wellness Topics | None |
| Mature or Suggestive Themes | None |
| Sexual Content or Nudity | None |
| Graphic Sexual Content and Nudity | None |
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Guns or Other Weapons | None |
| Gambling | No |
| Simulated Gambling | None |
| Contests | None |
| Loot Boxes | No |
| Made for Kids / override | Not Applicable; do not override the calculated rating |
| Age Suitability URL | Leave blank |

With these answers App Store Connect should calculate the lowest general rating;
record the actual global and regional values it shows rather than hard-coding a
rating in the ledger.

## Export compliance

The build declares `ITSAppUsesNonExemptEncryption = false`. Mila uses standard
HTTPS through Apple's networking stack and implements no proprietary or
non-standard cryptography. No encryption documentation is expected. If App
Store Connect still asks whether the app uses encryption, answer truthfully
that it uses only exempt operating-system HTTPS and follow the no-documentation
path; do not describe the app as transmitting plaintext.

## App Privacy

Use the exact answers in [`app-privacy-answers.md`](app-privacy-answers.md) and
publish them; saving them as a draft is not sufficient.

## Apple references checked 2026-07-19

- [Platform version information and metadata limits](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)
- [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Age rating values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)
- [App and submission statuses](https://developer.apple.com/help/app-store-connect/reference/app-information/app-and-submission-statuses)
- [EU Digital Services Act trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)
