#!/usr/bin/env node
/**
 * Copilot Hook Bridge
 *
 * 目标：在 VS Code Copilot Hooks 下复用现有 Claude hooks 脚本，
 * 解决工具命名和输入字段差异（camelCase vs snake_case）。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const eventName = process.argv[2] || '';
const repoRoot = path.resolve(__dirname, '..', '..');
const legacyHookDir = path.join(repoRoot, 'hooks');

const ROUTES = {
  SessionStart: [
    'session-start.js',
    'project-knowledge.js',
    'knowledge-sync-reminder.js',
  ],
  UserPromptSubmit: [
    'skill-router.js',
    'context-injector.js',
  ],
  Stop: [
    'build-verify.js',
    'metrics-report.js',
    'notify.ps1',
  ],
};

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

function safeJsonParse(raw, fallback = null) {
  if (!raw || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function extractPathFromPatch(patchText) {
  if (!patchText || typeof patchText !== 'string') return '';
  const m = patchText.match(/^\*\*\*\s+(?:Update|Add|Delete)\s+File:\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function pickFirstString(...candidates) {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return '';
}

function getRawToolName(input) {
  return pickFirstString(
    input?.tool_name,
    input?.toolName,
    input?.tool?.name,
    input?.tool?.id,
    input?.name
  );
}

function getRawToolInput(input) {
  return (
    input?.tool_input ||
    input?.toolInput ||
    input?.input ||
    input?.params ||
    {}
  );
}

function normalizeToolInput(rawToolName, rawToolInput) {
  const out = {};

  const filePath = pickFirstString(
    rawToolInput.file_path,
    rawToolInput.filePath,
    rawToolInput.path,
    rawToolInput.uri,
    rawToolInput.targetPath,
    rawToolInput.file
  );

  if (filePath) out.file_path = filePath;

  const content = pickFirstString(
    rawToolInput.content,
    rawToolInput.text,
    rawToolInput.newContent,
    rawToolInput.newCode,
    rawToolInput.input,
    rawToolInput.patch
  );

  if (content) out.content = content;

  const newString = pickFirstString(
    rawToolInput.new_string,
    rawToolInput.newString,
    rawToolInput.replacement,
    rawToolInput.value
  );

  if (newString) out.new_string = newString;

  const command = pickFirstString(
    rawToolInput.command,
    rawToolInput.cmd,
    rawToolInput.script
  );

  if (command) out.command = command;

  // apply_patch 兼容：从 patch 文本提取文件路径
  if (/apply[_-]?patch/i.test(rawToolName)) {
    const patch = pickFirstString(rawToolInput.input, rawToolInput.patch);
    if (patch && !out.file_path) {
      out.file_path = extractPathFromPatch(patch);
    }
    if (patch && !out.content) {
      out.content = patch;
    }
    if (patch && !out.new_string) {
      out.new_string = patch;
    }
  }

  return out;
}

function mapToolName(rawToolName, normalizedToolInput) {
  const t = String(rawToolName || '').toLowerCase();

  if (
    t === 'bash' ||
    /terminal|shell|run[_-]?in[_-]?terminal|powershell|runcommand|run_command/.test(t) ||
    typeof normalizedToolInput.command === 'string'
  ) {
    return 'Bash';
  }

  if (t === 'write' || /create[_-]?file|write/.test(t)) {
    return 'Write';
  }

  if (t === 'edit' || /apply[_-]?patch|replace|insert|rename|delete|move|edit/.test(t)) {
    return 'Edit';
  }

  if ((normalizedToolInput.file_path || normalizedToolInput.content || normalizedToolInput.new_string)) {
    return 'Edit';
  }

  return rawToolName || '';
}

function buildLegacyPayload(input) {
  const rawToolName = getRawToolName(input);
  const rawToolInput = getRawToolInput(input);
  const normalizedToolInput = normalizeToolInput(rawToolName, rawToolInput);
  const mappedToolName = mapToolName(rawToolName, normalizedToolInput);

  return {
    // 兼容 Claude hooks
    tool_name: mappedToolName,
    tool_input: normalizedToolInput,

    // 兼容仓库里少量非标准脚本（artifact-index-update 用 tool/params）
    tool: mappedToolName,
    params: {
      file_path: normalizedToolInput.file_path || '',
      content: normalizedToolInput.content || '',
      new_string: normalizedToolInput.new_string || '',
      command: normalizedToolInput.command || '',
    },

    // 会话/上下文
    cwd: input?.cwd || process.cwd(),
    prompt: input?.prompt || '',
    hook_event_name: input?.hook_event_name || eventName,
    timestamp: input?.timestamp,
    session_id: input?.session_id,
    transcript_path: input?.transcript_path,
  };
}

function getScriptsForEvent(event, payload) {
  if (event === 'PreToolUse') {
    if (payload.tool_name === 'Bash') {
      return ['bash-guard.js', 'commit-gate.js'];
    }
    if (payload.tool_name === 'Write' || payload.tool_name === 'Edit') {
      return ['secret-guard.js', 'write-guard.js', 'encrypted-write-guard.js', 'impact-guard.js'];
    }
    return [];
  }

  if (event === 'PostToolUse') {
    const scripts = [];

    if (payload.tool_name === 'Write' || payload.tool_name === 'Edit') {
      scripts.push(
        'cs-guard.js',
        'quality-guard.js',
        'logic-guard.js',
        'test-reminder.js',
        'sqlite-index-update.js',
        'learning-recorder.js',
        'vue-guard.js',
        'source-sync-update.js',
        'review-trigger.js',
        'artifact-index-update.js'
      );
    }

    if (payload.tool_name === 'Bash') {
      scripts.push('git-commit-review.js');
    }

    // 原配置中 PostToolUse 有一个全量 metrics 收集
    scripts.push('metrics-collector.js');

    return scripts;
  }

  return ROUTES[event] || [];
}

function executeScript(scriptName, payload) {
  const scriptPath = path.join(legacyHookDir, scriptName);
  if (!fs.existsSync(scriptPath)) {
    return {
      scriptName,
      status: 0,
      stdout: '',
      stderr: `[copilot-hook-bridge] Skip missing script: ${scriptPath}\n`,
      parsed: null,
    };
  }

  const isPs1 = /\.ps1$/i.test(scriptPath);
  const command = isPs1 ? 'powershell' : 'node';
  const args = isPs1
    ? ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]
    : [scriptPath];

  const result = spawnSync(command, args, {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    cwd: payload.cwd || repoRoot,
    windowsHide: true,
    timeout: eventName === 'Stop' ? 240000 : 120000,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const parsed = safeJsonParse(stdout, null);

  return {
    scriptName,
    status: typeof result.status === 'number' ? result.status : 0,
    stdout,
    stderr,
    parsed,
  };
}

function mergeOutput(event, execResults) {
  const additionalContexts = [];
  const systemMessages = [];
  let blockedReason = '';

  for (const r of execResults) {
    if (r.stderr) {
      process.stderr.write(r.stderr);
    }

    const parsed = r.parsed;
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.additionalContext === 'string' && parsed.additionalContext.trim()) {
        additionalContexts.push(parsed.additionalContext.trim());
      }

      if (parsed.hookSpecificOutput && typeof parsed.hookSpecificOutput.additionalContext === 'string' && parsed.hookSpecificOutput.additionalContext.trim()) {
        additionalContexts.push(parsed.hookSpecificOutput.additionalContext.trim());
      }

      if (typeof parsed.systemMessage === 'string' && parsed.systemMessage.trim()) {
        systemMessages.push(parsed.systemMessage.trim());
      }

      if (!blockedReason) {
        if (parsed.decision === 'block') {
          blockedReason = pickFirstString(parsed.reason, parsed.explanation) || `Blocked by ${r.scriptName}`;
        } else if (parsed.hookSpecificOutput?.permissionDecision === 'deny') {
          blockedReason = pickFirstString(parsed.hookSpecificOutput.permissionDecisionReason) || `Denied by ${r.scriptName}`;
        } else if (parsed.continue === false) {
          blockedReason = pickFirstString(parsed.stopReason) || `Stopped by ${r.scriptName}`;
        }
      }
    }

    if (!blockedReason && r.status === 2) {
      blockedReason = `Blocked by ${r.scriptName} (exit code 2)`;
    }
  }

  const combinedContext = additionalContexts.length > 0 ? additionalContexts.join('\n\n') : '';
  const combinedSystemMessage = systemMessages.length > 0 ? systemMessages.join('\n') : '';

  const output = {};

  if (event === 'PreToolUse') {
    if (blockedReason) {
      output.hookSpecificOutput = {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: blockedReason,
      };
    } else if (combinedContext) {
      output.hookSpecificOutput = {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext: combinedContext,
      };
    }
  } else if (event === 'PostToolUse') {
    if (blockedReason) {
      output.decision = 'block';
      output.reason = blockedReason;
    }
    if (combinedContext) {
      output.hookSpecificOutput = {
        hookEventName: 'PostToolUse',
        additionalContext: combinedContext,
      };
    }
  } else if (event === 'SessionStart' || event === 'UserPromptSubmit' || event === 'SubagentStart') {
    if (combinedContext) {
      output.hookSpecificOutput = {
        hookEventName: event,
        additionalContext: combinedContext,
      };
    }
  } else if (event === 'Stop') {
    // Stop 默认只做报告/通知，不强制 block；保留 additionalContext 注入能力
    if (combinedContext) {
      output.hookSpecificOutput = {
        hookEventName: 'Stop',
        additionalContext: combinedContext,
      };
    }
  }

  if (combinedSystemMessage) {
    output.systemMessage = combinedSystemMessage;
  }

  return output;
}

async function main() {
  try {
    if (!eventName) process.exit(0);

    const raw = await readStdin();
    const input = safeJsonParse(raw, {}) || {};

    const payload = buildLegacyPayload(input);
    const scripts = getScriptsForEvent(eventName, payload);
    if (scripts.length === 0) process.exit(0);

    const results = scripts.map((script) => executeScript(script, payload));
    const out = mergeOutput(eventName, results);

    if (Object.keys(out).length > 0) {
      process.stdout.write(JSON.stringify(out));
    }
  } catch (e) {
    console.error('[copilot-hook-bridge] Error:', e.message);
  }

  process.exit(0);
}

main();
