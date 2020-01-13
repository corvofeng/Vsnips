module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "semi": "off",
        "no-unused-vars": "off",
        "no-console": "error",
        "no-eval": "error",
        "no-trailing-spaces": "error",
        "@typescript-eslint/semi": "error",
        "@typescript-eslint/no-unused-vars": "warn"
    }
};