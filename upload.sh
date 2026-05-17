#!/usr/bin/env bash
#
# upload.sh — 从任意 server 一键上传 slides 到 slides-hub
#
# 名字必须是 <project>/<deck>:
#   • project —— 已有项目名 (现有: graph-agent / aesthetic-agent)。
#                开新项目就用一个新名字,kebab-case。
#   • deck    —— 这次 slides 的子名,建议用 MMDD 日期 (如 0531)。
#
# 用法:
#   # 基本用法 (当前目录有 slides.md)
#   curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- graph-agent/0531
#
#   # 指定 slides 文件 + assets 目录
#   curl -sL https://raw.githubusercontent.com/zhuconv/slides-hub/main/upload.sh | bash -s -- graph-agent/0531 slides.md public/
#
#   # 或者本地直接跑
#   bash upload.sh aesthetic-agent/0531
#   bash upload.sh aesthetic-agent/0531 report.slides.md figures/
set -e

REPO="git@github.com:zhuconv/slides-hub.git"
NAME="${1:?Usage: upload.sh <project>/<deck> [slides-file] [assets-dir...]}"
SLIDES="${2:-slides.md}"
DATE="$(date +%F)"
shift 2 2>/dev/null || shift 1 2>/dev/null || true
ASSETS=("$@")  # remaining args are asset dirs

# Name must be <project>/<deck> so every deck is archived under a project
if [[ "$NAME" != */* ]]; then
  echo "Error: name must be <project>/<deck>, e.g. graph-agent/0531 (got: '$NAME')"
  echo "       project = an existing project (graph-agent / aesthetic-agent) or a new one"
  exit 1
fi

# Validate slides file exists
if [[ ! -f "$SLIDES" ]]; then
  echo "Error: $SLIDES not found in $(pwd)"
  exit 1
fi

echo "=== slides-hub upload ==="
echo "  Deck:    $NAME"
echo "  Date:    $DATE"
echo "  Slides:  $SLIDES"
echo "  Assets:  ${ASSETS[*]:-none}"
echo ""

# Clone slides-hub into temp dir
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "Cloning slides-hub..."
git clone --depth 1 "$REPO" "$TMPDIR/hub" 2>&1 | tail -1

DEST="$TMPDIR/hub/projects/$NAME"
mkdir -p "$DEST/public"

# Copy slides (always rename to slides.md)
cp "$SLIDES" "$DEST/slides.md"
echo "  Copied $SLIDES -> projects/$NAME/slides.md"

# Copy asset directories
for dir in "${ASSETS[@]}"; do
  if [[ -d "$dir" ]]; then
    cp -r "$dir"/* "$DEST/public/" 2>/dev/null || true
    echo "  Copied $dir/ -> projects/$NAME/public/"
  fi
done

# Update projects.json if this deck isn't already in it
cd "$TMPDIR/hub"
if ! grep -q "\"$NAME\"" projects.json; then
  # Add entry using node (available) or python or sed
  if command -v node &>/dev/null; then
    node -e "
      const fs = require('fs');
      const p = JSON.parse(fs.readFileSync('projects.json','utf-8'));
      p.push({name:'$NAME', date:'$DATE', src:'uploaded', slides:'slides.md', assets:['public']});
      fs.writeFileSync('projects.json', JSON.stringify(p,null,2)+'\n');
    "
  elif command -v python3 &>/dev/null; then
    python3 -c "
import json
p = json.load(open('projects.json'))
p.append({'name':'$NAME','date':'$DATE','src':'uploaded','slides':'slides.md','assets':['public']})
json.dump(p, open('projects.json','w'), indent=2)
"
  else
    echo "Warning: could not update projects.json (no node/python3)"
  fi
  echo "  Added $NAME to projects.json"
fi

# Commit and push
git add -A
git commit -m "upload: $NAME from $(hostname)" 2>&1 | tail -1
git push 2>&1 | tail -2

echo ""
echo "Done! Slides will be live at:"
echo "  https://zhuconv.github.io/slides-hub/$NAME/"
