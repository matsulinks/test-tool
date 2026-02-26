/**
 * Antigravity Monitor - agent-progress.md の更新を監視して Discord に通知する
 * 
 * Script Properties に以下を設定すること:
 *   DISCORD_WEBHOOK_URL  - Discord Webhook URL
 *   DRIVE_FOLDER_ID      - 監視対象ファイルが入っている Google Drive フォルダ ID
 *   TIMEOUT_MINUTES      - 更新停止とみなす分数（デフォルト5）
 *   FILE_NAME            - 監視対象ファイル名（デフォルト agent-progress.md）
 */

var ALERT_KEYWORDS = ['terminated', '500 Internal', 'quota', 'rate limit', 'timeout', 'ERROR'];

function checkAntigravityStatus() {
  try {
    var props = PropertiesService.getScriptProperties();
    var webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
    var folderId = props.getProperty('DRIVE_FOLDER_ID');
    var timeoutMinutes = parseInt(props.getProperty('TIMEOUT_MINUTES') || '5', 10);
    var fileName = props.getProperty('FILE_NAME') || 'agent-progress.md';

    if (!webhookUrl) {
      Logger.log('ERROR: DISCORD_WEBHOOK_URL が設定されていません');
      return;
    }

    if (!folderId) {
      Logger.log('ERROR: DRIVE_FOLDER_ID が設定されていません');
      return;
    }

    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByName(fileName);

    if (!files.hasNext()) {
      // ファイルが存在しない = Antigravity 未起動とみなして何もしない
      Logger.log('agent-progress.md が見つかりません。Antigravity 未起動とみなしてスキップします。');
      return;
    }

    var file = files.next();
    var lastUpdated = file.getLastUpdated();
    var now = new Date();
    var elapsedMinutes = (now - lastUpdated) / 1000 / 60;

    Logger.log('ファイル最終更新: ' + lastUpdated + ' (' + elapsedMinutes.toFixed(1) + '分前)');

    // ファイル内容を確認してエラーキーワードを検索
    var content = '';
    try {
      content = file.getBlob().getDataAsString('UTF-8');
    } catch (e) {
      Logger.log('ファイル内容の読み取りエラー: ' + e.toString());
    }

    var foundKeywords = [];
    for (var i = 0; i < ALERT_KEYWORDS.length; i++) {
      if (content.toLowerCase().indexOf(ALERT_KEYWORDS[i].toLowerCase()) !== -1) {
        foundKeywords.push(ALERT_KEYWORDS[i]);
      }
    }

    if (foundKeywords.length > 0) {
      Logger.log('エラーキーワード検出: ' + foundKeywords.join(', '));
      sendDiscordAlert(webhookUrl, {
        time: formatTime(now),
        reason: 'agent-progress.md にエラーキーワードを検出: ' + foundKeywords.join(', '),
        action: 'エラー内容を確認し、Antigravity を再起動してください'
      });
      return;
    }

    if (elapsedMinutes >= timeoutMinutes) {
      Logger.log('更新停止検出: ' + elapsedMinutes.toFixed(1) + '分間更新なし');
      sendDiscordAlert(webhookUrl, {
        time: formatTime(now),
        reason: Math.floor(elapsedMinutes) + '分間 agent-progress.md が更新されていません（最終更新: ' + formatTime(lastUpdated) + '）',
        action: 'Antigravity の状態を確認し、必要に応じて再起動してください'
      });
      return;
    }

    Logger.log('Antigravity は正常動作中（' + elapsedMinutes.toFixed(1) + '分前に更新）');

  } catch (e) {
    Logger.log('checkAntigravityStatus エラー: ' + e.toString());
  }
}

function sendDiscordAlert(webhookUrl, info) {
  try {
    var message = {
      content: '🚨 **Antigravity停止を検知**\n' +
               '⏰ 検知時刻：' + info.time + '\n' +
               '❌ 状況：' + info.reason + '\n' +
               '📋 推奨対処：' + info.action
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(message),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(webhookUrl, options);
    var code = response.getResponseCode();

    if (code === 204 || code === 200) {
      Logger.log('Discord 通知送信成功');
    } else {
      Logger.log('Discord 通知失敗: HTTP ' + code + ' - ' + response.getContentText());
    }
  } catch (e) {
    Logger.log('sendDiscordAlert エラー: ' + e.toString());
  }
}

function formatTime(date) {
  var d = new Date(date);
  var pad = function(n) { return n < 10 ? '0' + n : String(n); };
  return d.getFullYear() + '/' +
         pad(d.getMonth() + 1) + '/' +
         pad(d.getDate()) + ' ' +
         pad(d.getHours()) + ':' +
         pad(d.getMinutes()) + ':' +
         pad(d.getSeconds());
}

/**
 * テスト用: Discord に手動でアラートを送信する
 */
function testDiscordAlert() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');
  if (!webhookUrl) {
    Logger.log('DISCORD_WEBHOOK_URL が設定されていません');
    return;
  }
  sendDiscordAlert(webhookUrl, {
    time: formatTime(new Date()),
    reason: 'テスト実行: 監視システムが正常に動作しています',
    action: 'これはテスト通知です。実際のアラートではありません'
  });
}

/**
 * 5分ごとのトリガーをセットアップする（一度だけ実行する）
 */
function setupTrigger() {
  // 既存トリガーを削除
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkAntigravityStatus') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('既存トリガーを削除しました');
    }
  }

  // 5分ごとのトリガーを作成
  ScriptApp.newTrigger('checkAntigravityStatus')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('5分ごとのトリガーを設定しました');
}
