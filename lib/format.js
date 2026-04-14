async function formatCode(components, typescript) {
  if (typeof IN_BROWSER === "undefined") {
    var prettier = require("prettier/standalone");
    var babelPlugin = require("prettier/plugins/babel");
    var estreePlugin = require("prettier/plugins/estree");
    var plugins = [babelPlugin, estreePlugin];
    var parser = typescript ? "babel-ts" : "babel";
    var result = {};
    for (var name of Object.keys(components)) {
      result[name] = await prettier.format(components[name], {
        semi: true,
        parser: parser,
        plugins: plugins,
      });
    }
    return result;
  } else {
    return components;
  }
}

module.exports = formatCode;
