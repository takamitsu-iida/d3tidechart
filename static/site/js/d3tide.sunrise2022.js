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
    "2022/01/01,6:50,11:45,16:39",
    "2022/01/02,6:51,11:45,16:40",
    "2022/01/03,6:51,11:46,16:41",
    "2022/01/04,6:51,11:46,16:42",
    "2022/01/05,6:51,11:47,16:42",
    "2022/01/06,6:51,11:47,16:43",
    "2022/01/07,6:51,11:47,16:44",
    "2022/01/08,6:51,11:48,16:45",
    "2022/01/09,6:51,11:48,16:46",
    "2022/01/10,6:51,11:49,16:47",
    "2022/01/11,6:51,11:49,16:48",
    "2022/01/12,6:51,11:50,16:49",
    "2022/01/13,6:50,11:50,16:50",
    "2022/01/14,6:50,11:50,16:51",
    "2022/01/15,6:50,11:51,16:52",
    "2022/01/16,6:50,11:51,16:53",
    "2022/01/17,6:49,11:51,16:54",
    "2022/01/18,6:49,11:52,16:55",
    "2022/01/19,6:49,11:52,16:56",
    "2022/01/20,6:48,11:52,16:57",
    "2022/01/21,6:48,11:53,16:58",
    "2022/01/22,6:47,11:53,16:59",
    "2022/01/23,6:47,11:53,17:00",
    "2022/01/24,6:46,11:53,17:01",
    "2022/01/25,6:46,11:54,17:02",
    "2022/01/26,6:45,11:54,17:03",
    "2022/01/27,6:45,11:54,17:04",
    "2022/01/28,6:44,11:54,17:05",
    "2022/01/29,6:43,11:54,17:06",
    "2022/01/30,6:43,11:55,17:07",
    "2022/01/31,6:42,11:55,17:08",
    "2022/02/01,6:41,11:55,17:09",
    "2022/02/02,6:41,11:55,17:10",
    "2022/02/03,6:40,11:55,17:11",
    "2022/02/04,6:39,11:55,17:12",
    "2022/02/05,6:38,11:55,17:13",
    "2022/02/06,6:37,11:55,17:14",
    "2022/02/07,6:36,11:55,17:15",
    "2022/02/08,6:35,11:56,17:16",
    "2022/02/09,6:34,11:56,17:17",
    "2022/02/10,6:34,11:56,17:18",
    "2022/02/11,6:33,11:56,17:19",
    "2022/02/12,6:32,11:56,17:20",
    "2022/02/13,6:30,11:56,17:21",
    "2022/02/14,6:29,11:56,17:22",
    "2022/02/15,6:28,11:56,17:23",
    "2022/02/16,6:27,11:55,17:24",
    "2022/02/17,6:26,11:55,17:25",
    "2022/02/18,6:25,11:55,17:26",
    "2022/02/19,6:24,11:55,17:27",
    "2022/02/20,6:23,11:55,17:28",
    "2022/02/21,6:22,11:55,17:29",
    "2022/02/22,6:20,11:55,17:30",
    "2022/02/23,6:19,11:55,17:31",
    "2022/02/24,6:18,11:55,17:32",
    "2022/02/25,6:17,11:54,17:33",
    "2022/02/26,6:16,11:54,17:34",
    "2022/02/27,6:14,1:54	,7:35	",    "2022/02/28,6:13,1:54	,7:35	",    "2022/03/01,6:12,1:54	,7:36	",    "2022/03/02,6:10,1:54	,7:37	",    "2022/03/03,6:09,1:53	,7:38	",    "2022/03/04,6:08,1:53	,7:39	",    "2022/03/05,6:07,1:53	,7:40	",    "2022/03/06,6:05,1:53	,7:41	",    "2022/03/07,6:04,1:52	,7:42	",    "2022/03/08,6:02,1:52	,7:43	",    "2022/03/09,6:01,1:52	,7:43	",    "2022/03/10,6:00,1:52	,7:44	",    "2022/03/11,5:58,1:52	,7:45	",    "2022/03/12,5:57,1:51	,7:46	",    "2022/03/13,5:56,1:51	,7:47	",    "2022/03/14,5:54,1:51	,7:48	",    "2022/03/15,5:53,1:50	,7:49	",    "2022/03/16,5:51,1:50	,7:49	",    "2022/03/17,5:50,1:50	,7:50	",    "2022/03/18,5:49,1:50	,7:51	",    "2022/03/19,5:47,1:49	,7:52	",    "2022/03/20,5:46,1:49	,7:53	",    "2022/03/21,5:44,1:49	,7:54	",    "2022/03/22,5:43,1:48	,7:54	",    "2022/03/23,5:41,1:48	,7:55	",    "2022/03/24,5:40,1:48	,7:56	",    "2022/03/25,5:39,1:47	,7:57	",    "2022/03/26,5:37,1:47	,7:58	",    "2022/03/27,5:36,1:47	,7:59	",    "2022/03/28,5:34,1:47	,7:59	",    "2022/03/29,5:33,1:46	,8:00	",    "2022/03/30,5:32,1:46	,8:01	",    "2022/03/31,5:30,1:46	,8:02	",    "2022/04/01,5:29,1:45	,8:03	",    "2022/04/02,5:27,1:45	,8:03	",    "2022/04/03,5:26,1:45	,8:04	",    "2022/04/04,5:25,1:45	,8:05	",    "2022/04/05,5:23,1:44	,8:06	",    "2022/04/06,5:22,1:44	,8:07	",    "2022/04/07,5:20,1:44	,8:08	",    "2022/04/08,5:19,1:43	,8:08	",    "2022/04/09,5:18,1:43	,8:09	",    "2022/04/10,5:16,1:43	,8:10	",    "2022/04/11,5:15,1:43	,8:11	",    "2022/04/12,5:14,1:42	,8:12	",    "2022/04/13,5:12,1:42	,8:12	",    "2022/04/14,5:11,1:42	,8:13	",    "2022/04/15,5:10,1:42	,8:14	",    "2022/04/16,5:08,1:41	,8:15	",    "2022/04/17,5:07,1:41	,8:16	",    "2022/04/18,5:06,1:41	,8:17	",    "2022/04/19,5:04,1:41	,8:17	",    "2022/04/20,5:03,1:40	,8:18	",    "2022/04/21,5:02,1:40	,8:19	",    "2022/04/22,5:01,1:40	,8:20	",    "2022/04/23,5:00,1:40	,8:21	",    "2022/04/24,4:58,1:40	,8:21	",    "2022/04/25,4:57,1:39	,8:22	",    "2022/04/26,4:56,1:39	,8:23	",    "2022/04/27,4:55,1:39	,8:24	",    "2022/04/28,4:54,1:39	,8:25	",    "2022/04/29,4:53,1:39	,8:26	",    "2022/04/30,4:51,1:39	,8:26	",    "2022/05/01,4:50,1:39	,8:27	",    "2022/05/02,4:49,1:38	,8:28	",    "2022/05/03,4:48,1:38	,8:29	",    "2022/05/04,4:47,1:38	,8:30	",    "2022/05/05,4:46,1:38	,8:31	",    "2022/05/06,4:45,1:38	,8:31	",    "2022/05/07,4:44,1:38	,8:32	",    "2022/05/08,4:43,1:38	,8:33	",    "2022/05/09,4:42,1:38	,8:34	",    "2022/05/10,4:41,1:38	,8:35	",    "2022/05/11,4:41,1:38	,8:36	",    "2022/05/12,4:40,1:38	,8:36	",    "2022/05/13,4:39,1:38	,8:37	",    "2022/05/14,4:38,1:38	,8:38	",    "2022/05/15,4:37,1:38	,8:39	",    "2022/05/16,4:36,1:38	,8:40	",    "2022/05/17,4:36,1:38	,8:40	",    "2022/05/18,4:35,1:38	,8:41	",    "2022/05/19,4:34,1:38	,8:42	",    "2022/05/20,4:34,1:38	,8:43	",    "2022/05/21,4:33,1:38	,8:43	",    "2022/05/22,4:32,1:38	,8:44	",    "2022/05/23,4:32,1:38	,8:45	",    "2022/05/24,4:31,1:38	,8:46	",    "2022/05/25,4:31,1:38	,8:46	",    "2022/05/26,4:30,1:38	,8:47	",    "2022/05/27,4:30,1:39	,8:48	",    "2022/05/28,4:29,1:39	,8:48	",    "2022/05/29,4:29,1:39	,8:49	",    "2022/05/30,4:28,1:39	,8:50	",    "2022/05/31,4:28,1:39	,8:50	",    "2022/06/01,4:28,1:39	,8:51	",    "2022/06/02,4:27,1:39	,8:52	",    "2022/06/03,4:27,1:40	,8:52	",    "2022/06/04,4:27,1:40	,8:53	",    "2022/06/05,4:26,1:40	,8:53	",    "2022/06/06,4:26,1:40	,8:54	",    "2022/06/07,4:26,1:40	,8:55	",    "2022/06/08,4:26,1:40	,8:55	",    "2022/06/09,4:26,1:41	,8:56	",    "2022/06/10,4:26,1:41	,8:56	",    "2022/06/11,4:26,1:41	,8:57	",    "2022/06/12,4:26,1:41	,8:57	",    "2022/06/13,4:26,1:41	,8:57	",    "2022/06/14,4:26,1:42	,8:58	",    "2022/06/15,4:26,1:42	,8:58	",    "2022/06/16,4:26,1:42	,8:58	",    "2022/06/17,4:26,1:42	,8:59	",    "2022/06/18,4:26,1:42	,8:59	",    "2022/06/19,4:26,1:43	,8:59	",    "2022/06/20,4:26,1:43	,9:00	",    "2022/06/21,4:26,1:43	,9:00	",    "2022/06/22,4:27,1:43	,9:00	",    "2022/06/23,4:27,1:44	,9:00	",    "2022/06/24,4:27,1:44	,9:00	",    "2022/06/25,4:27,1:44	,9:01	",    "2022/06/26,4:28,1:44	,9:01	",    "2022/06/27,4:28,1:44	,9:01	",    "2022/06/28,4:28,1:45	,9:01	",    "2022/06/29,4:29,1:45	,9:01	",    "2022/06/30,4:29,1:45	,9:01	",    "2022/07/01,4:30,1:45	,9:01	",    "2022/07/02,4:30,1:45	,9:01	",    "2022/07/03,4:30,1:46	,9:01	",    "2022/07/04,4:31,1:46	,9:00	",    "2022/07/05,4:31,1:46	,9:00	",    "2022/07/06,4:32,1:46	,9:00	",    "2022/07/07,4:32,1:46	,9:00	",    "2022/07/08,4:33,1:46	,9:00	",    "2022/07/09,4:34,1:47	,8:59	",    "2022/07/10,4:34,1:47	,8:59	",    "2022/07/11,4:35,1:47	,8:59	",    "2022/07/12,4:35,1:47	,8:58	",    "2022/07/13,4:36,1:47	,8:58	",    "2022/07/14,4:37,1:47	,8:58	",    "2022/07/15,4:37,1:47	,8:57	",    "2022/07/16,4:38,1:47	,8:57	",    "2022/07/17,4:39,1:48	,8:56	",    "2022/07/18,4:39,1:48	,8:56	",    "2022/07/19,4:40,1:48	,8:55	",    "2022/07/20,4:41,1:48	,8:55	",    "2022/07/21,4:41,1:48	,8:54	",    "2022/07/22,4:42,1:48	,8:53	",    "2022/07/23,4:43,1:48	,8:53	",    "2022/07/24,4:43,1:48	,8:52	",    "2022/07/25,4:44,1:48	,8:51	",    "2022/07/26,4:45,1:48	,8:51	",    "2022/07/27,4:46,1:48	,8:50	",    "2022/07/28,4:46,1:48	,8:49	",    "2022/07/29,4:47,1:48	,8:48	",    "2022/07/30,4:48,1:48	,8:47	",    "2022/07/31,4:49,1:48	,8:47	",    "2022/08/01,4:49,1:48	,8:46	",    "2022/08/02,4:50,1:48	,8:45	",    "2022/08/03,4:51,1:48	,8:44	",    "2022/08/04,4:52,1:48	,8:43	",    "2022/08/05,4:53,1:47	,8:42	",    "2022/08/06,4:53,1:47	,8:41	",    "2022/08/07,4:54,1:47	,8:40	",    "2022/08/08,4:55,1:47	,8:39	",    "2022/08/09,4:56,1:47	,8:38	",    "2022/08/10,4:56,1:47	,8:37	",    "2022/08/11,4:57,1:47	,8:36	",    "2022/08/12,4:58,1:47	,8:35	",    "2022/08/13,4:59,1:46	,8:33	",    "2022/08/14,4:59,1:46	,8:32	",    "2022/08/15,5:00,1:46	,8:31	",    "2022/08/16,5:01,1:46	,8:30	",    "2022/08/17,5:02,1:46	,8:29	",    "2022/08/18,5:03,1:45	,8:28	",    "2022/08/19,5:03,1:45	,8:26	",    "2022/08/20,5:04,1:45	,8:25	",    "2022/08/21,5:05,1:45	,8:24	",    "2022/08/22,5:06,1:44	,8:23	",    "2022/08/23,5:06,1:44	,8:21	",    "2022/08/24,5:07,1:44	,8:20	",    "2022/08/25,5:08,1:44	,8:19	",    "2022/08/26,5:09,1:43	,8:17	",    "2022/08/27,5:09,1:43	,8:16	",    "2022/08/28,5:10,1:43	,8:15	",    "2022/08/29,5:11,1:42	,8:13	",    "2022/08/30,5:12,1:42	,8:12	",    "2022/08/31,5:12,1:42	,8:11	",    "2022/09/01,5:13,1:42	,8:09	",    "2022/09/02,5:14,1:41	,8:08	",    "2022/09/03,5:15,1:41	,8:07	",    "2022/09/04,5:15,1:41	,8:05	",    "2022/09/05,5:16,1:40	,8:04	",    "2022/09/06,5:17,1:40	,8:02	",    "2022/09/07,5:18,1:40	,8:01	",    "2022/09/08,5:18,1:39	,7:59	",    "2022/09/09,5:19,1:39	,7:58	",    "2022/09/10,5:20,1:39	,7:57	",    "2022/09/11,5:21,1:38	,7:55	",    "2022/09/12,5:21,1:38	,7:54	",    "2022/09/13,5:22,1:37	,7:52	",    "2022/09/14,5:23,1:37	,7:51	",    "2022/09/15,5:24,1:37	,7:49	",    "2022/09/16,5:24,1:36	,7:48	",    "2022/09/17,5:25,1:36	,7:46	",    "2022/09/18,5:26,1:36	,7:45	",    "2022/09/19,5:27,1:35	,7:43	",    "2022/09/20,5:27,1:35	,7:42	",    "2022/09/21,5:28,1:35	,7:41	",    "2022/09/22,5:29,1:34	,7:39	",    "2022/09/23,5:30,1:34	,7:38	",    "2022/09/24,5:30,1:34	,7:36	",    "2022/09/25,5:31,1:33	,7:35	",    "2022/09/26,5:32,1:33	,7:33	",    "2022/09/27,5:33,1:33	,7:32	",    "2022/09/28,5:33,1:32	,7:30	",    "2022/09/29,5:34,1:32	,7:29	",    "2022/09/30,5:35,1:32	,7:28	",    "2022/10/01,5:36,1:31	,7:26	",    "2022/10/02,5:37,1:31	,7:25	",    "2022/10/03,5:37,1:31	,7:23	",    "2022/10/04,5:38,1:30	,7:22	",    "2022/10/05,5:39,1:30	,7:20	",    "2022/10/06,5:40,1:30	,7:19	",    "2022/10/07,5:41,1:29	,7:18	",    "2022/10/08,5:41,1:29	,7:16	",    "2022/10/09,5:42,1:29	,7:15	",    "2022/10/10,5:43,1:29	,7:14	",    "2022/10/11,5:44,1:28	,7:12	",    "2022/10/12,5:45,1:28	,7:11	",    "2022/10/13,5:45,1:28	,7:09	",    "2022/10/14,5:46,1:27	,7:08	",    "2022/10/15,5:47,1:27	,7:07	",    "2022/10/16,5:48,11:27,17:06",
    "2022/10/17,5:49,11:27,17:04",
    "2022/10/18,5:50,11:27,17:03",
    "2022/10/19,5:51,11:26,17:02",
    "2022/10/20,5:51,11:26,17:01",
    "2022/10/21,5:52,11:26,16:59",
    "2022/10/22,5:53,11:26,16:58",
    "2022/10/23,5:54,11:26,16:57",
    "2022/10/24,5:55,11:26,16:56",
    "2022/10/25,5:56,11:26,16:55",
    "2022/10/26,5:57,11:25,16:53",
    "2022/10/27,5:58,11:25,16:52",
    "2022/10/28,5:59,11:25,16:51",
    "2022/10/29,6:00,11:25,16:50",
    "2022/10/30,6:01,11:25,16:49",
    "2022/10/31,6:02,11:25,16:48",
    "2022/11/01,6:02,11:25,16:47",
    "2022/11/02,6:03,11:25,16:46",
    "2022/11/03,6:04,11:25,16:45",
    "2022/11/04,6:05,11:25,16:44",
    "2022/11/05,6:06,11:25,16:43",
    "2022/11/06,6:07,11:25,16:42",
    "2022/11/07,6:08,11:25,16:41",
    "2022/11/08,6:09,11:25,16:41",
    "2022/11/09,6:10,11:25,16:40",
    "2022/11/10,6:11,11:25,16:39",
    "2022/11/11,6:12,11:25,16:38",
    "2022/11/12,6:13,11:25,16:37",
    "2022/11/13,6:14,11:26,16:37",
    "2022/11/14,6:15,11:26,16:36",
    "2022/11/15,6:16,11:26,16:35",
    "2022/11/16,6:17,11:26,16:35",
    "2022/11/17,6:18,11:26,16:34",
    "2022/11/18,6:19,11:26,16:34",
    "2022/11/19,6:20,11:27,16:33",
    "2022/11/20,6:21,11:27,16:32",
    "2022/11/21,6:22,11:27,16:32",
    "2022/11/22,6:23,11:27,16:32",
    "2022/11/23,6:24,11:28,16:31",
    "2022/11/24,6:25,11:28,16:31",
    "2022/11/25,6:26,11:28,16:30",
    "2022/11/26,6:27,11:29,16:30",
    "2022/11/27,6:28,11:29,16:30",
    "2022/11/28,6:29,11:29,16:29",
    "2022/11/29,6:30,11:30,16:29",
    "2022/11/30,6:31,11:30,16:29",
    "2022/12/01,6:31,11:30,16:29",
    "2022/12/02,6:32,11:31,16:29",
    "2022/12/03,6:33,11:31,16:29",
    "2022/12/04,6:34,11:31,16:29",
    "2022/12/05,6:35,11:32,16:28",
    "2022/12/06,6:36,11:32,16:28",
    "2022/12/07,6:37,11:33,16:28",
    "2022/12/08,6:37,11:33,16:29",
    "2022/12/09,6:38,11:34,16:29",
    "2022/12/10,6:39,11:34,16:29",
    "2022/12/11,6:40,11:34,16:29",
    "2022/12/12,6:41,11:35,16:29",
    "2022/12/13,6:41,11:35,16:29",
    "2022/12/14,6:42,11:36,16:30",
    "2022/12/15,6:43,11:36,16:30",
    "2022/12/16,6:43,11:37,16:30",
    "2022/12/17,6:44,11:37,16:31",
    "2022/12/18,6:45,11:38,16:31",
    "2022/12/19,6:45,11:38,16:31",
    "2022/12/20,6:46,11:39,16:32",
    "2022/12/21,6:46,11:39,16:32",
    "2022/12/22,6:47,11:40,16:33",
    "2022/12/23,6:47,11:40,16:33",
    "2022/12/24,6:48,11:41,16:34",
    "2022/12/25,6:48,11:41,16:34",
    "2022/12/26,6:49,11:42,16:35",
    "2022/12/27,6:49,11:42,16:36",
    "2022/12/28,6:49,11:43,16:36",
    "2022/12/29,6:50,11:43,16:37",
    "2022/12/30,6:50,11:44,16:38",
    "2022/12/31,6:50,11:44,16:38",
  ];

  // データマネージャに処理させる
  d3tide.dataManager().parseSunriseLines(lines);
  //
})();
