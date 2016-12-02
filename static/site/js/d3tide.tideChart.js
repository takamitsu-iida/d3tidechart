/* global d3, d3tide */

// 2016.11.30
// Takamitsu IIDA

// ラインチャートモジュール
// svgは既に存在する前提
(function() {
  d3tide.tideChart = function module(_accessor) {
    //
    // クラス名定義
    //

    // 外枠になる、最下層のレイヤ
    var CLASS_BASE_LAYER = 'tidechart-base-layer';

    // チャートを配置するレイヤ
    var CLASS_CHART_LAYER = 'tidechart-layer';

    // チャートのラインとエリア
    var CLASS_CHART_LINE = 'tidechart-line'; // CSSでスタイル指定
    var CLASS_CHART_AREA = 'tidechart-area'; // CSSでスタイル指定

    // 日の出・日の入のタイムライン表示の縦線
    var CLASS_SUNRISE_LINE = 'tidechart-sunrise-line'; // CSSでスタイル指定
    var CLASS_SUNSET_LINE = 'tidechart-sunset-line'; // CSSでスタイル指定
    var CLASS_SUNRISE_LABEL = 'tidechart-sunrise-label'; // CSSでスタイル指定
    var CLASS_SUNSET_LABEL = 'tidechart-sunset-label'; // CSSでスタイル指定

    // 巨大テキスト'text'
    var CLASS_LABEL_LAYER = 'tidechart-label-layer';
    var CLASS_DATE_LABEL = 'tidechart-date-label'; // CSSでスタイル指定
    var CLASS_MOON_LABEL = 'tidechart-moon-label'; // CSSでスタイル指定

    // カスタムイベント
    var dispatch = d3.dispatch('next', 'prev');

    // ダミーデータ
    var dummy = ['dummy'];

    // 外枠の大きさ(初期値)
    var width = 800;
    var height = 300;

    // 描画領域のマージン
    var margin = {
      top: 10,
      right: 50,
      bottom: 20,
      left: 90
    };

    // 描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // このモジュールをcall()したコンテナへのセレクタ
    var container;

    // レイヤへのセレクタ
    var baseLayer;
    var chartLayer;

    // call()時に渡されたデータ
    var tideDatas;

    // 入力ドメイン（決め打ち）
    var xdomain = [0, 24];
    var ydomain = [-20, 160];

    // 軸のテキスト
    var xAxisText = '時刻';
    var yAxisText = '潮位(cm)';

    // スケール関数とレンジ指定
    var xScale = d3.scaleLinear().domain(xdomain).range([0, w]);
    var yScale = d3.scaleLinear().domain(ydomain).range([h, 0]);

    // 軸に付与するticksパラメータ
    var xticks = 12;
    var yticks = 5;

    // X軸の値は0~24までの数字なので、これを時刻のように見せる
    function xtickFormat(d) {
      return d + ':00';
    }

    // X軸
    var xaxis = d3.axisBottom(xScale).ticks(xticks).tickFormat(xtickFormat);

    // Y軸
    var yaxis = d3.axisLeft(yScale).ticks(yticks);

    // X軸に付与するグリッドライン（Y軸と平行のグリッド線）
    var drawXGrid = false;
    function make_x_gridlines() {
      return d3.axisBottom(xScale);
    }

    // Y軸に付与するグリッドライン（X軸と平行のグリッド線）
    var drawYGrid = true;
    function make_y_gridlines() {
      return d3.axisLeft(yScale).ticks(yticks);
    }

    // ライン用のパスジェネレータ
    var line = d3.line().curve(d3.curveNatural);

    // 塗りつぶしエリアのパスジェネレータ
    var area = d3.area().curve(d3.curveNatural);

    // これらパスジェネレータにスケールを設定する
    // widthやheightが変わったらスケールが変わるので、その時は再適用する
    setScale();

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      container = _selection;
      _selection.each(function(_data) {
        // 渡されたデータがundefinedやnullであっても、軸は描画する
        tideDatas = _data;

        // 外枠になるレイヤを描画する
        // ボタンはこのレイヤに置く
        var baseLayerAll = container.selectAll('.' + CLASS_BASE_LAYER).data(dummy);
        baseLayer = baseLayerAll
          .enter()
          .append('g')
          .classed(CLASS_BASE_LAYER, true)
          .merge(baseLayerAll)
          .attr('width', width)
          .attr('height', height);

        // チャートを描画するレイヤを追加する
        var chartLayerAll = baseLayer.selectAll('.' + CLASS_CHART_LAYER).data(dummy);
        chartLayer = chartLayerAll
          .enter()
          .append('g')
          .classed(CLASS_CHART_LAYER, true)
          .merge(chartLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // レイヤに日の出・日の入を表示する
        drawSunrise();

        // レイヤにチャートを配置する
        drawChart();

        // レイヤに日付けを表示する
        drawDate();

        // 左右の余白にボタンを表示
        drawButton();

        //
      });
    }

    // パスジェネレータにスケールを適用する関数
    // データは [[0, 107], [1, 102],
    // という構造を想定しているので、x軸はd[0]、y軸はd[1]になる
    // 実際にパスジェネレータにスケールを適用するのは
    // データ入手後に軸のドメインを決めて、スケールを作り直してから
    function setScale() {
      // ライン用パスジェネレータにスケールを適用する
      line
        .x(function(d) {
          return xScale(d[0]);
        })
        .y(function(d) {
          return yScale(d[1]);
        });

      // エリア用パスジェネレータにスケールを適用する
      area
        .x(function(d) {
          return xScale(d[0]);
        })
        .y0(h)
        .y1(function(d) {
          return yScale(d[1]);
        });
      //
    }

    // レイヤにチャートを描画する
    function drawChart() {
      // x軸を追加する
      var xAxisAll = chartLayer.selectAll('.tidechart-xaxis').data(dummy);
      xAxisAll
        .enter()
        .append('g')
        .classed('tidechart-xaxis', true)
        .merge(xAxisAll)
        .attr('transform', 'translate(0,' + h + ')')
        .call(xaxis);

      // X軸のラベルを追加
      var xAxisLabelAll = chartLayer.selectAll('.tidechart-xaxis-label').data(dummy);
      xAxisLabelAll
        .enter()
        .append('text')
        .classed('tidechart-xaxis-label', true) // CSSファイル参照
        .merge(xAxisLabelAll)
        .attr('x', w - 8)
        .attr('y', h - 8)
        .attr('text-anchor', 'end')
        .text(xAxisText);

      // y軸を追加する。クラス名はCSSと合わせる
      var yAxisAll = chartLayer.selectAll('.tidechart-yaxis').data(dummy);
      yAxisAll
        .enter()
        .append('g')
        .classed('tidechart-yaxis', true)
        .merge(yAxisAll)
        .call(yaxis);

      // Y軸のラベルを追加
      var yAxisLabelAll = chartLayer.selectAll('.tidechart-yaxis-label').data(dummy);
      yAxisLabelAll
        .enter()
        .append('text')
        .classed('tidechart-yaxis-label', true) // CSSファイル参照
        .merge(yAxisLabelAll)
        .attr('transform', 'rotate(-90)')
        .attr('x', -8)
        .attr('y', 8)
        .attr('dy', '.71em')
        .attr('text-anchor', 'end')
        .text(yAxisText);

      // X軸に対してグリッド線を引く(Y軸と平行の線)
      if (drawXGrid) {
        var xGridAll = chartLayer.selectAll('.tidechart-x-grid').data(dummy);
        xGridAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('tidechart-x-grid', true)
          .merge(xGridAll)
          .call(make_x_gridlines().tickSize(-h).tickFormat(''));
        //
      }

      // Y軸に対してグリッド線を引く(X軸と平行の線)
      if (drawYGrid) {
        var yGridAll = chartLayer.selectAll('.tidechart-y-grid').data(dummy);
        yGridAll
          // ENTER領域
          .enter()
          .append('g')
          .classed('tidechart-y-grid', true)
          .merge(yGridAll)
          .call(make_y_gridlines().tickSize(-w).tickFormat(''));
      }

      // データがない場合は、過去に描画したパスを消して終わり
      if (!tideDatas) {
        chartLayer.selectAll('.' + CLASS_CHART_AREA).remove();
        chartLayer.selectAll('.' + CLASS_CHART_LINE).remove();
        return;
      }

      // グラフを表示
      var areaAll = chartLayer.selectAll('.' + CLASS_CHART_AREA).data(dummy);
      areaAll
        .enter()
        .append('path')
        .classed(CLASS_CHART_AREA, true)
        .merge(areaAll)
        .datum(tideDatas)
        .transition()
        .attr('d', area);

      var lineAll = chartLayer.selectAll('.' + CLASS_CHART_LINE).data(dummy);
      lineAll
        .enter()
        .append('path')
        .classed(CLASS_CHART_LINE, true)
        .merge(lineAll)
        .datum(tideDatas)
        .transition()
        .attr('d', line);
      //
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      xScale.range([0, w]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
      yScale.range([h, 0]);

      // スケールを変更したので、パスジェネレータも直す
      setScale();

      return this;
    };

    //
    // 日付けと月齢の表示
    // 初期値は''なので、外からデータをセットしてからこのモジュールをcall()すること
    //

    // 表示する日付け
    var day = '';
    exports.day = function(_) {
      if (!arguments.length) {
        return day;
      }
      day = _;
      return this;
    };

    // 表示する月齢
    var moon = '';
    exports.moon = function(_) {
      if (!arguments.length) {
        return moon;
      }
      moon = _;
      return this;
    };

    // 日付け諸々を描画
    function drawDate() {
      // まとめて右寄せする
      var dateLayerAll = chartLayer.selectAll('.' + CLASS_LABEL_LAYER).data(dummy);
      var dateLayer = dateLayerAll
        .enter()
        .append('g')
        .classed(CLASS_LABEL_LAYER, true)
        .merge(dateLayerAll)
        .attr('transform', 'translate(' + (w - 10) + ',0)');

      var dateLabelAll = dateLayer.selectAll('.' + CLASS_DATE_LABEL).data([day]);
      var dateLabel = dateLabelAll
        .enter()
        .append('text')
        .classed(CLASS_DATE_LABEL, true)
        .merge(dateLabelAll)
        .text(function(d) {
          return d;
        })
        // 位置はdateLayerからの相対位置なので、右寄せ済み
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'end')
        .attr('dy', '1.0em');

      // この巨大テキストの境界ボックスを取り出す
      var bbox = dateLabel.node().getBBox();

      var moonLabelAll = dateLayer.selectAll('.' + CLASS_MOON_LABEL).data([moon]);
      moonLabelAll
        .enter()
        .append('text')
        .classed(CLASS_MOON_LABEL, true)
        .merge(moonLabelAll)
        .text(function(d) {
          return d;
        })
        .attr('x', 0)
        .attr('y', bbox.height)
        .attr('text-anchor', 'end')
        .attr('dy', '1.0em');

      //
    }

    //
    // 日の出と日の入
    // 初期値は0なので、外からデータをセットしてからこのモジュールをcall()すること
    //

    // 日の出・日の入の時刻
    var sunrise = 0;
    exports.sunrise = function(_) {
      if (!arguments.length) {
        return sunrise;
      }
      sunrise = _;
      return this;
    };

    var sunset = 0;
    exports.sunset = function(_) {
      if (!arguments.length) {
        return sunset;
      }
      sunset = _;
      return this;
    };

    // 6:31のようになっている文字列を数字に変換する
    // 時刻は0~24で表現しているので、それに合わせる
    function sunriseScale(d) {
      if (!d) {
        return 0;
      }

      // 6:31 を時と分に分解
      d = String(d);
      var times = d.split(':');
      var hour = times[0];
      var minute = times[1];
      try {
        return parseInt(hour, 10) + parseInt(minute, 10) / 60;
      } catch (e) {
        return 0;
      }
    }

    // タイムライン用のパスジェネレータ
    var tline = d3.line()
      .x(function(d) {
        return d[0];
      })
      .y(function(d) {
        return d[1];
      });

    // 日の出・日の入の線を追加する
    function drawSunrise() {
      //
      var sunrisex = xScale(sunriseScale(sunrise)) || 0;
      var sunrisePosition = [[sunrisex, 0], [sunrisex, h]];

      var sunsetx = xScale(sunriseScale(sunset)) || 0;
      var sunsetPosition = [[sunsetx, h / 1.8], [sunsetx, h]];

      var sunriseLineAll = chartLayer.selectAll('.' + CLASS_SUNRISE_LINE).data(dummy);
      sunriseLineAll
        .enter()
        .append('path')
        .classed(CLASS_SUNRISE_LINE, true)
        .merge(sunriseLineAll)
        .attr('d', tline(sunrisePosition));

      var sunsetPathAll = chartLayer.selectAll('.' + CLASS_SUNSET_LINE).data(dummy);
      sunsetPathAll
        .enter()
        .append('path')
        .classed(CLASS_SUNSET_LINE, true)
        .merge(sunsetPathAll)
        .attr('d', tline(sunsetPosition));

      // 日の出時刻の表示
      var sunriseLabelAll = chartLayer.selectAll('.' + CLASS_SUNRISE_LABEL).data([sunrise]);
      sunriseLabelAll
        .enter()
        .append('text')
        .classed(CLASS_SUNRISE_LABEL, true)
        .merge(sunriseLabelAll)
        .text(function(d) {
          return d;
        })
        .attr('x', sunrisex)
        .attr('y', h)
        .attr('text-anchor', 'start')
        .attr('dx', '0.1em')
        .attr('dy', '-0.4em');

      // 日の入時刻の表示
      var sunsetLabelAll = chartLayer.selectAll('.' + CLASS_SUNSET_LABEL).data([sunset]);
      sunsetLabelAll
        .enter()
        .append('text')
        .classed(CLASS_SUNSET_LABEL, true)
        .merge(sunsetLabelAll)
        .text(function(d) {
          return d;
        })
        .attr('x', sunsetx)
        .attr('y', h)
        .attr('text-anchor', 'start')
        .attr('dx', '0.1em')
        .attr('dy', '-0.4em');
      //
    }

    //
    // 左右の余白部分にボタンを付ける
    //

    var buttonWidth = 40;

    // ボタンを表示する
    function drawButton() {
      var prevButtonContainerAll = baseLayer.selectAll('.tidechart-prev-button-container').data(dummy);
      var prevButtonContainer = prevButtonContainerAll
        .enter()
        .append('g')
        .classed('tidechart-prev-button-container', true)
        .merge(prevButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(5,' + (margin.top) + ')');

      var prevButtonAll = prevButtonContainer.selectAll('.tidechart-prev-button').data(dummy);
      prevButtonAll
        .enter()
        .append('rect')
        .classed('tidechart-prev-button', true)
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

      var nextButtonContainerAll = baseLayer.selectAll('.tidechart-next-button-container').data(dummy);
      var nextButtonContainer = nextButtonContainerAll
        .enter()
        .append('g')
        .classed('tidechart-next-button-container', true)
        .merge(nextButtonContainerAll)
        .attr('width', buttonWidth)
        .attr('height', h)
        .attr('transform', 'translate(' + (width - buttonWidth - 5) + ',' + (margin.top) + ')');

      var nextButtonAll = nextButtonContainer.selectAll('.tidechart-next-button').data(dummy);
      nextButtonAll
        .enter()
        .append('rect')
        .classed('tidechart-next-button', true)
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
      dispatch.call('prev', this, '');
    }

    function onNext(selector) {
      dispatch.call('next', this, '');
    }

    // カスタムイベントを'on'で発火できるようにリバインドする
    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
  };

  //
})();
