var parse = require("posthtml-parser")
var htmlToReactComponentsLib = require("./processor")

module.exports = async function extractReactComponents(html, options) {
  options = options || {}

  var components = await htmlToReactComponentsLib(parse(html), options)

  if (typeof IN_BROWSER === "undefined") {
    require("./writer").writeToFS(components, options)
  }

  return components
}
