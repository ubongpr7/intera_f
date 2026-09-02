import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react/jsx-props-no-spreading": "off",
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-undef": "off",
      "no-use-before-define": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-namespace": "off",
      // Existing state synchronization uses in legacy workspaces need staged refactors.
      // Keep the diagnostics visible without preventing the release lint gate from running.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]

export default config
