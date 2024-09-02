/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// こよみのページ
// http://koyomi8.com/
//
// 暦データ公開　→　月齢カレンダー元データ

// 月齢(こよみ式)
// 2026年

(function () {
  var year = 2026;
  var lines = [
    "01/01,中潮",
    "01/02,中潮",
    "01/03,大潮",
    "01/04,大潮",
    "01/05,大潮",
    "01/06,大潮",
    "01/07,中潮",
    "01/08,中潮",
    "01/09,中潮",
    "01/10,中潮",
    "01/11,小潮",
    "01/12,小潮",
    "01/13,小潮",
    "01/14,長潮",
    "01/15,若潮",
    "01/16,中潮",
    "01/17,中潮",
    "01/18,大潮",
    "01/19,大潮",
    "01/20,大潮",
    "01/21,大潮",
    "01/22,中潮",
    "01/23,中潮",
    "01/24,中潮",
    "01/25,中潮",
    "01/26,小潮",
    "01/27,小潮",
    "01/28,小潮",
    "01/29,長潮",
    "01/30,若潮",
    "01/31,中潮",
    "02/01,中潮",
    "02/02,大潮",
    "02/03,大潮",
    "02/04,大潮",
    "02/05,大潮",
    "02/06,中潮",
    "02/07,中潮",
    "02/08,中潮",
    "02/09,中潮",
    "02/10,小潮",
    "02/11,小潮",
    "02/12,小潮",
    "02/13,長潮",
    "02/14,若潮",
    "02/15,中潮",
    "02/16,中潮",
    "02/17,大潮",
    "02/18,大潮",
    "02/19,大潮",
    "02/20,大潮",
    "02/21,中潮",
    "02/22,中潮",
    "02/23,中潮",
    "02/24,中潮",
    "02/25,小潮",
    "02/26,小潮",
    "02/27,小潮",
    "02/28,長潮",
    "03/01,若潮",
    "03/02,中潮",
    "03/03,中潮",
    "03/04,大潮",
    "03/05,大潮",
    "03/06,大潮",
    "03/07,大潮",
    "03/08,中潮",
    "03/09,中潮",
    "03/10,中潮",
    "03/11,中潮",
    "03/12,小潮",
    "03/13,小潮",
    "03/14,小潮",
    "03/15,長潮",
    "03/16,若潮",
    "03/17,中潮",
    "03/18,中潮",
    "03/19,大潮",
    "03/20,大潮",
    "03/21,大潮",
    "03/22,中潮",
    "03/23,中潮",
    "03/24,中潮",
    "03/25,中潮",
    "03/26,小潮",
    "03/27,小潮",
    "03/28,小潮",
    "03/29,長潮",
    "03/30,若潮",
    "03/31,中潮",
    "04/01,中潮",
    "04/02,大潮",
    "04/03,大潮",
    "04/04,大潮",
    "04/05,大潮",
    "04/06,中潮",
    "04/07,中潮",
    "04/08,中潮",
    "04/09,中潮",
    "04/10,小潮",
    "04/11,小潮",
    "04/12,小潮",
    "04/13,長潮",
    "04/14,若潮",
    "04/15,中潮",
    "04/16,中潮",
    "04/17,大潮",
    "04/18,大潮",
    "04/19,大潮",
    "04/20,大潮",
    "04/21,中潮",
    "04/22,中潮",
    "04/23,中潮",
    "04/24,中潮",
    "04/25,小潮",
    "04/26,小潮",
    "04/27,小潮",
    "04/28,長潮",
    "04/29,若潮",
    "04/30,中潮",
    "05/01,中潮",
    "05/02,大潮",
    "05/03,大潮",
    "05/04,大潮",
    "05/05,大潮",
    "05/06,中潮",
    "05/07,中潮",
    "05/08,中潮",
    "05/09,中潮",
    "05/10,小潮",
    "05/11,小潮",
    "05/12,小潮",
    "05/13,長潮",
    "05/14,若潮",
    "05/15,中潮",
    "05/16,中潮",
    "05/17,大潮",
    "05/18,大潮",
    "05/19,大潮",
    "05/20,中潮",
    "05/21,中潮",
    "05/22,中潮",
    "05/23,中潮",
    "05/24,小潮",
    "05/25,小潮",
    "05/26,小潮",
    "05/27,長潮",
    "05/28,若潮",
    "05/29,中潮",
    "05/30,中潮",
    "05/31,大潮",
    "06/01,大潮",
    "06/02,大潮",
    "06/03,大潮",
    "06/04,中潮",
    "06/05,中潮",
    "06/06,中潮",
    "06/07,中潮",
    "06/08,小潮",
    "06/09,小潮",
    "06/10,小潮",
    "06/11,長潮",
    "06/12,若潮",
    "06/13,中潮",
    "06/14,中潮",
    "06/15,大潮",
    "06/16,大潮",
    "06/17,大潮",
    "06/18,中潮",
    "06/19,中潮",
    "06/20,中潮",
    "06/21,中潮",
    "06/22,小潮",
    "06/23,小潮",
    "06/24,小潮",
    "06/25,長潮",
    "06/26,若潮",
    "06/27,中潮",
    "06/28,中潮",
    "06/29,大潮",
    "06/30,大潮",
    "07/01,大潮",
    "07/02,大潮",
    "07/03,中潮",
    "07/04,中潮",
    "07/05,中潮",
    "07/06,中潮",
    "07/07,小潮",
    "07/08,小潮",
    "07/09,小潮",
    "07/10,長潮",
    "07/11,若潮",
    "07/12,中潮",
    "07/13,中潮",
    "07/14,大潮",
    "07/15,大潮",
    "07/16,大潮",
    "07/17,大潮",
    "07/18,中潮",
    "07/19,中潮",
    "07/20,中潮",
    "07/21,中潮",
    "07/22,小潮",
    "07/23,小潮",
    "07/24,小潮",
    "07/25,長潮",
    "07/26,若潮",
    "07/27,中潮",
    "07/28,中潮",
    "07/29,大潮",
    "07/30,大潮",
    "07/31,大潮",
    "08/01,大潮",
    "08/02,中潮",
    "08/03,中潮",
    "08/04,中潮",
    "08/05,中潮",
    "08/06,小潮",
    "08/07,小潮",
    "08/08,小潮",
    "08/09,長潮",
    "08/10,若潮",
    "08/11,中潮",
    "08/12,中潮",
    "08/13,大潮",
    "08/14,大潮",
    "08/15,大潮",
    "08/16,中潮",
    "08/17,中潮",
    "08/18,中潮",
    "08/19,中潮",
    "08/20,小潮",
    "08/21,小潮",
    "08/22,小潮",
    "08/23,長潮",
    "08/24,若潮",
    "08/25,中潮",
    "08/26,中潮",
    "08/27,大潮",
    "08/28,大潮",
    "08/29,大潮",
    "08/30,大潮",
    "08/31,中潮",
    "09/01,中潮",
    "09/02,中潮",
    "09/03,中潮",
    "09/04,小潮",
    "09/05,小潮",
    "09/06,小潮",
    "09/07,長潮",
    "09/08,若潮",
    "09/09,中潮",
    "09/10,中潮",
    "09/11,大潮",
    "09/12,大潮",
    "09/13,大潮",
    "09/14,大潮",
    "09/15,中潮",
    "09/16,中潮",
    "09/17,中潮",
    "09/18,中潮",
    "09/19,小潮",
    "09/20,小潮",
    "09/21,小潮",
    "09/22,長潮",
    "09/23,若潮",
    "09/24,中潮",
    "09/25,中潮",
    "09/26,大潮",
    "09/27,大潮",
    "09/28,大潮",
    "09/29,大潮",
    "09/30,中潮",
    "10/01,中潮",
    "10/02,中潮",
    "10/03,中潮",
    "10/04,小潮",
    "10/05,小潮",
    "10/06,小潮",
    "10/07,長潮",
    "10/08,若潮",
    "10/09,中潮",
    "10/10,中潮",
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
    "11/01,中潮",
    "11/02,小潮",
    "11/03,小潮",
    "11/04,小潮",
    "11/05,長潮",
    "11/06,若潮",
    "11/07,中潮",
    "11/08,中潮",
    "11/09,大潮",
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
    "11/27,大潮",
    "11/28,中潮",
    "11/29,中潮",
    "11/30,中潮",
    "12/01,中潮",
    "12/02,小潮",
    "12/03,小潮",
    "12/04,小潮",
    "12/05,長潮",
    "12/06,若潮",
    "12/07,中潮",
    "12/08,中潮",
    "12/09,大潮",
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
    "12/31,小潮"
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseMoonLines(year, lines);
  //
})();
