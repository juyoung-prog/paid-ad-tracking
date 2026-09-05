

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/react-vite",
  /* MUI 배럴(@mui/material, icons-material)을 시작 시점에 통째로 사전 번들한다.
     이게 없으면 스토리를 열다가 아직 최적화 안 된 하위 경로 import를 만날 때마다
     Vite가 의존성 재번들을 돌리고, 그 순간 브라우저에는 옛 버전 React 청크와
     새 버전 MUI 청크가 섞여 "Cannot read properties of null (reading
     'useContext'/'useMemo')"가 난다(React가 두 벌 로드된 것과 같은 상태 —
     2026-09-04 실사용 재발 2회로 확인). */
  async viteFinal(config) {
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [
        ...(config.optimizeDeps?.include ?? []),
        '@mui/material',
        '@mui/icons-material',
        '@mui/material/styles',
        '@mui/material/colors',
      ],
    };
    return config;
  },
};
export default config;