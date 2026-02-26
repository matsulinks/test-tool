// （報告書エンジン）report-writer.js
// CLIテストとUIテストの結果を受け取り、
// 開発AI（修正側）が迷わず読める「latest_report.md」を生成するエンジン

const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, '../registry/latest_report.md');
const EVIDENCE_DIR = path.join(__dirname, '../registry/evidence');

/**
 * テスト結果から「AI向けレポート」を生成して latest_report.md に書き出す
 * @param {Object} results - テスト結果オブジェクト
 * @param {Object} results.cli  - CLIテスト結果 { passed, failed, total, failedItems }
 * @param {Object} results.api  - APIテスト結果 { passed, failed, failedItems }
 * @param {Object} results.ui   - UIテスト結果  { passed, failed, failedItems }
 */
function writeReport(results) {
    const now = new Date().toLocaleString('ja-JP');
    const { cli, api, ui } = results;

    const totalFailed = (cli?.failed ?? 0) + (api?.failed ?? 0) + (ui?.failed ?? 0);
    const totalPassed = (cli?.passed ?? 0) + (api?.passed ?? 0) + (ui?.passed ?? 0);
    const overallStatus = totalFailed === 0 ? '🟢 全合格' : '🔴 失敗あり';

    // 失敗したCLI項目のリスト生成
    const cliFailList = (cli?.failedItems ?? []).map(item =>
        `  - ❌ ${item.group}: ${item.desc}\n    期待値: ${item.expected}\n    実際の出力: ${item.actual ?? '（取得できず）'}`
    ).join('\n');

    // 失敗したUI項目のリスト生成
    const uiFailList = (ui?.failedItems ?? []).map(item => {
        const screenshotLine = item.screenshot
            ? `\n    📸 スクショ: evidence/${item.screenshot}`
            : '';
        return `  - ❌ ${item.id}: ${item.desc}\n    ヒント: ${item.hint ?? '（ヒントなし）'}${screenshotLine}`;
    }).join('\n');

    const report = `# 📋 ATP テスト報告書
> 自動生成 by Alchemist Test Pilot | ${now}
> ⚠️ **このファイルは、修正完了後に削除してください。削除がATPへの「再テスト開始」の合図です。**

---

## 🛰️ 総合結果: ${overallStatus}

| テスト種別 | 合格 | 失敗 |
|---|---|---|
| CLIテスト（自動） | ${cli?.passed ?? '-'} | ${cli?.failed ?? '-'} |
| APIテスト（HTTP） | ${api?.passed ?? '-'} | ${api?.failed ?? '-'} |
| UIテスト（Obsidian） | ${ui?.passed ?? '-'} | ${ui?.failed ?? '-'} |
| **合計** | **${totalPassed}** | **${totalFailed}** |

---

## 🚨 失敗した項目と修正ヒント

### 🔧 CLIテスト（コードの内部ロジック）
${cliFailList || '✅ 全項目合格'}

### 🖥️ UIテスト（Obsidianの画面操作）
${uiFailList || '✅ 全項目合格（またはスキップ）'}

---

## 🤖 開発AI向け指示

以下の手順で修正を進めてください：

1. **上記の失敗項目を確認**し、原因を特定する
2. **聖域の確認**: 修正後、必ず \`npm run test -w service\` を実行し、53項目全件合格を確認すること
3. **修正完了後**: このファイル（\`latest_report.md\`）を削除する
   - 削除がATPへの「修正完了・再テスト開始」の合図となります
   - 削除しない限り、ATPは「まだ修正中」と判断して待機します

---

## 📁 証拠写真
${fs.existsSync(EVIDENCE_DIR) && fs.readdirSync(EVIDENCE_DIR).filter(f => f.endsWith('.png')).length > 0
            ? fs.readdirSync(EVIDENCE_DIR).filter(f => f.endsWith('.png')).map(f => `- evidence/${f}`).join('\n')
            : '（なし）'}
`;

    fs.writeFileSync(REPORT_PATH, report.trim());
    console.log(`📄 ATP: 報告書を生成しました → ${REPORT_PATH}`);
    return REPORT_PATH;
}

/**
 * 報告書が「削除された」かどうかを監視する（修正完了の検知）
 * @param {number} intervalMs - チェック間隔（ミリ秒）
 * @param {Function} onCompleted - 削除を検知した時に呼ぶ関数
 */
function watchForCompletion(intervalMs = 10000, onCompleted) {
    console.log('👀 ATP: 報告書の削除を待機中（開発AI側の修正完了を監視）...');

    const timer = setInterval(() => {
        if (!fs.existsSync(REPORT_PATH)) {
            clearInterval(timer);
            console.log('✅ ATP: 報告書の削除を検知！修正完了と判断、再テストを開始します。');
            onCompleted();
        }
    }, intervalMs);

    return timer; // タイマーIDを返す（必要に応じてclearInterval可能）
}

module.exports = { writeReport, watchForCompletion, REPORT_PATH };
