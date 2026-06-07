#!/usr/bin/env node
/**
 * RTK Hook Wrapper for Claude Code
 * Ensures RTK hook is called correctly for Bash commands
 */
const { execSync } = require('child_process');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // Only process Bash commands
    if (toolName !== 'Bash') {
      console.log(data);
      return;
    }

    const command = (input.tool_input && input.tool_input.command) || '';
    if (!command) {
      console.log(data);
      return;
    }

    // Call RTK hook
    const rtkInput = JSON.stringify(input);
    const result = execSync('rtk hook claude', {
      input: rtkInput,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result && result.trim()) {
      // RTK returned a modified command
      console.log(result.trim());
    } else {
      // RTK didn't modify, pass through original
      console.log(data);
    }
  } catch (e) {
    // On error, pass through original
    console.log(data);
  }
});
