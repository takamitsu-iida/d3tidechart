/* global d3, d3tide */

// 2016.11.29
// Takamitsu IIDA

// ミニ・ラインチャートモジュール
// svgは既に存在する前提
(function() {
  d3tide.miniChart = function module(_accessor) {
    //
    // クラス名定義
    //

    // チャートを配置するレイヤ
    var CLASS_CHART_LAYER = 'mini-tidechart-layer';

    // チャートのラインとエリア
    var CLASS_CHART_LINE = 'mini-tidechart-line'; // CSSでスタイル指定
    var CLASS_CHART_AREA = 'mini-tidechart-area'; // CSSでスタイル指定

    // 外枠の大きさ(初期値)
    var width = 200;
    var height = 200;

    // 描画領域のマージン
    var margin = {
      top: 25, // 日付けがあるので上に隙間をあける
      right: 0,
      bottom: 0,
      left: 0
    };

    // 描画領域のサイズw, h
    // 軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // ダミーデータ
    var dummy = [0];

    // このモジュールをcall()したコンテナへのセレクタ
    var container;

    // チャートを描画するレイヤへのセレクタ
    var layer;

    // call()時に渡されたデータ
    var tideDatas;

    // 入力ドメイン（決め打ち）
    var xdomain = [0, 24];
    var ydomain = [-20, 150];

    // スケール関数とレンジ指定
    var xScale = d3.scaleLinear().domain(xdomain).range([0, w]);
    var yScale = d3.scaleLinear().domain(ydomain).range([h, 0]);

    // ライン用のパスジェネレータ
    var line = d3.line().curve(d3.curveNatural);

    // 塗りつぶしを描画するか
    var draw_area = false;

    // 塗りつぶしエリアのパスジェネレータ
    var area = d3.area().curve(d3.curveNatural);

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

    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      container = _selection;
      _selection.each(function(_data) {
        if (!_data) {
          // データにnullを指定してcall()した場合は、既存の描画領域を削除して終了
          container.select('.' + CLASS_CHART_LAYER).remove();
          return;
        }

        tideDatas = _data;

        // コンテナに直接描画するのは気がひけるので、レイヤを１枚追加する
        var layerAll = container.selectAll('.' + CLASS_CHART_LAYER).data(dummy);
        layer = layerAll
          .enter()
          .append('g')
          .classed(CLASS_CHART_LAYER, true)
          .merge(layerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // スケールをパスジェネレータに適用する
        setScale();

        // レイヤにチャートを配置する
        drawChart();
        //
      });
    }

    // レイヤにチャートを描画する
    function drawChart() {
      // X軸に並行のグリッド線を描画する
      var yGridAll = layer.selectAll('.mini-tidechart-y-grid').data(dummy);
      yGridAll
        .enter()
        .append('g')
        .classed('mini-tidechart-y-grid', true)
        .merge(yGridAll)
        .call(d3.axisLeft(yScale).ticks(3).tickSize(-w).tickFormat(''));

      // グラフを表示
      if (draw_area) {
        var areaAll = layer.selectAll('.' + CLASS_CHART_AREA).data(dummy);
        areaAll
          .enter()
          .append('path')
          .classed(CLASS_CHART_AREA, true)
          .merge(areaAll)
          .datum(tideDatas)
          .transition()
          .attr('d', area);
      }

      var lineAll = layer.selectAll('.' + CLASS_CHART_LINE).data(dummy);
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

    return exports;
  };

  //
})();
