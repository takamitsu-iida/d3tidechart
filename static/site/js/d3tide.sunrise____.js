/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 国立天文台 各地のこよみ
// 日の出・日の入
// http://eco.mtk.nao.ac.jp/koyomi/dni/
// 
// このサイトでは月単位でしか表示されないので、画面をコピペして一年分にする。

// 20XX年

(function() {
  var lines = [
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseSunriseLines(lines);
  //
})();
