"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firetail = void 0;
const fs_1 = __importDefault(require("fs"));
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const middleware_1 = __importDefault(require("./services/middleware"));
function firetail(options) {
    var _a;
    const apiDocPath = options.apiDocPath || ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.API_DOC_PATH);
    if (!apiDocPath) {
        throw new Error("Mandatory option 'apiDocPath' is not specified");
    }
    if ("string" !== typeof apiDocPath) {
        throw new Error(`Option 'apiDocPath' is not a string: ${JSON.parse(apiDocPath !== null && apiDocPath !== void 0 ? apiDocPath : null)}`);
    }
    if (!fs_1.default.existsSync(apiDocPath)) {
        throw new Error("Can't locate YAML file");
    }
    options.apiSpecPromise = swagger_parser_1.default.validate(apiDocPath);
    options.apiSpecPromise
        .then(s => {
        options.apiSpec = s;
    })
        .catch(() => {
        throw new Error("Can't validate API doc");
    });
    return (0, middleware_1.default)(options);
}
exports.firetail = firetail;
exports.default = firetail;
//# sourceMappingURL=index.js.map