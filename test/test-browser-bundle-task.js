/*global describe, it, before*/

import chai from "chai";
import browserBundleTask from "../src/browser-bundle-task";
import path from "path"
import fs from "fs-extra"
import _mkdirp from "mkdirp"
import denodeify from "denodeify"
import vm from "vm"
import crypto from "crypto"
import rimraf from "rimraf"
const expect = chai.expect

describe("browser-bundle-task", function () {
  before(function (done) {
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

    mkdirp(srcFolderPath).then(() => {
      return mkdirp(buildFolderPath)
    }).then(() => {
      return denodeify(fs.copy)(fixturePath, srcFolderPath)
    }).then(() => {
      process.chdir(srcFolderPath)
      const bundleStream = browserBundleTask(path.join(srcFolderPath, "main.js"), "main.js", buildFolderPath)()
      return new Promise((resolve, reject) => {
        bundleStream.on("end", resolve)
        bundleStream.on("error", reject)
      })
    }).then(() => {
      return readFile(path.join(buildFolderPath, "main.js"), "utf8")
    }).then((code) => {
      this.code = code
      done()
    })
  })

  it("should generate working code", function (done) {
    // run the code in a sandbox with `done` in the global context
    vm.runInNewContext(this.code, {done})
  })

  it("should have a sourcemap", function () {
    expect(this.code).to.match(/\/\/# sourceMappingURL=data:application\/json;base64,[A-Za-z0-9+/]+={0,2}\s+$/)
  })
});
