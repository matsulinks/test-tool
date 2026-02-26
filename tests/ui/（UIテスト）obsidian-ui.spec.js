// （UIテスト）obsidian-ui.spec.js
// Obsidianを自動起動して、プラグインのUI動作を確認するテスト群
// テスト定義は tests/config/self/（テスト定義_obsidian）obsidian.yaml に従う

const { test, expect } = require('@playwright/test');
const { launchObsidian, cleanupVault, cleanupEvidence } = require('../core/（Obsidian起動）obsidian-launcher');
const fs = require('fs');
const path = require('path');

// 証拠写真の保存先
const EVIDENCE_DIR = path.join(__dirname, '../registry/evidence');

// テスト全体の結果を追跡（全合格かどうかの判定用）
let anyFailed = false;

// -------------------------------------------------------
// テストの準備と後片付け
// -------------------------------------------------------
let app, window;

test.beforeAll(async () => {
    // Obsidianを起動
    const launched = await launchObsidian();
    app = launched.app;
    window = launched.window;

    // 証拠写真フォルダを確認
    if (!fs.existsSync(EVIDENCE_DIR)) {
        fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }

    // Obsidianが完全に起動するまで少し待つ（起動が遅い場合に備えて）
    await window.waitForTimeout(3000);
});

test.afterAll(async () => {
    if (app) await app.close();
    cleanupVault();               // 使い捨てVaultを削除
    cleanupEvidence(!anyFailed);  // 全合格なら証拠写真も削除
});

test.afterEach(async ({ }, testInfo) => {
    if (testInfo.status !== 'passed') {
        anyFailed = true;
    }
});

// -------------------------------------------------------
// U1: プラグインが有効になっているか
// -------------------------------------------------------
test('U1: Vault Alchemistプラグインが有効になっているか', async () => {
    // 設定を開く（コマンドパレット経由）
    await window.keyboard.press('Meta+,'); // Cmd+, で設定を開く
    await window.waitForTimeout(1000);

    // 「コミュニティプラグイン」をクリック
    const communityPlugins = window.locator('text=コミュニティプラグイン').first();
    await expect(communityPlugins).toBeVisible({ timeout: 5000 });
    await communityPlugins.click();
    await window.waitForTimeout(500);

    // Vault Alchemistが表示されているか確認
    const pluginEntry = window.locator('text=Vault Alchemist').first();

    // 見つからなかったら → 言葉で説明できない可能性があるためスクショ撮影
    if (!(await pluginEntry.isVisible())) {
        const screenshotPath = path.join(EVIDENCE_DIR, 'U1-plugin-not-found.png');
        await window.screenshot({ path: screenshotPath });
        throw new Error(
            `🔴 U1失敗: Vault Alchemistがプラグイン一覧に表示されません。\n` +
            `📸 スクショ: ${screenshotPath}\n` +
            `💡 ヒント: deploy-plugin.sh を実行してプラグインをObsidianに配置してください。`
        );
    }

    // 「有効」状態になっているか確認（トグルがオンか）
    const toggle = window.locator('[data-plugin-id="vault-alchemist"] .checkbox-container');
    await expect(toggle).toHaveClass(/is-enabled/, { timeout: 3000 });
});

// -------------------------------------------------------
// U2: サービスが自動起動しているか
// -------------------------------------------------------
test('U2: サービスが「Running」状態で起動しているか', async () => {
    // プラグイン設定を開く
    await window.keyboard.press('Meta+,');
    await window.waitForTimeout(500);

    const pluginSettings = window.locator('text=Vault Alchemist').nth(1); // 設定メニュー内の項目
    await pluginSettings.click();
    await window.waitForTimeout(1000);

    // "Service: Running" が表示されているか
    const serviceStatus = window.locator('text=Service: Running');
    const isRunning = await serviceStatus.isVisible();

    if (!isRunning) {
        // UIでの状態が不明→スクショで確認
        const screenshotPath = path.join(EVIDENCE_DIR, 'U2-service-not-running.png');
        await window.screenshot({ path: screenshotPath });
        throw new Error(
            `🔴 U2失敗: サービスが起動していません（"Service: Running"が見つかりません）。\n` +
            `📸 スクショ: ${screenshotPath}\n` +
            `💡 ヒント: node service/dist/main.js がバックグラウンドで動いているか確認してください。`
        );
    }
});

// -------------------------------------------------------
// U3: ホームビューが開くか
// -------------------------------------------------------
test('U3: 左サイドバーの📖アイコンでホーム画面が開くか', async () => {
    // 左サイドバーのアイコンをクリック
    const homeIcon = window.locator('[aria-label="Open Vault Alchemist Home"]');
    await expect(homeIcon).toBeVisible({ timeout: 5000 });
    await homeIcon.click();
    await window.waitForTimeout(1000);

    // ホーム画面が開いたか確認
    const homeView = window.locator('.vault-alchemist-home');
    const isVisible = await homeView.isVisible();

    if (!isVisible) {
        const screenshotPath = path.join(EVIDENCE_DIR, 'U3-home-not-opened.png');
        await window.screenshot({ path: screenshotPath });
        throw new Error(
            `🔴 U3失敗: ホーム画面が開きませんでした。\n` +
            `📸 スクショ: ${screenshotPath}\n` +
            `💡 ヒント: .vault-alchemist-home クラスの要素が見つかりません。CSSクラス名が変わった可能性があります。`
        );
    }
});
