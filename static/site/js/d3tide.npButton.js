/* global d3, d3tide */

// 2016.12.02
// Takamitsu IIDA

// NextとPrevのSVGボタンモジュール
(function() {
  d3tide.npButton = function module() {
    var CLASS_BASE_LAYER = 'd3tide-npbutton-base-layer';
    var CLASS_PREV_LAYER = 'd3tide-npbutton-prev-layer'; // CSS参照
    var CLASS_NEXT_LAYER = 'd3tide-npbutton-next-layer'; // CSS参照
    var CLASS_BUTTON_PREV_RECT = 'd3tide-npbutton-prev-rect';
    var CLASS_BUTTON_NEXT_RECT = 'd3tide-npbutton-next-rect';
    var CLASS_BUTTON_PREV_PATH = 'd3tide-npbutton-prev-path';
    var CLASS_BUTTON_NEXT_PATH = 'd3tide-npbutton-next-path';

    // 12x12で作成したNextとPrevのアイコン
    // これをscale(4.0)で4倍にトランスフォームして使うと48x48になる

    // >|
    var nextPathData = [
      'M0,0v12l8.5-6L0,0zM10,0v12h2v-12h-2z'
    ];

    // |<
    var prevPathData = [
      'M0,0h2v12H0zM3.5,6l8.5,6V0z'
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
    var dummy = [0];

    // カスタムイベントを登録する
    var dispatch = d3.dispatch('prev', 'next');

    // 公開関数
    // call()されたときに呼ばれる公開関数
    function exports(_selection) {
      // 最下層のレイヤ'g'を作成する
      var baseLayerAll = _selection.selectAll('.' + CLASS_BASE_LAYER).data(dummy);
      var baseLayer = baseLayerAll
        .enter()
        .append('g')
        .classed(CLASS_BASE_LAYER, true)
        .merge(baseLayerAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', w)
        .attr('height', h);

      // Prevボタンを配置するレイヤ'g'を作成する
      var prevLayerALl = baseLayer.selectAll('.' + CLASS_PREV_LAYER).data(dummy);
      var prevLayer = prevLayerALl
        .enter()
        .append('g')
        .classed(CLASS_PREV_LAYER, true)
        .merge(prevLayerALl);

      // Prevボタンになる'rectを作成する
      var prevRectAll = prevLayer.selectAll('.' + CLASS_BUTTON_PREV_RECT).data(dummy);
      prevRectAll
        .enter()
        .append('rect')
        .classed(CLASS_BUTTON_PREV_RECT, true)
        .on('mousedown', function() {
          // これ重要。わずかなマウスドラッグで他のHTML DOM要素が選択状態になることを防止する。クリックよりも前！
          d3.event.preventDefault();
          d3.event.stopPropagation();
          // マウスダウンした瞬間だけ色を変える
          prevLayer.classed('mousedown', true);
          d3.select(window).on('mouseup', function() {
            prevLayer.classed('mousedown', false);
          });
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

      var prevPathAll = prevLayer.selectAll('.' + CLASS_BUTTON_PREV_PATH).data(prevPathData);
      prevPathAll
        .enter()
        .append('path')
        .classed(CLASS_BUTTON_PREV_PATH, true)
        .merge(prevPathAll)
        .attr('d', function(d) {
          return d;
        })
        .attr('transform', 'translate(10,' + (buttonHeight / 2 - 24) + ')scale(4.0)');

      // Nextボタンを配置するレイヤ'g'を作成する
      var nextLayerALl = baseLayer.selectAll('.' + CLASS_NEXT_LAYER).data(dummy);
      var nextLayer = nextLayerALl
        .enter()
        .append('g')
        .classed(CLASS_NEXT_LAYER, true)
        .merge(nextLayerALl)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight)
        .attr('transform', 'translate(' + (w - buttonWidth) + ',0)');

      // Nextボタンになる'rectを作成する
      var nextRectAll = nextLayer.selectAll('.' + CLASS_BUTTON_NEXT_RECT).data(dummy);
      nextRectAll
        .enter()
        .append('rect')
        .classed(CLASS_BUTTON_NEXT_RECT, true)
        .on('mousedown', function() {
          // これ重要。わずかなマウスドラッグで他のHTML DOM要素が選択状態になることを防止する
          d3.event.preventDefault();
          d3.event.stopPropagation();
          // マウスダウンした瞬間だけ色を変える
          nextLayer.classed('mousedown', true);
          d3.select(window).on('mouseup', function() {
            nextLayer.classed('mousedown', false);
          });
        })
        .on('click', function(d) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
          dispatch.call('next', this, d);
        })
        .merge(nextRectAll)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight);

      var nextPathAll = nextLayer.selectAll('.' + CLASS_BUTTON_NEXT_PATH).data(nextPathData);
      nextPathAll
        .enter()
        .append('path')
        .classed(CLASS_BUTTON_NEXT_PATH, true)
        .merge(nextPathAll)
        .attr('d', function(d) {
          return d;
        })
        .attr('transform', 'translate(' + (buttonWidth - 48 - 10) + ',' + (buttonHeight / 2 - 24) + ')scale(4.0)');
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
