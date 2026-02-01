import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'


export default [
  {
    // 配置文件本身不需要 TypeScript 项目检查
    files: ['eslint.config.js', 'vite.config.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.vue'], // 匹配 Vue 文件
    languageOptions: {
      parser: vueParser, // 使用 Vue 的解析器
      parserOptions: {
        parser: tsParser, // 在 Vue 文件中使用 TypeScript 解析器
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  {
    files: ['src/**/*.{js,ts}'], // 只匹配 src 目录下的 JavaScript 和 TypeScript 文件
    languageOptions: {
      parser: tsParser, // Use TypeScript parser
      parserOptions: {
        ecmaVersion: 2020, // Use modern ECMAScript features
        sourceType: 'module', // Enable ES modules
        project: ['./tsconfig.app.json'], // 只使用 app 配置
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin, // Add TypeScript plugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules, // Use recommended TypeScript rules
    },
  },
]