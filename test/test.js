var fs = require("fs");
var path = require("path");
var getComponentsLib = require("../lib");
var { toFileName, writeToFS } = require("../lib/writer");
var html = readFile("basic.html");

function readFile(file) {
  return fs.readFileSync(path.join(__dirname, file), "utf8");
}

describe("HTML to React components", function () {
  it("should generate ES5 React components", async function () {
    expect(
      await getComponentsLib(html, {
        componentType: "es5",
      })
    ).toMatchSnapshot();
  });

  it("should generate ES6 React components", async function () {
    expect(
      await getComponentsLib(html, {
        componentType: "class",
      })
    ).toMatchSnapshot();
  });

  it("should generate functional React components", async function () {
    expect(
      await getComponentsLib(html, {
        componentType: "functional",
      })
    ).toMatchSnapshot();
  });

  it("should generate ES5 React components as ES6 modules", async function () {
    expect(
      await getComponentsLib(html, {
        componentType: "es5",
        moduleType: "es",
      })
    ).toMatchSnapshot();
  });

  it("should generate ES5 React components as CommonJS modules", async function () {
    expect(
      await getComponentsLib(html, {
        componentType: "es5",
        moduleType: "cjs",
      })
    ).toMatchSnapshot();
  });

  it("should generate file names in lowercase with the specified delimiter", async function () {
    expect(
      await getComponentsLib(html, {
        componentType: "es5",
        moduleType: "es",
        moduleFileNameDelimiter: "-",
      })
    ).toMatchSnapshot();
  });

  it("should throw an error if there's data-component attribute without a value in HTML", async function () {
    await expect(getComponentsLib(readFile("fail.html"))).rejects.toThrow();
  });

  it("should transform inline CSS properly", async function () {
    expect(
      await getComponentsLib(
        '<div data-component="Box" style="margin:0;padding:10px;border:1px solid black;">Box</div>'
      )
    ).toMatchSnapshot();
  });

  it("should transform public HTML attrbiutes into React props", async function () {
    expect(
      await getComponentsLib(
        '<button data-component="Button" public:onclick="hello();">press</button>'
      )
    ).toMatchSnapshot();
  });
});

describe("TypeScript output", function () {
  it("should generate TypeScript interface for functional components with public props", async function () {
    expect(
      await getComponentsLib(
        '<input public:type="text" public:placeholder="Enter text" data-component="Input" />',
        { componentType: "functional", typescript: true }
      )
    ).toMatchSnapshot();
  });

  it("should generate TypeScript interface for class components with public props", async function () {
    expect(
      await getComponentsLib(
        '<input public:type="text" public:placeholder="Enter text" data-component="Input" />',
        { componentType: "class", typescript: true }
      )
    ).toMatchSnapshot();
  });

  it("should not generate TypeScript interface for es5 components", async function () {
    expect(
      await getComponentsLib(
        '<input public:type="text" data-component="Input" />',
        { componentType: "es5", typescript: true }
      )
    ).toMatchSnapshot();
  });

  it("should generate plain JavaScript when typescript is false for functional", async function () {
    expect(
      await getComponentsLib(
        '<button data-component="Button" public:onclick="hello();">press</button>',
        { componentType: "functional", typescript: false }
      )
    ).toMatchSnapshot();
  });

  it("should generate plain JavaScript when typescript is false for class", async function () {
    expect(
      await getComponentsLib(
        '<button data-component="Button" public:onclick="hello();">press</button>',
        { componentType: "class", typescript: false }
      )
    ).toMatchSnapshot();
  });

  it("should generate TypeScript interface in CommonJS modules", async function () {
    expect(
      await getComponentsLib(
        '<button data-component="Button" public:onclick="hello();">press</button>',
        { componentType: "functional", moduleType: "cjs", typescript: true }
      )
    ).toMatchSnapshot();
  });

  it("should default to typescript when option is omitted", async function () {
    var result = await getComponentsLib(
      '<button data-component="Button" public:onclick="hello();">press</button>',
      { componentType: "functional" }
    );
    expect(result.Button).toContain("interface ButtonProps");
    expect(result.Button).toContain(": ButtonProps");
  });

  it("should not generate interface when component has no public props", async function () {
    var result = await getComponentsLib(
      '<div data-component="Box">Hello</div>',
      { componentType: "functional", typescript: true }
    );
    expect(result.Box).not.toContain("interface");
  });
});

describe("Nested components with public props", function () {
  it("should pass public props through parent-child nesting", async function () {
    expect(
      await getComponentsLib(
        '<div data-component="Parent"><input public:type="text" data-component="Child" /></div>',
        { componentType: "functional", typescript: true }
      )
    ).toMatchSnapshot();
  });

  it("should pass public props through parent-child nesting with class components", async function () {
    expect(
      await getComponentsLib(
        '<div data-component="Parent"><input public:type="text" data-component="Child" /></div>',
        { componentType: "class", typescript: true }
      )
    ).toMatchSnapshot();
  });
});

describe("HTML attribute mapping", function () {
  it("should convert class to className", async function () {
    var result = await getComponentsLib(
      '<div class="test" data-component="Box">hello</div>'
    );
    expect(result.Box).toContain("className");
    expect(result.Box).not.toMatch(/\bclass=/);
  });

  it("should convert for to htmlFor", async function () {
    var result = await getComponentsLib(
      '<label for="input" data-component="Label">text</label>'
    );
    expect(result.Label).toContain("htmlFor");
    expect(result.Label).not.toMatch(/\bfor=/);
  });

  it("should convert tabindex to tabIndex", async function () {
    var result = await getComponentsLib(
      '<div tabindex="0" data-component="Box">hello</div>'
    );
    expect(result.Box).toContain("tabIndex");
  });

  it("should convert readonly to readOnly", async function () {
    var result = await getComponentsLib(
      '<input readonly data-component="Input" />'
    );
    expect(result.Input).toContain("readOnly");
  });

  it("should handle SVG elements", async function () {
    expect(
      await getComponentsLib(
        '<svg data-component="Icon"><circle cx="10" cy="10" r="5" /></svg>'
      )
    ).toMatchSnapshot();
  });
});

describe("Option defaults", function () {
  it("should default componentType to functional", async function () {
    var result = await getComponentsLib(
      '<div data-component="Box">hello</div>'
    );
    expect(result.Box).toContain("const Box = ()");
    expect(result.Box).not.toContain("class Box");
    expect(result.Box).not.toContain("createClass");
  });

  it("should default moduleType to es", async function () {
    var result = await getComponentsLib(
      '<div data-component="Box">hello</div>'
    );
    expect(result.Box).toContain("import React");
    expect(result.Box).toContain("export default");
    expect(result.Box).not.toContain("require");
  });

  it("should default to functional when invalid componentType is given", async function () {
    var result = await getComponentsLib(
      '<div data-component="Box">hello</div>',
      { componentType: "invalid" }
    );
    expect(result.Box).toContain("const Box = ()");
  });
});

describe("File writer", function () {
  var tmpDir;

  beforeEach(function () {
    tmpDir = path.join(__dirname, "tmp_" + Date.now());
  });

  afterEach(function () {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should write files with .tsx extension by default", async function () {
    var components = { MyComponent: "const MyComponent = () => <div />;\n" };
    writeToFS(components, { output: { path: tmpDir } });
    expect(fs.existsSync(path.join(tmpDir, "MyComponent.tsx"))).toBe(true);
  });

  it("should write files with .js extension when typescript is false", async function () {
    var components = { MyComponent: "const MyComponent = () => <div />;\n" };
    writeToFS(components, { output: { path: tmpDir }, typescript: false });
    expect(fs.existsSync(path.join(tmpDir, "MyComponent.js"))).toBe(true);
  });

  it("should write files with custom extension when specified", async function () {
    var components = { MyComponent: "const MyComponent = () => <div />;\n" };
    writeToFS(components, {
      output: { path: tmpDir, fileExtension: "jsx" },
    });
    expect(fs.existsSync(path.join(tmpDir, "MyComponent.jsx"))).toBe(true);
  });

  it("should apply delimiter to file names", async function () {
    var components = { MyComponent: "const MyComponent = () => <div />;\n" };
    writeToFS(components, {
      output: { path: tmpDir },
      moduleFileNameDelimiter: "-",
    });
    expect(fs.existsSync(path.join(tmpDir, "my-component.tsx"))).toBe(true);
  });

  it("should create output directory recursively", async function () {
    var nestedDir = path.join(tmpDir, "nested", "dir");
    var components = { Box: "const Box = () => <div />;\n" };
    writeToFS(components, { output: { path: nestedDir } });
    expect(fs.existsSync(path.join(nestedDir, "Box.tsx"))).toBe(true);
  });
});

describe("toFileName", function () {
  it("should return name unchanged when delimiter is empty", function () {
    expect(toFileName("", "MyComponent")).toBe("MyComponent");
  });

  it("should split on camelCase boundaries with delimiter", function () {
    expect(toFileName("-", "MyComponent")).toBe("my-component");
  });

  it("should handle multi-word names", function () {
    expect(toFileName("_", "MyLongComponentName")).toBe(
      "my_long_component_name"
    );
  });
});
