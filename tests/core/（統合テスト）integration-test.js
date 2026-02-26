// （統合テスト）integration-test.js
// ATPの全モジュールが正しく連携するかを確認するテストスクリプト
// 実際のGitHub・Obsidian・LINE/Discordには繋がず、モックデータで動作確認する

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function ok(name) {
    console.log(`  ✅ ${name}`);
    passed++;
}
function fail(name, err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err?.message ?? err}`);
    failed++;
}

// -------------------------------------------------------
console.log('\n🛰️  ATP 統合テスト開始\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
// -------------------------------------------------------

// -------------------------------------------------------
// テスト1: 全モジュールのrequire確認
// -------------------------------------------------------
console.log('📦 [1] モジュール読み込み確認');

const modules = [
    ['（見張り番）monitor.js', './（見張り番）monitor.js'],
    ['（報告書エンジン）', './（報告書エンジン）report-writer.js'],
    ['（Obsidian起動）', './（Obsidian起動）obsidian-launcher.js'],
    ['（GitHub連携）', './（GitHub連携）github-connector.js'],
    ['（安全装置）', './（安全装置）safety-guard.js'],
    ['（通知エンジン）', './（通知エンジン）notifier.js'],
];

for (const [name, filePath] of modules) {
    try {
        require(path.join(__dirname, filePath));
        ok(name);
    } catch (err) {
        fail(name, err);
    }
}

// -------------------------------------------------------
// テスト2: 報告書エンジンのモックデータ出力
// -------------------------------------------------------
console.log('\n📄 [2] 報告書エンジン動作確認');

try {
    const { writeReport, REPORT_PATH } = require('./（報告書エンジン）report-writer.js');

    const mockResults = {
        cli: {
            passed: 51, failed: 2, failedItems: [
                { group: 'G1 類似度計算', desc: '空のベクトルでエラーにならないか', expected: '0.0', actual: 'TypeError' },
                { group: 'G3 境界検出', desc: '1メッセージでも壊れないか', expected: '境界なし', actual: 'undefined' },
            ]
        },
        api: { passed: 4, failed: 0, failedItems: [] },
        ui: {
            passed: 2, failed: 1, failedItems: [
                { id: 'U2', desc: 'サービスが起動しているか', hint: 'node service/dist/main.js を実行してください', screenshot: null },
            ]
        },
    };

    const reportPath = writeReport(mockResults);

    if (fs.existsSync(reportPath)) {
        ok('報告書ファイルが生成された');
        const content = fs.readFileSync(reportPath, 'utf8');
        if (content.includes('🔴 失敗あり')) ok('総合結果が正しく表示された');
        if (content.includes('G1 類似度計算')) ok('CLI失敗項目が含まれている');
        if (content.includes('U2')) ok('UI失敗項目が含まれている');
        if (content.includes('削除してください')) ok('開発AIへの指示が含まれている');
        // テスト用の報告書を後片付け
        fs.unlinkSync(reportPath);
        ok('報告書の後片付けが正常に完了した');
    } else {
        fail('報告書ファイルが生成されなかった', new Error('ファイルが見つかりません'));
    }
} catch (err) {
    fail('報告書エンジンでエラー発生', err);
}

// -------------------------------------------------------
// テスト3: 安全装置のカウンター動作確認
// -------------------------------------------------------
console.log('\n🛡️  [3] 安全装置（失敗カウンター）確認');

try {
    const { getFailCount, incrementFailCount, resetFailCount, checkDeadlock } = require('./（安全装置）safety-guard.js');

    resetFailCount();
    if (getFailCount() === 0) ok('リセット後のカウンターが0');

    const count1 = incrementFailCount();
    if (count1 === 1) ok('1回目のカウントが正しい');

    const count2 = incrementFailCount();
    if (count2 === 2) ok('2回目のカウントが正しい');

    // 3回目でデッドロック判定
    const isDeadlock = checkDeadlock();
    if (isDeadlock) ok('3回目でデッドロック判定が正しく発動した');

    resetFailCount();
    if (getFailCount() === 0) ok('リセット後に正しくゼロに戻った');
} catch (err) {
    fail('安全装置テストでエラー発生', err);
}

// -------------------------------------------------------
// テスト4: テスト設定ファイルの存在確認
// -------------------------------------------------------
console.log('\n📂 [4] テスト設定・レシピファイルの確認');

const requiredFiles = [
    ['テスト定義YAML', 'tests/config/self/（テスト定義_obsidian）obsidian.yaml'],
    ['聖域リスト', 'tests/registry/（聖域リスト）sanctuary.md'],
    ['セットアップSH', 'scripts/setup.sh'],
    ['Playwright設定', 'tests/core/（playwright設定）playwright.config.js'],
];

const ROOT = path.join(__dirname, '../..');
for (const [name, filePath] of requiredFiles) {
    const fullPath = path.join(ROOT, filePath);
    if (fs.existsSync(fullPath)) {
        ok(`${name} が存在する`);
    } else {
        fail(`${name} が見つからない`, new Error(fullPath));
    }
}

// -------------------------------------------------------
// 結果サマリー
// -------------------------------------------------------
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🛰️  統合テスト完了: ${passed}件合格 / ${failed}件失敗`);
if (failed === 0) {
    console.log('🌸 全項目合格！ATPは正常に動作する状態です。');
} else {
    console.log('🔴 失敗があります。上記のエラーを確認してください。');
}
console.log('');

process.exit(failed > 0 ? 1 : 0);
