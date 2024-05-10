const { src, dest, watch, series, parallel } = require('gulp');

const cssnano = require('cssnano')
const sass = require('gulp-sass')(require('sass'))
const postcss = require('gulp-postcss')
const concat = require('gulp-concat')
const terser = require('gulp-terser')
const fileinclude = require('gulp-file-include')
const rename = require('gulp-rename')
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');
const browserSync = require('browser-sync').create()


// File Includes
function fileincludeTask() {
  return src(['src/views/**/*.html', '!src/views/**/_*.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(dest('dist'))
}

// Scss Task w/o Reload
function scssTask() {
  return src(['src/scss/**/*.scss', '!src/scss/inc/bootstrap'], { sourcemaps: true })
    .pipe(sass())
    .pipe(postcss([cssnano()]))
    .pipe(dest('dist/assets/css', { sourcemaps: '.' }))
    .pipe(browserSync.stream()) // Sayfayı reload etmeden css inject
}

// Scss Task w/o Reload
function bsScssTask() {
  return src(['src/scss/**/*.scss', '!src/scss/inc/bootstrap'], { sourcemaps: true })
    .pipe(sass())
    .pipe(postcss([cssnano()]))
    .pipe(dest('dist/assets/css', { sourcemaps: '.' }))
}

// Javascript Task
function jsTask() {
  return src([
    // Birleştirilecek JS dosyaları
    'src/scripts/_bootstrap.bundle.js',
    'src/scripts/_custom.js'
  ], { sourcemaps: true })
    .pipe(concat('script.js'))
    .pipe(terser())
    .pipe(dest('dist/assets/js', { sourcemaps: '.' }))
}

// Browsersync Tasks
function browsersyncServe(done) {
  browserSync.init({
    //open: false,
    injectChanges: true,
    notify: false, // Notification disabled
    // notify: {
    // 	styles: {
    // 		top: 'auto',
    // 		bottom: '0',
    // 	},
    // },
    server: {
      baseDir: 'dist',
      serveStaticOptions: {
        extensions: ['html'] // Hide .html extension
      }
    }
  })
  done()
}

function browsersyncReload(done) {
  browserSync.reload()
  done()
}


// Watch Task
function watchTask() {
  //watch('src/views/**/*.html', '!src/views/**/_*.html', series('fileincludeTask'))
  // dist klasöründe html dosyalarında değişiklik olduğunda tarayıcıyı reload
  //watch('dist/*.html', browsersyncReload)
  watch('src/scss/**/*.scss', scssTask) // Sadece css dosyalarını hot reload inject 
  // src klasöründe .scss ve .js dosyalarında değişiklik olduğunda tarayıcıyı reload
  //watch(['src/scss/**/*.scss', 'src/js/**/*.js', 'src/views/**/*.html'], series(scssTask, jsTask, fileincludeTask, browsersyncReload))
  watch(['src/js/**/*.js', 'src/views/**/*.html'], series(parallel(bsScssTask, jsTask, fileincludeTask), browsersyncReload))
}

// Icon font derleyici
const fontName = 'iconfont'
const runTimestamp = Math.round(Date.now() / 1000);

function iconfontTask(done) {
  return src(['src/icons/*.svg'])
    .pipe(iconfontCss({
      fontName: fontName,
      //path: 'src/icons/templates/_icons.scss',
      path: 'src/icons/templates/_icons.css',
      targetPath: '../../../../src/scss/inc/_iconfont.scss',
      fontPath: '../fonts/iconfont/'
    }))
    .pipe(iconfont({
      fontName: fontName,
      prependUnicode: true,
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'], // default, 'woff2' and 'svg' are available
      timestamp: runTimestamp, // recommended to get consistent builds when watching files
      normalize: true,
      fontHeight: 1001
    }))
    .pipe(dest('dist/assets/fonts/iconfont/'))
  done()
}

// Customize Bootstrap SCSS
function customizeBootstrap() {
  return src('src/scss/inc/bootstrap/bootstrap.scss')
    .pipe(sass())
    .pipe(rename('_bootstrap.scss'))
    .pipe(dest('src/scss/inc'))
}


// DEV: Çalıştırmak için terminalde: gulp
exports.default = series(
  bsScssTask,
  jsTask,
  fileincludeTask,
  browsersyncServe,
  watchTask,
)

// ICONFONT: Çalıştırmak için terminalde: gulp iconfont
exports.iconfont = series(iconfontTask, bsScssTask)

// CUSTOMIZE BOOTSTRAP: Çalıştırmak için terminalde: gulp bootstrap
exports.bootstrap = series(customizeBootstrap, bsScssTask)