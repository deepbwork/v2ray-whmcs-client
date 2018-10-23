// 这里什么都没有耶
// 所以你在找什么咧
const {remote, shell} = require('electron');
const path = require('path')
const is = remote.getGlobal('is')
let __libname = path.join(path.dirname(__dirname), 'lib')
if (is.dev()) {
    __libname = path.join(__dirname, 'mac')
}
const tcpp = require('tcp-ping')

window.utils = {
    __libname,
    __dirname,
    platform: process.platform
}
window.tcpp = tcpp