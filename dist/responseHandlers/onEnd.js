"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firetailLogger_1 = __importDefault(require("../firetailLogger"));
function onEnd(responseMethod, res) {
    if (!res.firetailContext.logged) {
        res.firetailContext.logged = true;
        res.firetailContext.finishedAt = Date.now();
        (0, firetailLogger_1.default)(res);
    }
    return {};
}
exports.default = onEnd;
//# sourceMappingURL=onEnd.js.map