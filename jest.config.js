/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    fakeTimers: { enableGlobally: true },
    collectCoverageFrom: ["**/*.ts", "!**/node_modules/**", "!**/dist/**"],
};
