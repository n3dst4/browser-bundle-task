/*global describe, it*/

//import chai from "chai";
import browserBundleTask from "../src/browser-bundle-task";
import path from "path"
import os from "os"
import fs from "fs-extra"
import _mkdirp from "mkdirp"
import denodeify from "denodeify"
import streamToPromise from "stream-to-promise"
import vm from "vm"
import crypto from "crypto"
import rimraf from "rimraf"

//const expect = chai.expect;

describe("browser-bundle-task", function () {
  it("should definitely have more than one test", function (done) {

    const tmpDir = path.join(__dirname, "..", "tmp", crypto.randomBytes(20).toString('hex'))
    const srcFolderPath = path.join(tmpDir, "src")
    const buildFolderPath = path.join(tmpDir, "build")
    const fixturePath = path.join(__dirname, "fixtures")
    //const folderNow = process.cwd()

    const mkdirp = denodeify(_mkdirp)
    const readFile = denodeify(fs.readFile)

    rimraf.sync(path.join(__dirname, "..", "tmp"))

    mkdirp(srcFolderPath).then(() => {
      return mkdirp(buildFolderPath)
    }).then(() => {
      return denodeify(fs.copy)(fixturePath, srcFolderPath)
    }).then(() => {
      process.chdir(srcFolderPath)
      const bundleStream = browserBundleTask(path.join(srcFolderPath, "main.js"), "main.js", buildFolderPath)()
      return streamToPromise(bundleStream)
    }).then(() => {
      console.log(4)
      return readFile(path.join(buildFolderPath, "main.js"))
    }).then((code) => {
      console.log("here5")
      vm.runInNewContext(code, {done})
    })

    //expect("this single silly test").to.equal("lots of useful tests");
  })
});
