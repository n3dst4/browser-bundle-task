import browserify from "browserify"
import babelify from 'babelify'
import vinylSource from "vinyl-source-stream"
import vinylBuffer from "vinyl-buffer"
import sourcemaps from "gulp-sourcemaps"
import uglify from "gulp-uglify"
import watchify from "watchify"
import errorify from "errorify"
import gutil from "gulp-util"
import gulpIf from "gulp-if"
import path from "path"
import {dest as vinylDestination} from "vinyl-fs"
import transformObjectRestSpread from "babel-plugin-transform-object-rest-spread"
import envify from "envify"

// browserBundle returns a function which is suitable for use in a gulp task
export default function browserBundle (inFilePath, outFilePath,
    opts = {watch: false, production: false}) {
  const outFolder = path.dirname(outFilePath)
  const outFileName = path.basename(outFilePath)
  let bundler =
    browserify({
      entries: [inFilePath],
      debug: !opts.production,
      cache: {},
      packageCache: {},
      //plugin: [babelify]
    }).transform(babelify, {
      presets: ["es2015", "react"],
      "plugins": [transformObjectRestSpread]
    })
    .transform(envify, {
      global: true
    }) 

  if (opts.watch) {
    bundler = bundler.plugin(watchify)
    bundler = bundler.plugin(errorify)
  }

  // bundle() is where we actuall call bundler.bundle() and pipe the results
  // into vinyl streams
  function bundle () {
    return bundler.bundle()
      .on("error", function (err) {
        // thanks to http://stackoverflow.com/a/24817446/212676
        console.error(err);
        this.emit("end");
      })
      .pipe(vinylSource(outFileName))
      .pipe(vinylBuffer())
      .pipe(gulpIf(!opts.production, sourcemaps.init({loadMaps: true})))
      .pipe(gulpIf(opts.production, uglify()))
      // write sourcemaps inline to prevent bug in Chrome
      // https://bugs.chromium.org/p/chromium/issues/detail?id=508270
      .pipe(gulpIf(!opts.production, sourcemaps.write()))
      .pipe(vinylDestination(outFolder));
  }

  const bundleStream = bundle()

  // when a change is detected, log changes and call bundle again
  bundler.on("update", function (ids) {
    gutil.log("Script dependencies updated:");
    ids = ids.map(function (id) {
      return gutil.colors.magenta(path.relative(process.cwd(), id));
    });
    ids.forEach(function (id) { gutil.log(id); });
    const updateStream = bundle();
    updateStream.on("end", function () {
      bundleStream.emit("updated")
    })
  })

  // the log event is fired by watchify with time and size info
  bundler.on("log", function (msg) {
    gutil.log(msg);
  })

  // call bundle() once to kick off
  return bundleStream
}
