module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.3" } },
  rules: {
    // --- REGRAS DE ORGANIZAÇÃO (SOLUÇÃO PARA SEU PROBLEMA) ---
    // Proíbe mais de um componente por arquivo
    "react/no-multi-comp": ["error", { ignoreStateless: false }],
    // Limita o tamanho do arquivo para forçar a criação de novos componentes (ex: 200 linhas)
    "max-lines": [
      "warn",
      { max: 240, skipBlankLines: true, skipComments: true },
    ],
    // Limita o tamanho de cada função/componente (ex: 60 linhas)
    "max-lines-per-function": [
      "warn",
      { max: 120, skipBlankLines: true, skipComments: true },
    ],

    // --- REGRAS DE REACT ---
    "react/prop-types": "off",
    "react/self-closing-comp": "warn",
    "react/no-array-index-key": "warn",

    // --- REGRAS DE HOOKS ---
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // --- QUALIDADE E LIMPEZA ---
    "no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    "no-var": "error",
    "prefer-const": "error",
    eqeqeq: ["error", "always"],
    "no-duplicate-imports": "error",
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
  },
  ignorePatterns: ["dist", "node_modules", "public", "*.config.js"],
};
