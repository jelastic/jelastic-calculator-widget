'use strict';
/* import dependencies */
import config from 'config';

import gulp from 'gulp';
import browserSync from 'browser-sync';

var concat = require('gulp-concat');

const plugins = require("gulp-load-plugins")({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/
});

/* PostCSS plugins */
import cssnext from 'postcss-preset-env';
import cssnano from 'cssnano';
import mqpacker from 'css-mqpacker';
import discardDuplicates from 'postcss-discard-duplicates';
import discardEmpty from 'postcss-discard-empty';
import combineDuplicatedSelectors from 'postcss-combine-duplicated-selectors';
import unprefix from 'postcss-unprefix';
import charset from 'postcss-single-charset';
import focus from 'postcss-focus';

const postCSSprocessors = [
    charset(),
    unprefix(),
    discardDuplicates(),
    discardEmpty(),
    mqpacker({
        sort: true
    }),
    combineDuplicatedSelectors({
        removeDuplicatedProperties: true
    }),
    focus(),
    cssnext({
        browsers: [
            'ie >= 8',
            'ie_mob >= 10',
            'ff >= 20',
            'chrome >= 24',
            'safari >= 5',
            'opera >= 12',
            'ios >= 7',
            'android >= 2.3',
            '> 1%',
            'last 5 versions',
            'bb >= 10'
        ],
        warnForDuplicates: false
    }),
    cssnano({
        zindex: false,
        discardComments: {
            removeAll: true
        },
        discardUnused: {
            fontFace: false
        }
    })
];

/* browserSync config */
let args = {
    notify: false,
    port: 9080,
    server: {
        baseDir: config.path.base.dest,
    }
}

// Compile and automatically prefix stylesheets
gulp.task('styles', function () {
    let templateName = 'j-calculator',
        source = 'assets/scss/' + templateName + '.scss',
        destination = config.path.styles.dest;
    return gulp.src(source)
        .pipe(customPlumber('Error Running Sass'))
        .pipe(plugins.newer(destination))
        .pipe(plugins.sass({
            outputStyle: 'compact',
            precision: 5,
            onError: console.error.bind(console, 'Sass error:')
        }))
        .pipe(plugins.rename({
            suffix: '.min'
        }))
        .pipe(plugins.postcss(postCSSprocessors))
        .pipe(gulp.dest(destination))
        .pipe(plugins.size({
            showFiles: true,
            title: 'task: ' + templateName
        }))
        .pipe(browserSync.reload({stream: true}));
});

// Optimize images
gulp.task('images', function () {
    return gulp.src(config.path.images.srcimg)
        .pipe(customPlumber('Error Running Images'))
        .pipe(plugins.newer(config.path.images.dest))
        .pipe(plugins.bytediff.start())
        .pipe(plugins.imagemin([
            plugins.imagemin.gifsicle({
                interlaced: true
            }),
            plugins.imagemin.jpegtran({
                progressive: true
            }),
            plugins.imagemin.optipng({
                optimizationLevel: 5
            }),
            plugins.imagemin.svgo({
                plugins: [{
                    removeViewBox: false,
                    collapseGroups: true
                }]
            })
        ]))
        .pipe(plugins.bytediff.stop(function (data) {
            var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
            return data.fileName + ' is ' + data.percent + '%' + difference;
        }))
        .pipe(plugins.size({
            showFiles: true,
            title: 'task:images'
        }))
        .pipe(gulp.dest(config.path.images.dest))
        .pipe(browserSync.reload({stream: true}));
});

// Optimize script
const j_scripts = [
    'assets/js/3dparty/Obj.min.js',
    'assets/js/JApp.js',
    'assets/js/calculator.js',
    'assets/js/sliders.js',
];
gulp.task('scripts', function () {
    return gulp
        .src(j_scripts)
        .pipe(plugins.newer(config.path.scripts.dest))
        .pipe(customPlumber('Error Compiling Scripts'))
        .pipe(plugins.if('*.js', plugins.uglify()))
        .pipe(plugins.concat('j-calculator.min.js'))
        .pipe(gulp.dest(config.path.scripts.dest))
        .pipe(plugins.size({
            showFiles: true,
            title: 'task:scripts >> jelastic_base'
        }))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('task:images', gulp.series('images'));
gulp.task('task:images-styles', gulp.series('task:images', 'styles'));
gulp.task('parallel-scripts-images-styles', gulp.parallel('task:images-styles', 'scripts'));

// watch for changes
gulp.task('watch', function () {

    browserSync.init(args);

    gulp.watch(config.path.base.desthtml).on('change', browserSync.reload);

    gulp.watch(config.path.styles.srcfiles, gulp.series('styles'));

    gulp.watch(config.path.images.srcimg, gulp.series('images'));

    gulp.watch(config.path.scripts.src, gulp.series('scripts'));

});

// Consolidated dev phase task
gulp.task('serve', gulp.series('parallel-scripts-images-styles', 'watch'));

gulp.task('default', gulp.series('parallel-scripts-images-styles'));

// Custom Plumber function for catching errors
function customPlumber(errTitle) {
    return plugins.plumber({
        errorHandler: plugins.notify.onError({
            // Customizing error title
            title: errTitle || 'Error running Gulp',
            message: 'Error: <%= error.message %>',
            sound: "Bottle"
        })
    });
};
module.exports = customPlumber;
