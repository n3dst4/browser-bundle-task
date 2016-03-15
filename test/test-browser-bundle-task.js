/*global describe, it, before*/

import {expect} from "chai";
import browserBundleTask from "../src/browser-bundle-task";
import path from "path"
import fs from "fs-extra"
import _mkdirp from "mkdirp"
import denodeify from "denodeify"
import vm from "vm"
import crypto from "crypto"
import rimraf from "rimraf"
import touch from "touch"
const mkdirp = denodeify(_mkdirp)
const readFile = denodeify(fs.readFile)
const utimes = denodeify(fs.utimes)
const stat = denodeify(fs.stat)

function setup (options = {}) {
  const tmpDir = path.join(__dirname, "..", "tmp", crypto.randomBytes(20).toString('hex'))
  const srcFolderPath = path.join(tmpDir, "src")
  const buildFolderPath = path.join(tmpDir, "build")
  const fixturePath = path.join(__dirname, "fixtures")


  try {
    rimraf.sync(path.join(__dirname, "..", "tmp", "*"))
  }
  catch (e) {
    // this is a cleanup task, which fails on windows sometimes because
    // windows is awful. it doesn't matter if it fails, though. we can just
    // plough on.
  }

  return mkdirp(srcFolderPath).then(() => {
    return mkdirp(buildFolderPath)
  }).then(() => {
    return denodeify(fs.copy)(fixturePath, srcFolderPath)
  }).then(() => {
    process.chdir(srcFolderPath)
    const bundleStream = browserBundleTask(
      path.join(srcFolderPath, "main.js"),
      path.join(buildFolderPath, "main.js"),
      options)()
    return new Promise((resolve, reject) => {
      bundleStream.on("end", () => { resolve(bundleStream) })
      bundleStream.on("error", reject)
    })
  }).then((bundleStream) => {
    return Promise.all([
      bundleStream,
      readFile(path.join(buildFolderPath, "main.js"), "utf8"),
      path.join(srcFolderPath, "main.js"),
      path.join(buildFolderPath, "main.js")
    ])
  })
}

describe("browser-bundle-task", function () {
  describe("on default settings", function (){
    before(function () {
      return setup().then(([stream, code]) => {
        this.code = code
      })
    })

    it("should generate working code", function (done) {
      // run the code in a sandbox with `done` in the global context
      vm.runInNewContext(this.code, {done})
    })

    it("should have a sourcemap", function () {
      expect(this.code).to.match(/\/\/# sourceMappingURL=data:application\/json;base64,[A-Za-z0-9+/]+={0,2}\s+$/)
    })

    it("should NOT be minimised (=contains some line breaks)", function () {
      // kind of a ropey test, but it's hard to unequivocally tell if code is
      // "minimised"
      expect(this.code).to.match(/\n.*\n.*\n/)
    })
  })

  describe("with \"production\" flag", function (){
    before(function () {
      return setup({production: true}).then(([stream, code]) => {
        this.code = code
      })
    })

    it("should generate working code", function (done) {
      // run the code in a sandbox with `done` in the global context
      vm.runInNewContext(this.code, {done})
    })

    it("should NOT have a sourcemap", function () {
      expect(this.code).not.to.match(/\/\/# sourceMappingURL=data:application\/json;base64,[A-Za-z0-9+/]+={0,2}\s+$/)
    })

    it("should be minimised (=no line breaks)", function () {
      expect(this.code).not.to.match(/\n/)
    })
  })

  describe("with \"watch\" flag", function (){
    before(function () {
      return setup({watch: true}).then(([stream, code, inFile, outFile]) => {
        this.code = code
        this.stream = stream
        this.inFile = inFile
        this.outFile = outFile
      })
    })

    it("should generate working code", function (done) {
      // run the code in a sandbox with `done` in the global context
      vm.runInNewContext(this.code, {done})
    })

    it("should regenerate on change", function (done) {
      // set the "last modified time" of the outfile to epoch
      return utimes(this.outFile, new Date, new Date(0)).then(() => {
        // create a promise that will resolve when the outFile get updated
        const prom = new Promise((resolve, reject) => {
          this.stream.on("updated", resolve)
        })
        // touch the inFile; this should trigger a rebuild
        touch(this.inFile)
        return prom
      }).then(() => {
        // stat and read the file
        return Promise.all([readFile(this.outFile), stat(this.outFile)])
      }).then(([code, stats]) => {
        // ensure that the file has been updated
        expect(Date.parse(stats.mtime)).to.be.above(0)
        // aaaand, check that it's still functioning
        vm.runInNewContext(this.code, {done})
      })
    })
  })

});
