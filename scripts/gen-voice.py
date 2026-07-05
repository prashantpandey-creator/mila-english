#!/usr/bin/env python3
"""Pre-bake phrase audio with ElevenLabs → public/audio/<accent>/<idx>.mp3.

The Listen side plays these static files (instant, offline, zero runtime cost).
Phrase texts are read straight from src/lib/phrases.ts so they never drift.

Usage:
    ELEVEN_KEY=<key> python3 scripts/gen-voice.py us
    ELEVEN_KEY=<key> python3 scripts/gen-voice.py uk   # once a uk voice is added below
"""
import os, sys, re, json, urllib.request

# ElevenLabs premade voices, chosen for clarity as a pronunciation model.
VOICES = {
    "us": "EXAVITQu4vr4xnSDxMaL",  # Sarah — American, clear & reassuring
    "uk": "Xb7hH8MSUJpSbSDYk0k2",  # Alice — British, clear engaging educator
    "in": "2lO53AUjjzRVJUFIyuzi",  # Ria — Indian English, informative/documentary
}
MODEL = "eleven_multilingual_v2"

def phrases():
    ts = open(os.path.join(os.path.dirname(__file__), "..", "src", "lib", "phrases.ts")).read()
    # text may be single- or double-quoted (double is used for phrases with apostrophes)
    return ["".join(m) for m in re.findall(r'''text:\s*(?:"([^"]*)"|'([^']*)')''', ts)]

def main():
    accent = sys.argv[1] if len(sys.argv) > 1 else "us"
    key = os.environ.get("ELEVEN_KEY")
    if not key: sys.exit("set ELEVEN_KEY")
    if accent not in VOICES: sys.exit(f"no voice mapped for '{accent}' — add one to VOICES")
    voice = VOICES[accent]
    outdir = os.path.join(os.path.dirname(__file__), "..", "public", "audio", accent)
    os.makedirs(outdir, exist_ok=True)
    for i, text in enumerate(phrases()):
        body = json.dumps({"text": text, "model_id": MODEL, "output_format": "mp3_44100_128"}).encode()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
            data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            open(os.path.join(outdir, f"{i}.mp3"), "wb").write(r.read())
        print(f"  {accent}/{i}.mp3  «{text}»")

if __name__ == "__main__":
    main()
