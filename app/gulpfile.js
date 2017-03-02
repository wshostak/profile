var gulp = require('gulp'),
    cache = require('gulp-cached'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    gutil = require('gulp-util'),
    destination = ('assets'),
    javascript_files = 'javascripts/*.js',
    style_files = 'css/*.scss',
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload;

/*
gulp.task('vulcanize', function() {
  return gulp.src('app/elements/elements.html')
    .pipe(vulcanize({
      stripComments: true,
      inlineScripts: true,
      inlineCss: true
    }))
    .pipe(gulp.dest('dist/elements'));
});
*/
gulp.task('js', function() {

  gulp.src(javascript_files)
  .pipe(cache('javascripts'))
  .pipe(uglify().on('error', gutil.log))
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest(destination))
  .pipe(browserSync.stream());
});

gulp.task('loadjs', function() {

  gulp.src(javascript_files)
  .pipe(cache('javascripts'))
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest(destination));
});

gulp.task('sass', function() {

  gulp.src('css/base.scss')
  .pipe(cache('css'))
  .pipe(sass({style: 'expanded'}))
    .on('error', gutil.log)
  .pipe(concat('styles.css'))
  .pipe(gulp.dest(destination))
  .pipe(browserSync.stream());
});

gulp.task('watch', ['js', 'sass'], function() {

  gulp.watch(javascript_files, ['js'], reload());
  gulp.watch(style_files, ['sass'], reload());
});

gulp.task('serve', function() {

  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
});

gulp.task('default', ['serve', 'watch', 'js', 'sass']);