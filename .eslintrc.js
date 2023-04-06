/* eslint-disable 
    @typescript-eslint/no-require-imports, 
    @typescript-eslint/no-var-requires 
*/
const rules = require("../../common-eslint-rules");

// This adjusts "standard" object shorthand to be consistent
rules["object-shorthand"] = ["warn", "consistent"];

// There are some uses of commonJS modules in the code base
rules["@typescript-eslint/no-require-imports"] = ["warn"];
rules["@typescript-eslint/no-var-requires"] = ["warn"];

// We're writing ES6 & TypeScript so we need to slightly tweak the
// node recommended set
rules["node/no-unpublished-import"] = ["off"];
rules["node/no-unpublished-require"] = ["off"];
rules["node/no-unsupported-features/es-syntax"] = ["off"];
rules["node/no-unsupported-features/es-builtins"] = ["warn"];
rules["node/no-missing-import"] = [
    "warn",
    {
        tryExtensions: [".js", ".ts", ".json"],
    },
];

module.exports = {
    root: true,
    rules: rules,
    ignorePatterns: ["dist/**"],
    env: {
        es6: true,
        node: true,
    },
    extends: [
        "standard",
        "eslint:recommended",
        "plugin:node/recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    plugins: ["@typescript-eslint"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 6,
    },
    globals: {
        // Jest stuff
        jest: true,
        test: true,
        describe: true,
        expect: true,
        // Node env
        process: true,
        // Lodash
        _: true,
        // ES6
        Symbol: true,
        Promise: true,
    },
};
