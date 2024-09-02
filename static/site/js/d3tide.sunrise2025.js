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

// 2025年

(function() {
    var lines = [
      "2025/01/01,6:50,16:39",
      "2025/01/02,6:51,16:40",
      "2025/01/03,6:51,16:41",
      "2025/01/04,6:51,16:42",
      "2025/01/05,6:51,16:43",
      "2025/01/06,6:51,16:44",
      "2025/01/07,6:51,16:44",
      "2025/01/08,6:51,16:45",
      "2025/01/09,6:51,16:46",
      "2025/01/10,6:51,16:47",
      "2025/01/11,6:51,16:48",
      "2025/01/12,6:51,16:49",
      "2025/01/13,6:50,16:50",
      "2025/01/14,6:50,16:51",
      "2025/01/15,6:50,16:52",
      "2025/01/16,6:50,16:53",
      "2025/01/17,6:49,16:54",
      "2025/01/18,6:49,16:55",
      "2025/01/19,6:49,16:56",
      "2025/01/20,6:48,16:57",
      "2025/01/21,6:48,16:58",
      "2025/01/22,6:47,16:59",
      "2025/01/23,6:47,17:00",
      "2025/01/24,6:46,17:01",
      "2025/01/25,6:46,17:02",
      "2025/01/26,6:45,17:03",
      "2025/01/27,6:45,17:04",
      "2025/01/28,6:44,17:05",
      "2025/01/29,6:43,17:06",
      "2025/01/30,6:43,17:07",
      "2025/01/31,6:42,17:08",
      "2025/02/01,6:41,17:09",
      "2025/02/02,6:40,17:10",
      "2025/02/03,6:40,17:11",
      "2025/02/04,6:39,17:12",
      "2025/02/05,6:38,17:13",
      "2025/02/06,6:37,17:14",
      "2025/02/07,6:36,17:15",
      "2025/02/08,6:35,17:16",
      "2025/02/09,6:34,17:17",
      "2025/02/10,6:33,17:18",
      "2025/02/11,6:32,17:19",
      "2025/02/12,6:31,17:20",
      "2025/02/13,6:30,17:21",
      "2025/02/14,6:29,17:22",
      "2025/02/15,6:28,17:23",
      "2025/02/16,6:27,17:24",
      "2025/02/17,6:26,17:25",
      "2025/02/18,6:25,17:26",
      "2025/02/19,6:24,17:27",
      "2025/02/20,6:22,17:28",
      "2025/02/21,6:21,17:29",
      "2025/02/22,6:20,17:30",
      "2025/02/23,6:19,17:31",
      "2025/02/24,6:18,17:32",
      "2025/02/25,6:16,17:33",
      "2025/02/26,6:15,17:34",
      "2025/02/27,6:14,7:35	",      "2025/02/28,6:13,7:36	",      "2025/03/01,6:11,7:37	",      "2025/03/02,6:10,7:37	",      "2025/03/03,6:09,7:38	",      "2025/03/04,6:07,7:39	",      "2025/03/05,6:06,7:40	",      "2025/03/06,6:05,7:41	",      "2025/03/07,6:03,7:42	",      "2025/03/08,6:02,7:43	",      "2025/03/09,6:01,7:44	",      "2025/03/10,5:59,7:45	",      "2025/03/11,5:58,7:45	",      "2025/03/12,5:57,7:46	",      "2025/03/13,5:55,7:47	",      "2025/03/14,5:54,7:48	",      "2025/03/15,5:52,7:49	",      "2025/03/16,5:51,7:50	",      "2025/03/17,5:50,7:50	",      "2025/03/18,5:48,7:51	",      "2025/03/19,5:47,7:52	",      "2025/03/20,5:45,7:53	",      "2025/03/21,5:44,7:54	",      "2025/03/22,5:43,7:55	",      "2025/03/23,5:41,7:55	",      "2025/03/24,5:40,7:56	",      "2025/03/25,5:38,7:57	",      "2025/03/26,5:37,7:58	",      "2025/03/27,5:35,7:59	",      "2025/03/28,5:34,8:00	",      "2025/03/29,5:33,8:00	",      "2025/03/30,5:31,8:01	",      "2025/03/31,5:30,8:02	",      "2025/04/01,5:28,8:03	",      "2025/04/02,5:27,8:04	",      "2025/04/03,5:26,8:04	",      "2025/04/04,5:24,8:05	",      "2025/04/05,5:23,8:06	",      "2025/04/06,5:21,8:07	",      "2025/04/07,5:20,8:08	",      "2025/04/08,5:19,8:09	",      "2025/04/09,5:17,8:09	",      "2025/04/10,5:16,8:10	",      "2025/04/11,5:15,8:11	",      "2025/04/12,5:13,8:12	",      "2025/04/13,5:12,8:13	",      "2025/04/14,5:11,8:13	",      "2025/04/15,5:09,8:14	",      "2025/04/16,5:08,8:15	",      "2025/04/17,5:07,8:16	",      "2025/04/18,5:05,8:17	",      "2025/04/19,5:04,8:18	",      "2025/04/20,5:03,8:18	",      "2025/04/21,5:02,8:19	",      "2025/04/22,5:00,8:20	",      "2025/04/23,4:59,8:21	",      "2025/04/24,4:58,8:22	",      "2025/04/25,4:57,8:23	",      "2025/04/26,4:56,8:23	",      "2025/04/27,4:54,8:24	",      "2025/04/28,4:53,8:25	",      "2025/04/29,4:52,8:26	",      "2025/04/30,4:51,8:27	",      "2025/05/01,4:50,8:28	",      "2025/05/02,4:49,8:28	",      "2025/05/03,4:48,8:29	",      "2025/05/04,4:47,8:30	",      "2025/05/05,4:46,8:31	",      "2025/05/06,4:45,8:32	",      "2025/05/07,4:44,8:32	",      "2025/05/08,4:43,8:33	",      "2025/05/09,4:42,8:34	",      "2025/05/10,4:41,8:35	",      "2025/05/11,4:40,8:36	",      "2025/05/12,4:39,8:37	",      "2025/05/13,4:39,8:37	",      "2025/05/14,4:38,8:38	",      "2025/05/15,4:37,8:39	",      "2025/05/16,4:36,8:40	",      "2025/05/17,4:35,8:41	",      "2025/05/18,4:35,8:41	",      "2025/05/19,4:34,8:42	",      "2025/05/20,4:33,8:43	",      "2025/05/21,4:33,8:44	",      "2025/05/22,4:32,8:44	",      "2025/05/23,4:32,8:45	",      "2025/05/24,4:31,8:46	",      "2025/05/25,4:30,8:47	",      "2025/05/26,4:30,8:47	",      "2025/05/27,4:29,8:48	",      "2025/05/28,4:29,8:49	",      "2025/05/29,4:29,8:49	",      "2025/05/30,4:28,8:50	",      "2025/05/31,4:28,8:51	",      "2025/06/01,4:27,8:51	",      "2025/06/02,4:27,8:52	",      "2025/06/03,4:27,8:52	",      "2025/06/04,4:27,8:53	",      "2025/06/05,4:26,8:54	",      "2025/06/06,4:26,8:54	",      "2025/06/07,4:26,8:55	",      "2025/06/08,4:26,8:55	",      "2025/06/09,4:26,8:56	",      "2025/06/10,4:26,8:56	",      "2025/06/11,4:26,8:57	",      "2025/06/12,4:26,8:57	",      "2025/06/13,4:26,8:57	",      "2025/06/14,4:26,8:58	",      "2025/06/15,4:26,8:58	",      "2025/06/16,4:26,8:59	",      "2025/06/17,4:26,8:59	",      "2025/06/18,4:26,8:59	",      "2025/06/19,4:26,8:59	",      "2025/06/20,4:26,9:00	",      "2025/06/21,4:26,9:00	",      "2025/06/22,4:27,9:00	",      "2025/06/23,4:27,9:00	",      "2025/06/24,4:27,9:00	",      "2025/06/25,4:27,9:01	",      "2025/06/26,4:28,9:01	",      "2025/06/27,4:28,9:01	",      "2025/06/28,4:28,9:01	",      "2025/06/29,4:29,9:01	",      "2025/06/30,4:29,9:01	",      "2025/07/01,4:30,9:01	",      "2025/07/02,4:30,9:01	",      "2025/07/03,4:31,9:01	",      "2025/07/04,4:31,9:00	",      "2025/07/05,4:32,9:00	",      "2025/07/06,4:32,9:00	",      "2025/07/07,4:33,9:00	",      "2025/07/08,4:33,9:00	",      "2025/07/09,4:34,8:59	",      "2025/07/10,4:34,8:59	",      "2025/07/11,4:35,8:59	",      "2025/07/12,4:36,8:58	",      "2025/07/13,4:36,8:58	",      "2025/07/14,4:37,8:58	",      "2025/07/15,4:37,8:57	",      "2025/07/16,4:38,8:57	",      "2025/07/17,4:39,8:56	",      "2025/07/18,4:39,8:56	",      "2025/07/19,4:40,8:55	",      "2025/07/20,4:41,8:54	",      "2025/07/21,4:41,8:54	",      "2025/07/22,4:42,8:53	",      "2025/07/23,4:43,8:53	",      "2025/07/24,4:44,8:52	",      "2025/07/25,4:44,8:51	",      "2025/07/26,4:45,8:50	",      "2025/07/27,4:46,8:50	",      "2025/07/28,4:47,8:49	",      "2025/07/29,4:47,8:48	",      "2025/07/30,4:48,8:47	",      "2025/07/31,4:49,8:46	",      "2025/08/01,4:50,8:45	",      "2025/08/02,4:50,8:45	",      "2025/08/03,4:51,8:44	",      "2025/08/04,4:52,8:43	",      "2025/08/05,4:53,8:42	",      "2025/08/06,4:53,8:41	",      "2025/08/07,4:54,8:40	",      "2025/08/08,4:55,8:39	",      "2025/08/09,4:56,8:38	",      "2025/08/10,4:57,8:36	",      "2025/08/11,4:57,8:35	",      "2025/08/12,4:58,8:34	",      "2025/08/13,4:59,8:33	",      "2025/08/14,5:00,8:32	",      "2025/08/15,5:00,8:31	",      "2025/08/16,5:01,8:30	",      "2025/08/17,5:02,8:28	",      "2025/08/18,5:03,8:27	",      "2025/08/19,5:04,8:26	",      "2025/08/20,5:04,8:25	",      "2025/08/21,5:05,8:24	",      "2025/08/22,5:06,8:22	",      "2025/08/23,5:07,8:21	",      "2025/08/24,5:07,8:20	",      "2025/08/25,5:08,8:18	",      "2025/08/26,5:09,8:17	",      "2025/08/27,5:10,8:16	",      "2025/08/28,5:10,8:14	",      "2025/08/29,5:11,8:13	",      "2025/08/30,5:12,8:12	",      "2025/08/31,5:13,8:10	",      "2025/09/01,5:13,8:09	",      "2025/09/02,5:14,8:08	",      "2025/09/03,5:15,8:06	",      "2025/09/04,5:16,8:05	",      "2025/09/05,5:16,8:03	",      "2025/09/06,5:17,8:02	",      "2025/09/07,5:18,8:00	",      "2025/09/08,5:19,7:59	",      "2025/09/09,5:19,7:58	",      "2025/09/10,5:20,7:56	",      "2025/09/11,5:21,7:55	",      "2025/09/12,5:22,7:53	",      "2025/09/13,5:22,7:52	",      "2025/09/14,5:23,7:50	",      "2025/09/15,5:24,7:49	",      "2025/09/16,5:25,7:47	",      "2025/09/17,5:25,7:46	",      "2025/09/18,5:26,7:45	",      "2025/09/19,5:27,7:43	",      "2025/09/20,5:28,7:42	",      "2025/09/21,5:28,7:40	",      "2025/09/22,5:29,7:39	",      "2025/09/23,5:30,7:37	",      "2025/09/24,5:31,7:36	",      "2025/09/25,5:31,7:34	",      "2025/09/26,5:32,7:33	",      "2025/09/27,5:33,7:31	",      "2025/09/28,5:34,7:30	",      "2025/09/29,5:34,7:29	",      "2025/09/30,5:35,7:27	",      "2025/10/01,5:36,7:26	",      "2025/10/02,5:37,7:24	",      "2025/10/03,5:38,7:23	",      "2025/10/04,5:38,7:21	",      "2025/10/05,5:39,7:20	",      "2025/10/06,5:40,7:19	",      "2025/10/07,5:41,7:17	",      "2025/10/08,5:42,7:16	",      "2025/10/09,5:42,7:15	",      "2025/10/10,5:43,7:13	",      "2025/10/11,5:44,7:12	",      "2025/10/12,5:45,7:10	",      "2025/10/13,5:46,7:09	",      "2025/10/14,5:47,7:08	",      "2025/10/15,5:47,7:07	",      "2025/10/16,5:48,17:05",
      "2025/10/17,5:49,17:04",
      "2025/10/18,5:50,17:03",
      "2025/10/19,5:51,17:01",
      "2025/10/20,5:52,17:00",
      "2025/10/21,5:53,16:59",
      "2025/10/22,5:54,16:58",
      "2025/10/23,5:54,16:57",
      "2025/10/24,5:55,16:55",
      "2025/10/25,5:56,16:54",
      "2025/10/26,5:57,16:53",
      "2025/10/27,5:58,16:52",
      "2025/10/28,5:59,16:51",
      "2025/10/29,6:00,16:50",
      "2025/10/30,6:01,16:49",
      "2025/10/31,6:02,16:48",
      "2025/11/01,6:03,16:47",
      "2025/11/02,6:04,16:46",
      "2025/11/03,6:05,16:45",
      "2025/11/04,6:06,16:44",
      "2025/11/05,6:07,16:43",
      "2025/11/06,6:08,16:42",
      "2025/11/07,6:09,16:41",
      "2025/11/08,6:09,16:40",
      "2025/11/09,6:10,16:40",
      "2025/11/10,6:11,16:39",
      "2025/11/11,6:12,16:38",
      "2025/11/12,6:13,16:37",
      "2025/11/13,6:14,16:37",
      "2025/11/14,6:15,16:36",
      "2025/11/15,6:16,16:35",
      "2025/11/16,6:17,16:35",
      "2025/11/17,6:18,16:34",
      "2025/11/18,6:19,16:33",
      "2025/11/19,6:20,16:33",
      "2025/11/20,6:21,16:32",
      "2025/11/21,6:22,16:32",
      "2025/11/22,6:23,16:31",
      "2025/11/23,6:24,16:31",
      "2025/11/24,6:25,16:31",
      "2025/11/25,6:26,16:30",
      "2025/11/26,6:27,16:30",
      "2025/11/27,6:28,16:30",
      "2025/11/28,6:29,16:29",
      "2025/11/29,6:30,16:29",
      "2025/11/30,6:31,16:29",
      "2025/12/01,6:32,16:29",
      "2025/12/02,6:33,16:29",
      "2025/12/03,6:34,16:29",
      "2025/12/04,6:34,16:28",
      "2025/12/05,6:35,16:28",
      "2025/12/06,6:36,16:28",
      "2025/12/07,6:37,16:28",
      "2025/12/08,6:38,16:29",
      "2025/12/09,6:38,16:29",
      "2025/12/10,6:39,16:29",
      "2025/12/11,6:40,16:29",
      "2025/12/12,6:41,16:29",
      "2025/12/13,6:41,16:29",
      "2025/12/14,6:42,16:30",
      "2025/12/15,6:43,16:30",
      "2025/12/16,6:43,16:30",
      "2025/12/17,6:44,16:31",
      "2025/12/18,6:45,16:31",
      "2025/12/19,6:45,16:31",
      "2025/12/20,6:46,16:32",
      "2025/12/21,6:46,16:32",
      "2025/12/22,6:47,16:33",
      "2025/12/23,6:47,16:33",
      "2025/12/24,6:48,16:34",
      "2025/12/25,6:48,16:35",
      "2025/12/26,6:49,16:35",
      "2025/12/27,6:49,16:36",
      "2025/12/28,6:49,16:36",
      "2025/12/29,6:50,16:37",
      "2025/12/30,6:50,16:38",
      "2025/12/31,6:50,16:39"
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseSunriseLines(lines);
  //
})();
