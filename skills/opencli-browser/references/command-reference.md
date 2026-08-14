# opencli-browser 命令参考

> 本文件是 `opencli-browser/SKILL.md` 的详细命令手册,按需读取。
> 核心规则、Mental model、Target contract 在 SKILL.md 本体,此处只放命令级细节。

## Command reference

### Inspect

| command | purpose |
|---------|---------|
| `browser state` | Snapshot: text tree with `[N]` refs, scroll hints, hidden-interactive hints, `compounds (N):` sidecar for date/select/file refs. |
| `browser state --source ax` | Opt-in accessibility-tree snapshot. Use when custom controls, portals, or iframe contents are hard to identify in normal `state`. AX refs can recover stale React re-renders by role/name/nth and can route same-origin iframe refs. Cross-origin iframe refs are best-effort because Chrome may not expose attachable OOPIF targets to extensions. |
| `browser state --compare-sources` | Metrics-only DOM vs AX comparison for deciding whether AX should become default. It prints counts and sizes, not page text, so it is safer to share for validation. |
| `browser find --css <sel> [--limit N] [--text-max N]` | Run a CSS query and return one entry per match with `{nth, ref, tag, role, text, attrs, visible, compound?}`. Allocates refs for matches the prior snapshot didn't tag. Cheap alternative to `state` when you already know the selector. |
| `browser find --role button --name Save` | Semantic locator query. Also supports `--label`, `--text`, and `--testid`. Use before raw CSS when a control has accessible labels. |
| `browser frames` | List cross-origin iframe targets. Pass the index to `--frame` on `eval`. |
| `browser screenshot [path]` | Viewport PNG. No path → base64 to stdout. Prefer `state` when you just need structure. |
| `browser screenshot --annotate [path]` | Visual ref map. Refreshes DOM refs and overlays visible `[N]` labels so the screenshot maps back to `browser click <ref>` targets. Use for icon-only controls, visual layouts, charts, or when text state is ambiguous. |

### Get (read-only)

| command | returns |
|---------|---------|
| `browser get title` | plain text |
| `browser get url` | plain text |
| `browser get text <target> [--nth N]` | `{value, matches_n, match_level}` |
| `browser get value <target> [--nth N]` | `{value, matches_n, match_level}` |
| `browser get attributes <target> [--nth N]` | `{value: {attr: val, ...}, matches_n, match_level}` |
| `browser get text --role option --name Travel` | Semantic locator read without a prior `state` call. Same flags as `browser find`. |
| `browser get html [--selector <css>] [--as html\|json] [--depth N] [--children-max N] [--text-max N] [--max N]` | Raw HTML, or structured tree. JSON tree nodes have `{tag, attrs, text, children[], compound?}`. Truncation reported via `truncated: {depth?, children_dropped?, text_truncated?}`. |

### Interact

| command | notes |
|---------|-------|
| `browser click <target> [--nth N]` | Returns `{clicked, target, matches_n, match_level}`. |
| `browser click --role button --name Submit` | Semantic click. Write actions require a unique match; ambiguous locators return candidates instead of clicking the first match. |
| `browser hover [target] [--role R --name N] [--nth N]` | Moves the mouse over an element. Use for hover menus/tooltips before taking `state` or clicking submenu items. Returns `{hovered, target, matches_n, match_level}`. |
| `browser focus [target] [--role R --name N] [--nth N]` | Focuses an element without typing. Useful before `keys` or when a page reacts to focus/blur. Returns `{focused, target, matches_n, match_level}`. |
| `browser dblclick [target] [--role R --name N] [--nth N]` | Double-clicks an element via native mouse events when available. Returns `{dblclicked, target, matches_n, match_level}`. |
| `browser check [target] [--role R --name N] [--nth N]` | Ensures checkbox/radio/aria-checked control is checked. Returns `{checked, changed, target, matches_n, match_level, kind}`. Prefer this over blind `click` when target state matters. |
| `browser uncheck [target] [--role R --name N] [--nth N]` | Ensures checkbox/aria-checked control is unchecked. Radio buttons cannot be unchecked directly; select another radio in the group instead. |
| `browser upload [target] <file...> [--role R --name N] [--nth N]` | Attaches local file path(s) to an `input[type=file]` via CDP. With semantic flags, omit `target` and pass files as positionals. Returns `{uploaded, files, file_names, target, matches_n, match_level, multiple?, accept?}`. |
| `browser drag [source] [target] [--from-role R --from-name N] [--to-role R --to-name N] [--from-nth N] [--to-nth N]` | Mouse-based drag from one resolved element center to another. Works for mouse-listener drag libraries; native HTML5 `dataTransfer` drops may need a site-specific fallback. Returns `{dragged, source, target, source_matches_n, target_matches_n, ...}`. |
| `browser type [target] <text> [--role R --name N] [--nth N]` | Clicks first, then types. With semantic flags, omit `target` and pass text as the only positional. Returns `{typed, text, target, matches_n, match_level, autocomplete}`. `autocomplete: true` means a combobox/datalist popup appeared after typing — you almost always need `keys Enter` or a follow-up `click` on the suggestion to commit the value. |
| `browser fill [target] <text> [--role R --name N] [--nth N]` | Exact replacement for input, textarea, and contenteditable targets. With semantic flags, omit `target` and pass text as the only positional. Returns `{filled, verified, text, actual, matches_n, match_level}`. Use this when you need raw text set and verified, not keyboard/autocomplete behavior. Pipeline form supports `{ fill: { ref, text, submit: true } }`. |
| `browser select [target] <option> [--role R --name N] [--nth N]` | Matches native `<select>` option by label first, then value. With semantic flags, omit `target` and pass option as the only positional. Use `compound` from `find`/`state` to see exactly what labels are available. |
| `browser keys <key>` | `Enter`, `Escape`, `Tab`, `Control+a`, etc. Runs against the focused element. |
| `browser scroll <direction> [--amount px]` | `up` / `down`. Default amount `500`. |

### Wait

```bash
browser wait selector "<css>" [--timeout ms]    # wait until the selector matches
browser wait text "<substring>" [--timeout ms]  # wait until the text appears
browser wait download [pattern] [--timeout ms]  # wait for a Chrome download whose filename/URL/mime contains pattern
browser wait time <seconds>                     # hard sleep, last resort
```

Default timeout `10000` ms. SPA routes, login redirects, and lazy-loaded lists need `wait` before `state`/`get`.

`browser wait download` requires Browser Bridge extension 1.0.8+ because it uses
Chrome's downloads lifecycle API. Pass a narrow filename or URL substring such
as `receipt.pdf` when possible; an empty pattern waits for the next/recent
download in the timeout window. The command reports `{downloaded, filename, url,
state, elapsedMs}` on success and a JSON error envelope on timeout/failure.

### Extract

- **`web read --url <url>`** — One-shot Markdown reader for arbitrary pages. It expands relevant same-origin iframes by default, so old iframe-shell sites work better than with a top-document-only scrape. Use `--frames all-same-origin` when completeness matters more than Markdown noise. For AJAX shell pages use `opencli web read --url <url> --wait-for "<selector>" --wait-until networkidle --diagnose`; diagnostics show frame URLs, empty containers, and API-like XHRs. If the value you need is table/API data, switch to `browser network` or a dedicated adapter instead of relying on Markdown.
- **`browser eval <js> [--frame N]`** — Run an expression in the page (or in a cross-origin frame via `--frame`). Wrap in an IIFE and return JSON. Read-only: no `document.forms[0].submit()`, no clicks, no navigations. If the result is a string, stdout is the raw string; otherwise it's JSON.
- **`browser extract [--selector <css>] [--chunk-size N] [--start N]`** — Markdown extraction of long-form content with a continuation cursor. Returns `{url, title, selector, total_chars, chunk_size, start, end, next_start_char, content}`. Loop on `next_start_char` until it is `null`. Auto-scopes to `<main>`/`<article>`/`<body>` if you don't pass `--selector`.

### Network

```bash
browser network                        # shape preview + cache key list
browser network --detail <key>         # full body for one cached entry
browser network --filter "field1,field2"  # keep only entries whose body shape contains ALL fields as path segments
browser network --all                  # include static resources (usually noise)
browser network --raw                  # full bodies inline — large; use sparingly
browser network --ttl <ms>             # cache TTL (default 24h)
```

List entries look like `{key, method, status, url, ct, size, shape, body_truncated?}`. Detail envelope is `{key, url, method, status, ct, size, shape, body, body_truncated?, body_full_size?, body_truncation_reason}`. Cache lives in `~/.opencli/cache/browser-network/` so you can re-inspect without re-triggering the request.

Default output keeps JSON/XML/plain-text and JS-like API responses, then drops obvious static assets and telemetry by URL. If an expected endpoint is missing, run `browser network --all` once and check whether an unusual content type or URL filter hid it.

### Tabs & session

| command | purpose |
|---------|---------|
| `browser tab list` | JSON array of `{index, page, url, title, active}`. The `page` string is the tab identity you pass as `<targetId>` to `tab select` / `tab close`, or to `--tab <targetId>` on any subcommand. (`--tab`'s placeholder is historical — the value is always `page`.) |
| `browser tab new [url]` | Open a new tab. Prints the new `page` string. |
| `browser tab select [targetId]` | Make a tab the default. All subcommands accept `--tab <targetId>` to target one without changing the default. |
| `browser tab close [targetId]` | Close by `page`. |
| `browser back` | History back on the active tab. |
| `browser close` | Release the current owned browser session when done. |
| `browser <session> bind` | Bind the current Chrome tab to the named browser session. |
| `browser <session> unbind` | Detach the named bound session without closing the user tab/window. |

---

## Compound form controls

Every date/time, select, and file input carries a `compound` field. Use it — do not regex attributes.

### Date family

```json
{
  "control": "date",
  "format": "YYYY-MM-DD",
  "current": "2026-04-21",
  "min": "2026-01-01",
  "max": "2026-12-31"
}
```

`control` is one of `date | time | datetime-local | month | week`. `format` is a concrete template string — type into the field using that exact format, or `select` by label if the site wraps the native input in a custom widget.

### Select

```json
{
  "control": "select",
  "multiple": false,
  "current": "United States",
  "options": [
    { "label": "United States", "value": "us", "selected": true },
    { "label": "Canada", "value": "ca" }
  ],
  "options_total": 137
}
```

`options[]` is capped at 50 entries. **`current` is always correct** even when the selected option is past the cap — it's computed by scanning every option, not from the truncated list. If `options_total > options.length` and you need an option that isn't in `options[]`, call `browser select <target> "<label>"` directly — the CLI matches against the live DOM, not the truncated list.

### File

```json
{
  "control": "file",
  "multiple": true,
  "current": ["report.pdf", "cover.png"],
  "accept": "application/pdf,image/*"
}
```

Do not invent file paths. Upload is done via the normal click flow — respect `accept` when telling the user what to upload.

### Where compounds show up

- `browser find --css <sel>` entries: inline on each match.
- `browser get html --as json` tree nodes: inline on matching nodes.
- `browser state` snapshot: in a `compounds (N):` sidecar keyed by numeric ref, so you can tell at a glance which `[N]` entries have rich metadata.

---

## Cost guide

Think about payload size per call. Budgets exist for a reason.

| command | rough cost | when to use |
|---------|-----------|-------------|
| `state` | medium (bounded by internal budget) | First call on any page, after every nav, when you need refs. |
| `find --css <sel>` | small | You already know the selector — one query, compact entries. |
| `get title` / `get url` | tiny | Sanity checks between steps. |
| `get text/value/attributes` | tiny per call | Verifying one specific field. |
| `get html` (raw) | can be huge | Avoid on unbounded pages. Always pair with `--selector` and a budget. |
| `get html --as json --depth 3 --children-max 20` | medium | When you need to reason about structure, not a specific field. |
| `screenshot` | large | Only when the page is visual (CAPTCHA, charts). Prefer `state`. |
| `extract` | medium per chunk | Long-form reading. Loop via `next_start_char`. |
| `network` (default) | small | First look at APIs. |
| `network --detail <key>` | varies | Pull one body. |
| `network --raw` | huge | Only after `--filter` narrowed the candidate set. |
| `eval "JSON.stringify(...)"` | controlled | Targeted extraction when none of the above fit. |

Rule of thumb: **one `state` per page transition, one `find` per follow-up query, one `get`/`click`/`type` per action.** If your plan involves >10 calls per page you are probably scraping instead of interacting — consider `extract` or `network`.
