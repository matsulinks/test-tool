// （通知エンジン）notifier.js
// デッドロック時に監督（人間）へ Discord または LINE で通知するエンジン
// どちらか好きな方を setup.sh で設定するだけで動く

const https = require('https');
const url = require('url');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// .env から読み込む
const DISCORD_WEBHOOK = process.env.ATP_DISCORD_WEBHOOK; // Discord Webhook URL
const LINE_TOKEN = process.env.ATP_LINE_TOKEN;       // LINE Notify トークン

// -------------------------------------------------------
// Discord への通知
// -------------------------------------------------------
async function notifyDiscord(title, message) {
    if (!DISCORD_WEBHOOK) return false;

    const payload = JSON.stringify({
        username: '🛰️ Alchemist Test Pilot',
        avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        embeds: [{
            title: title,
            description: message,
            color: 0xFF4444, // 赤
            timestamp: new Date().toISOString(),
            footer: { text: 'ATP — Alchemist Test Pilot' },
        }],
    });

    return postHttps(DISCORD_WEBHOOK, payload, {
        'Content-Type': 'application/json',
    });
}

// -------------------------------------------------------
// LINE Notify への通知
// -------------------------------------------------------
async function notifyLine(message) {
    if (!LINE_TOKEN) return false;

    const body = `message=${encodeURIComponent(`🛰️ ATP\n${message}`)}`;

    return postHttps('https://notify-api.line.me/api/notify', body, {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${LINE_TOKEN}`,
    });
}

// -------------------------------------------------------
// メイン通知関数（Discord と LINE を両方試みる）
// -------------------------------------------------------
async function notifyDeadlock(failedCount, issueUrl) {
    const title = `🛑 ATPデッドロック！人間の介入が必要です`;
    const message = [
        `**失敗回数**: ${failedCount} 回連続`,
        `**GitHub Issue**: ${issueUrl ?? '（Issueなし）'}`,
        '',
        '自動修復を停止しました。',
        'Grok向け質問状を確認して、手動で対応してください。',
        '`tests/registry/grok_question.md` を開いてください。',
    ].join('\n');

    let sent = false;

    // Discord に通知
    if (DISCORD_WEBHOOK) {
        const ok = await notifyDiscord(title, message);
        if (ok) {
            console.log('📣 ATP: Discordに通知しました');
            sent = true;
        }
    }

    // LINE に通知
    if (LINE_TOKEN) {
        const ok = await notifyLine(`${title}\n\n${message}`);
        if (ok) {
            console.log('📣 ATP: LINEに通知しました');
            sent = true;
        }
    }

    if (!sent) {
        console.log('⚠️  ATP: 通知先が設定されていません。');
        console.log('   setup.sh を再実行してDiscordまたはLINEを設定してください。');
    }
}

// -------------------------------------------------------
// 内部ヘルパー: HTTPS POST
// -------------------------------------------------------
function postHttps(targetUrl, body, headers) {
    return new Promise((resolve) => {
        const parsed = url.parse(targetUrl);
        const options = {
            hostname: parsed.hostname,
            path: parsed.path,
            method: 'POST',
            headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
        };

        const req = https.request(options, (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 300);
        });
        req.on('error', () => resolve(false));
        req.write(body);
        req.end();
    });
}

module.exports = { notifyDeadlock };
