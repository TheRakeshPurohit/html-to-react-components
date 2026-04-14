var t = require("@babel/types");
var traverse = require("@babel/traverse").default;

function createPropsInterface(name, publics) {
  return t.tsInterfaceDeclaration(
    t.identifier(name + "Props"),
    null,
    null,
    t.tsInterfaceBody(
      publics.map(function ([propName]) {
        return t.tsPropertySignature(
          t.identifier(propName),
          t.tsTypeAnnotation(t.tsStringKeyword())
        );
      })
    )
  );
}

function props(publics, propsType) {
  if (propsType === "class") {
    return t.variableDeclaration("const", [
      t.variableDeclarator(
        t.objectPattern(
          publics.map((prop) =>
            t.objectProperty(
              t.identifier(prop[0]),
              t.identifier(prop[0]),
              false,
              true
            )
          )
        ),
        t.memberExpression(t.thisExpression(), t.identifier("props"))
      ),
    ]);
  }
  if (propsType === "functional") {
    return [
      t.objectPattern(
        publics.map((prop) =>
          t.objectProperty(
            t.identifier(prop[0]),
            t.identifier(prop[0]),
            false,
            true
          )
        )
      ),
    ];
  }
}

function toES5Component(name, jsxElement) {
  return t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier(name),
      t.callExpression(
        t.memberExpression(t.identifier("React"), t.identifier("createClass")),
        [
          t.objectExpression([
            t.objectMethod(
              "method",
              t.identifier("render"),
              [],
              t.blockStatement([t.returnStatement(jsxElement)])
            ),
          ]),
        ]
      )
    ),
  ]);
}

function toES6Component(name, jsxElement, publics, typescript) {
  var block = publics.length
    ? t.blockStatement([props(publics, "class"), t.returnStatement(jsxElement)])
    : t.blockStatement([t.returnStatement(jsxElement)]);

  var classDecl = t.classDeclaration(
    t.identifier(name),
    t.memberExpression(t.identifier("React"), t.identifier("Component")),
    t.classBody([t.classMethod("method", t.identifier("render"), [], block)]),
    []
  );

  if (typescript && publics.length > 0) {
    classDecl.superTypeParameters = t.tsTypeParameterInstantiation([
      t.tsTypeReference(t.identifier(name + "Props")),
    ]);
  }

  return classDecl;
}

function toStatelessComponent(name, jsxElement, publics, typescript) {
  var params = publics.length ? props(publics, "functional") : [];

  if (typescript && publics.length > 0 && params.length > 0) {
    params[0].typeAnnotation = t.tsTypeAnnotation(
      t.tsTypeReference(t.identifier(name + "Props"))
    );
  }

  return t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier(name),
      t.arrowFunctionExpression(params, jsxElement)
    ),
  ]);
}

function getAST(name, expr, publics, componentType, typescript) {
  if (componentType === "es5") {
    return toES5Component(name, expr);
  }

  if (componentType === "class") {
    return toES6Component(name, expr, publics, typescript);
  }

  if (componentType === "functional") {
    return toStatelessComponent(name, expr, publics, typescript);
  }
}

function replacePublicAttrs(expr) {
  var publics = [];

  expr.openingElement.attributes.forEach((attr) => {
    if (
      attr.name.hasOwnProperty("namespace") &&
      attr.name.namespace.name === "public"
    ) {
      var value = attr.value;
      attr.name = attr.name.name;
      attr.value = t.jSXExpressionContainer(t.identifier(attr.name.name));
      publics.push([attr.name.name, value]);
    }
  });

  return { expr, publics };
}

function enrichWithPublics(body, publics, child) {
  traverse(t.file(t.program([body])), {
    JSXOpeningElement(path) {
      if (path.node.name.name === child) {
        publics.forEach(([attr, value]) => {
          path.node.attributes.push(
            t.jSXAttribute(
              t.jSXIdentifier(attr),
              t.jSXExpressionContainer(value)
            )
          );
        });
      }
    },
  });
  return body;
}

function toReactComponents(componentType, components, typescript) {
  var components = Object.keys(components).reduce(function (cs, name) {
    components[name].forEach((component) => {
      var { expr, publics } = replacePublicAttrs(
        component.body.program.body[0].expression
      );

      var interfaceDecl = null;
      if (typescript && publics.length > 0 && componentType !== "es5") {
        interfaceDecl = createPropsInterface(name, publics);
      }

      cs[name] = cs[name] || [];
      cs[name].push({
        body: getAST(name, expr, publics, componentType, typescript),
        interfaceDecl: interfaceDecl,
        children: component.children,
        publics: component.publics,
      });
    });
    return cs;
  }, {});

  Object.values(components).forEach((parents) => {
    parents.forEach((parent) => {
      Object.keys(components).forEach((child) => {
        components[child].forEach((child) => {
          var publics = child.publics;
          if (parent.children.includes(child) && publics.length) {
            enrichWithPublics(parent.body, publics, child);
          }
        });
      });
    });
  });

  return components;
}

module.exports = toReactComponents;
