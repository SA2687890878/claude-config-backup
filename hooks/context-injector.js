#!/usr/bin/env node
/**
 * UserPromptSubmit hook: 智能注入规则上下文
 *
 * 根据输入关键词，自动注入对应的规则文件
 * 合并了原先的：inject-git-rules.js、inject-token-rules.js、prompt-optimizer.js
 */
const fs = require('fs');
const path = require('path');

// 会话级注入去重：同一会话内同一规则只注入一次，
// 避免多轮对话反复命中关键词重复注入规则，浪费 token
const CACHE_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', '.cache', 'context-injector');

function loadInjected(sessionId) {
  try {
    const f = path.join(CACHE_DIR, sessionId + '.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) { /* 读取失败视为未注入 */ }
  return [];
}

function saveInjected(sessionId, names) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, sessionId + '.json'), JSON.stringify(names));
  } catch (e) { /* 写入失败不影响主流程 */ }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

async function main() {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);

    const input = JSON.parse(raw);
    const prompt = input.prompt || '';
    // 会话标识：优先 session_id，退而求其次用转录文件路径
    const sessionId = input.session_id || input.transcript_path || 'default';

    // 规则配置：关键词 → 文件路径 + 最大行数
    const rules = [
      {
        name: 'Git',
        keywords: /git\s+(commit|push|branch|merge|rebase|checkout|stash|reset|cherry-pick|revert)|提交|推送|分支|合并|变基|暂存|回滚/i,
        path: 'workflows/git.md',
        maxLines: 40
      },
      {
        name: 'Token Optimization',
        keywords: /codegraph|search\.ps1|sqlite[-_]?index|代码索引|token.{0,3}优化|rtk\s+(gain|proxy|discover)/i,
        path: 'token-optimization/overview.md',
        maxLines: 40
      },
      {
        name: 'Security',
        keywords: /密钥|password|api[-_]?key|secret|credential|token|安全|防护/i,
        path: 'tools/security.md',
        maxLines: 30
      },
      {
        name: 'SQL Server',
        keywords: /sql\s+server|mssql|sqlconnection|system\.data\.sqlclient|sqlcommand|sqlparameter/i,
        path: 'languages/sqlserver.md',
        maxLines: 30
      },
      {
        name: 'PostgreSQL',
        keywords: /postgresql|postgres|npgsql|pg\s+(database|query)|pgadmin|psql/i,
        path: 'languages/postgresql.md',
        maxLines: 30
      },
      {
        name: 'C#',
        keywords: /\.net|dotnet|c#|async\s+await|task\.run|iasyncenumerable|cancellationtoken|ioc|di\s+container|ef\s+core|entity framework/i,
        path: 'languages/csharp.md',
        maxLines: 40
      },
      {
        name: 'WPF',
        keywords: /wpf|xaml|mvvm|dispatcher|propertychanged\.fody|communitytoolkit\.mvvm/i,
        path: 'languages/wpf.md',
        maxLines: 45
      },
      {
        name: 'Logging and Observability',
        keywords: /日志|serilog|openobserve|trace.?id|correlation.?id|调用链|可观测性/i,
        path: 'quality/logging-observability.md',
        maxLines: 40
      },
      {
        name: 'Sanhua PCS',
        keywords: /三花|pcs\s*(数采|设备|标刻|日志|测试)|markdata|com_id|act_name|条码|工单|标刻指令|设备反馈|分区表/i,
        path: '../project/sanhua/INDEX.md',
        maxLines: 50
      },
      {
        name: 'Task Stack',
        keywords: /继续|上次|恢复|切换|暂停|pause|active\.json|任务栈|上次做到哪了/i,
        path: 'workflows/task-management.md',
        maxLines: 25
      }
    ];

    // 找到匹配的规则
    const matched = rules.filter(r => r.keywords.test(prompt));
    if (matched.length === 0) process.exit(0);

    // 会话级去重：跳过本会话已注入过的规则，避免重复注入浪费 token
    const injected = loadInjected(sessionId);
    const fresh = matched.filter(r => !injected.includes(r.name));
    if (fresh.length === 0) process.exit(0);

    const rulesDir = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'knowledge', 'rules');
    const contexts = [];

    for (const rule of fresh) {
      const rulePath = path.join(rulesDir, rule.path);

      if (fs.existsSync(rulePath)) {
        try {
          const content = fs.readFileSync(rulePath, 'utf8');
          const lines = content.split('\n').slice(0, rule.maxLines).join('\n');
          contexts.push(`## ${rule.name}\n\n${lines}`);
        } catch (e) {
          console.error(`[context-injector] Failed to read ${rule.path}:`, e.message);
        }
      }
    }

    if (contexts.length > 0) {
      console.log(JSON.stringify({
        additionalContext: contexts.join('\n\n---\n\n')
      }));
      // 记录本次已注入的规则，供会话内去重
      saveInjected(sessionId, [...injected, ...fresh.map(r => r.name)]);
    }
  } catch (e) {
    console.error('[context-injector] Error:', e.message);
  }
  process.exit(0);
}

main();
