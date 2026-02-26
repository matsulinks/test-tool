/**
 * Script Properties を一括セットアップする関数
 * GAS エディタから一度だけ実行する
 */
function setupProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'DISCORD_WEBHOOK_URL': 'https://discord.com/api/webhooks/1473598795160752181/pemXqhToWx4a6GaHdH-iBFblf1lchmjlu0OpFIRHyO3MhCAVJvT5NpK9Rgzjh9CiKUcU',
    'DRIVE_FOLDER_ID': '1EWpIYiioKQO6nOVdpKDhNuK8wQQdMFnZ',
    'TIMEOUT_MINUTES': '5',
    'FILE_NAME': 'agent-progress.md'
  });
  Logger.log('Script Properties を設定しました');
  Logger.log('DISCORD_WEBHOOK_URL: 設定済み');
  Logger.log('DRIVE_FOLDER_ID: 1EWpIYiioKQO6nOVdpKDhNuK8wQQdMFnZ');
  Logger.log('TIMEOUT_MINUTES: 5');
  Logger.log('FILE_NAME: agent-progress.md');
}
