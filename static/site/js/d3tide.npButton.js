/* global d3, d3tide */

// 2016.12.02
// Takamitsu IIDA

// NextとPrevのSVGボタンモジュール
(function() {
  d3tide.npButton = function module() {
    var CLASS_BASE_LAYER = 'd3tide-npbutton-base-layer'; // see CSS
    var CLASS_BUTTON_PREV_RECT = 'd3tide-npbutton-prev-rect';
    var CLASS_BUTTON_NEXT_RECT = 'd3tide-npbutton-next-rect';
    var CLASS_BUTTON_PREV_PATH = 'd3tide-npbutton-prev-path';
    var CLASS_BUTTON_NEXT_PATH = 'd3tide-npbutton-next-path';

    // |>
    var nextPathData = [
      'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z'
    ];

    // <|
    var prevPathData = [
      'M6 6h2v12H6zm3.5 6l8.5 6V6z'
    ];

    // 外枠の大きさ(初期値)
    var width = 800;
    var height = 300;

    // 描画領域のマージン
    var margin = {
      top: 10,
      right: 0,
      bottom: 10,
      left: 0
    };

    // 描画領域のサイズw, h
    var w = width - margin.left - margin.right;
    var h = height - margin.top - margin.bottom;

    var buttonWidth = 150;
    var buttonHeight = h;

    // ダミーデータ
    var dummy = ['dummy'];

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('prev', 'next');

    // 公開関数
    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      // 'rect'を配置するためのレイヤ'g'を作成する
      var layerAll = _selection.selectAll('.' + CLASS_BASE_LAYER).data(dummy);
      var layer = layerAll
        .enter()
        .append('g')
        .classed(CLASS_BASE_LAYER, true)
        .merge(layerAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', w)
        .attr('height', h);

      // Prevボタンになる'rectを作成する
      var prevRectAll = layer.selectAll('.' + CLASS_BUTTON_PREV_RECT).data(dummy);
      prevRectAll
        .enter()
        .append('rect')
        .classed(CLASS_BUTTON_PREV_RECT, true)
        // これ重要。わずかなマウスドラッグで他のHTML DOM要素が選択状態になることを防止する。クリックよりも前！
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function(d) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          dispatch.call('prev', this, d);
        })
        .merge(prevRectAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight);

      var prevPathAll = layer.selectAll('.' + CLASS_BUTTON_PREV_PATH).data(prevPathData);
      prevPathAll
        .enter()
        .append('path')
        .classed(CLASS_BUTTON_PREV_PATH, true)
        .merge(prevPathAll)
        .attr('transform', 'translate(0,' + (buttonHeight / 2 - 50) + ')scale(4.0)')
        .attr('d', function(d) {
          return d;
        });

      // Nextボタンになる'rectを作成する
      var nextRectAll = layer.selectAll('.' + CLASS_BUTTON_NEXT_RECT).data(dummy);
      nextRectAll
        .enter()
        .append('rect')
        .classed(CLASS_BUTTON_NEXT_RECT, true)
        // これ重要。わずかなマウスドラッグで他のHTML DOM要素が選択状態になることを防止する
        .on('mousedown', function() {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        })
        .on('click', function(d) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          dispatch.call('next', this, d);
        })
        .merge(nextRectAll)
        .attr('x', w - buttonWidth)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight);

      var nextPathAll = layer.selectAll('.' + CLASS_BUTTON_NEXT_PATH).data(nextPathData);
      nextPathAll
        .enter()
        .append('path')
        .classed(CLASS_BUTTON_NEXT_PATH, true)
        .merge(nextPathAll)
        .attr('transform', 'translate(' + (w - 70) + ',' + (buttonHeight / 2 - 50) + ')scale(4.0)')
        .attr('d', function(d) {
          return d;
        });

      //
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
      buttonHeight = h;
      return this;
    };

    exports.on = function() {
      var value = dispatch.on.apply(dispatch, arguments);
      return value === dispatch ? exports : value;
    };

    return exports;
    //
  };
  //
})();
