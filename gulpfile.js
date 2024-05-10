const { src, dest, watch, series, parallel } = require('gulp');

const cssnano = require('cssnano')
const sass = require('gulp-sass')(require('sass'))
const postcss = require('gulp-postcss')
const concat = require('gulp-concat')
const terser = require('gulp-terser')
const fileinclude = require('gulp-file-include')
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
  return src('src/scss/**/*.scss', { sourcemaps: true })
    .pipe(sass())
    .pipe(postcss([cssnano()]))
    .pipe(dest('dist/assets/css', { sourcemaps: '.' }))
    .pipe(browserSync.stream()) // Sayfayı reload etmeden css inject
}

// Scss Task w/o Reload
function bsScssTask() {
  return src('src/scss/**/*.scss', { sourcemaps: true })
    .pipe(sass())
    .pipe(postcss([cssnano()]))
    .pipe(dest('dist/assets/css', { sourcemaps: '.' }))
}

// Javascript Task
function jsTask() {
  return src([
    // Birleştirilecek JS dosyaları
    //'src/scripts/_bootstrap.bundle.js',
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


// DEV: Çalıştırmak için terminalde: gulp
exports.default = series(
  bsScssTask,
  jsTask,
  fileincludeTask,
  browsersyncServe,
  watchTask,
)