var fs, path

function toFileName(delimiter, name) {
  if (delimiter === "") {
    return name
  }

  return name
    .replace(/[a-z][A-Z]/g, function(str) {
      return str[0] + delimiter + str[1]
    })
    .toLowerCase()
}

if (typeof IN_BROWSER === "undefined") {
  fs = require("fs")
  path = require("path")

  function writeToFS(components, options) {
    options = options || {}

    var outPath = path.resolve(options.output && options.output.path ? options.output.path : "components")
    var delimiter = options.moduleFileNameDelimiter || ""
    var ext = options.output && options.output.fileExtension ? options.output.fileExtension : (options.typescript !== false ? "tsx" : "js")

    fs.mkdirSync(outPath, { recursive: true })

    Object.keys(components).forEach(function(name) {
      fs.writeFileSync(
        path.join(outPath, toFileName(delimiter, name)) + "." + ext,
        components[name],
        "utf8"
      )
    })
  }

  module.exports = {
    toFileName: toFileName,
    writeToFS: writeToFS
  }
} else {
  module.exports = {
    toFileName: toFileName
  }
}
