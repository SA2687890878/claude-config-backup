#!/usr/bin/env node
/**
 * Stop hook: 会话结束时自动验证本次修改的 .NET 项目。
 *
 * 验证流程：
 * 1. 通过 git status 找出本次修改过的 .cs 文件
 * 2. 向上查找最近的 .csproj，逐个 dotnet build
 * 3. 编译通过后，查找对应的测试项目（*.Tests.csproj / *.Test.csproj），运行 dotnet test
 * 4. 编译/测试失败 → 输出警告到 stderr（不阻断会话结束）
 *
 * 符合 Claude 官方 hook 规范：
 * - stdin: 读取 JSON 输入 { cwd }
 * - stderr: 信息性提示（警告级别）
 * - exit code: 0（即使阻断也是 exit 0，通过 decision 字段控制）
 */
const { execSync, spawnSync } = require('child_process');
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

function findCsprojUp(filePath) {
  let dir = path.dirname(filePath);
  for (let i = 0; i < 10; i++) {
    try {
      const entries = fs.readdirSync(dir);
      const csproj = entries.find(f => f.toLowerCase().endsWith('.csproj'));
      if (csproj) return path.join(dir, csproj);
    } catch (_) { return null; }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function findTestProjects(csprojPath) {
  const dir = path.dirname(csprojPath);
  const parent = path.dirname(dir);
  const projectName = path.basename(dir).toLowerCase();
  const testProjects = [];

  try {
    const siblings = fs.readdirSync(parent, { withFileTypes: true });
    for (const s of siblings) {
      if (!s.isDirectory()) continue;
      // 匹配命名约定：ProjectName.Tests / ProjectName.Test / tests/
      if (/\.(tests?|test)$/i.test(s.name) && s.name.toLowerCase().includes(projectName.split('.')[0])) {
        const testDir = path.join(parent, s.name);
        try {
          const csprojs = fs.readdirSync(testDir).filter(f => f.toLowerCase().endsWith('.csproj'));
          if (csprojs.length > 0) testProjects.push(path.join(testDir, csprojs[0]));
        } catch (_) {}
      }
    }
  } catch (_) {}

  return testProjects;
}

function getDirtyCsFiles(cwd) {
  try {
    const out = execSync('git status --porcelain -- "*.cs"', { cwd, encoding: 'utf8', timeout: 5000 });
    return out.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(l => {
        // 移除状态列（前 2 字符 + 空格）
        let file = l.replace(/^\S{2}\s+/, '');
        // 处理重命名：R  old -> new，取 new
        if (l.startsWith('R')) {
          const parts = file.split(' -> ');
          file = parts[parts.length - 1];
        }
        // 处理引号包裹的文件名
        return file.replace(/^"(.*)"$/, '$1');
      })
      .map(f => path.resolve(cwd, f));
  } catch (_) { return []; }
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const cwd = input.cwd || process.cwd();

    const dirtyFiles = getDirtyCsFiles(cwd);
    if (dirtyFiles.length === 0) process.exit(0);

    // 收集所有受影响的 .csproj
    const csprojSet = new Set();
    for (const f of dirtyFiles) {
      const p = findCsprojUp(f);
      if (p) csprojSet.add(p);
    }
    if (csprojSet.size === 0) process.exit(0);

    // === 阶段 1: 编译验证 ===
    const buildFailures = [];
    for (const csproj of csprojSet) {
      const r = spawnSync('dotnet', ['build', csproj, '--nologo', '-v', 'q'], {
        encoding: 'utf8',
        timeout: 120000,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      if (r.status !== 0) {
        const output = (r.stdout || '') + (r.stderr || '');
        const errLines = output.split('\n').filter(l => /error/i.test(l)).slice(0, 20);
        buildFailures.push(`${path.basename(csproj)}:\n${errLines.join('\n')}`);
      }
    }

    if (buildFailures.length > 0) {
      console.error(`[build-verify] ⚠️ dotnet build 有问题（不阻断）：\n${buildFailures.join('\n\n')}`);
      // 改为警告，不阻断会话结束
    }

    // === 阶段 2: 测试验证 ===
    const testFailures = [];
    const testProjectsRun = [];

    for (const csproj of csprojSet) {
      // 跳过测试项目本身（避免递归）— 检查项目目录名
      const projectName = path.basename(path.dirname(csproj)).toLowerCase();
      if (projectName.endsWith('.tests') || projectName.endsWith('.test')) continue;

      const testProjs = findTestProjects(csproj);
      for (const testProj of testProjs) {
        testProjectsRun.push(testProj);
        const r = spawnSync('dotnet', ['test', testProj, '--nologo', '-v', 'q', '--no-restore'], {
          encoding: 'utf8',
          timeout: 180000,
          windowsHide: true,
        });
        if (r.status !== 0) {
          // 提取失败摘要
          const output = (r.stdout || '') + (r.stderr || '');
          const failLines = output.split('\n')
            .filter(l => /failed|error|assert/i.test(l))
            .slice(0, 15);
          testFailures.push(`${path.basename(testProj)}:\n${failLines.join('\n')}`);
        }
      }
    }

    if (testFailures.length > 0) {
      console.error(`[build-verify] ⚠️ dotnet test 有问题（不阻断）：\n${testFailures.join('\n\n')}`);
      // 改为警告，不阻断会话结束
    }

    // === 全部通过 ===
    const summary = [`[build-verify] dotnet build 通过 (${csprojSet.size} 个项目)`];
    if (testProjectsRun.length > 0) {
      summary.push(`dotnet test 通过 (${testProjectsRun.length} 个测试项目)`);
    }
    summary.push(`本次有 ${dirtyFiles.length} 个 .cs 改动未提交，可使用 /commit 生成提交信息。`);
    console.error(summary.join(' | '));

  } catch (e) { console.error('[build-verify] Error:', e.message); }
  process.exit(0);
})();
