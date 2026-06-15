#!/usr/bin/env node
/**
 * PreToolUse hook: Git commit 前强制验证编译和测试
 *
 * 触发时机：git commit 命令执行前
 * 验证流程：
 * 1. 检测 Bash 命令是否包含 git commit
 * 2. 查找修改过的 .cs 文件（git diff）
 * 3. 定位所属的 .csproj，执行 dotnet build
 * 4. 如果有测试项目，执行 dotnet test
 * 5. 失败 → decision: "block"（阻断提交）
 *
 * 符合 Claude 官方 hook 规范：
 * - stdin: { tool_name, tool_input: { command } }
 * - stdout: JSON { decision: "allow" | "block", explanation }
 * - exit code: 0
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

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);
    const input = JSON.parse(raw);

    // 只拦截 git commit
    if (input.tool_name !== 'Bash') process.exit(0);
    const command = input.tool_input?.command || '';
    if (!/git\s+commit/i.test(command)) process.exit(0);

    // 查找修改过的 .cs 文件
    let changedCsFiles = [];
    try {
      const gitOutput = execSync('git diff --name-only HEAD', { encoding: 'utf8', timeout: 5000 });
      changedCsFiles = gitOutput.split('\n').filter(f => f.trim() && f.toLowerCase().endsWith('.cs'));

      // 如果 HEAD 没有改动，检查暂存区
      if (changedCsFiles.length === 0) {
        const stagedOutput = execSync('git diff --cached --name-only', { encoding: 'utf8', timeout: 5000 });
        changedCsFiles = stagedOutput.split('\n').filter(f => f.trim() && f.toLowerCase().endsWith('.cs'));
      }
    } catch (_) {
      process.exit(0); // 不是 git 仓库或无改动
    }

    if (changedCsFiles.length === 0) process.exit(0); // 没有 .cs 修改，不验证

    // 找到所有相关的 .csproj
    const csprojSet = new Set();
    for (const csFile of changedCsFiles) {
      const absPath = path.resolve(csFile);
      if (!fs.existsSync(absPath)) continue;
      const csproj = findCsprojUp(absPath);
      if (csproj) csprojSet.add(csproj);
    }

    if (csprojSet.size === 0) process.exit(0);

    const issues = [];

    // 验证编译
    for (const csproj of csprojSet) {
      const r = spawnSync('dotnet', ['build', csproj, '--nologo', '-v', 'q', '--no-restore'], {
        encoding: 'utf8',
        timeout: 120000,
        windowsHide: true,
      });

      if (r.status !== 0) {
        const output = (r.stdout || '') + (r.stderr || '');
        const errLines = output.split('\n')
          .filter(l => /error|错误/i.test(l))
          .slice(0, 5);
        issues.push(`编译失败: ${path.basename(csproj)}\n${errLines.join('\n')}`);
      }
    }

    // 验证测试
    for (const csproj of csprojSet) {
      const projectName = path.basename(path.dirname(csproj)).toLowerCase();
      if (projectName.endsWith('.tests') || projectName.endsWith('.test')) continue;

      const testProjs = findTestProjects(csproj);
      for (const testProj of testProjs) {
        const r = spawnSync('dotnet', ['test', testProj, '--nologo', '-v', 'q', '--no-restore'], {
          encoding: 'utf8',
          timeout: 180000,
          windowsHide: true,
        });

        if (r.status !== 0) {
          const output = (r.stdout || '') + (r.stderr || '');
          const failLines = output.split('\n')
            .filter(l => /failed|error/i.test(l))
            .slice(0, 5);
          issues.push(`测试失败: ${path.basename(testProj)}\n${failLines.join('\n')}`);
        }
      }
    }

    // 判断是否阻断
    if (issues.length > 0) {
      console.log(JSON.stringify({
        decision: 'block',
        explanation: `⛔ 提交被阻断（Quality Gate 失败）：\n\n${issues.join('\n\n')}\n\n请先修复问题，再尝试提交。`
      }));
    }

  } catch (e) {
    console.error('[commit-gate] Error:', e.message);
  }
  process.exit(0);
})();
