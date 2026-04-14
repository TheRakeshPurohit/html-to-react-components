const html2react = require("../lib/index")

html2react(
  `<h1 class="heading" data-component="Heading">Hello, world!</h1>`,
).then(function (out) {
  console.log(out)
})
