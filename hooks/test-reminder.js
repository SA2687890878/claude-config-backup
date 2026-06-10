#!/usr/bin/env node
/**
 * PostToolUse hook: 写完 .cs 文件后，若该文件存在对应测试项目，提示主 agent 运行测试。
 * 命名约定：MyProject.csproj → MyProject.Tests.csproj 或 *.Test.csproj 或 tests/ 目录。
 * 本 hook 只输出建议，不阻塞、不自动跑（避免拖慢工作流）。
 */
const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const tool = input.tool_name || '';
    if (tool !== 'Write' && tool !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!/\.cs$/i.test(filePath)) return;
    if (/[\\/](Tests?|Test)[\\/]/i.test(filePath)) return; // 测试文件本身不提示

    // 向上找最近的 csproj
    let dir = path.dirname(filePath);
    let csprojDir = null;
    for (let i = 0; i < 10; i++) {
      try {
        const entries = fs.readdirSync(dir);
        if (entries.some(f => f.toLowerCase().endsWith('.csproj'))) { csprojDir = dir; break; }
      } catch (_) { return; }
      const parent = path.dirname(dir);
      if (parent === dir) return;
      dir = parent;
    }
    if (!csprojDir) return;

    // 查找同级或父级的测试项目
    const projectName = path.basename(csprojDir);
    const parent = path.dirname(csprojDir);
    let testProj = null;
    try {
      const siblings = fs.readdirSync(parent, { withFileTypes: true });
      const candidates = siblings.filter(d => d.isDirectory() && /\.(tests?|test)$/i.test(d.name) && d.name.toLowerCase().includes(projectName.toLowerCase().split('.')[0]));
      for (const c of candidates) {
        const csprojs = fs.readdirSync(path.join(parent, c.name)).filter(f => f.toLowerCase().endsWith('.csproj'));
        if (csprojs.length > 0) { testProj = path.join(parent, c.name, csprojs[0]); break; }
      }
    } catch (_) {}

    if (testProj) {
      console.error(`[test-reminder] .cs 已修改 → 建议运行：dotnet test "${testProj}"`);
    }
  } catch (_) {}
});
