# 폰트 로딩 설정

테마(`src/styles/themes/default.js`)는 폰트 **이름**만 지정한다. 실제 서체가 나오려면
새 프로젝트에서 아래 패키지 설치 + 엔트리 포인트 import가 필요하다. 전부 npm
self-host 방식이며 CDN `<link>`는 쓰지 않는다.

## 1. 패키지 설치

```bash
pnpm add pretendard @fontsource-variable/outfit @fontsource-variable/inter
```

원본 프로젝트 기준 버전: `pretendard ^1.3.9`, `@fontsource-variable/outfit ^5.2.8`,
`@fontsource-variable/inter ^5.3.0`

아이콘까지 쓰면 (선택):

```bash
pnpm add @fontsource-variable/material-symbols-outlined
```

## 2. 앱 엔트리 포인트에서 로드

`src/main.jsx` 최상단 (이 번들의 `src/main.jsx` 참고):

```jsx
import 'pretendard/dist/web/variable/pretendardvariable.css';
import '@fontsource-variable/outfit';
```

- **Pretendard Variable** — 본문(body1/body2 등) 기본 서체
- **Outfit Variable** — 헤딩(h1~h6) 서체

## 3. Inter — SaaS 화면 전용

SaaS 셸 계열 화면은 Inter를 쓴다. `SaasShell.jsx`가 직접 import하고
`SAAS_FONT` 상수로 내보내므로, SaasShell을 가져다 쓰면 별도 설정은 필요 없고
**패키지만 설치되어 있으면 된다**:

```jsx
// SaasShell.jsx 내부
import '@fontsource-variable/inter';
export const SAAS_FONT = '"Inter Variable", Inter, "Pretendard Variable", Pretendard, sans-serif';
```

SaaS 계열 화면을 새로 만들 때는 이 `SAAS_FONT`를 참조한다 (임의로 폰트 스택을
다시 쓰지 않는다).

## 4. Storybook을 쓴다면

`.storybook/preview.jsx`에도 2번과 동일한 import 두 줄을 넣는다. 앱과 Storybook
양쪽에서 로드해야 스토리 화면과 실제 화면의 서체가 일치한다.
