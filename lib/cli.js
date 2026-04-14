#! /usr/bin/env node
var fs = require("fs");
var path = require("path");
var meow = require("meow");
var chalk = require("chalk");
var glob = require("glob");
var extractReactComponents = require("./");

var cli = meow(
  `Usage
  $ html2react <input> [options]

Options

  -c, --component      Type of generated React components                   ["functional", "class", "es5"]   [default: "functional"]
  -m, --module         Type of generated JavaScript modules                 ["es", "cjs"]                    [default: "es"]
  -t, --typescript     Generate TypeScript output                                                            [default: true]
      --no-typescript  Generate plain JavaScript output
  -o, --out            Output directory path                                                                 [default: "components"]
  -e, --ext            Output files extension                                                                [default: "tsx"]
  -d, --delimiter      Delimiter character to be used in modules filename

More info at https://github.com/roman01la/html-to-react-components`,
  {
    flags: {
      component: { type: "string", alias: "c" },
      module: { type: "string", alias: "m" },
      delimiter: { type: "string", alias: "d" },
      out: { type: "string", alias: "o", default: "components" },
      ext: { type: "string", alias: "e" },
      typescript: { type: "boolean", alias: "t", default: true },
    },
  }
);

var flags = cli.flags;

if (cli.input.length === 0) {
  console.log(
    chalk.red("Did you forget to specify target HTML file? See --help")
  );
  process.exit(1);
}

glob(cli.input[0], function (err, files) {
  if (err) {
    return console.warn(chalk.red(err));
  }

  var opts = {
    componentType: flags.component,
    moduleType: flags.module,
    moduleFileNameDelimiter: processDelimiterOption(flags.delimiter),
    typescript: flags.typescript,
    output: {
      path: flags.out || "components",
      fileExtension: flags.ext || (flags.typescript ? "tsx" : "js"),
    },
  };

  Promise.all(
    files.map(function (f) {
      var html = fs.readFileSync(path.join(process.cwd(), f), "utf8");
      return extractReactComponents(html, opts);
    })
  )
    .then(function (results) {
      var stats = results.reduce(
        function (agg, cs) {
          var names = Object.keys(cs);
          agg.count += names.length;
          agg.names = agg.names.concat(names);
          return agg;
        },
        { count: 0, names: [] }
      );

      console.log(
        chalk.green(
          `Successfully generated ${chalk.red(
            stats.count
          )} components: ${chalk.red(stats.names.join(", "))}
Saved into "${chalk.red(opts.output.path)}" directory`
        )
      );
    })
    .catch(function (err) {
      console.error(chalk.red(err.message || err));
      process.exit(1);
    });
});

function processDelimiterOption(flag) {
  return typeof flag === "string" && flag !== "" ? flag : "";
}
