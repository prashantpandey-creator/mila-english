#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
asset_root="$repo_root/docs/app-store-assets/1.0"
text_root="$asset_root/app-store-connect"
manifest="$asset_root/release-manifest.json"
privacy_manifest="$repo_root/ios/Mila/Resources/PrivacyInfo.xcprivacy"
ipa_path="${1:-$repo_root/ios/build/export/Mila.ipa}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

pass() {
  echo "PASS: $*"
}

text_chars() {
  local value
  value="$(<"$1")"
  printf '%s' "$value" | LC_ALL=en_US.UTF-8 wc -m | tr -d ' '
}

text_bytes() {
  local value
  value="$(<"$1")"
  printf '%s' "$value" | LC_ALL=C wc -c | tr -d ' '
}

check_char_limit() {
  local file="$1"
  local limit="$2"
  local count
  count="$(text_chars "$file")"
  (( count <= limit )) || fail "$file has $count characters; limit is $limit"
  pass "$(basename "$file") is $count/$limit characters"
}

check_byte_limit() {
  local file="$1"
  local limit="$2"
  local count
  count="$(text_bytes "$file")"
  (( count <= limit )) || fail "$file has $count bytes; limit is $limit"
  pass "$(basename "$file") is $count/$limit bytes"
}

for required in \
  "$text_root/en-US/name.txt" \
  "$text_root/en-US/subtitle.txt" \
  "$text_root/en-US/promotional_text.txt" \
  "$text_root/en-US/description.txt" \
  "$text_root/en-US/keywords.txt" \
  "$text_root/en-US/support_url.txt" \
  "$text_root/en-US/marketing_url.txt" \
  "$text_root/en-US/privacy_url.txt" \
  "$text_root/review_notes.txt" \
  "$asset_root/app-privacy-answers.md" \
  "$asset_root/metadata.md" \
  "$asset_root/submission-checklist.md" \
  "$manifest" \
  "$privacy_manifest"; do
  [[ -s "$required" ]] || fail "missing or empty release artifact: $required"
done

check_char_limit "$text_root/en-US/name.txt" 30
check_char_limit "$text_root/en-US/subtitle.txt" 30
check_char_limit "$text_root/en-US/promotional_text.txt" 170
check_char_limit "$text_root/en-US/description.txt" 4000
check_byte_limit "$text_root/en-US/keywords.txt" 100
check_byte_limit "$text_root/review_notes.txt" 4000

[[ "$(<"$text_root/en-US/name.txt")" == "Mila: English Speaking" ]] || fail "unexpected App Store name"
[[ "$(<"$text_root/en-US/support_url.txt")" == "https://mila.purangpt.com/support" ]] || fail "unexpected support URL"
[[ "$(<"$text_root/en-US/privacy_url.txt")" == "https://mila.purangpt.com/privacy" ]] || fail "unexpected privacy URL"

plutil -lint "$repo_root/ios/Mila/Info.plist" "$repo_root/ios/ExportOptions.plist" "$privacy_manifest" >/dev/null
python3 -m json.tool "$manifest" >/dev/null
pass "all release property lists and JSON parse"

project_spec="$repo_root/ios/project.yml"
rg -q 'PRODUCT_BUNDLE_IDENTIFIER: com\.purangpt\.mila' "$project_spec" || fail "bundle ID drifted"
rg -q 'MARKETING_VERSION: 1\.0' "$project_spec" || fail "marketing version drifted"
rg -q 'CURRENT_PROJECT_VERSION: 1' "$project_spec" || fail "build number drifted"
rg -q 'DEVELOPMENT_TEAM: 8U3RHGA83G' "$project_spec" || fail "development team drifted"
rg -q 'iOS: "16\.0"' "$project_spec" || fail "minimum iOS drifted"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :MilaBaseURL' "$repo_root/ios/Mila/Info.plist")" == "https://mila.purangpt.com" ]] || fail "production origin drifted"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :ITSAppUsesNonExemptEncryption' "$repo_root/ios/Mila/Info.plist")" == "false" ]] || fail "export compliance key drifted"
pass "bundle, build, team, minimum iOS, origin, and encryption settings match release manifest"

privacy_dump="$(plutil -p "$privacy_manifest")"
for data_type in Name EmailAddress OtherUserContent UserID ProductInteraction; do
  grep -q "NSPrivacyCollectedDataType${data_type}" <<<"$privacy_dump" || fail "privacy manifest is missing $data_type"
done
! grep -q 'NSPrivacyCollectedDataTypeAudioData' <<<"$privacy_dump" || fail "transient audio must not be declared as retained data"
grep -q '"NSPrivacyTracking" => false' <<<"$privacy_dump" || fail "privacy tracking must be false"
python3 - "$privacy_manifest" <<'PY'
import plistlib
import sys

with open(sys.argv[1], "rb") as source:
    manifest = plistlib.load(source)

app = "NSPrivacyCollectedDataTypePurposeAppFunctionality"
personalization = "NSPrivacyCollectedDataTypePurposeProductPersonalization"
expected = {
    "NSPrivacyCollectedDataTypeName": {app, personalization},
    "NSPrivacyCollectedDataTypeEmailAddress": {app},
    "NSPrivacyCollectedDataTypeOtherUserContent": {app, personalization},
    "NSPrivacyCollectedDataTypeUserID": {app, personalization},
    "NSPrivacyCollectedDataTypeProductInteraction": {app, personalization},
}
actual = {
    item["NSPrivacyCollectedDataType"]: set(item["NSPrivacyCollectedDataTypePurposes"])
    for item in manifest["NSPrivacyCollectedDataTypes"]
}
if actual != expected:
    raise SystemExit(f"privacy purpose mapping drifted: {actual!r}")
PY
pass "privacy manifest matches the App Privacy answer sheet"

screenshots=("$asset_root/screenshots-6.9-inch"/*.png)
[[ "${#screenshots[@]}" -eq 5 ]] || fail "expected exactly five 6.9-inch screenshots"
for screenshot in "${screenshots[@]}"; do
  width="$(sips -g pixelWidth "$screenshot" | awk '/pixelWidth/ {print $2}')"
  height="$(sips -g pixelHeight "$screenshot" | awk '/pixelHeight/ {print $2}')"
  alpha="$(sips -g hasAlpha "$screenshot" | awk '/hasAlpha/ {print $2}')"
  [[ "$width" == "1320" && "$height" == "2868" ]] || fail "$(basename "$screenshot") is ${width}x${height}, expected 1320x2868"
  [[ "$alpha" == "no" ]] || fail "$(basename "$screenshot") contains an alpha channel"
done
pass "five ordered iPhone screenshots are 1320x2868 PNG without alpha"

app_icon="$repo_root/ios/Mila/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
[[ -f "$app_icon" ]] || fail "App Store icon is missing"
icon_width="$(sips -g pixelWidth "$app_icon" | awk '/pixelWidth/ {print $2}')"
icon_height="$(sips -g pixelHeight "$app_icon" | awk '/pixelHeight/ {print $2}')"
icon_alpha="$(sips -g hasAlpha "$app_icon" | awk '/hasAlpha/ {print $2}')"
[[ "$icon_width" == "1024" && "$icon_height" == "1024" ]] || fail "App Store icon must be 1024x1024"
[[ "$icon_alpha" == "no" ]] || fail "App Store icon contains an alpha channel"
pass "App Store icon is 1024x1024 without alpha"

for public_url in \
  "$(<"$text_root/en-US/privacy_url.txt")" \
  "$(<"$text_root/en-US/support_url.txt")"; do
  curl --fail --silent --show-error --location --max-time 20 --output /dev/null "$public_url" || fail "$public_url is not publicly reachable"
done
pass "privacy and support URLs are publicly reachable"

[[ -f "$ipa_path" ]] || fail "IPA not found: $ipa_path"
release_tmp="$(mktemp -d)"
unzip -q "$ipa_path" -d "$release_tmp"
app_path="$release_tmp/Payload/Mila.app"
[[ -d "$app_path" ]] || fail "IPA has no Payload/Mila.app"

codesign --verify --deep --strict "$app_path" || fail "IPA code signature verification failed"
signature_dump="$(codesign -dvvv "$app_path" 2>&1)"
grep -q 'Authority=Apple Distribution:' <<<"$signature_dump" || fail "IPA is not Apple Distribution-signed"
grep -q 'TeamIdentifier=8U3RHGA83G' <<<"$signature_dump" || fail "IPA signing team drifted"

info_plist="$app_path/Info.plist"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$info_plist")" == "com.purangpt.mila" ]] || fail "IPA bundle ID drifted"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$info_plist")" == "1.0" ]] || fail "IPA version drifted"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$info_plist")" == "1" ]] || fail "IPA build number drifted"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :MinimumOSVersion' "$info_plist")" == "16.0" ]] || fail "IPA minimum iOS drifted"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :MilaBaseURL' "$info_plist")" == "https://mila.purangpt.com" ]] || fail "IPA production origin drifted"
[[ "$(/usr/libexec/PlistBuddy -c 'Print :ITSAppUsesNonExemptEncryption' "$info_plist")" == "false" ]] || fail "IPA export compliance value drifted"
cmp -s "$privacy_manifest" "$app_path/PrivacyInfo.xcprivacy" || fail "IPA privacy manifest does not match the checked-in manifest; rebuild and export"

distribution_summary="$(dirname "$ipa_path")/DistributionSummary.plist"
[[ -f "$distribution_summary" ]] || fail "DistributionSummary.plist is missing beside the IPA"
grep -q '"type" => "Apple Distribution"' < <(plutil -p "$distribution_summary") || fail "distribution summary does not show Apple Distribution"

expected_sha="$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["binary"]["sha256"])' "$manifest")"
actual_sha="$(shasum -a 256 "$ipa_path" | awk '{print $1}')"
[[ "$expected_sha" != "PENDING_REEXPORT" ]] || fail "release manifest still has a pending IPA checksum"
[[ "$actual_sha" == "$expected_sha" ]] || fail "IPA SHA-256 does not match release-manifest.json"

pass "IPA signature, bundle, version, build, minimum iOS, origin, privacy manifest, and SHA-256 are release-ready"
echo "IPA: $ipa_path"
echo "SHA-256: $actual_sha"
