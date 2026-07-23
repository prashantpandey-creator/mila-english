# Mila campaign — Feel the language

## The idea

People often know more English than they can comfortably say. Mila closes that
gap by listening without judgement until the language begins to feel like the
learner's own voice.

**Campaign line:** Feel the language. Find your voice.

**Brand line:** English, in your own voice.

**Primary action:** Start speaking free.

## 15-second film

The existing graphite origin sketch is the story engine. Two hesitant voices
find a shared line; at 8.25 seconds the monochrome drawing hard-cuts into the
new Mineral Paper crescendo frame. That change is the intended chorus/downbeat
moment.

| Time | Picture | Copy |
| --- | --- | --- |
| 0.00–2.50 | Two figures, separate | You know the words. |
| 2.50–5.25 | Their voice lines begin to meet | Now let them feel like yours. |
| 5.25–8.25 | Shared waveform becomes Mila | Speak with Mila. |
| 8.25–12.00 | Mineral colour release | English, in your own voice. |
| 12.00–15.00 | Branded end card | Start speaking free. |

## Deliverables

- `video/mila-feel-the-language-15s-landscape-silent-v1.mp4` — 1920×1080,
  H.264, 30 fps, 15 seconds.
- `video/mila-feel-the-language-15s-vertical-silent-v1.mp4` — 1080×1920,
  H.264, 30 fps, 15 seconds.
- Two matching poster frames in `video/`.
- Campaign-only AI crescendo art in `assets/`; the live site's source artwork
  is untouched.

## Music requested: "Feel Like Makin' Love" by Bad Company

The repository does not contain this recording. Using it in a published ad
would require the applicable master-use and synchronization permissions for
the specific recording, campaign, media, territories, and term.

Choose a 15-second licensed excerpt whose first full chorus/downbeat lands at
**+8.25 seconds** in the ad. Then mux it without re-encoding the picture:

```bash
campaigns/feel-the-language/scripts/add-licensed-track.sh \
  campaigns/feel-the-language/video/mila-feel-the-language-15s-landscape-silent-v1.mp4 \
  /absolute/path/to/licensed-track.wav \
  AUDIO_START_SECONDS
```

Run the same command with the vertical master. `AUDIO_START_SECONDS` is the
point in the licensed source file where the 15-second excerpt begins.

## Placement copy

**Primary social caption**

You know the words. Mila helps them feel like yours. Speak privately, get one
clear next step, and start free.

**Short caption**

Stop rehearsing English in your head. Start speaking it with Mila.

**Russian adaptation**

Ты знаешь слова. Mila поможет им зазвучать твоим голосом. Говори без страха,
получай один понятный следующий шаг и начни бесплатно.

**Headline options**

1. Feel the language. Find your voice.
2. English, in your own voice.
3. Stop rehearsing. Start speaking.

## Rendering

The render is deterministic and uses the original front-page film plus the two
campaign-only AI frames. Fonts are the same open-source Manrope and Yeseva One
families used by the product.

```bash
campaigns/feel-the-language/scripts/render.sh
```

The generated bitmap frames were made with the built-in image generation path,
using Mila's v6 Mineral Paper art and v7 graphite poster as references. Prompt
direction: expand the faceless graphite/eucalyptus ribbons into an elegant
rock-ballad crescendo; preserve linen paper, the magenta voice signal, clear
typography space, and all existing brand bans.
