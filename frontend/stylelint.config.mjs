export default {
  extends: ["stylelint-config-standard"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["apply", "custom-variant", "plugin", "source", "tailwind", "theme", "utility", "variant"],
      },
    ],
  },
}
