/* global d3tide */

// データマネージャモジュール
(function() {
  d3tide.dataManager = function module() {
    // このモジュールは関数ではなくマップを返す
    var exports = {};

    //
    // 潮汐データ
    //

    exports.parseTideLines = function(lines) {
      return parseTideLines(lines);
    };

    function parseTideLines(lines) {
      lines = [].concat(lines);

      // 潮汐データの保管場所
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        d3tide.appdata.tidedata = {};
      }
      var data = d3tide.appdata.tidedata;

      var i;
      for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        var dateStr = line.substr(72, 6);

        var tideDatas = [];
        var m;
        var str;
        var num;
        for (m = 0; m < 24; m++) {
          str = line.substr(m * 3, 3);
          num = parseInt(str, 10) || 0;
          tideDatas.push([m, num]);
        }

        // 1日のデータは23時で終わってしまうので、次の行の先頭のデータを読んで24時の値とする
        if (i === lines.length - 1) {
          tideDatas.push([24, 0]);
        } else {
          line = lines[i + 1];
          str = line.substr(0, 3);
          num = parseInt(str, 10) || 0;
          tideDatas.push([24, num]);
        }

        // dateStrすなわち'16 1 1'のような日付けの文字列をキーにして取り出せるようにする
        data[dateStr] = tideDatas;
      }

      return data;
    }

    // 潮汐データの取得
    // 潮汐データにおける日付けは'16 1 1'のように、6文字固定で、0埋めではなく空白が使われている

    exports.getTideDataByDate = function(date) {
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        console.log('tide data not found');
        return null;
      }

      // 年は2桁
      var year = date.getFullYear();
      year = (year % 100).toString();

      // 月は空白埋めの2桁
      var month = date.getMonth() + 1;
      month = (month < 10) ? ' ' + month : month.toString();

      // 日は空白埋めの2桁
      var day = date.getDate();
      day = (day < 10) ? ' ' + day : day.toString();

      // 全部を連結して6文字にしたものが、データ取得用のキーになる
      var key = year + month + day;

      // 潮汐データの保管場所
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        d3tide.appdata.tidedata = {};
      }

      return d3tide.appdata.tidedata[key];
    };

    exports.getTideDataByDayObj = function(d) {
      if (!d3tide.appdata.hasOwnProperty('tidedata')) {
        console.log('tide data not found');
        return null;
      }

      // 年は2桁
      var year = (d.year % 100).toString();

      // 月は空白埋めの2桁
      var month = d.month + 1;
      month = (month < 10) ? ' ' + month : month.toString();

      // 日は空白埋めの2桁
      var day = d.day;
      day = (day < 10) ? ' ' + day : day.toString();

      // 全部を連結して6文字にしたものが、データ取得用のキーになる
      var key = year + month + day;

      return d3tide.appdata.tidedata[key];
    };

    //
    // 月齢
    //

    exports.parseMoonLines = function(year, lines) {
      return parseMoonLines(year, lines);
    };

    function parseMoonLines(year, lines) {
      lines = [].concat(lines);

      // 月齢データの保管場所
      if (!d3tide.appdata.hasOwnProperty('moondata')) {
        d3tide.appdata.moondata = {};
      }
      var data = d3tide.appdata.moondata;

      var i;
      for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        var arr = line.split(',');
        if (arr.length !== 2) {
          continue;
        }

        var date = arr[0];
        var moon = arr[1];

        // 2016/1/1
        date = year + '/' + date;

        data[date] = moon;
      }

      return data;
    }

    // 月齢データの取得
    // 月齢データにアクセスするためのキーは'2016/1/1'のようになっている

    exports.getMoonDataByDate = function(date) {
      if (!d3tide.appdata.hasOwnProperty('moondata')) {
        console.log('moon data not found');
        return null;
      }

      // 年・月・日
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      return d3tide.appdata.moondata[key];
    };

    exports.getMoonDataByDayObj = function(d) {
      if (!d3tide.appdata.hasOwnProperty('moondata')) {
        console.log('moon data not found');
        return null;
      }

      // 年・月・日
      var year = d.year;
      var month = d.month + 1;
      var day = d.day;

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      return d3tide.appdata.moondata[key];
    };

    //
    // 日の出・日の入
    //

    exports.parseSunriseLines = function(lines) {
      return parseSunriseLines(lines);
    };

    function parseSunriseLines(lines) {
      lines = [].concat(lines);

      // 日の出データの保管場所
      if (!d3tide.appdata.hasOwnProperty('sunrisedata')) {
        d3tide.appdata.sunrisedata = {};
      }
      var data = d3tide.appdata.sunrisedata;

      var i;
      for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        var arr = line.split(',');
        if (arr.length !== 3) {
          continue;
        }

        var date = arr[0];
        var sunrise = arr[1];
        var sunset = arr[2];

        data[date] = {sunrise: sunrise, sunset: sunset};
      }

      return data;
    }

    // 日の出データの取得
    // 日の出データにアクセスするためのキーは'2016/01/01'のようになっている

    exports.getSunriseDataByDate = function(date) {
      if (!d3tide.appdata.hasOwnProperty('sunrisedata')) {
        console.log('sunrise data not found');
        return null;
      }

      // 年・月・日
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      month = (month < 10) ? '0' + month : month.toString();
      var day = date.getDate();
      day = (day < 10) ? '0' + day : day.toString();

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      var data = d3tide.appdata.sunrisedata[key];
      data = data ? data : {sunrise: 0, sunset: 0};

      return data;
    };

    exports.getSunriseDataByDayObj = function(d) {
      if (!d3tide.appdata.hasOwnProperty('sunrisedata')) {
        console.log('sunrise data not found');
        return null;
      }

      // 年・月・日
      var year = d.year;
      var month = d.month + 1;
      month = (month < 10) ? '0' + month : month.toString();
      var day = d.day;
      day = (day < 10) ? '0' + day : day.toString();

      // 全部を連結したものが、データ取得用のキーになる
      var key = year + '/' + month + '/' + day;

      var data = d3tide.appdata.sunrisedata[key];
      data = data ? data : {sunrise: 0, sunset: 0};

      return data;
    };

    return exports;
  };
  //
})();
