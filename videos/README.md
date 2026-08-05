# videos/

The clips for the reel strip between the menus and *Our Story*.

## What's here

Five reels, pulled from the brand's own TikTok account (`@badri.hania.eg`) and re-encoded for the web:

| File | Clip | Source |
|---|---|---|
| `reel-01` | حين تجتمع المعايير العالمية | `7669803682241858823` |
| `reel-02` | فرع مدينة نصر | `7636819712160353554` |
| `reel-03` | آيس سولتد كراميل | `7540343297282198802` |
| `reel-04` | فرع ٦ أكتوبر | `7655729772215012615` |
| `reel-05` | منظومة صناعية وخطوط إنتاج | `7546224718404226322` |
| `reel-06` | مراجعة الشيف حسام حسن | `7642211940617440530` — `@chefhossamhassan` |
| `reel-07` | مراجعة رغدة توفيق | `7644873032531709202` — `@raghdatawfiq` |

The last two are creator reviews from other people's accounts, reused with the publisher's
permission. If that permission is ever withdrawn, delete the files and their `REELS` entries — the
strip re-measures itself and keeps looping with whatever is left.

Each `reel-NN.jpg` is the first frame of its `.mp4`, used as the poster.

Originals live in `_raw/` (gitignored) so a clip can be re-cut without downloading again.

## Encoding recipe

```
ffmpeg -ss <start> -t 8 -i _raw/reel-NN.mp4 \
  -vf "scale=540:960:force_original_aspect_ratio=increase,crop=540:960,fps=25" \
  -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 30 -preset slow \
  -movflags +faststart -an videos/reel-NN.mp4
ffmpeg -i videos/reel-NN.mp4 -frames:v 1 -q:v 4 videos/reel-NN.jpg
```

`-an` is deliberate: the strip is always silent, so the audio track is dead weight.
`+faststart` puts the index at the front so playback can begin before the file finishes downloading.

## Adding or replacing a reel

1. Encode with the recipe above. **9:16 portrait** — anything else gets cropped to fill the tile.
2. Keep it under ~1 MB and around 8 seconds; it loops, so a clean loop point matters more than length.
3. Add it to the `REELS` list in `index.html` (search for `REELS —`). That list is the only place
   video links live; the strip repeats itself as many times as needed to cover the screen.

A clip whose point is its audio does not belong here. Neither does one wider than it is tall — the
factory walkthrough (`7634545204753730823`) is 1024×576 and was left out for exactly that reason;
it suits a full-width section, not this strip.

## While a file is missing

Its tile shows the poster still instead of a black box, so the page never looks broken.
