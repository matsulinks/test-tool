# 🛰️ Alchemist Test Pilot (ATP)

Obsidianプラグインの自動テストツール。

---

## ⚡ スタート

```bash
bash scripts/setup.sh   # GitHubトークンをペースト1回だけ
npm run test:cli        # テスト実行
```

---

## 何をするツール？

開発AIが作ったコードを**自動で検査する見張り番**。失敗したらGitHub Issueで通知、3回直らなければLINE/DiscordとGrok質問状を自動生成。

---

## 詳しく読む

- [DETAILS.md](DETAILS.md) — **本物はこっち。めちゃくちゃ面白いから読んで。** フロー図・ファイル構成・哲学まで全部ある。
- [（設計図）spec.md](docs/（設計図）spec.md) — 設計思想と哲学
- [（決定と哲学の記録）decision_log.md](docs/（決定と哲学の記録）decision_log.md) — なぜこの設計にしたか（二社のAIによる開発者評価も入ってる）
