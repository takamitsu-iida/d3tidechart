/* global d3, d3tide */

// 2016.11.28
// Takamitsu IIDA

//
// 依存
// dataManager.js
//

// 月を表示するモジュール
(function() {
  d3tide.monthCalendar = function module(_accessor) {
    // svgを作る必要があるならインスタンス化するときにtrueを渡す
    var needsvg = arguments.length ? _accessor : false;

    // コンテナの幅に自動調整するかどうか
    var adjustContainerWidth = false;

    //
    // データマネージャ
    //
    var dm = d3tide.dataManager();

    // ダミーデータ
    var dummy = ['dummy'];

    // カスタムイベント
    var dispatch = d3.dispatch('click', 'offsetChanged');

    // 枠の大きさ
    var width = 800;
    var height = 600;

    // 6行7列のグリッドの大きさを決めるマージン
    // マージンで作った余白部分には、年や月のラベル、曜日を表示する
    var margin = {
      top: 100, // 余白にラベルを表示するのでグリッドの位置を下げる(60+5 + 30+5)
      right: 50, // 余白にボタンを配置する
      bottom: 20,
      left: 50 // 余白にボタンを配置する
    };

    // グリッドを描画する領域
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // 6x7グリッドの各セルの幅と高さ
    var cellWidth = w / 7;
    var cellHeight = h / 6;

    // ラベルの高さ
    var labelHeight = 60;

    // 曜日を表示する部分の高さ
    var dtwHeight = 30;

    // 描画するレイヤ'g'へのセレクタ
    var baseLayer;

    // いま時点の年・月・日
    var now = new Date();
    var ThisYear = now.getFullYear();
    var ThisMonth = now.getMonth();
    var ThisDay = now.getDate();

    // 今月から何ヶ月ズレた月を表示するか、のオフセット
    // -1で1ヶ月前、1で1ヶ月後になる
    // 依存関係があるので直接変更するのではなく、exports.offset(1)とする
    var offset = 0;

    // 表示対象の年と月(0-11)
    var targetYear = getTargetYear();
    var targetMonth = getTargetMonth();

    // 表示対象の前の月(0-11)とその年
    var prevMonth = getPrevMonth();
    var prevMonthYear = getPrevMonthYear();

    // 表示対象の次の月(0-11)とその年
    var nextMonth = getNextMonth();
    var nextMonthYear = getNextMonthYear();

    var weekNames = ['日', '月', '火', '水', '木', '金', '土'];
    var monthNames = d3.range(1, 13).map(function(d) {
      return d;
    });

    // 各セルの'g'へのセレクタ
    // セル位置の配列が紐付けられている
    var cell;

    // 6x7=42の長さを持つ配列
    // セルの位置情報 [ [x,y], [x,y],,,]
    var cellPositions = getCellPositions();

    // days配列に格納するオブジェクトのプロトタイプ
    var proto_day = {
      year: 1970,
      month: 0,
      day: 1,
      offset: 0, // ターゲット月は0、-1は前月、+1は翌月
      isToday: false
    };

    // proto_dayをインスタンス化する関数
    function makeDay() {
      var d = Object.create(proto_day);

      // 日付表示は 11/29 のように「月/日」を返すようにする
      d.showDate = function() {
        // return d.year + '/' + (d.month + 1) + '/' + d.day;
        return (d.month + 1) + '/' + d.day;
      };

      return d;
    }

    // 6x7=42の長さを持つコンテンツの配列
    var days = getDays();

    // 6x7=42のminiChart()インスタンスの配列
    var minicharts = d3.range(0, 42).map(function(d) {
      return d3tide.miniChart().width(cellWidth).height(cellHeight);
    });

    // call()したコンテナ
    var container;

    // call()時に実行される関数
    function exports(_selection) {
      if (adjustContainerWidth) {
        // コンテナの大きさを取り出してそれに合わせる
        var containerWidth = _selection.node().clientWidth;
        exports.width(containerWidth);
      }
      if (needsvg) {
        // svgの作成を必要とするなら、新たにsvgを作成して、それをコンテナにする
        var svgAll = _selection.selectAll('svg').data(dummy);
        container = svgAll.enter().append('svg').merge(svgAll).attr('width', width).attr('height', height);
      } else {
        container = _selection;
      }

      //
      _selection.each(function(_data) {
        // ベースとなるレイヤを作成し、この上にコンテンツを乗せていく
        var baseLayerAll = container.selectAll('.mc-base-layer').data(dummy);
        baseLayer = baseLayerAll
          .enter()
          .append('g')
          .classed('mc-base-layer', true)
          .merge(baseLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // ベースレイヤの余白部分にラベルを乗せる
        drawLabel();

        // ベースレイヤの余白部分にボタンを乗せる
        initButton();

        // ベースレイヤの余白部分に曜日の表示を乗せる
        initDayOfTheWeek();

        // ベースレイヤに6x7=42個のセルを乗せる
        initGrid();

        // セルの中に日付けや月齢を描画する
        drawGrid();

        // セルの中に潮汐グラフを描画する
        drawMiniChart();
        //
      });
    }

    // ラベルを表示する
    function drawLabel() {
      var labelAll = baseLayer.selectAll('.mc-label-g').data(dummy);
      var label = labelAll
        .enter()
        .append('g')
        .classed('mc-label-g', true)
        .merge(labelAll)
        .attr('width', w)
        .attr('height', labelHeight)
        .attr('transform', 'translate(0,' + (-margin.top) + ')');

      var labelMonthAll = label.selectAll('.mc-label-month').data(dummy);
      labelMonthAll
        .enter()
        .append('text')
        .classed('mc-label-month', true)
        .merge(labelMonthAll)
        .text(monthNames[targetMonth])
        .attr('text-anchor', 'middle')
        .attr('x', cellWidth / 2)
        .attr('y', labelHeight);

      var labelYearAll = label.selectAll('.mc-label-year').data(dummy);
      labelYearAll
        .enter()
        .append('text')
        .classed('mc-label-year', true)
        .merge(labelYearAll)
        .text(targetYear)
        .attr('text-anchor', 'middle')
        .attr('x', cellWidth * 1.5)
        .attr('y', labelHeight);
    }

    var buttonWidth = 40;

    // ボタンを表示する
    function initButton() {
      var prevButtonContainerAll = baseLayer.selectAll('.mc-prev-button-container').data(dummy);
      var prevButtonContainer = prevButtonContainerAll
        .enter()
        .append('g')
        .classed('mc-prev-button-container', true)
        .merge(prevButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(' + (-1 * buttonWidth - 5) + ',0)');

      var prevButtonAll = prevButtonContainer.selectAll('.mc-prev-button').data(dummy);
      prevButtonAll
        .enter()
        .append('rect')
        .classed('mc-prev-button', true)
        .merge(prevButtonAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', h)
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          onPrev(d3.select(this));
        });

      var nextButtonContainerAll = baseLayer.selectAll('.mc-next-button-container').data(dummy);
      var nextButtonContainer = nextButtonContainerAll
        .enter()
        .append('g')
        .classed('mc-next-button-container', true)
        .merge(nextButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(' + (w + 5) + ',0)');

      var nextButtonAll = nextButtonContainer.selectAll('.mc-next-button').data(dummy);
      nextButtonAll
        .enter()
        .append('rect')
        .classed('mc-next-button', true)
        .merge(nextButtonAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', h)
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          onNext(d3.select(this));
        });
      //
    }

    function onPrev(selector) {
      exports.prev();
    }

    function onNext(selector) {
      exports.next();
    }

    // 曜日(Day of The Week)を表示する
    function initDayOfTheWeek() {
      var dtwAll = baseLayer.selectAll('.mc-dtw-g').data([0, 1, 2, 3, 4, 5, 6]);
      dtwAll
        .enter()
        .append('g')
        .classed('mc-dtw-g', true)
        .merge(dtwAll)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('transform', function(d, i) {
          return 'translate(' + cellPositions[i][0] + ',' + (-dtwHeight - 5) + ')';
        })
        .each(function(d, i) {
          var dtwRectAll = d3.select(this).selectAll('rect').data([i]);
          dtwRectAll
            .enter()
            .append('rect')
            .merge(dtwRectAll)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', cellWidth)
            .attr('height', dtwHeight)
            .attr('fill', '#E2E2E2')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', '2.0px');

          var dtwTextAll = d3.select(this).selectAll('text').data([i]);
          dtwTextAll
            .enter()
            .append('text')
            .merge(dtwTextAll)
            .attr('x', 0)
            .attr('y', 0)
            .attr('dx', '1em')
            .attr('dy', '1.5em')
            .text(function(d) {
              return weekNames[d];
            });
        });
    }

    function initGrid() {
      // 座標の配列を紐付けて'g'を6x7=42個作成する
      var cellAll = baseLayer.selectAll('.mc-cell-g').data(cellPositions);
      cell = cellAll
        .enter()
        .append('g')
        .classed('mc-cell-g', true)
        .merge(cellAll)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('transform', function(d) {
          return 'translate(' + d[0] + ',' + d[1] + ')';
        });
    }

    function drawGrid() {
      // 各セルの中に'rect'を一つ追加
      cell.each(function(d, i) {
        // 'rect'には座標配列の何番目か、という情報を紐付けておく
        var rectAll = d3.select(this).selectAll('.mc-cell-rect').data([i]);
        rectAll
          .enter()
          .append('rect')
          .classed('mc-cell-rect', true) // CSSでスタイルを指定
          .merge(rectAll)
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', function(d) {
            return getFillColor(d);
          })
          .on('click', function(d) {
            // イベントを発行する
            var date = new Date();
            date.setYear(targetYear);
            date.setMonth(targetMonth + days[d].offset); // offsetは前月だと-1、翌月だと+1
            date.setDate(days[d].day);
            dispatch.call('click', this, date);
          });
      });

      cell.each(function(d, i) {
        // セルの'g'の中に日付けを描画する'text'を追加する
        // 'text'にはセル位置配列の何番目か、という情報を紐付ける
        var dayTextAll = d3.select(this).selectAll('.mc-cell-day-text').data([i]);
        dayTextAll
          .enter()
          .append('text')
          .classed('mc-cell-day-text', true)
          .merge(dayTextAll)
          .attr('dx', '0.2em')
          .attr('dy', '1em')
          .text(function(d) {
            return days[d].showDate();
          });

        // 月齢を表示する
        var moon = dm.getMoonDataByDayObj(days[i]);
        var moonTextAll = d3.select(this).selectAll('.mc-cell-moon-text').data([i]);
        moonTextAll
          .enter()
          .append('text')
          .classed('mc-cell-moon-text', true)
          .merge(moonTextAll)
          .attr('x', cellWidth)
          .attr('dx', '-0.2em')
          .attr('dy', '1em')
          .attr('text-anchor', 'end')
          .text(moon);

        //
      });
      //
    }

    function drawMiniChart() {
      cell.each(function(d, i) {
        // データを取り出す
        var datas = dm.getTideDataByDayObj(days[i]);

        // チャートインスタンスを取り出す
        var chart = minicharts[i];

        // セルの中にチャート描画用のコンテナを一つだけ作り、データを紐付けてcall()する
        var chartContainerAll = d3.select(this).selectAll('.mc-cell-chart').data(dummy);
        chartContainerAll
          .enter()
          .append('g')
          .classed('mc-cell-chart', true)
          .merge(chartContainerAll)
          .datum(datas)
          .call(chart);
      });
    }

    // 表示対象の月を返却する(0-11)
    function getTargetMonth() {
      // 現時点のdate
      var date = new Date();
      // 1日を指定する(実行日が30日だったりすると、誤動作するため)
      date.setDate(1);
      // 今月を表す数字(0~11)
      var thisMonth = date.getMonth();
      // カウンター分だけdateをズラす
      date.setMonth(thisMonth + offset);
      return date.getMonth();
    }

    function getPrevMonth() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset - 1);
      return date.getMonth();
    }

    function getPrevMonthYear() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset - 1);
      return date.getFullYear();
    }

    function getNextMonth() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset + 1);
      return date.getMonth();
    }

    function getNextMonthYear() {
      var date = new Date();
      date.setDate(1);
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset + 1);
      return date.getFullYear();
    }

    // 表示対象の年を返却する
    function getTargetYear() {
      var date = new Date();
      date.setDate(1);
      var thisMonth = date.getMonth();
      date.setMonth(thisMonth + offset);
      return date.getFullYear();
    }

    // 6行7列の各セルの位置の配列
    // [[x, y], [x, y],,,
    function getCellPositions() {
      var cellPositions = [];
      for (var y = 0; y < 6; y++) {
        for (var x = 0; x < 7; x++) {
          cellPositions.push([x * cellWidth, y * cellHeight]);
        }
      }
      return cellPositions;
    }

    // 6x7=42マスに日付けを入れるためのデータ配列
    // [{}, {}, ...
    function getDays() {
      // 6x7=42個分の日付けデータを格納する
      var results = [];

      // その月の1日の曜日を数字で表す(0が日曜、6が土曜)
      // つまりは、6x7グリッドのどの位置から始まるか、を表す
      var firstDayOfTheWeek = new Date(targetYear, targetMonth, 1).getDay();

      // 前の月の最後の日が31なのか、30なのか、28なのか、を取得する
      // 0日が前月の最後の日
      var lastDayOfPrevMonth = new Date(targetYear, targetMonth, 0).getDate();

      // 29, 30, 31のように、前月の最後の日付けで埋める
      var d;
      var i;
      for (i = 1; i <= firstDayOfTheWeek; i++) {
        d = makeDay();
        d.year = prevMonthYear;
        d.month = prevMonth; // 表示用に使うときには要注意
        d.day = lastDayOfPrevMonth - firstDayOfTheWeek + i;
        d.offset = -1; // 前月
        results.push(d);
      }

      // 今月の最後の日が31なのか、30なのか、を取得する
      // 翌月から1日戻った日を取得
      var lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      for (i = 1; i <= lastDay; i++) {
        d = makeDay();
        d.year = targetYear;
        d.month = targetMonth;
        d.day = i;
        d.offset = 0; // ターゲット月
        results.push(d);
      }

      // 6x7=42マスの最後の方は、翌月の先頭になる
      // あと何日足りないか
      var tail = 42 - results.length;
      for (i = 1; i <= tail; i++) {
        d = makeDay();
        d.year = nextMonthYear;
        d.month = nextMonth;
        d.day = i;
        d.offset = 1; // 翌月
        results.push(d);
      }

      // 各データが今日を表しているのか否か
      for (i = 0; i < results.length; i++) {
        d = results[i];
        if (d.year === ThisYear && d.month === ThisMonth && d.day === ThisDay) {
          d.isToday = true;
        } else {
          d.isToday = false;
        }
      }

      return results;
    }

    // 配列のi番目、の情報をもとにして、色を返す
    function getFillColor(i) {
      if (days[i].isToday) {
        return 'pink';
      }

      var column = i % 7;
      if (column === 0) { // 日曜日
        return '#ffddff';
      }
      if (column === 6) { // 土曜日
        return '#ddffff';
      }
      if (days[i].offset === 0) {
        // ターゲット月の平日
        return '#fffacd';
      }
      // それ以外
      return '#ffffee';
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      cellWidth = w / 7;
      cellPositions = getCellPositions();
      for (var i = 0; i < minicharts.length; i++) {
        minicharts[i].width(cellWidth);
      }
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      cellHeight = h / 6;
      cellPositions = getCellPositions();
      for (var i = 0; i < minicharts.length; i++) {
        minicharts[i].height(cellHeight);
      }
      return this;
    };

    exports.offset = function(_) {
      if (!arguments.length) {
        return offset;
      }
      offset = _;
      targetYear = getTargetYear();
      targetMonth = getTargetMonth();
      prevMonth = getPrevMonth();
      prevMonthYear = getPrevMonthYear();
      nextMonth = getNextMonth();
      nextMonthYear = getNextMonthYear();
      days = getDays();

      // イベントを発行する
      var date = new Date();
      date.setYear(targetYear);
      date.setMonth(targetMonth);
      date.setDate(1);
      dispatch.call('offsetChanged', this, date);

      return this;
    };

    exports.next = function(_) {
      exports.offset(offset + 1);
      drawLabel();
      drawGrid();
      drawMiniChart();
      return this;
    };

    exports.prev = function(_) {
      exports.offset(offset - 1);
      drawLabel();
      drawGrid();
      drawMiniChart();
      return this;
    };

    // カスタムイベントを'on'で発火できるようにリバインドする
    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
  };
  //
})();
