# Custom add-ons (presets)

Every `*.json` file in this folder becomes its own Stremio add-on, built and hosted free on GitHub Pages alongside the stock themes, and refreshed daily:

```
presets/my-setup.json  →  https://<you>.github.io/stremio-marquee/addon/my-setup/manifest.json
```

The easy way to make one is the **[Studio](https://griffdog21.github.io/stremio-marquee/studio.html)**: design your setup, then press **Publish with GitHub**. It opens a pre-filled new file here; commit it and the add-on is live about two minutes later.

## Rules

- File names use lowercase letters, numbers and dashes (`my-setup.json`) and can't reuse a stock theme's name (`neon`, `haunt-classic`, …).
- A file that isn't valid JSON is skipped with a warning; it never breaks the rest of the site.
- Delete the file to remove the add-on at the next build.

## Format

Only `theme` is required; everything else falls back to that theme's defaults.

```json
{
  "title": "Griffin's Halloween",
  "theme": "haunt",
  "template": "noir",
  "colors": { "primary": "#ff7518" },
  "art": "art",
  "rows": ["spotlight", "custom0", "movies", "series", "mood"],
  "names": { "movies": "Hot Right Now" },
  "shapes": { "series": "landscape" },
  "prefix": "🦇",
  "posters": { "tt0077651": "https://example.com/my-halloween-poster.jpg" },
  "custom": [{ "name": "Family Movie Night", "type": "movie", "ids": ["tt0107120", "tt1014759"] }],
  "count": 40
}
```

| Field | Meaning |
| --- | --- |
| `title` | Add-on name shown in Stremio |
| `theme` | `neon`, `noir`, `deco`, `vhs`, `bauhaus`, `terminal`, `haunt` or `aurora` |
| `template` | Draw posters in another theme's style |
| `colors` | Override palette colours: `bg`, `surface`, `primary`, `secondary`, `accent`, `text`, `muted` |
| `art` | `"art"` for generated posters, `"original"` for real posters |
| `rows` | Rows in order: `spotlight`, `movies`, `series`, `mood`, `fresh`, `custom0`…`custom5` |
| `names` / `shapes` | Per-row name, and card shape: `poster`, `landscape` or `square` |
| `prefix` | Emoji or symbol before row names (`""` for none) |
| `logo` / `background` | Image URLs for the add-on's logo and backdrop |
| `posters` | Replace a title's poster with your own image, keyed by IMDb id |
| `custom` | Up to six rows of your own titles (IMDb ids) |
| `count` | Titles per row, 10–100 |
