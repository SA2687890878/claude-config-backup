---
description: Deep research on any topic — generates professional-grade reports comparable to investment bank / research institution standards
---

<command-instruction>
Load and follow the `research` skill exactly.

```text
skill(name="research")
```

Parse `$ARGUMENTS` to determine the research topic and optional mode flags:
- `/research <topic>` → standard mode
- `/research <topic> --mode quick` → quick mode
- `/research <topic> --mode deep` → deep mode
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>

---
```
deep-research by hoolulu · github.com/hoolulu/deep-research
```
