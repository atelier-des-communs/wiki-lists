module.exports = {
    preset: 'ts-jest',
    testMatch : ["**/src/test/**/*.ts"],
    sourceMap: true,
    testEnvironment: 'jest-environment-jsdom-global',
};
