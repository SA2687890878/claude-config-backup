#!/usr/bin/env node
/**
 * UserPromptSubmit hook: 检测 skill 触发词，自动注入路由上下文
 * 让 LLM 不用记住关键词，hook 自动告诉它该走哪个 skill。
 *
 * 设计原则：
 * - 只在用户明确要求"执行"时触发，讨论/分析不触发
 * - 注入的是路由提示，不是完整指令（避免 token 浪费）
 * - 多个匹配时选第一个（优先级从上到下）
 */

const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

// 触发词 → skill 映射（按优先级排序）
// 注意：只匹配"执行意图"，不匹配纯讨论/分析
const ROUTES = [
  {
    // 继续工作 → 恢复 task-state
    pattern: /继续(工作|上次|开发|实现|做)|上次做到哪|进度|恢复/i,
    skill: null,
    action: 'restore-task-state',
    hint: '检查 memory/task-state.md 恢复上次进度',
  },
  {
    // 全流程编排（新：放在第一优先级，避免被单 skill 抢走）
    pattern: /(?:一键|全流程|帮我开发|帮我做|按计划|自动跑|联动|编排|一条龙).*(?:功能|项目|模块|需求)/i,
    skill: '/pipeline-executor',
    hint: '触发 /pipeline-executor 全链路编排调度',
  },
  {
    // 需求讨论/设计
    pattern: /(?:讨论|设计|方案|头脑风暴|需求分析|需求探索).*(?:一下|吧|需求|功能|模块)|(?:帮我|我们).*(?:讨论|设计|分析需求)/i,
    skill: '/requirements',
    hint: '触发 /requirements 需求探索流程',
  },
  {
    // 功能开发
    pattern: /(?:开发|添加|实现|写一个|写个|新建).*(?:功能|接口|页面|模块|服务|组件)|(?:帮我|给我).*(?:开发|实现|添加)/i,
    skill: '/dev-workflow',
    hint: '触发 /dev-workflow 开发工作流',
  },
  {
    // 架构评审
    pattern: /(?:架构|方案).*(?:评审|审查|review|合理|可行)|(?:评审|review).*(?:架构|方案)/i,
    skill: '/arch-review',
    hint: '触发 /arch-review 架构审查流程',
  },
  {
    // Bug 修复
    pattern: /(?:修复|修|改|排查|定位|解决).*(?:bug|报错|错误|异常|失败|问题|崩)|(?:有|出|这个).*(?:bug|报错|异常|问题)|修复.*(?:一下|吧)|(?:出错了|报错了|挂了|崩溃)/i,
    skill: '/systematic-debugging',
    hint: '触发 /systematic-debugging 问题排查流程',
  },
  {
    // 性能优化
    pattern: /(?:优化|调优|加速|慢|卡|性能).*(?:一下|吧|问题)|(?:接口|查询|页面).*(?:慢|卡|超时)/i,
    skill: '/perf-tune',
    hint: '触发 /perf-tune 性能调优流程',
  },
  {
    // 代码搜索/定位
    pattern: /(?:找|搜索|定位|在哪|查一下).*(?:代码|方法|函数|类|文件|接口|页面)|(?:代码).*(?:在哪|在哪里|位置|哪里)/i,
    skill: '/code-radar',
    hint: '触发 /code-radar 代码定位',
  },
  {
    // 代码审查
    pattern: /(?:审查|review|检查|看看).*(?:代码|改动|diff|提交)|(?:帮我|给我).*(?:review|审查)/i,
    skill: '/review',
    hint: '触发 /review 代码审查流程',
  },
  {
    // 测试
    pattern: /(?:跑|运行|执行|跑一下).*(?:测试|test)|(?:测试|test).*(?:失败|通过|过了|跑一下)|回归测试/i,
    skill: '/test',
    hint: '触发 /test 测试执行流程',
  },
  {
    // 数据库变更
    pattern: /(?:数据库|表|字段|迁移|scaffold|migration).*(?:添加|修改|删除|创建)|(?:建|改|加).*(?:表|字段|索引)/i,
    skill: '/sql-best-practices',
    hint: '触发 /sql-best-practices 数据库变更流程',
  },
  {
    // 保存经验/进度
    pattern: /(?:保存|记录|存一下).*(?:经验|进度|记忆|心得)|(?:下次|以后).*(?:继续|接着)/i,
    skill: '/save-memory',
    hint: '触发 /save-memory 经验与进度管理',
  },
  {
    // Git 提交
    pattern: /(?:提交|commit|push|推送).*(?:一下|吧|代码)|(?:帮我|给我).*(?:提交|commit)/i,
    skill: '/commit',
    hint: '触发 /commit 提交信息生成流程',
  },
  {
    // 文档生成
    pattern: /(?:写|生成|出|整理).*(?:文档|doc|说明|readme)|(?:帮我|给我).*(?:写|生成).*(?:文档|doc)/i,
    skill: '/docs',
    hint: '触发 /docs 文档生成流程',
  },
  {
    // 发布/上线
    pattern: /(?:发布|上线|部署|发布一下).*(?:版本|分支|项目)|准备.*(?:上线|发布)/i,
    skill: '/verification-before-completion',
    hint: '触发 /verification-before-completion 发布前验证',
  },
];

async function main() {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);

    const input = JSON.parse(raw);
    const prompt = input.prompt || '';

    // 太短的输入不处理（避免误触发）
    if (prompt.length < 4) process.exit(0);

    // 跳过已经是 slash command 的输入
    if (/^\s*\//.test(prompt)) process.exit(0);

    // 跳过纯讨论/提问（没有执行意图的词）
    if (/^(?:什么是|怎么理解|为什么|如何看|介绍一下|解释|tell me|what is|why|how)/i.test(prompt)) {
      process.exit(0);
    }

    for (const route of ROUTES) {
      if (route.pattern.test(prompt)) {
        const lines = [];

        if (route.action === 'restore-task-state') {
          // 恢复任务进度：优先读 active.json，fallback 到 task-state.md
          const activePath = path.join(
            process.env.USERPROFILE || process.env.HOME || '',
            '.claude', 'tasks', 'active.json'
          );
          if (fs.existsSync(activePath)) {
            try {
              const active = JSON.parse(fs.readFileSync(activePath, 'utf8'));
              if (active.active && active.active.length > 0) {
                const task = active.active[0];
                lines.push('## 自动恢复：上次任务');
                lines.push(`任务: ${task.title || task.id}`);
                lines.push(`阶段: ${task.stage}`);
                lines.push(`产物: ${task.product_path}`);
                if (task.paused_at) lines.push(`断点: ${task.paused_at}`);
                if (task.links) lines.push(`关联: ${JSON.stringify(task.links)}`);
                lines.push('');
                lines.push('> 请读取 active.json 和对应产物，从断点继续。');
              } else {
                lines.push('## 提示');
                lines.push('active.json 无活跃任务。');
                lines.push('检查 .index.json 查找历史任务，或 git status 检查项目状态。');
              }
            } catch (e) {
              lines.push('## 提示');
              lines.push('active.json 读取失败: ' + e.message);
            }
          } else {
            // fallback: 读旧的 task-state.md
            const cwd = input.cwd || process.cwd();
            const projectPath = cwd.replace(/:/g, '-').replace(/[\/\\]/g, '-');
            const taskStatePath = path.join(
              process.env.USERPROFILE || process.env.HOME || '',
              '.claude', 'projects', projectPath, 'memory', 'task-state.md'
            );
            if (fs.existsSync(taskStatePath)) {
              try {
                const content = fs.readFileSync(taskStatePath, 'utf8');
                lines.push('## 自动恢复：上次任务进度');
                lines.push('');
                lines.push(content);
                lines.push('');
                lines.push('> 请读取上述进度，报告给用户并询问是否继续。');
              } catch (e) {
                lines.push('## 提示');
                lines.push('检测到任务进度文件，但读取失败: ' + e.message);
              }
            } else {
              lines.push('## 提示');
              lines.push('没有找到保存的任务进度（active.json/task-state.md）。');
              lines.push('运行 `git status` 检查当前项目状态。');
            }
          }
        } else {
          // Skill 路由
          lines.push('## Skill 路由');
          lines.push('');
          lines.push(`检测到执行意图 → ${route.hint}`);
          lines.push('');
          lines.push(`请使用 Skill 工具调用 \`${route.skill}\` 启动对应流程。`);
          lines.push('');
          lines.push('> 注意：这是 hook 自动注入的路由提示，不需要用户手动输入 slash command。');
        }

        console.log(JSON.stringify({ additionalContext: lines.join('\n') }));
        break; // 只匹配第一个
      }
    }
  } catch (e) {
    console.error('[skill-router] Error:', e.message);
  }
  process.exit(0);
}

main();
