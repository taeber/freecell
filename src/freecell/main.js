"use strict"

if (typeof require !== "undefined") {
    // deno-lint-ignore no-inner-declarations no-var
    var webui = require("./webui.js")
    // deno-lint-ignore no-inner-declarations no-var
    var freecell = require("./freecell.js")
}

// deno-lint-ignore no-var no-unused-vars
var main = function (element, requestAnimationFrame) {
    freecell.Play(webui.Renderer(element, requestAnimationFrame))
}
