// （GitHub連携）github-connector.js
// テスト失敗時にGitHub Issueを自動投稿し、
// 開発AIがIssueをCloseするのを監視して再テストを起動するパイプライン

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // ルートの.envを読む

// -------------------------------------------------------
// 設定（テスト対象のリポジトリ情報）
// -------------------------------------------------------
const GITHUB_TOKEN = process.env.ATP_GITHUB_TOKEN;
const REPO_OWNER = 'matsulinks';
const REPO_NAME = 'vault-alchemist';

// GitHub Issueのラベル定義
const LABELS = {
    FAILURE: '🔴 テスト失敗',
    COMPLETE: 'atp:project-complete',  // プロジェクト完了の合図
};

// -------------------------------------------------------
// 内部ヘルパー: GitHubのAPIを叩く
// -------------------------------------------------------
function githubApi(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${REPO_OWNER}/${REPO_NAME}${endpoint}`,
            method,
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'AlchemistTestPilot/1.0',
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// -------------------------------------------------------
// テスト失敗時: GitHub Issue を自動投稿
// -------------------------------------------------------
async function postFailureIssue(reportSummary) {
    if (!GITHUB_TOKEN) {
        console.error('❌ ATP_GITHUB_TOKEN が設定されていません。setup.sh を実行してください。');
        return null;
    }

    const title = `🔴 [ATP] テスト失敗 ${new Date().toLocaleDateString('ja-JP')}`;
    const body = `## 🛰️ Alchemist Test Pilot からの報告

${reportSummary}

---

## 🤖 開発AI へ

1. 上記の失敗項目を修正してください
2. 修正完了後、\`tests/registry/latest_report.md\` を**削除**してください
3. このIssueを**GitHub上で直接Close（またはgh CLI等で手動Close）**してください。
   ⚠️ 注意: 作業ブランチからのPushの場合、コミットメッセージによる自動Close（\`Closes #XXX\`）は発動しません。必ず手動でCloseしてください。
   （IssueのCloseを検知した時点で、ATPが再テストを開始します）

> このIssueはATPが自動生成しました。`;

    const res = await githubApi('POST', '/issues', {
        title,
        body,
        labels: [LABELS.FAILURE],
    });

    if (res.status === 201) {
        console.log(`📮 ATP: GitHub Issueを投稿しました → #${res.body.number}`);
        console.log(`   URL: ${res.body.html_url}`);
        return res.body.number;
    } else {
        console.error(`❌ Issue投稿に失敗しました（HTTP ${res.status}）`);
        return null;
    }
}

// -------------------------------------------------------
// Issue が Close されたか監視する（修正完了の検知）
// -------------------------------------------------------
async function watchIssueForClose(issueNumber, intervalMs = 30000, onClosed) {
    if (!issueNumber) return;

    console.log(`👀 ATP: Issue #${issueNumber} のCloseを監視中...（${intervalMs / 1000}秒おきに確認）`);

    const timer = setInterval(async () => {
        const res = await githubApi('GET', `/issues/${issueNumber}`);
        if (res.body?.state === 'closed') {
            clearInterval(timer);
            console.log(`✅ ATP: Issue #${issueNumber} がCloseされました！修正完了と判断します。`);
            onClosed();
        }
    }, intervalMs);

    return timer;
}

// -------------------------------------------------------
// プロジェクト完了通知の検知（開発終了の合図）
// -------------------------------------------------------
async function checkProjectComplete() {
    const res = await githubApi('GET', '/issues?labels=atp:project-complete&state=open');
    if (res.body?.length > 0) {
        console.log('🏁 ATP: プロジェクト完了のIssueを検知。テスト設定をarchiveに移動します。');
        return true;
    }
    return false;
}

module.exports = { postFailureIssue, watchIssueForClose, checkProjectComplete };
