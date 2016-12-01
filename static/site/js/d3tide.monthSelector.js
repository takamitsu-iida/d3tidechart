/* global d3, d3tide */

// 2016.11.27
// Takamitsu IIDA

// 月を選択するモジュール
(function() {
  d3tide.monthSelector = function module(_accessor) {
    // svgを作る必要があるならインスタンス化するときにtrueを渡す
    var needsvg = arguments.length ? _accessor : false;

    // 枠の大きさ
    var width = 900;
    var height = 200;

    // 'g'の描画領域となるデフォルトのマージン
    var margin = {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40
    };

    // d3.jsで描画する領域。軸や凡例がはみ出てしまうので、マージンの分だけ小さくしておく。
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('customHover');

    // 描画するレイヤ'g'へのセレクタ
    var baseLayer;

    var monthTexts = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    var year = 2016;
    var dates = d3.range(0, 13).map(function(d) {
      return new Date(2016, d);
    });

    // 開始日と終了日
    var startDate = dates[0];
    var endDate = dates[dates.length - 1];

    // 'rect'を横並びにするためのスケール
    var bandScale = d3.scaleBand()
      .domain(dates)
      .rangeRound([0, w]);

    var opacityMouseOver = 0.4;
    var opacityDefault = 0;

    // x軸のスケール関数
    var xScale = d3.scaleTime()
      .domain([startDate, endDate])
      .rangeRound([bandScale(startDate), bandScale(endDate)]);

    // x軸のグリッド
    var xaxisGrid = d3.axisBottom(xScale)
      .ticks(d3.timeMonth)
      .tickSize(-h)
      .tickFormat(function() {
        return null;
      });

    // x軸
    var xaxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth)
      .tickSize(16, 0)
      .tickPadding(0)
      .tickFormat(function(d) {
        if (d.getFullYear() === year) {
          return monthTexts[d.getMonth()];
        }
        return null;
      });

    // call()したコンテナ
    var container;

    function exports(_selection) {
      // svgの作成を必要とするなら、新たにsvgを作成して、それをコンテナにする
      if (needsvg) {
        var svgAll = _selection.selectAll('svg').data(['dummy']);
        container = svgAll.enter().append('svg').merge(svgAll).attr('width', width).attr('height', height);
      } else {
        container = _selection;
      }

      _selection.each(function(_data) {
        var baseLayerAll = container.selectAll('.ms-base-layer').data(['dummy']);
        baseLayer = baseLayerAll
          .enter()
          .append('g')
          .classed('ms-base-layer', true)
          .merge(baseLayerAll)
          .attr('width', w)
          .attr('height', h)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var xaxisGridAll = baseLayer.selectAll('.ms-x-axis-grid').data(['dummy']);
        xaxisGridAll
          .enter()
          .append('g')
          .classed('ms-x-axis-grid', true)
          .merge(xaxisGridAll)
          .attr('transform', 'translate(0,' + h + ')')
          .call(xaxisGrid)
          .selectAll('.tick');
          /*
          .classed('tick-minor', function(d) {
            return d.getMonth();
          });
          */

        var xaxisAll = baseLayer.selectAll('.ms-x-axis').data(['dummy']);
        xaxisAll
          .enter()
          .append('g')
          .classed('ms-x-axis', true)
          .merge(xaxisAll)
          .attr('transform', 'translate(0,' + h + ')')
          .call(xaxis)
          .attr('text-anchor', 'start')
          .selectAll('text')
          .attr('x', 6)
          .attr('y', 6);

        var columnLayerAll = baseLayer.selectAll('.ms-column-layer').data(['dummy']);
        var columnLayer = columnLayerAll
          .enter()
          .append('g')
          .classed('ms-column-layer', true)
          .merge(columnLayerAll);

        columnLayer
          .selectAll('rect')
          .data(dates)
          .enter()
          .append('rect')
          .attr('x', function(d) {
            return bandScale(d);
          })
          .attr('y', 0)
          .attr('height', h)
          .attr('width', bandScale.bandwidth())
          .style('fill', 'gray')
          .style('opacity', opacityDefault)
          .on('mouseover', function() {
            onMouseOver(d3.select(this));
          })
          .on('mouseleave', function() {
            onMouseLeave(d3.select(this));
          });

        //
      });
    }

    function onMouseOver(selection) {
      selection.style('opacity', opacityMouseOver);
    }

    function onMouseLeave(selection) {
      selection.style('opacity', opacityDefault);
    }

    exports.width = function(_) {
      if (!arguments.length) {
        return width;
      }
      width = _;
      w = width - margin.left - margin.right;
      return this;
    };

    exports.height = function(_) {
      if (!arguments.length) {
        return height;
      }
      height = _;
      h = height - margin.top - margin.bottom;
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
