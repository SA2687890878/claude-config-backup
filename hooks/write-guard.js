#!/usr/bin/env node
/**
 * Write Guard Hook (PreToolUse)
 *
 * Blocks unnecessary .md/.txt file creation while allowing:
 * - Special files: README.md, CLAUDE.md, AGENTS.md, CONTRIBUTING.md
 * - System directories: ~/.claude/(skills|plans|commands)/
 * - Project working directories (any path outside home root)
 *
 * Only blocks .md/.txt files created directly in the home directory root.
 */

const os = require('os');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const p = (input.tool_input && input.tool_input.file_path) || '';
    const resolvedPath = path.resolve(String(p));
    const normalizedPath = resolvedPath.replace(/\\/g, '/');
    const normalizedHome = os.homedir().replace(/\\/g, '/').replace(/\/+$/, '');
    const normalizedParent = path.dirname(resolvedPath).replace(/\\/g, '/').replace(/\/+$/, '');

    const isMdOrTxt = /\.(md|txt)$/i.test(p);

    if (isMdOrTxt) {
      const isSpecialFile = /(README|CLAUDE|AGENTS|CONTRIBUTING|CHANGELOG)\.md$/i.test(path.basename(resolvedPath));
      if (isSpecialFile) {
        console.log(data);
        return;
      }

      const isSystemDir = /[\/]\.claude[\/](skills|plans|commands|hooks|workflows)[\/]/i.test(normalizedPath);
      if (isSystemDir) {
        console.log(data);
        return;
      }

      if (normalizedParent === normalizedHome) {
        console.error('[Hook] BLOCKED: Unnecessary documentation file in home directory');
        console.error('[Hook] File: ' + normalizedPath);
        console.error('[Hook] Tip: Move to a project directory or use README.md');
        process.exit(2);
        return;
      }

      console.log(data);
      return;
    }

    console.log(data);
  } catch (e) {
    console.log(data);
  }
});
