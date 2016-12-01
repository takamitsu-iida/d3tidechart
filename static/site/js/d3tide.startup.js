/* global d3, d3tide */

// グローバルに独自の名前空間を定義する
(function() {
  // このthisはグローバル空間
  this.d3tide = this.d3tide || (function() {
    // アプリのデータを取り込む場合、appdata配下にぶら下げる
    var appdata = {};

    // ヒアドキュメント経由で静的データを取り込む場合、テキストデータをheredoc配下にぶら下げる
    var heredoc = {};

    // 地図データを取り込む場合、geodata配下にぶら下げる
    var geodata = {};

    // 公開するオブジェクト
    return {
      appdata: appdata,
      heredoc: heredoc,
      geodata: geodata
    };
  })();
  //
})();

// メイン関数
(function() {
  d3tide.main = function() {
    // HTMLのコンテナを取得する
    var container = d3.select('#tideChart');

    // データマネージャのインスタンス
    // データの入手はデータマネージャ経由で実施
    var dm = d3tide.dataManager();

    // 現在表示している日
    var currentDate = new Date();

    // 全体で共有するsvgを一つ作成する
    var svgAll = container.selectAll('.tidechart-svg').data(['dummy']);
    var svg = svgAll
      .enter()
      .append('svg')
      .classed('tidechart-svg', true)
      .merge(svgAll)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 800)
      .attr('height', 1000);

    //
    // d3tide.Chart.js
    //

    // コンテナを作成
    var chartContainerAll = svg.selectAll('.tidechart-chart-container').data(['dummy']);
    var chartContainer = chartContainerAll
      .enter()
      .append('g')
      .classed('tidechart-chart-container', true)
      .attr('width', 800)
      .attr('height', 300)
      .merge(chartContainerAll);

    // チャートをインスタンス化
    var chart = d3tide.tideChart();

    chart
      .on('prev', function() {
        var cd = currentDate.getDate();
        currentDate.setDate(cd - 1);
        drawChart();
      })
      .on('next', function() {
        var cd = currentDate.getDate();
        currentDate.setDate(cd + 1);
        drawChart();
      });

    // チャートを描画
    function drawChart() {
      // 日付けをチャートにセットする(文字列なので日付けフォーマットは適当に)
      var day = (currentDate.getMonth() + 1) + '/' + currentDate.getDate();
      chart.day(day);

      // 月齢をチャートにセット
      var moon = dm.getMoonDataByDate(currentDate);
      chart.moon(moon);

      var sun = dm.getSunriseDataByDate(currentDate);
      if (sun) {
        chart.sunrise(sun.sunrise);
        chart.sunset(sun.sunset);
      } else {
        chart.sunrise(0);
        chart.sunset(0);
      }

      // コンテナに潮汐データを紐付けてcall()する
      var tideDatas = dm.getTideDataByDate(currentDate);
      chartContainer.datum(tideDatas).call(chart);
    }

    // 現在時で表示
    drawChart();

    //
    // d3tide.monthCalendar.js
    //

    // カレンダ用のコンテナを作成
    var mcContainerAll = svg.selectAll('.tidechart-mc-container').data(['dummy']);
    var mcContainer = mcContainerAll
      .enter()
      .append('g')
      .classed('tidechart-mc-container', true)
      .merge(mcContainerAll)
      .attr('width', 800)
      .attr('height', 600)
      .attr('transform', 'translate(0,300)');

    // カレンダをインスタンス化
    var mc = d3tide.monthCalendar();

    // clickイベントはDateオブジェクトを返してくるので、それを指定してチャートを再描画
    mc.on('click', function(d) {
      currentDate = d;
      drawChart();
    });

    // コンテナに紐付けてcall()する
    mcContainer.call(mc);
  };
  //
})();
