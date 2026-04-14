const webpack = require("webpack")
const path = require("path")

module.exports = {
  entry: "./example/index.js",
  output: {
    path: path.resolve(__dirname, "example/dist"),
    filename: "bundle.js",
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
