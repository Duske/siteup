require('mocha');
import * as gulpfile from '../../gulpfile.babel';
import assert from 'assert';
import gulp from 'gulp';
import del from 'del';
import expect from 'expect.js';
import fs from 'fs';

var inputDir = __dirname + '/input';
var outputDir = __dirname + '/output';

describe('Test gulp tasks', function() {
  beforeEach(function(done) {
      del(outputDir, done);
  });
  describe('ES2015fy', function() {
    it('should compile ES2015 modules and run babel', function(done) {
      this.timeout(3000);
      gulp.task('es2015fy', gulpfile.es2015fy(inputDir + '/main.js', {
        basePath: inputDir,
        filename: 'app.js',
        destDir: outputDir
      }));

      gulp.task('test', ['es2015fy'], () => {
        expect(fs.existsSync(outputDir + '/app.js')).to.be(true);
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.contain('\n//# sourceMappingURL');
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.contain('derp$$testConstant');
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.not.contain('require(');
        expect(fs.readFileSync(outputDir + '/app.js').toString('utf8'))
          .to.not.contain('() => {');
        done();
      });
      gulp.start('test');
      });

    });
});
