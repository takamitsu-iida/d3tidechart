/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// こよみのページ
// http://koyomi8.com/

// 月齢(こよみ式)
// 2022年

(function() {
  var year = 2022;
  var lines = [
    "1/1,中潮",
    "1/2,中潮",
    "1/3,大潮",
    "1/4,大潮",
    "1/5,大潮",
    "1/6,中潮",
    "1/7,中潮",
    "1/8,中潮",
    "1/9,中潮",
    "1/10,小潮",
    "1/11,小潮",
    "1/12,小潮",
    "1/13,長潮",
    "1/14,若潮",
    "1/15,中潮",
    "1/16,中潮",
    "1/17,大潮",
    "1/18,大潮",
    "1/19,大潮",
    "1/20,大潮",
    "1/21,中潮",
    "1/22,中潮",
    "1/23,中潮",
    "1/24,中潮",
    "1/25,小潮",
    "1/26,小潮",
    "1/27,小潮",
    "1/28,長潮",
    "1/29,若潮",
    "1/30,中潮",
    "1/31,中潮",
    "2/1,大潮",
    "2/2,大潮",
    "2/3,大潮",
    "2/4,大潮",
    "2/5,中潮",
    "2/6,中潮",
    "2/7,中潮",
    "2/8,中潮",
    "2/9,小潮",
    "2/10,小潮",
    "2/11,小潮",
    "2/12,長潮",
    "2/13,若潮",
    "2/14,中潮",
    "2/15,中潮",
    "2/16,大潮",
    "2/17,大潮",
    "2/18,大潮",
    "2/19,大潮",
    "2/20,中潮",
    "2/21,中潮",
    "2/22,中潮",
    "2/23,中潮",
    "2/24,小潮",
    "2/25,小潮",
    "2/26,小潮",
    "2/27,長潮",
    "2/28,若潮",
    "3/1,中潮",
    "3/2,中潮",
    "3/3,大潮",
    "3/4,大潮",
    "3/5,大潮",
    "3/6,中潮",
    "3/7,中潮",
    "3/8,中潮",
    "3/9,中潮",
    "3/10,小潮",
    "3/11,小潮",
    "3/12,小潮",
    "3/13,長潮",
    "3/14,若潮",
    "3/15,中潮",
    "3/16,中潮",
    "3/17,大潮",
    "3/18,大潮",
    "3/19,大潮",
    "3/20,大潮",
    "3/21,中潮",
    "3/22,中潮",
    "3/23,中潮",
    "3/24,中潮",
    "3/25,小潮",
    "3/26,小潮",
    "3/27,小潮",
    "3/28,長潮",
    "3/29,若潮",
    "3/30,中潮",
    "3/31,中潮",
    "4/1,大潮",
    "4/2,大潮",
    "4/3,大潮",
    "4/4,大潮",
    "4/5,中潮",
    "4/6,中潮",
    "4/7,中潮",
    "4/8,中潮",
    "4/9,小潮",
    "4/10,小潮",
    "4/11,小潮",
    "4/12,長潮",
    "4/13,若潮",
    "4/14,中潮",
    "4/15,中潮",
    "4/16,大潮",
    "4/17,大潮",
    "4/18,大潮",
    "4/19,大潮",
    "4/20,中潮",
    "4/21,中潮",
    "4/22,中潮",
    "4/23,中潮",
    "4/24,小潮",
    "4/25,小潮",
    "4/26,小潮",
    "4/27,長潮",
    "4/28,若潮",
    "4/29,中潮",
    "4/30,中潮",
    "5/1,大潮",
    "5/2,大潮",
    "5/3,大潮",
    "5/4,中潮",
    "5/5,中潮",
    "5/6,中潮",
    "5/7,中潮",
    "5/8,小潮",
    "5/9,小潮",
    "5/10,小潮",
    "5/11,長潮",
    "5/12,若潮",
    "5/13,中潮",
    "5/14,中潮",
    "5/15,大潮",
    "5/16,大潮",
    "5/17,大潮",
    "5/18,大潮",
    "5/19,中潮",
    "5/20,中潮",
    "5/21,中潮",
    "5/22,中潮",
    "5/23,小潮",
    "5/24,小潮",
    "5/25,小潮",
    "5/26,長潮",
    "5/27,若潮",
    "5/28,中潮",
    "5/29,中潮",
    "5/30,大潮",
    "5/31,大潮",
    "6/1,大潮",
    "6/2,大潮",
    "6/3,中潮",
    "6/4,中潮",
    "6/5,中潮",
    "6/6,中潮",
    "6/7,小潮",
    "6/8,小潮",
    "6/9,小潮",
    "6/10,長潮",
    "6/11,若潮",
    "6/12,中潮",
    "6/13,中潮",
    "6/14,大潮",
    "6/15,大潮",
    "6/16,大潮",
    "6/17,大潮",
    "6/18,中潮",
    "6/19,中潮",
    "6/20,中潮",
    "6/21,中潮",
    "6/22,小潮",
    "6/23,小潮",
    "6/24,小潮",
    "6/25,長潮",
    "6/26,若潮",
    "6/27,中潮",
    "6/28,中潮",
    "6/29,大潮",
    "6/30,大潮",
    "7/1,大潮",
    "7/2,中潮",
    "7/3,中潮",
    "7/4,中潮",
    "7/5,中潮",
    "7/6,小潮",
    "7/7,小潮",
    "7/8,小潮",
    "7/9,長潮",
    "7/10,若潮",
    "7/11,中潮",
    "7/12,中潮",
    "7/13,大潮",
    "7/14,大潮",
    "7/15,大潮",
    "7/16,大潮",
    "7/17,中潮",
    "7/18,中潮",
    "7/19,中潮",
    "7/20,中潮",
    "7/21,小潮",
    "7/22,小潮",
    "7/23,小潮",
    "7/24,長潮",
    "7/25,若潮",
    "7/26,中潮",
    "7/27,中潮",
    "7/28,大潮",
    "7/29,大潮",
    "7/30,大潮",
    "7/31,大潮",
    "8/1,中潮",
    "8/2,中潮",
    "8/3,中潮",
    "8/4,中潮",
    "8/5,小潮",
    "8/6,小潮",
    "8/7,小潮",
    "8/8,長潮",
    "8/9,若潮",
    "8/10,中潮",
    "8/11,中潮",
    "8/12,大潮",
    "8/13,大潮",
    "8/14,大潮",
    "8/15,大潮",
    "8/16,中潮",
    "8/17,中潮",
    "8/18,中潮",
    "8/19,中潮",
    "8/20,小潮",
    "8/21,小潮",
    "8/22,小潮",
    "8/23,長潮",
    "8/24,若潮",
    "8/25,中潮",
    "8/26,中潮",
    "8/27,大潮",
    "8/28,大潮",
    "8/29,大潮",
    "8/30,大潮",
    "8/31,中潮",
    "9/1,中潮",
    "9/2,中潮",
    "9/3,中潮",
    "9/4,小潮",
    "9/5,小潮",
    "9/6,小潮",
    "9/7,長潮",
    "9/8,若潮",
    "9/9,中潮",
    "9/10,中潮",
    "9/11,大潮",
    "9/12,大潮",
    "9/13,大潮",
    "9/14,大潮",
    "9/15,中潮",
    "9/16,中潮",
    "9/17,中潮",
    "9/18,中潮",
    "9/19,小潮",
    "9/20,小潮",
    "9/21,小潮",
    "9/22,長潮",
    "9/23,若潮",
    "9/24,中潮",
    "9/25,中潮",
    "9/26,大潮",
    "9/27,大潮",
    "9/28,大潮",
    "9/29,中潮",
    "9/30,中潮",
    "10/1,中潮",
    "10/2,中潮",
    "10/3,小潮",
    "10/4,小潮",
    "10/5,小潮",
    "10/6,長潮",
    "10/7,若潮",
    "10/8,中潮",
    "10/9,中潮",
    "10/10,大潮",
    "10/11,大潮",
    "10/12,大潮",
    "10/13,大潮",
    "10/14,中潮",
    "10/15,中潮",
    "10/16,中潮",
    "10/17,中潮",
    "10/18,小潮",
    "10/19,小潮",
    "10/20,小潮",
    "10/21,長潮",
    "10/22,若潮",
    "10/23,中潮",
    "10/24,中潮",
    "10/25,大潮",
    "10/26,大潮",
    "10/27,大潮",
    "10/28,大潮",
    "10/29,中潮",
    "10/30,中潮",
    "10/31,中潮",
    "11/1,中潮",
    "11/2,小潮",
    "11/3,小潮",
    "11/4,小潮",
    "11/5,長潮",
    "11/6,若潮",
    "11/7,中潮",
    "11/8,中潮",
    "11/9,大潮",
    "11/10,大潮",
    "11/11,大潮",
    "11/12,大潮",
    "11/13,中潮",
    "11/14,中潮",
    "11/15,中潮",
    "11/16,中潮",
    "11/17,小潮",
    "11/18,小潮",
    "11/19,小潮",
    "11/20,長潮",
    "11/21,若潮",
    "11/22,中潮",
    "11/23,中潮",
    "11/24,大潮",
    "11/25,大潮",
    "11/26,大潮",
    "11/27,中潮",
    "11/28,中潮",
    "11/29,中潮",
    "11/30,中潮",
    "12/1,小潮",
    "12/2,小潮",
    "12/3,小潮",
    "12/4,長潮",
    "12/5,若潮",
    "12/6,中潮",
    "12/7,中潮",
    "12/8,大潮",
    "12/9,大潮",
    "12/10,大潮",
    "12/11,大潮",
    "12/12,中潮",
    "12/13,中潮",
    "12/14,中潮",
    "12/15,中潮",
    "12/16,小潮",
    "12/17,小潮",
    "12/18,小潮",
    "12/19,長潮",
    "12/20,若潮",
    "12/21,中潮",
    "12/22,中潮",
    "12/23,大潮",
    "12/24,大潮",
    "12/25,大潮",
    "12/26,大潮",
    "12/27,中潮",
    "12/28,中潮",
    "12/29,中潮",
    "12/30,中潮",
    "12/31,小潮",
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseMoonLines(year, lines);
  //
})();
