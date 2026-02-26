// （Obsidian起動）obsidian-launcher.js
// ObsidianをElectronとして起動し、テスト用Vaultをロードすするヘルパー
// Playwrightのテストファイルからimportして使う

const { _electron: electron } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

// テスト用Vaultの場所（一時Vaultを使い捨てで作る）
const TEMP_VAULT = path.join(os.tmpdir(), 'atp_test_vault');
const OBSIDIAN_APP = '/Applications/Obsidian.app/Contents/MacOS/Obsidian';

/**
 * Obsidianを起動してElectronAppを返す
 * テスト終了後は必ず app.close() を呼ぶこと
 */
async function launchObsidian() {
    // テスト用の使い捨てVaultを作成
    if (!fs.existsSync(TEMP_VAULT)) {
        fs.mkdirSync(TEMP_VAULT, { recursive: true });
        // Obsidianが認識できるように .obsidian フォルダも作成
        fs.mkdirSync(path.join(TEMP_VAULT, '.obsidian'), { recursive: true });
    }

    // ObsidianをElectronとして起動
    const app = await electron.launch({
        executablePath: OBSIDIAN_APP,
        args: [
            '--no-sandbox',
            `--vault=${TEMP_VAULT}`,  // テスト用Vaultを指定
        ],
        env: {
            ...process.env,
            // テスト環境フラグ（将来の条件分岐に使える）
            ATP_TEST_MODE: 'true',
        },
    });

    // 最初のウィンドウが開くまで待機
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    return { app, window };
}

/**
 * テスト用Vaultを後片付けする（使い捨ての哲学）
 */
function cleanupVault() {
    if (fs.existsSync(TEMP_VAULT)) {
        fs.rmSync(TEMP_VAULT, { recursive: true, force: true });
    }
}

/**
 * テストが全件合格した場合、証拠写真を削除する
 * 「使い終わったら消す」哲学を画像ファイルにまで拡張
 * @param {boolean} allPassed - 全テスト合格かどうか
 */
function cleanupEvidence(allPassed) {
    const evidenceDir = path.join(__dirname, '../registry/evidence');
    if (!fs.existsSync(evidenceDir)) return;

    if (allPassed) {
        // 合格→証拠写真は役目を終えた→全削除
        fs.rmSync(evidenceDir, { recursive: true, force: true });
        fs.mkdirSync(evidenceDir, { recursive: true }); // 空フォルダだけ再生成
        console.log('🌸 ATP: 全テスト合格→証拠写真を削除しました（使い終わったので）');
    } else {
        // 失敗あり→証拠写真は修正中も必要→保全
        console.log('🔴 ATP: 失敗あり→証拠写真を保全します');
        console.log(`📁 証拠写真: ${evidenceDir}`);
    }
}

module.exports = { launchObsidian, cleanupVault, cleanupEvidence, TEMP_VAULT };
