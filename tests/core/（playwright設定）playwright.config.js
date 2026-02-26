// playwright.config.js — ATP用Playwright設定ファイル
// ObsidianはElectronアプリのため、_electron モードで制御する

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    // テストファイルの場所
    testDir: './tests/ui',

    // タイムアウト設定（Obsidianの起動に余裕を持たせる）
    timeout: 60_000,
    expect: { timeout: 10_000 },

    // 失敗時は必ずスクショを撮る（聖域リストの方針に従う）
    use: {
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'retain-on-failure',
    },

    // 証拠写真の保存先（tests/registry/evidence/）
    outputDir: './tests/registry/evidence/',

    // 並列実行は OFF（Obsidianは1プロセスしか起動できないため）
    workers: 1,

    // テストレポーター
    reporter: [
        ['list'],                                         // ターミナルに進捗表示
        ['json', { outputFile: 'tests/registry/last_result.json' }], // JSON出力
    ],
});
