# OpenCLI 策略梯子 + 双层记忆 + Verify + 限频

> 来源：`strategy-selection:18` 837adapter实测 + `site-memory:12` + `browser:95` + `smart-search:42`

## 梯子（契约优先）

| Strategy | fixes/年 | 优先级 |
|----------|----------|--------|
| PUBLIC_API | 1.18 | 1首选 |
| COOKIE_API | 2.01 | 2 |
| UI_SELECTOR | 1.92 | 2平级 |
| PAGE_FETCH | 8.41 | 3末选 |
| INTERCEPT | 8.69 | 3末选 |

> 能用契约层不用无契约，PAGE_FETCH/INTERCEPT维护7-8倍

## 双层记忆

`references/site-memory/<site>.md` 种子 + `~/.opencli/sites/<site>/field-map.json` 本地累积，二次同站跳recon（`site-memory:12`+`author:188`）

## Verify

`--trace + keep-tab + matches_n/match_level exact/stable/reidentified`（`browser:95`）

## 限频

单题AI1/非AI2第3次禁，跨agent `~/.opencli/search-budget.json`（`smart-search:42`）
