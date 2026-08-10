import { globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'

export default tseslint.config(
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx}'],
    extends: [tseslint.configs.recommended],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
