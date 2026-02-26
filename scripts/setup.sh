#!/bin/bash
# =============================================================
# ATP セットアップスクリプト（One-Paste Setup）
# 使い方: bash scripts/setup.sh
# 監督がやること: GitHubトークンをコピーして、聞かれたらペーストするだけ
# =============================================================

set -e  # エラーが起きたら即停止

# 色付きメッセージ用
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo ""
echo "🛰️  Alchemist Test Pilot — セットアップを開始します"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# -------------------------------------------------------
# Node.js バージョンチェック（v22必須）
# -------------------------------------------------------
NODE_MAJOR=$(node -e "process.stdout.write(process.version.split('.')[0].replace('v',''))")
if [ "$NODE_MAJOR" != "22" ]; then
    echo -e "${RED}❌ Node.js v22が必要です。現在: $(node --version)${RESET}"
    echo ""
    echo "   以下で切り替えてください:"
    echo "   export NVM_DIR=\"\$HOME/.nvm\" && \\. \"\$NVM_DIR/nvm.sh\""
    echo "   nvm install 22 && nvm use 22"
    echo "   その後もう一度 bash scripts/setup.sh を実行してください。"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) を確認${RESET}"
echo ""

# -------------------------------------------------------
# Step 1: 依存パッケージのインストール
# -------------------------------------------------------
echo "📦 [1/4] 必要なパッケージをインストール中..."
npm install --silent
echo -e "${GREEN}✅ パッケージのインストール完了${RESET}"
echo ""

# -------------------------------------------------------
# Step 2: GitHubトークンの設定（ペースト1回）
# -------------------------------------------------------
echo "🔑 [2/4] GitHubトークンの設定"
echo ""
echo "  ブラウザで以下を開いてトークンを発行・コピーしてください:"
echo "  👉 https://github.com/settings/tokens/new"
echo "     必要な権限: 「repo」にチェック"
echo ""
echo -n "  コピーしたトークンをここにペーストしてEnter: "
read -s GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ トークンが入力されませんでした。setup.sh を再実行してください。${RESET}"
    exit 1
fi

# トークンを ~/.zshrc に書き込む
ZSHRC="$HOME/.zshrc"
# 既存のATP_GITHUB_TOKENエントリを削除してから追記（重複防止）
grep -v "ATP_GITHUB_TOKEN" "$ZSHRC" > /tmp/zshrc_tmp 2>/dev/null && mv /tmp/zshrc_tmp "$ZSHRC" || true
echo "" >> "$ZSHRC"
echo "# Alchemist Test Pilot — GitHub Token" >> "$ZSHRC"
echo "export ATP_GITHUB_TOKEN=\"$GITHUB_TOKEN\"" >> "$ZSHRC"

# .env ファイルも生成（node スクリプトから読み込む用）
cat > .env << EOF
# ATP 環境設定ファイル
# ⚠️ このファイルはGitHubにアップしないこと（.gitignoreに含まれています）
ATP_GITHUB_TOKEN=$GITHUB_TOKEN
EOF

echo -e "${GREEN}✅ トークンを保存しました（~/.zshrc と .env）${RESET}"
echo ""

# -------------------------------------------------------
# Step 3: .gitignore に .env を追加
# -------------------------------------------------------
echo "🛡️  [3/4] セキュリティ設定を確認中..."
GITIGNORE=".gitignore"
if [ ! -f "$GITIGNORE" ]; then
    touch "$GITIGNORE"
fi
if ! grep -q "^\.env$" "$GITIGNORE"; then
    echo ".env" >> "$GITIGNORE"
fi
if ! grep -q "node_modules" "$GITIGNORE"; then
    echo "node_modules/" >> "$GITIGNORE"
fi
if ! grep -q "tests/registry/evidence" "$GITIGNORE"; then
    echo "tests/registry/evidence/" >> "$GITIGNORE"
fi
echo -e "${GREEN}✅ .gitignore を設定しました（.env・証拠写真はGitHubに上がりません）${RESET}"
echo ""

# -------------------------------------------------------
# Step 3.5: 通知先の設定（Discord または LINE）
# -------------------------------------------------------
echo "📣 [3.5/4] デッドロック時の通知先を設定します（スキップ可）"
echo ""
echo "  DiscordとLINE、どちらか（または両方）設定できます。"
echo "  スキップする場合はそのままEnterを押してください。"
echo ""
echo -n "  Discord Webhook URL（スキップ→Enter）: "
read DISCORD_WEBHOOK
echo ""
echo -n "  LINE Notify トークン（スキップ→Enter）: "
read LINE_TOKEN
echo ""

# .env に追記
if [ -n "$DISCORD_WEBHOOK" ]; then
    grep -v "ATP_DISCORD_WEBHOOK" .env > /tmp/env_tmp && mv /tmp/env_tmp .env || true
    echo "ATP_DISCORD_WEBHOOK=$DISCORD_WEBHOOK" >> .env
    echo -e "${GREEN}✅ Discord通知を設定しました${RESET}"
fi
if [ -n "$LINE_TOKEN" ]; then
    grep -v "ATP_LINE_TOKEN" .env > /tmp/env_tmp && mv /tmp/env_tmp .env || true
    echo "ATP_LINE_TOKEN=$LINE_TOKEN" >> .env
    echo -e "${GREEN}✅ LINE通知を設定しました${RESET}"
fi
if [ -z "$DISCORD_WEBHOOK" ] && [ -z "$LINE_TOKEN" ]; then
    echo "  （通知なし。後で setup.sh を再実行すれば追加できます）"
fi
echo ""

# -------------------------------------------------------
# Step 4: GitHub への接続確認
# -------------------------------------------------------
echo "🌐 [4/4] GitHubへの接続を確認中..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITHUB_TOKEN" \
    https://api.github.com/user)

if [ "$RESPONSE" = "200" ]; then
    USERNAME=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/user | grep '"login"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ GitHub接続成功！ アカウント: @${USERNAME}${RESET}"
else
    echo -e "${YELLOW}⚠️  GitHub接続確認失敗（HTTPコード: ${RESPONSE}）${RESET}"
    echo "   トークンの権限を確認してください。後で手動で確認できます。"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 セットアップ完了！${RESET}"
echo ""
echo "  次のコマンドでテストを実行できます:"
echo "  $ source ~/.zshrc   ← 新しい設定を反映（1回だけ）"
echo "  $ npm run test:cli   ← CLIテスト（53項目）を実行"
echo "  $ npm run test:ui    ← UIテスト（Obsidian）を実行"
echo ""
