---
name: opencli-browser
description: >
  Drive a real Chrome window via opencli: inspect pages, fill forms, click through flows, extract data.
allowed-tools: Bash(opencli:*), Read, Edit, Write
---

# opencli-browser

The first reader of this CLI is an agent, not a human. Every subcommand returns a structured envelope that tells you exactly what matched, how confident the match is, and what to do if it didn't. Lean on those envelopes — do not guess.

This skill is for **driving a live browser** to accomplish an agent task. If you are building a reusable adapter under `~/.opencli/clis/<site>/` use `opencli-adapter-author` instead.

> **Shell 说明**：示例默认 bash 语法。DSH 默认终端为 PowerShell 7：`\` 行续符 → 改用反引号（`` ` ``）或单行书写；`&&` 可用（PS7+）；管道中的 `grep` → `Select-String`；`2>file` 重定向可用。opencli 命令本身跨 shell 通用。

---

## Prerequisites

```bash
opencli doctor
```

Until `doctor` is green, nothing else will work. Typical failures: Chrome not running, extension not installed, debug port blocked by 1Password / other extensions. The doctor output tells you which.

---

## Session lifecycle

- `opencli browser *` commands require a `<session>` positional immediately after `browser`. Use the same session name for a multi-step flow; use a different name to isolate parallel browser work.
- Use a stable session name for any multi-command or human-paced browser workflow. Example: `opencli browser fb-yaya-warmup open https://example.com`, then reuse `opencli browser fb-yaya-warmup state`, `extract`, `click`, etc.
- Owned browser sessions keep a tab lease alive between calls. Release it with `opencli browser <session> close` or let the idle timeout expire.
- `opencli browser <session> bind` binds the Chrome tab you already have open to that session. Use this for logged-in pages, SSO flows, or pages you manually positioned before handing control to the agent.
- `--window foreground|background` (or `OPENCLI_WINDOW=foreground|background`) chooses whether OpenCLI creates/focuses a foreground browser window or uses a background browser window for owned sessions.

### Bind Tab

```bash
opencli browser gmail bind
opencli browser gmail state
opencli browser gmail click "Search"
opencli browser gmail network
opencli browser gmail unbind
```

Binding never owns the user window and never closes the user tab. It fails closed if the tab is closed or becomes non-debuggable. Re-run `opencli browser <session> bind` when you switch to a different real tab.

Navigation is allowed on bound sessions because the session now represents explicit agent ownership of that tab. Tab mutation (`tab new`, `tab select`, `tab close`) is still blocked for bound sessions. Use an owned session when you want OpenCLI to manage tab lifecycle.

Bound sessions have no OpenCLI idle-close timer; the binding lasts until `unbind`, tab close, window close, or daemon restart.

---

## Mental model

1. **Selector-first target contract.** Every interaction command (`click`, `type`, `select`, `get text/value/attributes`) takes one `<target>`, which is *either* a numeric ref from `state`/`find` *or* a CSS selector. Use `--nth <n>` to disambiguate multiple CSS matches.
2. **Every envelope reports `matches_n` and `match_level`.** `match_level` is `exact`, `stable`, or `reidentified` — the CLI already rescued moderate DOM drift for you, but the level tells you how confident to be.
3. **Compact output first, full payload on demand.** `state` is a budget-aware snapshot; `get html --as json` supports `--depth/--children-max/--text-max`; `network` returns shape previews and you re-fetch a single body with `--detail <key>`. If you emit a giant payload you are burning context you did not need to burn.
4. **Structured errors are machine-readable.** On failure the CLI emits `{error: {code, message, hint?, candidates?}}`. Branch on `code`, not on message strings.

---

## Critical rules

1. **Always inspect before you act.** Run `state` or `find` first. Never hard-code a ref or selector from memory across sessions — indices are per-snapshot.
2. **Prefer site adapters before raw browser driving.** If `opencli <site> <command>` already covers the task, use that adapter command first (`opencli facebook notifications`, `opencli reddit read`, etc.). Use `opencli browser ...` only for gaps, debugging, or one-off UI flows the adapter does not expose.
3. **Prefer numeric ref over CSS once you have it.** Numeric refs survive mild DOM shifts because the CLI fingerprints each tagged element. A CSS selector written by hand will break the first time the site re-renders.
4. **Read `match_level` after every write.** `exact` = all good. `stable` = the element is the same but some soft attrs drifted — your action still applied. `reidentified` = the original ref was gone and the CLI found a unique replacement; double-check you hit the right element.
5. **Use the `compound` field for form controls.** Do not regex-guess a date format, do not `state` twice to get the full `<select>` options list. The compound envelope has the format string, full option list up to 50, `options_total` for overflow, and `accept`/`multiple` for `<input type=file>`.
6. **Verify writes that matter.** After `type <target> <text>`, run `get value <target>`. After `select`, run `get value`. Autocomplete widgets, React controlled inputs, and masked fields all silently eat characters. The CLI cannot detect this for you.
7. **`state` → action → `state` after a page change.** Navigations, form submits, and SPA route changes invalidate refs. Take a fresh snapshot. Do not reuse refs from before the transition.
8. **Chain with `&&` when reusing freshly parsed refs.** A chained sequence runs in one shell so the ref you just read from output can be passed directly to the next command. Separate shell invocations keep the named browser session, but any shell-local variables or copied refs from the previous command can go stale after page changes.
9. **`eval` is read-only.** Wrap the JS in an IIFE and return JSON. If you need to *change* the page, use the structured `click` / `type` / `select` / `keys` commands instead — they produce structured output and fingerprints, `eval` does not.
10. **Prefer `network` to screen-scraping.** If a page you care about fetches its data from a JSON API, the API is almost always more reliable than scraping the rendered DOM. Capture once, inspect the shape, then `--detail <key>` the body you need.

---

## Sitemaps

`browser analyze <url>` classifies a site (anti-bot vendor, real-data API candidates, pattern A/B/C/D, nearest adapter, next step). If `browser open` or `browser analyze` reports `sitemap.available: true` (sitemap context present), switch to `opencli-browser-sitemap` before continuing a multi-step site flow. The sitemap is prior context for pages, actions, workflows, APIs, and pitfalls; it is not truth. If the browser state disagrees with the sitemap, trust the browser and mark the sitemap stale per `opencli-browser-sitemap`'s health write-back step.

> 注：`sitemap.available` 等 sitemap 字段以 `opencli browser analyze --help` 与实际输出为准；若当前版本输出无该字段，按 `opencli-browser-sitemap` 的 Lookup Order 主动探测 `~/.opencli/sites/<site>/sitemap/`。

---

## Target contract (`<target>` for click / type / select / get text|value|attributes)

```
<target> ::= <numeric-ref> | <css-selector>
```

- **Numeric ref** — the `[N]` index from `state` or `find`. Cheap, resilient to soft DOM drift.
- **CSS selector** — anything `querySelectorAll` accepts. Must be unambiguous on write ops, or pair with `--nth <n>`.

### Envelope on success

```json
{ "clicked": true, "target": "3", "matches_n": 1, "match_level": "exact" }
```

```json
{ "value": "kalevin@example.com", "matches_n": 1, "match_level": "stable" }
```

### match_level

| level | meaning | you should |
|-------|---------|------------|
| `exact` | Fingerprint agreed on tag + strong IDs with at most one soft drift | Proceed. |
| `stable` | Tag + strong IDs still agree, soft signals (aria-label, role, text) drifted | Proceed, but if *what* you typed/clicked matters, re-check with `get value` or `state`. |
| `reidentified` | Original ref was gone; a unique live element matched the fingerprint and was re-tagged with the old ref | Double-check you hit the right element before chaining more writes. |

### Structured error codes

Branch on these, not on the human message:

| code | meaning |
|------|---------|
| `not_found` | Numeric ref is no longer in the DOM. Re-`state`. |
| `stale_ref` | Ref exists but the element at that ref changed identity. Re-`state`. |
| `invalid_selector` | CSS was rejected by `querySelectorAll`. Fix the selector. |
| `selector_not_found` | CSS matches 0 elements. Try `find` with a looser selector. |
| `selector_ambiguous` | CSS matches >1 and no `--nth`. Add `--nth` or narrow the selector. |
| `selector_nth_out_of_range` | `--nth` beyond match count. |
| `option_not_found` | `select` couldn't find an option matching that label/value. Error envelope includes `available: string[]` of the real option labels. |
| `not_a_select` | `select` was called on a non-`<select>` element. |

Error envelope always includes `error.code` and `error.message`. Target errors (`selector_not_found`, `selector_ambiguous`, etc.) often add `error.candidates: string[]` with suggested selectors. `option_not_found` adds `error.available: string[]` instead.

---

## Command reference

完整命令手册(含 Inspect / Get / Interact / Wait / Extract / Network / Tabs / Compound 控件 / Cost guide)见 **`references/command-reference.md`**,按需读取。本节只保留高频命令速查:

- `browser state` — 页面快照,产出 `[N]` refs
- `browser find --css <sel>` / `--role <r> --name <n>` — 精确定位,产出 refs
- `browser click|type|select <target> <arg>` — 交互写入,读回 `match_level`
- `browser get text|value|attributes <target>` — 读一个字段并验证
- `browser wait selector|text "<...>"` — 页面变化后先等再操作
- `browser network [--detail <key>]` — API 数据优先于 DOM 抓取
- `browser extract [--chunk-size N]` — 长文分块提取,循环 `next_start_char`
- `browser screenshot --annotate` — 视觉型页面(图标按钮/CAPTCHA)才用

详细参数、envelope 结构、compound 格式、成本表都进 references 文件。

---

## Chaining rules

**Good — one shell, live session:**

```bash
opencli browser hn open "https://news.ycombinator.com" \
  && opencli browser hn state \
  && opencli browser hn click 3
```

PowerShell 7 等价（`\` 续行不适用，写单行即可）：

```powershell
opencli browser hn open "https://news.ycombinator.com" && opencli browser hn state && opencli browser hn click 3
```

**Bad — each line is a fresh shell, refs from call 1 are already forgotten when call 2 runs.** (Only a problem if you rely on shell-scoped state; browser refs themselves persist in-page, but interleaving unrelated shells invites races.) Prefer `&&` when the steps are meant to be atomic.

**Never** chain a write and then an immediate `state` without a `wait` if the action causes a network round-trip — you will snapshot the pre-response DOM and make bad decisions off stale data.

---

## Recipes

### Fill a login form

```bash
opencli browser login open "https://example.com/login"
opencli browser login state                          # find [N] for email, password, submit
opencli browser login type 4 "me@example.com"
opencli browser login type 5 "hunter2"
opencli browser login get value 4                    # verify (autocomplete can eat chars)
opencli browser login click 6                        # submit
opencli browser login wait selector "[data-testid=account-menu]" --timeout 15000
opencli browser login state                          # fresh refs on the logged-in page
```

### Pick from a long dropdown

```bash
opencli browser form state                          # sidebar shows [12] <select name=country>
opencli browser form find --css "select[name=country]"
# the compound.options_total is 137, but compound.current is "" — unselected.
opencli browser form select 12 "Uruguay"
opencli browser form get value 12                   # { value: "uy", match_level: "exact" }
```

### Pick from a custom React dropdown

Use this for Radix, shadcn, Material UI, Mercury-style category fields, and
other controls that are not native `<select>`.

```bash
opencli browser mercury state                          # find category trigger ref
# If the trigger/option is not clear, use AX:
opencli browser mercury state --source ax              # look for combobox/button/listbox/option names
opencli browser mercury click 7                        # click category trigger
opencli browser mercury state --source ax              # fresh refs after the portal/listbox opens
opencli browser mercury click 12                       # click option
opencli browser mercury get text 7                     # verify visible selected label
```

Do not use `browser select` on these widgets. `browser select` is only for
native `<select>` elements. Custom dropdowns should be driven with
`state -> click trigger -> state -> click option -> verify`.

### Compare DOM vs AX observation

When deciding whether AX refs are better for a page, collect metrics without
sharing page contents:

```bash
opencli browser compare state --compare-sources
```

Report `sources.dom.refs`, `sources.ax.refs`, `frame_sections`,
`approx_tokens`, `elapsed_ms`, and any per-source `error`. Use this before
arguing that AX should become the default on a site.

### Scrape a list via network instead of DOM

```bash
opencli browser hn open "https://news.ycombinator.com"
opencli browser hn network --filter "title,score"
# -> find the /topstories entry, note its key
opencli browser hn network --detail topstories-a1b2
```

### Read a long article in chunks

```bash
opencli browser article open "https://blog.example.com/long-post"
opencli browser article extract --chunk-size 8000
# -> content + next_start_char: 8000
opencli browser article extract --start 8000 --chunk-size 8000
# ...until next_start_char is null
```

### Cross-origin iframe

```bash
opencli browser checkout frames
# -> [{"index": 0, "url": "https://checkout.stripe.com/...", ...}]
opencli browser checkout eval "(() => document.querySelector('input[name=cardnumber]')?.value)()" --frame 0
```

`browser state --source ax` may omit cross-origin iframe contents or fail to
route actions into them when Chrome does not expose an attachable OOPIF target
to the extension. In that case use `browser frames` + `browser eval --frame`, a
normal DOM `state`, or navigate/bind directly to the iframe URL when possible.

---

## Pitfalls

- **Do not submit forms via `eval "document.forms[0].submit()"`** — modern sites intercept with JS handlers and silently drop the call. Either `click` the submit button via its ref, or (if you know the GET URL) just `open` it directly.
- **Do not reuse refs across a page transition.** `wait` for the new state, then re-`state`. Old refs will either 404 or (worse) `reidentify` onto a similarly-shaped element on the new page.
- **`match_level: reidentified` is a warning, not an error.** The action went through, but if you are chaining 5 more writes that all depend on that being the right element, verify with a `get text` or `get value` before continuing.
- **Budget-aware commands silently cap.** `get html --as json` with default budgets will return `truncated: {...}`. If your downstream logic needs the whole subtree, raise `--depth` / `--children-max` or tighten the selector.
- **`autocomplete: true` on a `type` response is not an error.** It means a suggestion popup is open and your value isn't committed yet. Typically `keys Enter` to accept the first suggestion, or `click` the one you want.
- **`network --filter` is AND-semantics on path segments.** `--filter "title,score"` keeps entries whose body shape contains *both* `title` and `score` as path segments, at any depth. It is not a regex.
- **Screenshots are for humans, not for agents.** Use `state` + `find` unless the page is genuinely visual (captcha, chart). Screenshots burn tokens and rarely add signal an agent can act on.

---

## Troubleshooting

| symptom | fix |
|---------|-----|
| `opencli doctor` red: "Browser not connected" | Start Chrome with `--remote-debugging-port=9222`, or install the extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk). |
| `attach failed: chrome-extension://...` | Disable 1Password / other CDP-hungry extensions temporarily. |
| `selector_not_found` right after `state` | Page mutated. `wait selector "..."` then retry. |
| `stale_ref` across every command | You are reusing refs from a prior page. Re-`state`. |
| `click` succeeds but nothing happens | The element is probably a decorative wrapper stealing clicks from the real target. `find --css "..."` with a narrower selector and retry on the inner element. |
| `type` appears to finish but value is wrong | Autocomplete, masked input, or React controlled re-render. Verify with `get value`. Add `keys Enter` or re-type. |
| Giant `get html` output | Pass `--selector` + `--as json --depth 3 --children-max 20 --text-max 200`. |
| Network cache seems stale | Bump `--ttl` down, or let it expire. The cache lives at `~/.opencli/cache/browser-network/`. |

---

## See also

- `opencli-adapter-author` — turning what you just figured out into a reusable `~/.opencli/clis/<site>/<command>.js`.
- `opencli-browser-sitemap` — consuming site sitemap context while driving a browser task; also owns marking stale entries (health write-back).
- `opencli-autofix` — when an existing adapter breaks, this skill walks you through `--trace retain-on-failure` evidence and filing a fix.
