module.exports = {
    preset: 'ts-jest',
    testMatch : ["**/src/test/**/*.ts"],
    sourceMap: true,
    verbose : true,
    testEnvironment: 'jest-environment-jsdom-global',
};
