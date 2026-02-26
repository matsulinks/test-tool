// （安全装置＋Grok質問状）safety-guard.js
// テスト失敗が3回重なった時のデッドロック防止機能と
// Grok向け質問状の自動生成エンジン

const fs = require('fs');
const path = require('path');

const FAIL_COUNT_FILE = path.join(__dirname, '../registry/.fail_count');
const MAX_RETRIES = 3; // 聖域リストの哲学に従い、3回で停止

// -------------------------------------------------------
// 失敗カウンターの管理
// -------------------------------------------------------
function getFailCount() {
    if (!fs.existsSync(FAIL_COUNT_FILE)) return 0;
    return parseInt(fs.readFileSync(FAIL_COUNT_FILE, 'utf8').trim()) || 0;
}

function incrementFailCount() {
    const count = getFailCount() + 1;
    fs.writeFileSync(FAIL_COUNT_FILE, String(count));
    return count;
}

function resetFailCount() {
    if (fs.existsSync(FAIL_COUNT_FILE)) {
        fs.unlinkSync(FAIL_COUNT_FILE);
    }
    console.log('🔄 ATP: 失敗カウンターをリセットしました。');
}

// -------------------------------------------------------
// 安全装置: 3回失敗でデッドロック判定
// -------------------------------------------------------
function checkDeadlock() {
    const count = incrementFailCount();
    console.log(`⚠️  ATP: 失敗 ${count}/${MAX_RETRIES} 回目`);

    if (count >= MAX_RETRIES) {
        console.log('🛑 ATP: デッドロック検知！自動修復を停止します。');
        console.log('   → Grok向け質問状を生成します...');
        return true;
    }
    return false;
}

// -------------------------------------------------------
// Grok向け質問状の自動生成
// -------------------------------------------------------
function generateGrokQuestion(failedItems, reportPath) {
    const timestamp = new Date().toLocaleString('ja-JP');
    const failList = failedItems.map((item, i) =>
        `${i + 1}. **${item.group ?? item.id}**: ${item.desc}\n   期待値: ${item.expected ?? '不明'}\n   実際: ${item.actual ?? '取得できず'}`
    ).join('\n\n');

    const question = `# 🆘 Grok への質問状（ATP デッドロック報告）

> 生成日時: ${timestamp}
> 自動修復を **${MAX_RETRIES}回** 試みましたが、解決できませんでした。

## 何が壊れているか

以下のテストが **${MAX_RETRIES}回連続で失敗**しています：

${failList}

## 試したこと

- テスト失敗の都度、GitHub Issue で開発AIに修正を依頼した
- ${MAX_RETRIES}回修正→再テストを繰り返したが、改善しなかった

## 質問

1. 上記の失敗パターンから、根本原因として何が考えられるか？
2. 開発AIに渡すべき修正指示（具体的なファイルや関数レベルで）を教えてほしい
3. このまま自動修復を続けるべきか、人間の介入が必要か？

## テスト環境

- Node.js: ${process.version}
- プロジェクト: vault-alchemist (github.com/matsulinks/vault-alchemist)
- 報告書の場所: ${reportPath}
`;

    const questionPath = path.join(__dirname, '../registry/grok_question.md');
    fs.writeFileSync(questionPath, question.trim());
    console.log(`📝 ATP: Grok向け質問状を生成しました → ${questionPath}`);
    console.log('   内容をコピーしてGrokに貼り付けてください。');
    return questionPath;
}

module.exports = { checkDeadlock, resetFailCount, getFailCount, incrementFailCount, generateGrokQuestion };
