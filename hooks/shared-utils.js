#!/usr/bin/env node
/**
 * Shared utility functions for DSH hooks
 * 
 * Extracted from build-verify.js, commit-gate.js, and completion-reminder.js
 * to eliminate code duplication.
 */
const fs = require('fs');
const path = require('path');

/**
 * Find the nearest .csproj file by walking up from the given file path
 * @param {string} filePath - Starting file path
 * @returns {string|null} - Path to .csproj or null if not found
 */
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

/**
 * Find test projects associated with a given .csproj
 * @param {string} csprojPath - Path to the main .csproj
 * @returns {string[]} - Array of paths to test project .csproj files
 */
function findTestProjects(csprojPath) {
  const dir = path.dirname(csprojPath);
  const parent = path.dirname(dir);
  const projectName = path.basename(dir).toLowerCase();
  const testProjects = [];

  try {
    const siblings = fs.readdirSync(parent, { withFileTypes: true });
    for (const s of siblings) {
      if (!s.isDirectory()) continue;
      // Match naming convention: ProjectName.Tests / ProjectName.Test / tests/
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

/**
 * Find a single test project (for completion-reminder.js compatibility)
 * @param {string} filePath - Path to the source file
 * @returns {string|null} - Path to test project .csproj or null
 */
function findTestProject(filePath) {
  const testProjects = [];
  let dir = path.dirname(filePath);
  let csprojDir = null;
  
  for (let i = 0; i < 10; i++) {
    try {
      if (fs.readdirSync(dir).some(f => f.toLowerCase().endsWith('.csproj'))) {
        csprojDir = dir;
        break;
      }
    } catch (e) { return null; }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  
  if (!csprojDir) return null;
  
  const projectName = path.basename(csprojDir);
  const parent = path.dirname(csprojDir);
  
  try {
    const siblings = fs.readdirSync(parent, { withFileTypes: true });
    for (const d of siblings) {
      if (d.isDirectory() && /\.(tests?|test)$/i.test(d.name) && d.name.toLowerCase().includes(projectName.toLowerCase().split('.')[0])) {
        const csprojs = fs.readdirSync(path.join(parent, d.name)).filter(f => f.toLowerCase().endsWith('.csproj'));
        if (csprojs.length > 0) return path.join(parent, d.name, csprojs[0]);
      }
    }
  } catch (e) {}
  
  return null;
}

/**
 * Git security check patterns (merged from bash-guard.js and git-commit-review.js)
 * @returns {Array} - Array of pattern objects with label, severity, confidence, description, fix
 */
function getGitSecurityPatterns() {
  return [
    // Force push patterns
    {
      pattern: /git\s+push\s+.*--force/,
      label: 'Force push detected',
      severity: 'HIGH',
      confidence: 95,
      description: '强制推送可能覆盖其他人的代码',
      fix: '使用 --force-with-lease 或确认分支是独占的',
      level: 'block'
    },
    {
      pattern: /git\s+push\s+.*--force-with-lease/,
      label: 'Force push with lease',
      severity: 'MEDIUM',
      confidence: 70,
      description: '使用 --force-with-lease 比 --force 安全',
      fix: '确认分支是独占的',
      level: 'warn'
    },
    // Protected branch patterns
    {
      pattern: /git\s+push\s+.*origin\s+(main|master|develop)/,
      label: 'Push to protected branch',
      severity: 'HIGH',
      confidence: 90,
      description: '推送到受保护的分支',
      fix: '使用 Pull Request 流程',
      level: 'block'
    },
    // Commit message secrets
    {
      pattern: /git\s+commit\s+.*-m\s*["'].*(?:password|secret|token|key|credential)/i,
      label: 'Secret in commit message',
      severity: 'HIGH',
      confidence: 85,
      description: '提交信息中包含敏感词',
      fix: '不要在提交信息中包含敏感信息',
      level: 'warn'
    },
    // Skip commit hooks
    {
      pattern: /git\s+commit\s+.*--no-verify/,
      label: 'Skip commit hooks',
      severity: 'MEDIUM',
      confidence: 60,
      description: '跳过提交钩子',
      fix: '确保所有钩子都通过',
      level: 'warn'
    },
    // Hard reset
    {
      pattern: /git\s+reset\s+.*--hard/,
      label: 'Hard reset detected',
      severity: 'HIGH',
      confidence: 90,
      description: '硬重置会丢失未提交的更改',
      fix: '确认没有未提交的更改',
      level: 'block'
    },
    // Force clean
    {
      pattern: /git\s+clean\s+.*-f/,
      label: 'Force clean detected',
      severity: 'HIGH',
      confidence: 85,
      description: '强制清理会删除未跟踪的文件',
      fix: '确认没有重要的未跟踪文件',
      level: 'block'
    },
    // Additional patterns from bash-guard.js
    {
      pattern: /\bgit\s+checkout\s+--\s+\./,
      label: 'git checkout -- .',
      severity: 'HIGH',
      confidence: 90,
      description: 'git checkout -- . 会丢失所有未提交修改',
      fix: '确认没有未提交的更改',
      level: 'block'
    },
    {
      pattern: /\bgit\s+clean\s+-[a-zA-Z]*f[a-zA-Z]*\s+/,
      label: 'git clean -f',
      severity: 'HIGH',
      confidence: 85,
      description: 'git clean -f 会删除未跟踪文件',
      fix: '确认没有重要的未跟踪文件',
      level: 'block'
    },
    {
      pattern: /\bgit\s+push\b(?![^\n]*--force-with-lease)[^\n]*--force\b/,
      label: 'git push --force',
      severity: 'HIGH',
      confidence: 95,
      description: 'git push --force 会覆盖远端提交历史',
      fix: '使用 --force-with-lease',
      level: 'block'
    },
    {
      pattern: /\bgit\s+push\b[^\n]*?\s(?<![\/-])(?:main|master|develop)\b/,
      label: 'git push to protected branch',
      severity: 'HIGH',
      confidence: 90,
      description: '推送到受保护分支（main/master/develop）',
      fix: '使用 Pull Request 流程',
      level: 'block'
    },
    {
      pattern: /\bgit\s+reset\s+--hard\b/,
      label: 'git reset --hard',
      severity: 'HIGH',
      confidence: 90,
      description: 'git reset --hard 会丢失所有未提交更改',
      fix: '确认没有未提交的更改',
      level: 'block'
    }
  ];
}

module.exports = {
  findCsprojUp,
  findTestProjects,
  findTestProject,
  getGitSecurityPatterns
};
