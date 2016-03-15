# @n3dst4/browser-bundle

![Travis status](https://travis-ci.org/n3dst4/browser-bundle.svg)

An opinionated browser code bundler using browserify & babelify

## Installation

```sh
npm install @n3dst4/browser-bundle --save
```

## Usage

```js
import browserBundle from "@n3dst4/browser-bundle"
browserBundleTask(inFilePath, outFilePath [, options] )
```

where

* `inFilePath` is the path to the entry-point script for your build (this is passed to Browserified as `entries`)
* `outFilePath` is the path that the results will be saved under
* `options` is an optional object which, if present, may contain the following keys:
   * `watch`: if true, put the task into watch mode, i.e. become long-running and rebuild when changes occur to the source
   * `production`: if true, omit source maps and minify the resulting code

Returns an eventEmitter that represents the bundling stream. You can listen to the the `"end"` event to know when the bundling is completed.

In watch mode, there is also an `updated` event that is triggered *after* a rebuild has finished.

## Examples

## Just build the code once

This module exports a factory function that you call with some filename parameters, and it returns a function which, when called, will build and bundle your source.

```js
import browserBundle from "@n3dst4/browser-bundle"

const entryPoint = "src/main.js"
const outFileName = "build/main.js"

browserBundle(entryPoint, outFileName)
```

## In a gulp task

Wrap your call to browserBundle in an arrow function to easily turn it into a gulp-compatible task.

```js
gulp.task("build", () => {
   browserBundle(entryPoint, outFileName)
})
```

## Watch mode

The task can be configured to run in watch mode, i.e. it will become long-running and rebuild your bundle every time a change is detected. Do this by passing in an options object with `watch` set to `true`:

```js
browserBundle(entryPoint, outFileName, {watch: true})
```

or in gulp:
```js
gulp.task("watch", () => {
   browserBundle(entryPoint, outFileName, {watch: true})
})
```

## Production mode

This module makes no assumptions about what you may or may not consider to be "production", e.g. it doesn't interrogate `NODE_ENV`. If you want to build in "production" mode, which omits source maps and minifies the code, pass the option `production`:

```js
browserBundle(entryPoint, outFileName,
   {production: process.env.NODE_ENV === "production"})
```

or in gulp:
```js
gulp.task("build", () => {
   browserBundle(entryPoint, outFileName,
      {production: process.env.NODE_ENV === "production"})
   })

```

## Triggering browser reloads with `.on("updated")`

You can add an event listener for the "updated" event to trigger any kind of browser reload you might need (this package is not bound to any particular system.)

```js
gulp.task("watch", () => {
   const task = browserBundle(entryPoint, outFileName, {watch: true}))
      .on("updated", browserSync.reload)
})
```

[gulp]: http://gulpjs.com/
