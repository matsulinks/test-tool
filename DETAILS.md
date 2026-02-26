# 🛰️ Alchemist Test Pilot (ATP)

**Obsidianプラグインの自動テストツール。コードを書かずに、AIと一緒にプラグインの品質を守る。**

---

## ⚡ 3分でスタート

```bash
# 1. このリポジトリをクローン
git clone <このリポジトリのURL>
cd （テスト環境構築）

# 2. セットアップ（GitHubトークンのペースト1回だけ）
bash scripts/setup.sh

# 3. テスト実行
npm run test:cli   # CLIテスト（53項目）
npm run test:ui    # UIテスト（Obsidian起動）
```

---

## 🤔 ATPとは？

開発AIが作ったObsidianプラグインを**自動で検査する見張り番**です。

```
開発AI がコードを書く
    ↓
ATP がテストを実行
    ↓
失敗したら → GitHub Issueで開発AIに自動通知
    ↓
開発AI が修正 → IssueをClose
    ↓
ATP が再テスト
    ↓（3回直らなかったら）
Grok に質問状を自動生成 + LINEかDiscordで監督に通知
```

---

## 📂 ファイル構成

```
（テスト環境構築）/
├── docs/
│   ├── （設計図）spec.md             ← 何を作るか
│   ├── （作業手順書）tasks.md         ← どう進めるか
│   ├── （決定と哲学の記録）decision_log.md
│   └── （あとで考えることリスト）backlog.md
└── tests/
    ├── core/
    │   ├── （見張り番）monitor.js     ← CLIテスト実行
    │   ├── （報告書エンジン）report-writer.js
    │   ├── （GitHub連携）github-connector.js
    │   ├── （安全装置）safety-guard.js
    │   ├── （通知エンジン）notifier.js
    │   └── （Obsidian起動）obsidian-launcher.js
    ├── config/self/
    │   └── （テスト定義）obsidian.yaml ← テストのレシピ
    ├── registry/
    │   ├── （聖域リスト）sanctuary.md  ← 守るべき項目の宣言
    │   └── latest_report.md            ← AI向け報告書（使い終わったら消える）
    └── ui/
        └── （UIテスト）obsidian-ui.spec.js
```

---

## 🛡️ 哲学

> **「使い終わったら消す」**
> 報告書は修正完了後に消える。証拠写真は全合格後に消える。
> プロジェクトが終わればレシピもarchiveへ。
> ATPは常にクリーンな状態を保つ。

---

## 📖 詳しい設計思想

→ [（設計図）spec.md](docs/（設計図）spec.md)
→ [（決定と哲学の記録）decision_log.md](docs/（決定と哲学の記録）decision_log.md)
