#!/usr/bin/env bash
# Claude Code StatusLine Script（多行显示）
# 第1行：模型 | 上下文进度条 | 窗口大小
# 第2行：Token 统计（含缓存） | Git 分支
# 第3行：速率限制（仅订阅用户）
# 第4行：会话名 | 项目名 | 版本
input=$(cat)

# === 字段提取（纯 bash，不依赖 jq） ===
get_str() {
  echo "$input" | grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/"
}
get_num() {
  echo "$input" | grep -o "\"$1\"[[:space:]]*:[[:space:]]*[0-9.]*" | head -1 | sed "s/.*\"$1\"[[:space:]]*:[[:space:]]*\([0-9.]*\).*/\1/"
}
# 嵌套字段：在 "parent":{...} 内找子字段
get_nested_str() {
  echo "$input" | grep -o "\"$1\"[[:space:]]*:{[^}]*\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | grep -o "\"$2\"[[:space:]]*:\"[^\"]*\"" | sed "s/.*:\"\([^\"]*\)\"/\1/" | head -1
}
get_nested_num() {
  echo "$input" | grep -o "\"$1\"[[:space:]]*:{[^}]*\"$2\"[[:space:]]*:[[:space:]]*[0-9.]*" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*[0-9.]*" | sed "s/.*:\([0-9.]*\)/\1/" | head -1
}

# === 提取所有字段 ===
model=$(get_str "display_name")
[ -z "$model" ] && exit 0

used=$(get_num "used_percentage")
total_in=$(get_num "total_input_tokens")
total_out=$(get_num "total_output_tokens")
ctx_size=$(get_num "context_window_size")
version=$(get_str "version")
session=$(get_str "session_name")
output_style=$(get_str "name")

# 嵌套字段
cache_read=$(get_nested_num "current_usage" "cache_read_input_tokens")
cache_write=$(get_nested_num "current_usage" "cache_creation_input_tokens")
agent_name=$(get_nested_str "agent" "name")
worktree_name=$(get_nested_str "worktree" "name")
five_hour_pct=$(get_nested_num "five_hour" "used_percentage")
seven_day_pct=$(get_nested_num "seven_day" "used_percentage")

# 项目名
project_dir=$(get_str "project_dir")
project=$(echo "$project_dir" | sed 's|.*/\([^/]*\)$|\1|')

# Git 分支
git_branch=$(git -c core.locker=false branch --show-current 2>/dev/null)

# === 工具函数 ===
fmt_tokens() {
  local t=$1
  [ -z "$t" ] && return
  if [ "$t" -ge 1000000 ]; then
    printf '%d.%dM' $(( t / 1000000 )) $(( (t % 1000000) / 100000 ))
  elif [ "$t" -ge 1000 ]; then
    printf '%d.%dK' $(( t / 1000 )) $(( (t % 1000) / 100 ))
  else
    printf '%s' "$t"
  fi
}

# === 第1行：模型 | 上下文进度条 | 窗口大小 ===
line1="$model"
if [ -n "$used" ]; then
  pct=$(printf '%.0f' "$used")
  filled=$(( pct * 20 / 100 ))
  empty=$(( 20 - filled ))
  bar=""
  for (( i=0; i<filled; i++ )); do bar+="█"; done
  for (( i=0; i<empty; i++ )); do bar+="░"; done
  line1="$line1  [$bar] ${pct}%"
fi
[ -n "$ctx_size" ] && line1="$line1  ($(fmt_tokens "$ctx_size"))"

# === 第2行：Token 统计 + 缓存 + Git 分支 ===
line2=""
if [ -n "$total_in" ] || [ -n "$total_out" ]; then
  line2="↓$(fmt_tokens "$total_in") ↑$(fmt_tokens "$total_out")"
  [ -n "$cache_read" ] && [ "$cache_read" != "0" ] && line2="$line2  cache↓$(fmt_tokens "$cache_read")"
  [ -n "$cache_write" ] && [ "$cache_write" != "0" ] && line2="$line2  cache↑$(fmt_tokens "$cache_write")"
fi
[ -n "$git_branch" ] && line2="$line2  | $git_branch"

# === 第3行：速率限制（仅订阅用户有数据时显示） ===
line3=""
[ -n "$five_hour_pct" ] && line3="5h: $(printf '%.0f' "$five_hour_pct")%"
[ -n "$seven_day_pct" ] && line3="${line3:+$line3  }7d: $(printf '%.0f' "$seven_day_pct")%"

# === 第4行：会话名 | 输出风格 | Agent | Worktree | 项目名 | 版本 ===
parts=()
[ -n "$session" ] && parts+=("$session")
[ -n "$output_style" ] && [ "$output_style" != "default" ] && parts+=("$output_style")
[ -n "$agent_name" ] && parts+=("agent:$agent_name")
[ -n "$worktree_name" ] && parts+=("wt:$worktree_name")
[ -n "$project" ] && parts+=("$project")
[ -n "$version" ] && parts+=("v$version")
line4=""
for i in "${!parts[@]}"; do
  [ -n "$line4" ] && line4="$line4  |  "
  line4="${line4}${parts[$i]}"
done

# === 输出 ===
printf '%s' "$line1"
[ -n "$line2" ] && printf '\n%s' "$line2"
[ -n "$line3" ] && printf '\n%s' "$line3"
[ -n "$line4" ] && printf '\n%s' "$line4"
