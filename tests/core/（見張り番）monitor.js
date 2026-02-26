const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { postFailureIssue } = require('./（GitHub連携）github-connector.js');

// 構成設定
const SANDBOX_DIR = '/tmp/atp_sandbox';
const REGISTRY_DIR = path.join(__dirname, '../registry');
const REPORT_PATH = path.join(REGISTRY_DIR, 'latest_report.md');

/**
 * テストを実行し、結果を報告書にまとめる
 */
async function runPilotTest() {
    console.log('🛰️  ATP: 抜き打ちテストを開始します...');

    try {
        // 1. サンドボックスでテスト実行
        // ガイドに基づき、まずはサービス側のテストを実行してみる
        const output = execSync('npm run test -w service', { cwd: SANDBOX_DIR, encoding: 'utf-8' });

        console.log('🟢 ATP: 全テストがパスしました！聖域は守られています。');

        // 合格した場合は、もし古い報告書があれば消しておく（念のため）
        if (fs.existsSync(REPORT_PATH)) {
            fs.unlinkSync(REPORT_PATH);
        }

    } catch (error) {
        console.log('🔴 ATP: テスト失敗を検知しました。報告書を作成します。');

        const errorOutput = error.stdout || error.message;

        // 2. 報告書の作成
        const reportContent = `
# 📋 ATP テスト報告書 (自動生成)

## 🛰️ 概要 / Overview
- **実行日時**: ${new Date().toLocaleString('ja-JP')}
- **判定**: 🔴 失敗 (FAILED)
- **状況**: CLIテスト（npm run test）でエラーが発生しました。

---

## 🚨 検出された問題 (Issue)
\`\`\`text
${errorOutput}
\`\`\`

---

## 🤖 AI向け修正示唆 (AI Instructions)
上記のエラーログを解析し、壊れている箇所を特定して修正してください。
**修正が完了したら、このファイルを削除してください。** 削除を合図に、ATPが再テストを実施します。
        `;

        fs.writeFileSync(REPORT_PATH, reportContent.trim());
        console.log(`📄 ATP: 報告書を生成しました: ${REPORT_PATH}`);

        // 3. GitHubへIssue投稿（自動直結）
        await postFailureIssue(reportContent.trim());
    }
}

// 直接実行された時だけ動く（require()で読み込まれた時は動かない）
if (require.main === module) {
    runPilotTest();
}

module.exports = { runPilotTest };
