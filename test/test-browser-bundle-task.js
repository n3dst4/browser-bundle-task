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

function setup (options = {}) {
  const tmpDir = path.join(__dirname, "..", "tmp", crypto.randomBytes(20).toString('hex'))
  const srcFolderPath = path.join(tmpDir, "src")
  const buildFolderPath = path.join(tmpDir, "build")
  const fixturePath = path.join(__dirname, "fixtures")

  const mkdirp = denodeify(_mkdirp)
  const readFile = denodeify(fs.readFile)

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
      bundleStream.on("end", resolve)
      bundleStream.on("error", reject)
    })
  }).then(() => {
    return readFile(path.join(buildFolderPath, "main.js"), "utf8")
  })
}

describe("browser-bundle-task", function () {
  describe("on default settings", function (){
    before(function () {
      return setup().then((code) => {
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
      return setup({production: true}).then((code) => {
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
});
