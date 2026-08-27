#!/usr/bin/env node
/**
 * Shared secret detection patterns
 * 
 * Extracted from secret-guard.js to eliminate duplication between
 * file content and bash command detection patterns.
 */

// Token/API key patterns (used in both file content and bash commands)
const TOKEN_PATTERNS = [
  { pattern: /ghp_[A-Za-z0-9]{36}/, label: 'GitHub personal access token' },
  { pattern: /gho_[A-Za-z0-9]{36}/, label: 'GitHub OAuth token' },
  { pattern: /github_pat_[A-Za-z0-9_]{22,}/, label: 'GitHub fine-grained PAT' },
  { pattern: /glpat-[A-Za-z0-9\-_]{20,}/, label: 'GitLab personal access token' },
  { pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/, label: 'Anthropic API key' },
  { pattern: /\btp-[A-Za-z0-9]{32,}/, label: 'Anthropic/proxy auth token' },
  { pattern: /\bsk-[A-Za-z0-9]{32,}/, label: 'OpenAI-style API key' },
];

// File content-specific patterns
const FILE_SECRET_PATTERNS = [
  { pattern: /Password\s*=\s*[^;{}\s$"']+/i, label: 'Connection string password' },
  { pattern: /Server\s*=\s*[^;]+;.*Password\s*=\s*[^;]+/i, label: 'DB connection string' },
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"'${]{8,}["']/i, label: 'Hardcoded API key' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]{20,}/i, label: 'Hardcoded Bearer token' },
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, label: 'Private key' },
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS access key' },
  { pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'${]{4,}["']/i, label: 'Hardcoded password' },
  { pattern: /ANTHROPIC_(?:AUTH_TOKEN|API_KEY)\s*[:=]\s*["']?[A-Za-z0-9\-_]{16,}/i, label: 'Anthropic credential assignment' },
];

// Bash command-specific patterns
const BASH_SECRET_PATTERNS = [
  { pattern: /curl\s+[^\n]*(?:-u|--user)\s+\S+:\S+/i, label: 'curl with credentials' },
  { pattern: /curl\s+[^\n]*(?:-H|--header)\s+["']Authorization:/i, label: 'curl with auth header' },
  { pattern: /(?:export|set)\s+(?:API_KEY|SECRET|TOKEN|PASSWORD|PWD)\s*=/i, label: 'Secret in env variable' },
  { pattern: /echo\s+["'][^"']*(?:password|secret|token|key)[^"']*["']\s*>/i, label: 'Secret written to file' },
  { pattern: /(?:psql|mysql|sqlcmd)\s+[^\n]*(?:-p|--password)\s+\S+/i, label: 'DB password in command' },
];

// Combined patterns for different contexts
const FILE_CONTENT_PATTERNS = [...FILE_SECRET_PATTERNS, ...TOKEN_PATTERNS];
const BASH_COMMAND_PATTERNS = [...BASH_SECRET_PATTERNS, ...TOKEN_PATTERNS.map(p => ({
  ...p,
  label: p.label.replace(' token', ' token in command').replace(' key', ' key in command')
}))];

module.exports = {
  TOKEN_PATTERNS,
  FILE_SECRET_PATTERNS,
  BASH_SECRET_PATTERNS,
  FILE_CONTENT_PATTERNS,
  BASH_COMMAND_PATTERNS
};
