"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var cellQueryResult_exports = {};
__export(cellQueryResult_exports, {
  default: () => transform
});
module.exports = __toCommonJS(cellQueryResult_exports);
const cellFunctionsToCheck = ["Success", "Failure", "Loading", "Empty"];
const nonSpreadVariables = [
  "previousData",
  "variables",
  "networkStatus",
  "client",
  "called",
  "refetch",
  "fetchMore",
  "startPolling",
  "stopPolling",
  "subscribeToMore",
  "updateQuery"
];
function transform(file, api) {
  const j = api.jscodeshift;
  const ast = j(file.source);
  cellFunctionsToCheck.forEach((variableName) => {
    const foundCellFunctions = ast.findVariableDeclarators(variableName);
    if (foundCellFunctions.size() === 1) {
      const foundFunction = foundCellFunctions.get();
      if (foundFunction.value.init.type === "ArrowFunctionExpression" || foundFunction.value.init.type === "FunctionExpression") {
        const firstParameter = foundFunction.value.init.params.at(0);
        if (!firstParameter) {
        } else {
          if (firstParameter.type === "ObjectPattern") {
            const previouslySpreadPropertiesInUse = firstParameter.properties.filter((property) => {
              if (property.type === "RestElement") {
                return false;
              }
              return nonSpreadVariables.includes(property.key.name);
            });
            if (previouslySpreadPropertiesInUse.length > 0) {
              firstParameter.properties.push(
                j.property(
                  "init",
                  j.identifier("queryResult"),
                  // Previously spead properties are now found within 'queryResult'
                  j.objectPattern(
                    // For every previously spead property in use add a destructuring
                    previouslySpreadPropertiesInUse.map(
                      (usedProperty) => {
                        if (usedProperty.key.type !== "Identifier" || usedProperty.value.type !== "Identifier") {
                          throw new Error(
                            "Unable to process a parameter within the cell function"
                          );
                        }
                        const prop = j.property(
                          "init",
                          j.identifier(usedProperty.key.name),
                          j.identifier(usedProperty.value.name)
                        );
                        prop.shorthand = usedProperty.shorthand;
                        return prop;
                      }
                    )
                  )
                )
              );
              firstParameter.properties = firstParameter.properties.filter(
                (property) => {
                  if (property.key.type !== "Identifier") {
                    throw new Error("Unable to process a parameter");
                  }
                  return !nonSpreadVariables.includes(property.key.name);
                }
              );
            }
          } else {
            console.warn(
              `The first parameter to '${variableName}' was not an object and we could not process this.`
            );
          }
        }
      } else {
        console.warn(
          `'${variableName}' is not a function and we could not process this.`
        );
      }
    } else {
      console.warn(`Could not find a unique '${variableName}' variable`);
    }
  });
  return ast.toSource({
    trailingComma: true,
    quote: "single",
    lineTerminator: "\n"
  });
}
