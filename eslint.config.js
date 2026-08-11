// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // storybook-static: `pnpm build-storybook` 산출물. dist처럼 빌드 결과물인데
  // 목록에 없어서, 로컬에서 스토리북을 한 번 빌드하면 lint가 번들 9천 건을
  // 에러로 세기 시작한다(실측) — 진짜 에러가 그 밑에 묻힌다.
  globalIgnores(['dist', 'storybook-static']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    /**
     * 스토리 파일에서는 rules-of-hooks를 끈다.
     *
     * Storybook의 `render: () =&gt; {...}`는 이름이 소문자라 규칙이 "컴포넌트가
     * 아닌 함수에서 훅을 부른다"고 보지만, Storybook은 이 함수를 실제로
     * 컴포넌트로 취급해 렌더한다 — 거짓 양성이다. 이걸 "고치려면" 스토리마다
     * 렌더 본문을 별도 컴포넌트로 빼야 하는데 얻는 것 없이 스토리만 장황해진다.
     *
     * 편의가 아니라 신호 회복을 위해 끈다: 이 거짓 양성 75건이 전체 오류의
     * 대부분이라 새로 생긴 진짜 오류(파싱 에러 등)가 그 속에 묻혔다.
     */
    files: ['**/*.stories.{js,jsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
])
