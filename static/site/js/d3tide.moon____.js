/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// こよみのページ
// http://koyomi8.com/
//
// 暦データ公開　→　月齢カレンダー元データ

// 月齢(こよみ式)
// 20XX年

(function() {
  var year = 2019;
  var lines = [
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseMoonLines(year, lines);
  //
})();
