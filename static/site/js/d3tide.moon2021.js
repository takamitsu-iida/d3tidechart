/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// こよみのページ
// http://koyomi8.com/

// 月齢(こよみ式)
// 2021年

(function() {
  var year = 2021;
  var lines = [
    '1/1,大潮',
    '1/2,中潮',
    '1/3,中潮',
    '1/4,中潮',
    '1/5,中潮',
    '1/6,小潮',
    '1/7,小潮',
    '1/8,小潮',
    '1/9,長潮',
    '1/10,若潮',
    '1/11,中潮',
    '1/12,中潮',
    '1/13,大潮',
    '1/14,大潮',
    '1/15,大潮',
    '1/16,大潮',
    '1/17,中潮',
    '1/18,中潮',
    '1/19,中潮',
    '1/20,中潮',
    '1/21,小潮',
    '1/22,小潮',
    '1/23,小潮',
    '1/24,長潮',
    '1/25,若潮',
    '1/26,中潮',
    '1/27,中潮',
    '1/28,大潮',
    '1/29,大潮',
    '1/30,大潮',
    '1/31,大潮',
    '2/1,中潮',
    '2/2,中潮',
    '2/3,中潮',
    '2/4,中潮',
    '2/5,小潮',
    '2/6,小潮',
    '2/7,小潮',
    '2/8,長潮',
    '2/9,若潮',
    '2/10,中潮',
    '2/11,中潮',
    '2/12,大潮',
    '2/13,大潮',
    '2/14,大潮',
    '2/15,中潮',
    '2/16,中潮',
    '2/17,中潮',
    '2/18,中潮',
    '2/19,小潮',
    '2/20,小潮',
    '2/21,小潮',
    '2/22,長潮',
    '2/23,若潮',
    '2/24,中潮',
    '2/25,中潮',
    '2/26,大潮',
    '2/27,大潮',
    '2/28,大潮',
    '3/1,大潮',
    '3/2,中潮',
    '3/3,中潮',
    '3/4,中潮',
    '3/5,中潮',
    '3/6,小潮',
    '3/7,小潮',
    '3/8,小潮',
    '3/9,長潮',
    '3/10,若潮',
    '3/11,中潮',
    '3/12,中潮',
    '3/13,大潮',
    '3/14,大潮',
    '3/15,大潮',
    '3/16,大潮',
    '3/17,中潮',
    '3/18,中潮',
    '3/19,中潮',
    '3/20,中潮',
    '3/21,小潮',
    '3/22,小潮',
    '3/23,小潮',
    '3/24,長潮',
    '3/25,若潮',
    '3/26,中潮',
    '3/27,中潮',
    '3/28,大潮',
    '3/29,大潮',
    '3/30,大潮',
    '3/31,大潮',
    '4/1,中潮',
    '4/2,中潮',
    '4/3,中潮',
    '4/4,中潮',
    '4/5,小潮',
    '4/6,小潮',
    '4/7,小潮',
    '4/8,長潮',
    '4/9,若潮',
    '4/10,中潮',
    '4/11,中潮',
    '4/12,大潮',
    '4/13,大潮',
    '4/14,大潮',
    '4/15,中潮',
    '4/16,中潮',
    '4/17,中潮',
    '4/18,中潮',
    '4/19,小潮',
    '4/20,小潮',
    '4/21,小潮',
    '4/22,長潮',
    '4/23,若潮',
    '4/24,中潮',
    '4/25,中潮',
    '4/26,大潮',
    '4/27,大潮',
    '4/28,大潮',
    '4/29,大潮',
    '4/30,中潮',
    '5/1,中潮',
    '5/2,中潮',
    '5/3,中潮',
    '5/4,小潮',
    '5/5,小潮',
    '5/6,小潮',
    '5/7,長潮',
    '5/8,若潮',
    '5/9,中潮',
    '5/10,中潮',
    '5/11,大潮',
    '5/12,大潮',
    '5/13,大潮',
    '5/14,大潮',
    '5/15,中潮',
    '5/16,中潮',
    '5/17,中潮',
    '5/18,中潮',
    '5/19,小潮',
    '5/20,小潮',
    '5/21,小潮',
    '5/22,長潮',
    '5/23,若潮',
    '5/24,中潮',
    '5/25,中潮',
    '5/26,大潮',
    '5/27,大潮',
    '5/28,大潮',
    '5/29,大潮',
    '5/30,中潮',
    '5/31,中潮',
    '6/1,中潮',
    '6/2,中潮',
    '6/3,小潮',
    '6/4,小潮',
    '6/5,小潮',
    '6/6,長潮',
    '6/7,若潮',
    '6/8,中潮',
    '6/9,中潮',
    '6/10,大潮',
    '6/11,大潮',
    '6/12,大潮',
    '6/13,大潮',
    '6/14,中潮',
    '6/15,中潮',
    '6/16,中潮',
    '6/17,中潮',
    '6/18,小潮',
    '6/19,小潮',
    '6/20,小潮',
    '6/21,長潮',
    '6/22,若潮',
    '6/23,中潮',
    '6/24,中潮',
    '6/25,大潮',
    '6/26,大潮',
    '6/27,大潮',
    '6/28,大潮',
    '6/29,中潮',
    '6/30,中潮',
    '7/1,中潮',
    '7/2,中潮',
    '7/3,小潮',
    '7/4,小潮',
    '7/5,小潮',
    '7/6,長潮',
    '7/7,若潮',
    '7/8,中潮',
    '7/9,中潮',
    '7/10,大潮',
    '7/11,大潮',
    '7/12,大潮',
    '7/13,中潮',
    '7/14,中潮',
    '7/15,中潮',
    '7/16,中潮',
    '7/17,小潮',
    '7/18,小潮',
    '7/19,小潮',
    '7/20,長潮',
    '7/21,若潮',
    '7/22,中潮',
    '7/23,中潮',
    '7/24,大潮',
    '7/25,大潮',
    '7/26,大潮',
    '7/27,大潮',
    '7/28,中潮',
    '7/29,中潮',
    '7/30,中潮',
    '7/31,中潮',
    '8/1,小潮',
    '8/2,小潮',
    '8/3,小潮',
    '8/4,長潮',
    '8/5,若潮',
    '8/6,中潮',
    '8/7,中潮',
    '8/8,大潮',
    '8/9,大潮',
    '8/10,大潮',
    '8/11,大潮',
    '8/12,中潮',
    '8/13,中潮',
    '8/14,中潮',
    '8/15,中潮',
    '8/16,小潮',
    '8/17,小潮',
    '8/18,小潮',
    '8/19,長潮',
    '8/20,若潮',
    '8/21,中潮',
    '8/22,中潮',
    '8/23,大潮',
    '8/24,大潮',
    '8/25,大潮',
    '8/26,大潮',
    '8/27,中潮',
    '8/28,中潮',
    '8/29,中潮',
    '8/30,中潮',
    '8/31,小潮',
    '9/1,小潮',
    '9/2,小潮',
    '9/3,長潮',
    '9/4,若潮',
    '9/5,中潮',
    '9/6,中潮',
    '9/7,大潮',
    '9/8,大潮',
    '9/9,大潮',
    '9/10,中潮',
    '9/11,中潮',
    '9/12,中潮',
    '9/13,中潮',
    '9/14,小潮',
    '9/15,小潮',
    '9/16,小潮',
    '9/17,長潮',
    '9/18,若潮',
    '9/19,中潮',
    '9/20,中潮',
    '9/21,大潮',
    '9/22,大潮',
    '9/23,大潮',
    '9/24,大潮',
    '9/25,中潮',
    '9/26,中潮',
    '9/27,中潮',
    '9/28,中潮',
    '9/29,小潮',
    '9/30,小潮',
    '10/1,小潮',
    '10/2,長潮',
    '10/3,若潮',
    '10/4,中潮',
    '10/5,中潮',
    '10/6,大潮',
    '10/7,大潮',
    '10/8,大潮',
    '10/9,大潮',
    '10/10,中潮',
    '10/11,中潮',
    '10/12,中潮',
    '10/13,中潮',
    '10/14,小潮',
    '10/15,小潮',
    '10/16,小潮',
    '10/17,長潮',
    '10/18,若潮',
    '10/19,中潮',
    '10/20,中潮',
    '10/21,大潮',
    '10/22,大潮',
    '10/23,大潮',
    '10/24,大潮',
    '10/25,中潮',
    '10/26,中潮',
    '10/27,中潮',
    '10/28,中潮',
    '10/29,小潮',
    '10/30,小潮',
    '10/31,小潮',
    '11/1,長潮',
    '11/2,若潮',
    '11/3,中潮',
    '11/4,中潮',
    '11/5,大潮',
    '11/6,大潮',
    '11/7,大潮',
    '11/8,中潮',
    '11/9,中潮',
    '11/10,中潮',
    '11/11,中潮',
    '11/12,小潮',
    '11/13,小潮',
    '11/14,小潮',
    '11/15,長潮',
    '11/16,若潮',
    '11/17,中潮',
    '11/18,中潮',
    '11/19,大潮',
    '11/20,大潮',
    '11/21,大潮',
    '11/22,大潮',
    '11/23,中潮',
    '11/24,中潮',
    '11/25,中潮',
    '11/26,中潮',
    '11/27,小潮',
    '11/28,小潮',
    '11/29,小潮',
    '11/30,長潮',
    '12/1,若潮',
    '12/2,中潮',
    '12/3,中潮',
    '12/4,大潮',
    '12/5,大潮',
    '12/6,大潮',
    '12/7,大潮',
    '12/8,中潮',
    '12/9,中潮',
    '12/10,中潮',
    '12/11,中潮',
    '12/12,小潮',
    '12/13,小潮',
    '12/14,小潮',
    '12/15,長潮',
    '12/16,若潮',
    '12/17,中潮',
    '12/18,中潮',
    '12/19,大潮',
    '12/20,大潮',
    '12/21,大潮',
    '12/22,大潮',
    '12/23,中潮',
    '12/24,中潮',
    '12/25,中潮',
    '12/26,中潮',
    '12/27,小潮',
    '12/28,小潮',
    '12/29,小潮',
    '12/30,長潮',
    '12/31,若潮'
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseMoonLines(year, lines);
  //
})();
