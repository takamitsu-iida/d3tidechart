/* global d3tide */
/* eslint-disable */

// 依存関係
// d3tide.dataManager.js

// 国立天文台 各地のこよみ
// 日の出・日の入
// http://eco.mtk.nao.ac.jp/koyomi/dni/

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

// 2020年

(function() {
  var lines = [
    '2020/01/01,6:50,16:39',
    '2020/01/02,6:50,16:40',
    '2020/01/03,6:51,16:40',
    '2020/01/04,6:51,16:41',
    '2020/01/05,6:51,16:42',
    '2020/01/06,6:51,16:43',
    '2020/01/07,6:51,16:44',
    '2020/01/08,6:51,16:45',
    '2020/01/09,6:51,16:46',
    '2020/01/10,6:51,16:46',
    '2020/01/11,6:51,16:47',
    '2020/01/12,6:51,16:48',
    '2020/01/13,6:51,16:49',
    '2020/01/14,6:50,16:50',
    '2020/01/15,6:50,16:51',
    '2020/01/16,6:50,16:52',
    '2020/01/17,6:50,16:53',
    '2020/01/18,6:49,16:54',
    '2020/01/19,6:49,16:55',
    '2020/01/20,6:49,16:56',
    '2020/01/21,6:48,16:57',
    '2020/01/22,6:48,16:58',
    '2020/01/23,6:47,16:59',
    '2020/01/24,6:47,17:00',
    '2020/01/25,6:46,17:01',
    '2020/01/26,6:46,17:02',
    '2020/01/27,6:45,17:03',
    '2020/01/28,6:44,17:04',
    '2020/01/29,6:44,17:05',
    '2020/01/30,6:43,17:06',
    '2020/01/31,6:42,17:07',
    '2020/02/01,6:42,17:08',
    '2020/02/02,6:41,17:09',
    '2020/02/03,6:40,17:10',
    '2020/02/04,6:39,17:11',
    '2020/02/05,6:39,17:13',
    '2020/02/06,6:38,17:14',
    '2020/02/07,6:37,17:15',
    '2020/02/08,6:36,17:16',
    '2020/02/09,6:35,17:17',
    '2020/02/10,6:34,17:18',
    '2020/02/11,6:33,17:19',
    '2020/02/12,6:32,17:20',
    '2020/02/13,6:31,17:21',
    '2020/02/14,6:30,17:22',
    '2020/02/15,6:29,17:23',
    '2020/02/16,6:28,17:24',
    '2020/02/17,6:27,17:25',
    '2020/02/18,6:26,17:26',
    '2020/02/19,6:25,17:27',
    '2020/02/20,6:23,17:27',
    '2020/02/21,6:22,17:28',
    '2020/02/22,6:21,17:29',
    '2020/02/23,6:20,17:30',
    '2020/02/24,6:19,17:31',
    '2020/02/25,6:17,17:32',
    '2020/02/26,6:16,17:33',
    '2020/02/27,6:15,17:34',
    '2020/02/28,6:14,17:35',
    '2020/02/29,6:12,17:36',
    '2020/03/01,6:11,17:37',
    '2020/03/02,6:10,17:38',
    '2020/03/03,6:09,17:39',
    '2020/03/04,6:07,17:40',
    '2020/03/05,6:06,17:40',
    '2020/03/06,6:05,17:41',
    '2020/03/07,6:03,17:42',
    '2020/03/08,6:02,17:43',
    '2020/03/09,6:00,17:44',
    '2020/03/10,5:59,17:45',
    '2020/03/11,5:58,17:46',
    '2020/03/12,5:56,17:46',
    '2020/03/13,5:55,17:47',
    '2020/03/14,5:54,17:48',
    '2020/03/15,5:52,17:49',
    '2020/03/16,5:51,17:50',
    '2020/03/17,5:49,17:51',
    '2020/03/18,5:48,17:52',
    '2020/03/19,5:46,17:52',
    '2020/03/20,5:45,17:53',
    '2020/03/21,5:44,17:54',
    '2020/03/22,5:42,17:55',
    '2020/03/23,5:41,17:56',
    '2020/03/24,5:39,17:56',
    '2020/03/25,5:38,17:57',
    '2020/03/26,5:37,17:58',
    '2020/03/27,5:35,17:59',
    '2020/03/28,5:34,18:00',
    '2020/03/29,5:32,18:01',
    '2020/03/30,5:31,18:01',
    '2020/03/31,5:29,18:02',
    '2020/04/01,5:28,18:03',
    '2020/04/02,5:27,18:04',
    '2020/04/03,5:25,18:05',
    '2020/04/04,5:24,18:05',
    '2020/04/05,5:22,18:06',
    '2020/04/06,5:21,18:07',
    '2020/04/07,5:20,18:08',
    '2020/04/08,5:18,18:09',
    '2020/04/09,5:17,18:10',
    '2020/04/10,5:16,18:10',
    '2020/04/11,5:14,18:11',
    '2020/04/12,5:13,18:12',
    '2020/04/13,5:12,18:13',
    '2020/04/14,5:10,18:14',
    '2020/04/15,5:09,18:14',
    '2020/04/16,5:08,18:15',
    '2020/04/17,5:06,18:16',
    '2020/04/18,5:05,18:17',
    '2020/04/19,5:04,18:18',
    '2020/04/20,5:03,18:19',
    '2020/04/21,5:01,18:19',
    '2020/04/22,5:00,18:20',
    '2020/04/23,4:59,18:21',
    '2020/04/24,4:58,18:22',
    '2020/04/25,4:57,18:23',
    '2020/04/26,4:55,18:24',
    '2020/04/27,4:54,18:24',
    '2020/04/28,4:53,18:25',
    '2020/04/29,4:52,18:26',
    '2020/04/30,4:51,18:27',
    '2020/05/01,4:50,18:28',
    '2020/05/02,4:49,18:29',
    '2020/05/03,4:48,18:29',
    '2020/05/04,4:47,18:30',
    '2020/05/05,4:46,18:31',
    '2020/05/06,4:45,18:32',
    '2020/05/07,4:44,18:33',
    '2020/05/08,4:43,18:33',
    '2020/05/09,4:42,18:34',
    '2020/05/10,4:41,18:35',
    '2020/05/11,4:40,18:36',
    '2020/05/12,4:39,18:37',
    '2020/05/13,4:38,18:38',
    '2020/05/14,4:38,18:38',
    '2020/05/15,4:37,18:39',
    '2020/05/16,4:36,18:40',
    '2020/05/17,4:35,18:41',
    '2020/05/18,4:35,18:41',
    '2020/05/19,4:34,18:42',
    '2020/05/20,4:33,18:43',
    '2020/05/21,4:33,18:44',
    '2020/05/22,4:32,18:45',
    '2020/05/23,4:31,18:45',
    '2020/05/24,4:31,18:46',
    '2020/05/25,4:30,18:47',
    '2020/05/26,4:30,18:47',
    '2020/05/27,4:29,18:48',
    '2020/05/28,4:29,18:49',
    '2020/05/29,4:29,18:49',
    '2020/05/30,4:28,18:50',
    '2020/05/31,4:28,18:51',
    '2020/06/01,4:27,18:51',
    '2020/06/02,4:27,18:52',
    '2020/06/03,4:27,18:53',
    '2020/06/04,4:27,18:53',
    '2020/06/05,4:26,18:54',
    '2020/06/06,4:26,18:54',
    '2020/06/07,4:26,18:55',
    '2020/06/08,4:26,18:55',
    '2020/06/09,4:26,18:56',
    '2020/06/10,4:26,18:56',
    '2020/06/11,4:26,18:57',
    '2020/06/12,4:26,18:57',
    '2020/06/13,4:26,18:58',
    '2020/06/14,4:26,18:58',
    '2020/06/15,4:26,18:58',
    '2020/06/16,4:26,18:59',
    '2020/06/17,4:26,18:59',
    '2020/06/18,4:26,18:59',
    '2020/06/19,4:26,19:00',
    '2020/06/20,4:26,19:00',
    '2020/06/21,4:26,19:00',
    '2020/06/22,4:27,19:00',
    '2020/06/23,4:27,19:00',
    '2020/06/24,4:27,19:00',
    '2020/06/25,4:28,19:01',
    '2020/06/26,4:28,19:01',
    '2020/06/27,4:28,19:01',
    '2020/06/28,4:29,19:01',
    '2020/06/29,4:29,19:01',
    '2020/06/30,4:29,19:01',
    '2020/07/01,4:30,19:01',
    '2020/07/02,4:30,19:01',
    '2020/07/03,4:31,19:00',
    '2020/07/04,4:31,19:00',
    '2020/07/05,4:32,19:00',
    '2020/07/06,4:32,19:00',
    '2020/07/07,4:33,19:00',
    '2020/07/08,4:33,19:00',
    '2020/07/09,4:34,18:59',
    '2020/07/10,4:34,18:59',
    '2020/07/11,4:35,18:59',
    '2020/07/12,4:36,18:58',
    '2020/07/13,4:36,18:58',
    '2020/07/14,4:37,18:57',
    '2020/07/15,4:38,18:57',
    '2020/07/16,4:38,18:56',
    '2020/07/17,4:39,18:56',
    '2020/07/18,4:40,18:55',
    '2020/07/19,4:40,18:55',
    '2020/07/20,4:41,18:54',
    '2020/07/21,4:42,18:54',
    '2020/07/22,4:42,18:53',
    '2020/07/23,4:43,18:52',
    '2020/07/24,4:44,18:52',
    '2020/07/25,4:45,18:51',
    '2020/07/26,4:45,18:50',
    '2020/07/27,4:46,18:49',
    '2020/07/28,4:47,18:49',
    '2020/07/29,4:48,18:48',
    '2020/07/30,4:48,18:47',
    '2020/07/31,4:49,18:46',
    '2020/08/01,4:50,18:45',
    '2020/08/02,4:51,18:44',
    '2020/08/03,4:51,18:43',
    '2020/08/04,4:52,18:42',
    '2020/08/05,4:53,18:41',
    '2020/08/06,4:54,18:40',
    '2020/08/07,4:54,18:39',
    '2020/08/08,4:55,18:38',
    '2020/08/09,4:56,18:37',
    '2020/08/10,4:57,18:36',
    '2020/08/11,4:57,18:35',
    '2020/08/12,4:58,18:34',
    '2020/08/13,4:59,18:33',
    '2020/08/14,5:00,18:32',
    '2020/08/15,5:01,18:31',
    '2020/08/16,5:01,18:29',
    '2020/08/17,5:02,18:28',
    '2020/08/18,5:03,18:27',
    '2020/08/19,5:04,18:26',
    '2020/08/20,5:04,18:25',
    '2020/08/21,5:05,18:23',
    '2020/08/22,5:06,18:22',
    '2020/08/23,5:07,18:21',
    '2020/08/24,5:08,18:19',
    '2020/08/25,5:08,18:18',
    '2020/08/26,5:09,18:17',
    '2020/08/27,5:10,18:15',
    '2020/08/28,5:11,18:14',
    '2020/08/29,5:11,18:13',
    '2020/08/30,5:12,18:11',
    '2020/08/31,5:13,18:10',
    '2020/09/01,5:14,18:09',
    '2020/09/02,5:14,18:07',
    '2020/09/03,5:15,18:06',
    '2020/09/04,5:16,18:04',
    '2020/09/05,5:17,18:03',
    '2020/09/06,5:17,18:02',
    '2020/09/07,5:18,18:00',
    '2020/09/08,5:19,17:59',
    '2020/09/09,5:19,17:57',
    '2020/09/10,5:20,17:56',
    '2020/09/11,5:21,17:54',
    '2020/09/12,5:22,17:53',
    '2020/09/13,5:22,17:52',
    '2020/09/14,5:23,17:50',
    '2020/09/15,5:24,17:49',
    '2020/09/16,5:25,17:47',
    '2020/09/17,5:25,17:46',
    '2020/09/18,5:26,17:44',
    '2020/09/19,5:27,17:43',
    '2020/09/20,5:28,17:41',
    '2020/09/21,5:28,17:40',
    '2020/09/22,5:29,17:38',
    '2020/09/23,5:30,17:37',
    '2020/09/24,5:31,17:35',
    '2020/09/25,5:31,17:34',
    '2020/09/26,5:32,17:33',
    '2020/09/27,5:33,17:31',
    '2020/09/28,5:34,17:30',
    '2020/09/29,5:35,17:28',
    '2020/09/30,5:35,17:27',
    '2020/10/01,5:36,17:25',
    '2020/10/02,5:37,17:24',
    '2020/10/03,5:38,17:23',
    '2020/10/04,5:38,17:21',
    '2020/10/05,5:39,17:20',
    '2020/10/06,5:40,17:18',
    '2020/10/07,5:41,17:17',
    '2020/10/08,5:42,17:16',
    '2020/10/09,5:43,17:14',
    '2020/10/10,5:43,17:13',
    '2020/10/11,5:44,17:12',
    '2020/10/12,5:45,17:10',
    '2020/10/13,5:46,17:09',
    '2020/10/14,5:47,17:08',
    '2020/10/15,5:48,17:06',
    '2020/10/16,5:48,17:05',
    '2020/10/17,5:49,17:04',
    '2020/10/18,5:50,17:02',
    '2020/10/19,5:51,17:01',
    '2020/10/20,5:52,17:00',
    '2020/10/21,5:53,16:59',
    '2020/10/22,5:54,16:58',
    '2020/10/23,5:55,16:56',
    '2020/10/24,5:55,16:55',
    '2020/10/25,5:56,16:54',
    '2020/10/26,5:57,16:53',
    '2020/10/27,5:58,16:52',
    '2020/10/28,5:59,16:51',
    '2020/10/29,6:00,16:50',
    '2020/10/30,6:01,16:49',
    '2020/10/31,6:02,16:48',
    '2020/11/01,6:03,16:47',
    '2020/11/02,6:04,16:46',
    '2020/11/03,6:05,16:45',
    '2020/11/04,6:06,16:44',
    '2020/11/05,6:07,16:43',
    '2020/11/06,6:08,16:42',
    '2020/11/07,6:09,16:41',
    '2020/11/08,6:10,16:40',
    '2020/11/09,6:11,16:39',
    '2020/11/10,6:12,16:39',
    '2020/11/11,6:13,16:38',
    '2020/11/12,6:14,16:37',
    '2020/11/13,6:15,16:36',
    '2020/11/14,6:16,16:36',
    '2020/11/15,6:17,16:35',
    '2020/11/16,6:18,16:34',
    '2020/11/17,6:19,16:34',
    '2020/11/18,6:20,16:33',
    '2020/11/19,6:21,16:33',
    '2020/11/20,6:22,16:32',
    '2020/11/21,6:22,16:32',
    '2020/11/22,6:23,16:31',
    '2020/11/23,6:24,16:31',
    '2020/11/24,6:25,16:31',
    '2020/11/25,6:26,16:30',
    '2020/11/26,6:27,16:30',
    '2020/11/27,6:28,16:30',
    '2020/11/28,6:29,16:29',
    '2020/11/29,6:30,16:29',
    '2020/11/30,6:31,16:29',
    '2020/12/01,6:32,16:29',
    '2020/12/02,6:33,16:29',
    '2020/12/03,6:34,16:29',
    '2020/12/04,6:35,16:28',
    '2020/12/05,6:35,16:28',
    '2020/12/06,6:36,16:28',
    '2020/12/07,6:37,16:29',
    '2020/12/08,6:38,16:29',
    '2020/12/09,6:39,16:29',
    '2020/12/10,6:39,16:29',
    '2020/12/11,6:40,16:29',
    '2020/12/12,6:41,16:29',
    '2020/12/13,6:42,16:29',
    '2020/12/14,6:42,16:30',
    '2020/12/15,6:43,16:30',
    '2020/12/16,6:44,16:30',
    '2020/12/17,6:44,16:31',
    '2020/12/18,6:45,16:31',
    '2020/12/19,6:45,16:32',
    '2020/12/20,6:46,16:32',
    '2020/12/21,6:47,16:32',
    '2020/12/22,6:47,16:33',
    '2020/12/23,6:47,16:34',
    '2020/12/24,6:48,16:34',
    '2020/12/25,6:48,16:35',
    '2020/12/26,6:49,16:35',
    '2020/12/27,6:49,16:36',
    '2020/12/28,6:49,16:37',
    '2020/12/29,6:50,16:37',
    '2020/12/30,6:50,16:38',
    '2020/12/31,6:50,16:39'
    ];

  // データマネージャに処理させる
  d3tide.dataManager().parseSunriseLines(lines);
  //
})();
