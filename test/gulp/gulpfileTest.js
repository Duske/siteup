require('mocha');
import * as gulpfile from '../../gulpfile.babel';
import assert from 'assert';
import gulp from 'gulp';
import del from 'del';
import expect from 'expect.js';
import fs from 'fs';

const inputDir = __dirname + '/input';
const outputDir = __dirname + '/output';

describe('Test gulp tasks', function() {
  beforeEach(function(done) {
      del(outputDir, done);
  });

  describe('Enable ES2015 features and modules', function() {
    this.timeout(5000);
    gulp.task('es2015fy', gulpfile.es2015fy(inputDir + '/main.js', {
      basePath: inputDir,
      filename: 'app.js',
      destDir: outputDir
    }));
    it('should compile ES2015 into a single file', function(done) {
      gulp.task('test', ['es2015fy'], () => {
        expect(fs.existsSync(outputDir + '/app.js')).to.be(true);
        done();
      });
      gulp.start('test');
    });
    it('should compile with inline sourcemaps', function(done) {
      gulp.task('test', ['es2015fy'], () => {
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.contain('\n//# sourceMappingURL');
        done();
      });
      gulp.start('test');
    });
    it('should bundle ES2015 modules directly', function(done) {
      gulp.task('test', ['es2015fy'], () => {
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.not.contain('require(');
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.contain('derp$$testConstant');
        done();
      });
      gulp.start('test');
    });
    it('should compile ES2015 features, e.g. arrow functions', function(done) {
      gulp.task('test', ['es2015fy'], () => {
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.not.contain('() => {');
        done();
      });
      gulp.start('test');
    });
  });

  describe('Style compilation (SASS)', function() {
    this.timeout(5000);
    gulp.task('compileStyles', gulpfile.compileStyles(inputDir + '/main.scss', {
      destDir: outputDir,
      supportedBrowsers: ['last 1 version']
    }));
    it('should compile styles into a single css file', function(done) {
      gulp.task('test', ['compileStyles'], () => {
        expect(fs.existsSync(outputDir + '/main.css')).to.be(true);
        done();
      });
      gulp.start('test');
    });
    it('should compile styles with sourcemaps', function(done) {
      gulp.task('test', ['compileStyles'], () => {
        expect(fs.readFileSync(outputDir + '/main.css').toString('utf8'))
          .to.contain('\n/*# sourceMappingURL');
        done();
      });
      gulp.start('test');
    });
    it('should compile SASS includes as well', function(done) {
      gulp.task('test', ['compileStyles'], () => {
        expect(fs.readFileSync(outputDir + '/main.css').toString('utf8'))
          .to.contain('html');
        done();
      });
      gulp.start('test');
    });
  });

});
