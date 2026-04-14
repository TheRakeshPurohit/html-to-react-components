const webpack = require("webpack")
const path = require("path")

module.exports = {
  entry: "./lib/index.js",
  output: {
    library: "html2react",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "dist"),
    filename: "html2react.js",
  },
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js?$/,
        exclude: [path.resolve(__dirname, "node_modules")],
        options: {
          presets: ["@babel/preset-env"],
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      IN_BROWSER: JSON.stringify(true),
    }),
  ],
}
