module.exports = {
    preset: 'ts-jest',
    testMatch : ["**/src/test/**/*.ts"],
    verbose : true,
    testEnvironment: 'jest-environment-jsdom-global',
};
