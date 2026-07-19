# Mila origin film — v7 generation and delivery record

This revision keeps the approved graphite drawings but replaces the seven-still
canvas dissolve with a real stepped film. Two people begin in separate paper
worlds, learn to listen, make one waveform, and physically fold into Mila.

## Final contract

- 12 narrative keyframes.
- 41 selected AI-authored geometric in-betweens in landscape; 39 in portrait.
- 53 separately redrawn graphite drawings in the landscape film and 51 in the
  portrait film. The complete 82-file in-between workshop stays versioned.
- 141 hard-cut exposures at 12 fps: 11.75 seconds.
- 600 ms CSS release from the registered final graphite drawing to the mineral
  Mila artwork underneath: 12.35 seconds total.
- No crossfades between drawings, optical flow, software camera movement,
  temporal blur, audio, or loop.
- Once per browser session, with explicit replay, Skip, Reduced Motion, Save
  Data, constrained-network, interaction, scroll, visibility, orientation, and
  playback-failure exits.

The landscape drawing holds are:

```text
8 3 3 5 2 2 5 2 2 4 2 2 4 2 2 4 2 2
4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 2 2 2
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 7
```

They total 141. The opening and final registration breathe longest; moving
drawings normally hold for two exposures to keep a deliberate pencil
stop-motion cadence without returning to slideshow-sized jumps.

The portrait cut uses the same clock except that p93 and p995 are not screened:

```text
8 3 3 5 2 2 5 2 2 4 2 2 4 2 2 4 2 2
4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 2 2 2
2 2 2 2 2 2 2 2 2 2 2 2 2 2 11
```

Those two drawings remain in the workshop. Their four exposures become a
longer hold on the exact registered final portrait, so both orientation cuts
still contain 141 exposures and finish together.

## Narrative anchors

| # | Beat | Purpose |
| --- | --- | --- |
| 00 | quiet | Two worlds, no signal yet |
| 01 | apart | Separate voice threads begin |
| 02 | listen | Threads meet as one waveform |
| 03 | bridge | First true geometric bridge |
| 04 | weave | Human hems become shared ribbons |
| 05 | midcurl | Wide ribbons begin the inward curl |
| 06 | fold | The shared form gains a stable base |
| 07 | tighten | Human echoes recede as Mila forms |
| 08 | converge | Organic and geometric folds become one |
| 09 | land | Bead, shadow, and final construction logic arrive |
| 10 | nearfinal | Sculpture approaches the final registered bounds |
| 11 | final | Exact graphite counterpart of the mineral Mila hero |

Each adjacent pair has new p33 and p67 drawings. The difficult 10→11 landscape
landing has a denser hand-authored progression: p08, p16, p33, p50, p58, p625,
p67, p695, p72, p76, p80, p825, p85, p90, p92, p93, p94, p97, p98, p99, and
p995. Portrait uses the same progression without p93 and p995. Every added
settling drawing was generated between already approved neighboring exposures,
then quantitatively and visually checked. When an extra drawing made the
silhouette move away from its target, it stayed in the workshop but was not
forced into the delivery cut.

## Workspace assets

- Keyframe masters:
  `artwork/mila-story/v7/keyframes/mila-film-{00..11}-*-desktop-v1.webp`
- Portrait keyframe masters:
  `artwork/mila-story/v7/keyframes/mila-film-{00..11}-*-mobile-v1.webp`
- AI in-betweens:
  `artwork/mila-story/v7/inbetweens/mila-film-*-*-v1.webp`
- Runtime posters:
  `public/visuals/v7/mila-origin-poster-{desktop,mobile}-v1.webp`
- Landscape film:
  `public/visuals/v7/mila-origin-film-desktop-v1.mp4`
- Portrait film:
  `public/visuals/v7/mila-origin-film-mobile-v1.mp4`
- Reproducible renderer: `scripts/render-mila-story-film.sh`
- Encode/package verifier: `scripts/verify-mila-story-film.mjs`
- Drawing-boundary continuity auditor:
  `scripts/audit-mila-story-continuity.mjs`

Delivery metadata:

| Film | Raster | Codec | Frames | Duration | Size |
| --- | ---: | --- | ---: | ---: | ---: |
| Desktop | 2048×978 | H.264 High, Level 4.2, BT.709, yuv420p | 141 | 11.75 s | 10,065,913 bytes |
| Mobile | 960×2024 | H.264 High, Level 4.2, BT.709, yuv420p | 141 | 11.75 s | 7,441,857 bytes |

Only the viewport-appropriate film is assigned to the video element. Portrait
phones and tablets through 1100 CSS px use the portrait composition and its
art-above/card-below layout; using the landscape film there would crop away one
person and part of the final sculpture. The 864 px portrait masters are dense
on phones and approximately 1× on larger tablets, not Retina-class. A true
high-DPI tablet edition requires newly authored 3:4 masters (1280×1708 is the
Level 4.2 target); blind upscaling was rejected because it adds decode and
transfer cost without adding graphite detail.

## ImageGen provenance

All new art used the built-in ImageGen edit workflow in `compositing` mode.
Existing approved drawings supplied both endpoints. Every prompt required a
locked camera, paper border, copy negative space, waveform axis, and graphite
medium; only the causal ribbon geometry was allowed to advance. ImageGen output
rasters vary by a few pixels, so the renderer normalizes them onto one delivery
canvas instead of claiming pixel-identical paper registration.

The five first-pass anchor pairs came from:

| Beat | Desktop generated PNG | Mobile generated PNG |
| --- | --- | --- |
| bridge | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-e7fa4594-798e-404e-b058-eee6a3bb248b.png` | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-d6322ede-f052-474d-81d4-8406a7c66d0a.png` |
| midcurl | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-8aa75ebc-8964-4e60-b9fa-b781ae89f866.png` | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-7b28cbad-f371-412c-b7c6-009f72bb5ead.png` |
| tighten | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-4568c813-a65a-4559-bfdf-755f08a55029.png` | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-cd254a1f-bc56-4d0c-89f2-b88ea1fa22c7.png` |
| land | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-986996ff-20d6-459f-9fbf-a69dcbef1f43.png` | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-4a7338af-88bf-404c-9ec2-bac89ea98e63.png` |
| nearfinal | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-a06189f4-76d9-4973-8ad0-3c5736404928.png` | `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/exec-07eed29f-1f18-4438-ae7a-dbe8ec841c97.png` |

The five final-settling redraws came from:

| Progress | Desktop generated PNG | Mobile generated PNG |
| --- | --- | --- |
| p16 | `/Users/badenath/.codex/generated_images/019f78cb-3932-7b70-860e-d7675a27b76f/exec-89f5b525-f484-48e4-ad95-52af3e825025.png` | `/Users/badenath/.codex/generated_images/019f78cb-71b4-7360-91b0-cbeffff492b4/exec-b9eb940c-f0aa-4f9e-956b-26a68a9ae629.png` |
| p50 | `/Users/badenath/.codex/generated_images/019f78cb-3932-7b70-860e-d7675a27b76f/exec-b6e60845-2273-4750-a4da-df6a581eef49.png` | `/Users/badenath/.codex/generated_images/019f78cb-71b4-7360-91b0-cbeffff492b4/exec-c41439bf-befe-4c67-a805-ba2bdf9a5cb4.png` |
| p76 | `/Users/badenath/.codex/generated_images/019f78cb-3932-7b70-860e-d7675a27b76f/exec-e7f244c4-aaa5-4463-9fad-e62f8acd301e.png` | `/Users/badenath/.codex/generated_images/019f78cb-71b4-7360-91b0-cbeffff492b4/exec-e1216620-0bdf-4c77-bee2-1178b18f413a.png` |
| p90 | `/Users/badenath/.codex/generated_images/019f78cb-3932-7b70-860e-d7675a27b76f/exec-7b1a81f8-c9cd-48bf-b7ac-2a0e1d1206ea.png` | `/Users/badenath/.codex/generated_images/019f78cb-71b4-7360-91b0-cbeffff492b4/exec-ea95238f-f6af-4581-abc7-f430fb55de9d.png` |
| p97 | `/Users/badenath/.codex/generated_images/019f78cb-3932-7b70-860e-d7675a27b76f/exec-4a51afd2-d1bb-445a-874a-043f61526896.png` | `/Users/badenath/.codex/generated_images/019f78cb-71b4-7360-91b0-cbeffff492b4/exec-f533eace-59e5-4139-9cf7-82274b1c05de.png` |

The six micro-settling redraws used to close the remaining measured late-film
gaps came from:

| Progress | Desktop generated PNG | Mobile generated PNG |
| --- | --- | --- |
| p08 | `/Users/badenath/.codex/generated_images/019f78e5-73fe-7280-8a7e-a8df4eec1f90/exec-7f1fa6bf-46b3-4d10-a770-3280b2bb21d2.png` | `/Users/badenath/.codex/generated_images/019f78e5-c317-7a31-bed1-be6a4ca69f40/exec-478fe808-3e73-4d67-9887-0c901f6b7046.png` |
| p58 | `/Users/badenath/.codex/generated_images/019f78e5-73fe-7280-8a7e-a8df4eec1f90/exec-1ac34d71-73fd-46da-9b7e-de7b3718a3f8.png` | `/Users/badenath/.codex/generated_images/019f78e5-c317-7a31-bed1-be6a4ca69f40/exec-750c8e0b-17d9-457d-bb0a-05abf5a4cf8c.png` |
| p72 | `/Users/badenath/.codex/generated_images/019f78e5-73fe-7280-8a7e-a8df4eec1f90/exec-2718f6d3-686a-41df-80b9-23cf70dad57b.png` | `/Users/badenath/.codex/generated_images/019f78e5-c317-7a31-bed1-be6a4ca69f40/exec-990c6fac-e983-4c14-aa42-559c8a981594.png` |
| p80 | `/Users/badenath/.codex/generated_images/019f78e5-73fe-7280-8a7e-a8df4eec1f90/exec-8a30406d-07c9-4aca-8db9-a1637fc7554a.png` | `/Users/badenath/.codex/generated_images/019f78e5-c317-7a31-bed1-be6a4ca69f40/exec-f08dc176-e406-4521-bfb3-2508f51633d1.png` |
| p92 | `/Users/badenath/.codex/generated_images/019f78e5-73fe-7280-8a7e-a8df4eec1f90/exec-56a72b7a-11a1-4a72-9302-bbda2eaa3dbb.png` | `/Users/badenath/.codex/generated_images/019f78e5-c317-7a31-bed1-be6a4ca69f40/exec-5f7ab57e-ea21-433c-a1d3-98edb872315a.png` |
| p99 | `/Users/badenath/.codex/generated_images/019f78e5-73fe-7280-8a7e-a8df4eec1f90/exec-284a6293-287a-493b-b546-37f48a58142a.png` | `/Users/badenath/.codex/generated_images/019f78e5-c317-7a31-bed1-be6a4ca69f40/exec-a5276814-f31b-4506-94d6-65c7d66bc2f1.png` |

The six final bridge experiments came from:

| Progress | Desktop generated PNG | Mobile generated PNG |
| --- | --- | --- |
| p625 | `/Users/badenath/.codex/generated_images/019f7904-9cfb-7de1-b851-bf1a9579e12f/exec-48758d20-a407-45f0-a262-58bd50cb8fde.png` | `/Users/badenath/.codex/generated_images/019f7904-fbe0-78a2-9f53-434aa7e8debe/exec-917b5e59-9494-4db2-a4a2-e3009af22b6a.png` |
| p695 | `/Users/badenath/.codex/generated_images/019f7904-9cfb-7de1-b851-bf1a9579e12f/exec-c5a6d1f3-f404-4b93-8943-bbb54e10c32a.png` | `/Users/badenath/.codex/generated_images/019f7933-5e49-70a0-afe9-fa1f44ac2957/exec-613b5e4a-46e3-48f2-8326-32c8940553e1.png` |
| p825 | `/Users/badenath/.codex/generated_images/019f7904-9cfb-7de1-b851-bf1a9579e12f/exec-a596a48d-2813-4444-983c-44debfef0c5d.png` | `/Users/badenath/.codex/generated_images/019f7904-fbe0-78a2-9f53-434aa7e8debe/exec-b9cbded2-3516-40de-a72b-c5f535a8f915.png` |
| p93 | `/Users/badenath/.codex/generated_images/019f7904-9cfb-7de1-b851-bf1a9579e12f/exec-c5ebe9c8-c394-4e70-8d08-9b947bab0f27.png` | `/Users/badenath/.codex/generated_images/019f7904-fbe0-78a2-9f53-434aa7e8debe/exec-19cda867-9ab9-457e-997f-3e113ea201ab.png` |
| p98 | `/Users/badenath/.codex/generated_images/019f7904-9cfb-7de1-b851-bf1a9579e12f/exec-9cf89661-040d-4c0f-9957-954cbfc2fc3e.png` | `/Users/badenath/.codex/generated_images/019f7904-fbe0-78a2-9f53-434aa7e8debe/exec-19748365-ae79-4d28-b76e-a65b9228be96.png` |
| p995 | `/Users/badenath/.codex/generated_images/019f7904-9cfb-7de1-b851-bf1a9579e12f/exec-371bcc34-9fda-4a12-ace3-30d2b4871055.png` | `/Users/badenath/.codex/generated_images/019f7904-fbe0-78a2-9f53-434aa7e8debe/exec-c94b864a-ba3c-45a4-a1b6-5a17bfcfc9fb.png` |

The selected portrait p695 is a corrective generation registered between p67
and p72. Portrait p93 and p995 remain reproducible workshop candidates but are
intentionally omitted from the runtime schedule. Additional attempts to repair
those two candidates are preserved in the ImageGen archives
`019f7933-1635-7a21-b40c-f6bd100f7142` and
`019f7932-d502-7992-b68f-17986da7b46a`; neither passed the monotonic silhouette
and placement gates, so neither replaced a workspace master.

The high-density in-between generation sources remain in these ImageGen roots:

- Desktop 00→05:
  `/Users/badenath/.codex/generated_images/019f7890-570b-70d2-b1b0-43ec4ab9c034/`
- Desktop 05→11:
  `/Users/badenath/.codex/generated_images/019f7890-99ec-7d33-9cce-5395d20e6440/`
- Mobile 00→05:
  `/Users/badenath/.codex/generated_images/019f7890-c9e6-7d32-b2aa-543f89e1d838/`
- Mobile 05→11 and final settling:
  `/Users/badenath/.codex/generated_images/019f67c4-f4a4-7dd3-a696-956d8a55a11b/`
- Final desktop settling:
  `/Users/badenath/.codex/generated_images/019f78cb-3932-7b70-860e-d7675a27b76f/`
- Final mobile settling:
  `/Users/badenath/.codex/generated_images/019f78cb-71b4-7360-91b0-cbeffff492b4/`
- Desktop micro-settling:
  `/Users/badenath/.codex/generated_images/019f78e5-73fe-7280-8a7e-a8df4eec1f90/`
- Mobile micro-settling:
  `/Users/badenath/.codex/generated_images/019f78e5-c317-7a31-bed1-be6a4ca69f40/`
- Desktop final bridges:
  `/Users/badenath/.codex/generated_images/019f7904-9cfb-7de1-b851-bf1a9579e12f/`
- Mobile final bridges:
  `/Users/badenath/.codex/generated_images/019f7904-fbe0-78a2-9f53-434aa7e8debe/`
- Selected mobile p695 repair:
  `/Users/badenath/.codex/generated_images/019f7933-5e49-70a0-afe9-fa1f44ac2957/`

The 82 workshop in-betweens were normalized to high-fidelity quality-98 WebP
renderer masters and total 32,628,982 bytes. Together with 24 keyframes, the
off-public renderer workshop totals 38,827,530 bytes. It is versioned in git
but excluded from the production Docker image by `.dockerignore`. The external
lossless PNG folders remain the archival provenance; the workspace WebPs are
the stable renderer inputs. Delivery selects 41 landscape and 39 portrait
in-betweens without deleting the two rejected portrait experiments.

## Prompt set

Standard p33/p67 template, used with the two adjacent registered images:

```text
Use case: compositing
Asset type: [landscape|portrait] stop-motion geometric in-between drawing for
Mila's homepage origin film.
The two reference images are consecutive, precisely registered keyframes on the
same paper canvas. Create ONE new full-canvas exposure that advances the actual
ribbon geometry between Image 1 and Image 2 by exactly [33|67]%. It must be a
freshly redrawn single exposure, never a crossfade or double exposure. Preserve
the exact camera, canvas dimensions and aspect, warm torn paper border, figure
placement, waveform continuity, and [left copy negative space|quiet lower 58%
copy space]. Exceptionally sharp monochrome graphite, clean dark contours, fine
cross-hatching and visible paper tooth. Do not add text, logos, UI, new objects,
faces, panels, blur, soft focus, smeared graphite, ghost contours, crop, zoom,
or camera movement.
```

Final p85/p94 settling template, used with final first and nearfinal second:

```text
Use case: compositing
Image 1 is the exact final registered large graphite sculpture. Image 2 is the
smaller preceding pose. Create ONE fresh full-canvas drawing that stays
[85|94]% identical to Image 1's size, centre, silhouette, waveform, bead,
shadow, and camera registration while retaining only [15|6]% unfinished
settling from Image 2. Make a physically continuous bridge into Image 1. One
sharp coherent drawing only: no crossfade, doubled edges, blur, text, logo, new
objects, crop, or camera movement.
```

Dense final-settling template for p16/p50/p76/p90/p97, used with the two
neighboring approved exposures:

```text
Use case: compositing
Create ONE fresh 50%-between registered graphite redraw from these two adjacent
full-canvas exposures. Preserve the paper camera, copy negative space, waveform,
ribbon topology, bead, construction arcs, and grounding shadow. Advance the
actual silhouette and scale halfway between the endpoints. One coherent sharp
drawing only: no crossfade, double contour, blur, new object, text, logo, crop,
zoom, or camera movement.
```

Micro-settling template for p08/p58/p72/p80/p92/p99 used the same compositing
contract, but the requested midpoint was bounded by the measured silhouettes
of its immediate neighbors. The corrective portrait p80 generation explicitly
targeted top 17.6%, left 9.7%, right 88.9%, and bottom 60% of its registered
canvas to overcome endpoint bias while preserving one coherent redraw.

Final bridge and corrective template for p625/p695/p825/p93/p98/p995:

```text
Use case: compositing
Use the immediate registered endpoint pair. Create ONE fresh, exact midpoint
graphite redraw. Lock the full paper canvas, camera, copy negative space,
waveform, ribbon topology, bead, shadow, and the measured midpoint silhouette
placement. Advance geometry only. One sharp single contour: no blend, double
exposure, ghosting, blur, crop, zoom, text, or new object.
```

## Continuity audit

`scripts/audit-mila-story-continuity.mjs` decodes the films as downscaled
grayscale raw video, reads the orientation-specific hold schedule, and measures
only genuine drawing boundaries. It reports within-hold codec noise separately
so compression is never mistaken for a new drawing.

For the final cut, landscape boundary MAD has median 4.781 and maximum 10.704;
its late-film median is 5.015 and maximum 10.348. Portrait boundary MAD has
median 5.537 and maximum 14.332; its late-film median is 9.195 and maximum
14.332. The higher portrait numbers are concentrated in fresh graphite tone
and hatching changes; contact-sheet review confirmed a monotonic silhouette.
The selected p695 materially reduces the p67→p72 geometric move. Direct
p92→p94 and p99→final cuts were retained because both generated alternatives
moved scale or placement away from the registered final pose.

## Render method

The renderer normalizes 53 landscape and 51 portrait drawings to their delivery
canvases with Lanczos, small per-stage contrast compensation, and restrained
spatial sharpening. It then links each drawing into its explicit exposure
schedule and encodes H.264
with `libx264`, `preset slow`, `CRF 23`, `tune animation`, `yuv420p`, fast-start,
a two-second GOP, and explicit BT.709 VUI metadata. There is no audio.

An optical-flow prototype at
`/private/tmp/mila-film-proto.JhdzK7/desktop-draft.mp4` was rejected. It created
ghosted double contours and smeared graphite. It is intentionally not shipped.
