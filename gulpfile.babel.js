import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import handlebars from 'gulp-compile-handlebars';
//import babelrc from 'babelrc-rollup';
import babel from 'rollup-plugin-babel';
import del from 'del';
import rollup from 'rollup-stream';
//import rename from 'gulp-rename';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import {stream as wiredep} from 'wiredep';

const SITEDATA = require('./siteData.json');
const $ = gulpLoadPlugins();
const reload = browserSync.reload;

export function es2015fy(entryFile, options) {
  return () => {
    return rollup({
      entry: entryFile,
      format: 'iife',
      sourceMap: true,
      plugins: [
        babel({
          presets: [
            ['es2015', { 'modules': false }]
          ],
          babelrc: false
        })
      ]
    }).on('error', $.util.log)
      .pipe(source('main.js', './src'))
      .pipe(buffer())
      .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.rename(options.filename))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(options.destDir));
  };
}

export function compileStyles(files, options) {
  return () => {
    return gulp.src(files)
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass.sync({
        outputStyle: 'expanded',
        precision: 10,
        includePaths: ['.']
      }).on('error', $.sass.logError))
      .pipe($.autoprefixer({browsers: options.supportedBrowsers}))
      .pipe($.sourcemaps.write())
      .pipe(gulp.dest(options.destDir))
      .pipe(reload({stream: true}));
    };
}

export function compileHandlebars(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(handlebars(options.handlebars.data || {}, options.handlebars.options))
      .pipe($.rename({extname: options.fileExtension}))
      .pipe(gulp.dest(options.destDir));
  };
}
gulp.task('compileHandlebars', compileHandlebars('app/pages/*.hbs', {
  handlebars: {
    options: {
      batch: ['./app/pages/partials'],
      ignorePartials: true //ignores the unknown footer2 partial in the handlebars template, defaults to false
    },
    data: SITEDATA
  },
  fileExtension: '.html',
  destDir: '.tmp'
}));


gulp.task('styles', compileStyles('app/styles/*.scss', {
  destDir: '.tmp/styles',
  supportedBrowsers: ['last 1 version']
}));

gulp.task('es2015fy', es2015fy('app/scripts/main.js', {
  basePath: 'app/scripts',
  filename: 'app.js',
  destDir: '.tmp/scripts'
}));

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}
const testLintOptions = {
  env: {
    mocha: true
  }
};

gulp.task('lint', lint('app/scripts/**/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

gulp.task('html', ['styles'], () => {
  const assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('.tmp/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['styles', 'fonts', 'compileHandlebars', 'lint', 'es2015fy'], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    '.tmp/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/pages/**/*.hbs', ['compileHandlebars']);
  gulp.watch('app/scripts/**/*.js', ['lint', 'es2015fy']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/pages/partials/*.hbs')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app/pages/partials/'));
});

gulp.task('build', ['lint', 'es2015fy', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
