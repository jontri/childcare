var fs = require('fs');
var path = require('path');
var del = require('del');

var gulp = require('gulp');

// Load all gulp plugins automatically
// and attach them to the `plugins` object
// var plugins = require('gulp-load-plugins')();

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
// var runSequence = require('run-sequence');

// Dynamic javascript versioning
var inject = require('gulp-inject');
var md5 = require('gulp-md5');
var filter = require('gulp-filter');
var order = require('gulp-order');
var rename = require('gulp-rename');
var mainBowerFiles = require('main-bower-files');
var es = require('event-stream');
var series = require('stream-series');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var runSequence = require('run-sequence');

var pkg = require('./package.json');
// var dirs = pkg['h5bp-configs'].directories;

// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('archive:create_archive_dir', function () {
    fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

// var nodemon = require('gulp-nodemon'),
// nodemon({
//     script: 'app.js',
//     nodeArgs: ['--debug']
// });

gulp.task('archive:zip', function (done) {

    var archiveName = path.resolve(dirs.archive, pkg.name + '_v' + pkg.version + '.zip');
    var archiver = require('archiver')('zip');
    var files = require('glob').sync('**/*.*', {
        'cwd': dirs.dist,
        'dot': true // include hidden files
    });
    var output = fs.createWriteStream(archiveName);

    archiver.on('error', function (error) {
        done();
        throw error;
    });

    output.on('close', done);

    files.forEach(function (file) {

        var filePath = path.resolve(dirs.dist, file);

        // `archiver.bulk` does not maintain the file
        // permissions, so we need to add files individually
        archiver.append(fs.createReadStream(filePath), {
            'name': file,
            'mode': fs.statSync(filePath)
        });

    });

    archiver.pipe(output);
    archiver.finalize();

});

gulp.task('clean', function (done) {
    del([
        dirs.archive,
        dirs.dist
    ], done);
});

gulp.task('copy', [
    'copy:.htaccess',
    'copy:index.html',
    'copy:jquery',
    'copy:license',
    'copy:main.css',
    'copy:misc',
    'copy:normalize'
]);

gulp.task('copy:.htaccess', function () {
    return gulp.src('node_modules/apache-server-configs/dist/.htaccess')
               .pipe(plugins.replace(/# ErrorDocument/g, 'ErrorDocument'))
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + '/index.html')
               .pipe(plugins.replace(/{{JQUERY_VERSION}}/g, pkg.devDependencies.jquery))
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
               .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
               .pipe(gulp.dest(dirs.dist + '/js/vendor'));
});

gulp.task('copy:license', function () {
    return gulp.src('LICENSE.txt')
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:main.css', function () {

    var banner = '/*! HTML5 Boilerplate v' + pkg.version +
                    ' | ' + pkg.license.type + ' License' +
                    ' | ' + pkg.homepage + ' */\n\n';

    return gulp.src(dirs.src + '/css/main.css')
               .pipe(plugins.header(banner))
               .pipe(plugins.autoprefixer({
                   browsers: ['last 2 versions', 'ie >= 8', '> 1%'],
                   cascade: false
               }))
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        dirs.src + '/**/*',

        // Exclude the following files
        // (other tasks will handle the copying of these files)
        '!' + dirs.src + '/css/main.css',
        '!' + dirs.src + '/index.html'

    ], {

        // Include hidden files by default
        dot: true

    }).pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:normalize', function () {
    return gulp.src('node_modules/normalize.css/normalize.css')
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        dirs.src + '/js/*.js',
        dirs.test + '/*.js'
    ]).pipe(plugins.jscs())
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('jshint-stylish'))
      .pipe(plugins.jshint.reporter('fail'));
});

// change working directory to web
process.chdir('./web')

var assetsPath = 'assets/';
var tempPath = 'temp/';
var bowerOptions = {
    paths: '..'
};

var allCSSFiles = [!assetsPath+'dist', assetsPath+'css/**/*.css', assetsPath+'plugins/**/*.css'];
var cssFilter = '**/*.css';
var cssOrder = order([
    assetsPath+'css/bootstrap.min.css',
    assetsPath+'plugins/**',
    'vendor/**',
    assetsPath+'css/plugins/**',
    assetsPath+'css/themes/**',
    assetsPath+'css/custom/theme-custom.css',
    !assetsPath+'css/custom/**/custom.css',
    assetsPath+'css/index.css'
]);

var allJSFiles = ['*.js', !assetsPath+'dist', !assetsPath+'plugins/jquery.js', assetsPath+'**/*.js', 'controls/**/*.js', 'directives/**/*.js', 'services/**/*.js', 'filters/**/*.js', 'constants/**/*.js', 'components/**/*.js'];
var jsFilter = '**/*.js';
var jsOrder = order([
    assetsPath+'plugins/jquery.js',
    'vendor/js/angular.js',
    'vendor/js/vs-google-autocomplete.js',
    'vendor/js/d3.js',
    'vendor/js/nv.d3.js',
    'vendor/js/moment.js',
    'vendor/**',
    'app.js',
    'services/**',
    'controls/**',
    'directives/**',
    'filters/**',
    'constants/**',
    'components/**',
    assetsPath+'plugins/**',
    assetsPath+'js/*',
    assetsPath+'js/plugins/**',
    assetsPath+'js/languages/**',
    assetsPath+'theme/js/**',
    assetsPath+'js/custom/**'
]);

gulp.task('inject:dev', function() {
    return gulp.src('./index_html/index.html')
        .pipe(gulp.dest('.'))
        .pipe(inject(gulp.src('app.js', {read:false}), {name:'app',relative:true}))
        .pipe(inject(gulp.src('./services/**/*.js', {read:false}), {name:'services',relative:true}))
        .pipe(inject(gulp.src('./controls/**/*.js', {read:false}), {name:'controls',relative:true}))
        .pipe(inject(gulp.src('./directives/**/*.js', {read:false}), {name:'directives',relative:true}))
        .pipe(inject(gulp.src('./filters/**/*.js', {read:false}), {name:'filters',relative:true}))
        .pipe(inject(gulp.src('./constants/**/*.js', {read:false}), {name:'constants',relative:true}))
        .pipe(inject(gulp.src('./components/**/*.js', {read:false}), {name:'components',relative:true}))
        .pipe(inject(gulp.src('./assets/js/custom/index.js', {read:false}), {name:'index',relative:true}))
        .pipe(gulp.dest('.'));
});

gulp.task('copy:temp', function() {
    var bowerCSS = gulp.src(mainBowerFiles(bowerOptions))
        .pipe(filter(cssFilter))
        .pipe(gulp.dest(tempPath+'vendor/css'));

    var cssFiles = gulp.src(allCSSFiles, {base:assetsPath})
        .pipe(gulp.dest(tempPath+'assets'));

    var bowerJS = gulp.src(mainBowerFiles(bowerOptions))
        .pipe(filter([jsFilter, '!**/jquery.js']))
        .pipe(uglify())
        .pipe(gulp.dest(tempPath+'vendor/js'));

    var jsFiles = gulp.src(allJSFiles, {base:'.'})
        .pipe(gulp.dest(tempPath));

    var jqueryFile = gulp.src(assetsPath+'plugins/jquery.js', {base:'.'})
        .pipe(uglify())
        .pipe(gulp.dest(tempPath));

    return es.merge(bowerCSS, cssFiles, bowerJS, jsFiles, jqueryFile);
});

gulp.task('hash:prod', function() {
    var minifiyCSS = cleanCSS({compatibility: 'ie8'});

    var cssStream = gulp.src(tempPath+'**')
        .pipe(filter(cssFilter))
        .pipe(cssOrder)
        .pipe(concat('main.min.css'))
        .pipe(minifiyCSS)
        .pipe(md5())
        .pipe(gulp.dest(assetsPath+'dist'));

    var jsStream = gulp.src(tempPath+'**')
        .pipe(filter(jsFilter))
        .pipe(jsOrder)
        .pipe(concat('main.min.js'))
        .pipe(md5())
        .pipe(gulp.dest(assetsPath+'dist'));

    return gulp.src('index_html/index.prod.html')
        .pipe(rename({
            basename: 'index'
        }))
        .pipe(gulp.dest('.'))
        .pipe(inject(es.merge(cssStream,jsStream), {relative:true}))
        .pipe(gulp.dest('.'));
});

gulp.task('clean:temp', function() {
    return del.sync(['temp/**']);
});

gulp.task('clean:dist', function() {
    return del.sync([assetsPath+'dist/**', 'jsver/**']);
})

gulp.task('inject:prod', function(cb) {
    runSequence(['clean:dist','copy:temp'], 'hash:prod', 'clean:temp', cb);
});


// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('archive', function (done) {
    runSequence(
        'build',
        'archive:create_archive_dir',
        'archive:zip',
    done);
});

gulp.task('build', function (done) {
    runSequence(
        ['clean', 'lint:js'],
        'copy',
    done);
});

gulp.task('default', ['build']);
