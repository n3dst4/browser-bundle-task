# @n3dst4/browser-bundle-task

![Travis status](https://travis-ci.org/n3dst4/browser-bundle-task.svg)

An opinionated gulp-compatible task factory for bundling through browserify & babelify

## Installation

```sh
npm install @n3dst4/browser-bundle-task --save
```

## Usage

```js
browserBundleTask(inFilePath, outFilePath [, options] )
```

where

* `inFilePath` is the path to the entry-point script for your build (this is passed to Browserified as `entries`)
* `outFilePath` is the path that the results will be saved under
* `options` is an optional object which, if present, may contain the following keys:
   * `watch`: if true, put the task into watch mode, i.e. become long-running and rebuild when changes occur to the source
   * `production`: if true, omit source maps and minify the resulting code

Returns a function, which, when called, will bundle the code.

## Examples

## Just build the code once

This module exports a factory function that you call with some filename parameters, and it returns a function which, when called, will build and bundle your source.

```js
import browserBundleTask from "@n3dst4/browser-bundle-task"

const entryPoint = "src/main.js"
const outFileName = "build/main.js"

const task = browserBundleTask(entryPoint, outFileName)
task()

// you can simplify the last two lines by immediately calling the new task:
browserBundleTask(entryPoint, outFileName)()
```

## As a gulp task

The reason this module exports a factory function is so that it plays nicely with [gulp][gulp]:

```js
gulp.task("build", browserBundleTask(entryPoint, outFileName))
```

## Watch mode

The task can be configured to run in watch mode, i.e. it will become long-running and rebuild your bundle every time a change is detected. Do this by passing in an options object with `watch` set to `true`:

```js
browserBundleTask(entryPoint, outFileName, {watch: true})()
```

or in gulp:
```js
gulp.task("watch", browserBundleTask(entryPoint, outFileName, {watch: true}))
```

## Production mode

This module makes no assumptions about what you may or may not consider to be "production", e.g. it doesn't interrogate `NODE_ENV`. If you want to build in "production" mode, which omits source maps and minifies the code, pass the option `production`:

```js
browserBundleTask(entryPoint, outFileName, {production: true})()
```

or in gulp:
```js
gulp.task("watch", browserBundleTask(entryPoint, outFileName,
   {production: true}))
```



# TODO

* callback
* test production flag
* test watch flag?



[gulp]: http://gulpjs.com/
