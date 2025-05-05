// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: "expo",
  ignorePatterns: ["/dist/*"],
  settings: {
    "import/resolver": {
      typescript: {}, // This will use the tsconfig.json for path resolution
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  rules: {
    "import/no-unresolved": ["error", { ignore: ["^@/"] }],
  },
};
