/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 潮位データ
// http://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php

// 油壺
// 20XX年

(function() {
  var lines = [
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseTideLines(lines);
  //
})();
