/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 国立天文台 各地のこよみ
// 日の出・日の入
// http://eco.mtk.nao.ac.jp/koyomi/dni/
//
// このサイトでは月単位でしか表示されないので、画面をコピペして一年分にする。

// 1ヶ月ごとウェブ画面をコピペしてemacsで加工して作成
// emacsにコピペ
// meta-x replace-regexp
// ^
// 2020/01
// 日付の1〜9を01〜09に書き換える
// meta-x kill-rectangle
// meta-x replace-string でスペースを,に
// meta-x replace-regexp
// ^
// '
// meta-x replace-regexp
// $
// ',
// 最終行の,を削除

// 20XX年

(function() {
  var lines = [
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseSunriseLines(lines);
  //
})();
