
// gruntコマンドを使えるようにインストールする
// npm install -g grunt-cli

// プロジェクトでgruntを使えるようにする
// npm install grunt --save-dev
// npm install grunt-contrib-uglify
// npm install grunt-contrib-concat

// grunt

module.exports = function (grunt) {
  var pkg = grunt.file.readJSON('package.json');

  grunt.file.defaultEncoding = 'utf-8';
  grunt.file.preserveBOM = true;

  grunt.initConfig({
    concat: {
      target_js: {
        // 元ファイルの指定
        src: [
          'static/d3.4.4.0/d3.js',
          'static/site/js/d3tide.startup.js',
          'static/site/js/d3tide.dataManager.js',
          'static/site/js/d3tide.npButton.js',
          'static/site/js/d3tide.aburatsubo2024.js',
          'static/site/js/d3tide.moon2024.js',
          'static/site/js/d3tide.moon2025.js',
          'static/site/js/d3tide.moon2026.js',
          'static/site/js/d3tide.moon2027.js',
          'static/site/js/d3tide.moon2028.js',
          'static/site/js/d3tide.moon2029.js',
          'static/site/js/d3tide.moon2030.js',
          'static/site/js/d3tide.sunrise2024.js',
          'static/site/js/d3tide.sunrise2025.js',
          'static/site/js/d3tide.miniChart.js',
          'static/site/js/d3tide.monthCalendar.js',
          'static/site/js/d3tide.tideChart.js'
        ],
        // 出力ファイルの指定
        dest: 'static/site/dist/d3tide.js'
      },
      target_css: {
        src: [
          'static/site/css/d3tide.css'
          ],
        dest: 'static/site/dist/d3tide.css'
      }
    },

    uglify: {
      target_js: {
        files: {
          // 出力ファイル: 元ファイル
          'static/site/dist/d3tide-min.js': ['static/site/dist/d3tide.js']
        }
      }
    }
  });

  // プラグインのロード・デフォルトタスクの登録
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['concat', 'uglify']);
};
