# Interactive Component Principles

> 기존 디자인 시스템 위에서 인터랙티브 컴포넌트 설계 시 따라야 할 원칙
> 프로젝트에 설치된 디자인 시스템(MUI, Chakra, Ant Design, shadcn/ui 등)을 존중하며 확장
> Claude rules / skill / agent 등록용

---

## 핵심 목표

- 불필요한 리렌더링 방지
- 훅 남용 금지
- 클린업 누락 방지
- GPU 가속 활용
- 재사용 가능한 구조

---

## 1. 상태 관리 원칙

### 애니메이션 값은 React 상태로 관리하지 않는다

```
❌ useState로 애니메이션 값 관리
✅ useRef, useMotionValue, GSAP 내부 상태 사용
```

**이유**: `useState`는 값 변경마다 리렌더링 발생. 애니메이션은 초당 60회 업데이트되므로 성능 치명적.

### 애니메이션 트리거만 React 상태로

```
✅ isOpen, isActive, currentTab 등 "언제 시작할지"만 상태
❌ x좌표, opacity, scale 등 "현재 값"은 상태 금지
```

---

## 2. 라이브러리 선택 원칙

### 권장 스택: Framer Motion + GSAP

이 두 개 조합으로 대부분의 인터랙티브 패턴 커버 가능.

### 핵심 기준: "무엇이 트리거인가?"

| 트리거 | 담당 | 이유 |
|--------|------|------|
| **React 상태** (isOpen, activeTab) | Framer Motion | 상태 → UI 전환 선언적 처리 |
| **마운트/언마운트** | Framer Motion | AnimatePresence로 exit 처리 |
| **레이아웃 변화** | Framer Motion | layout prop으로 FLIP 자동 |
| **스크롤 위치** | GSAP ScrollTrigger | 핀/스크럽/진행률 연동 |
| **복잡한 시퀀스** | GSAP Timeline | 정밀한 타이밍, 상대적 위치 |
| **텍스트 분해** | GSAP SplitText | 글자/단어/줄 단위 분해 |
| **단순 hover/focus** | CSS | JS 불필요 |
| **무한 반복** | CSS keyframes | JS 스레드 점유 안 함 |

### 겹치는 영역 선택 기준

기본 fade, slide, scale은 둘 다 가능. 이럴 때:

```
프로젝트에 이미 Framer Motion 있음 → Framer Motion으로 통일
해당 컴포넌트에 스크롤 로직도 섞여 있음 → GSAP로 통일
둘 다 없는 새 프로젝트 → Framer Motion (React 친화적)
```

### 같은 컴포넌트 ✅ vs 같은 DOM 요소 ❌

```tsx
// ✅ OK - 같은 컴포넌트, 다른 요소
function Card() {
  useGSAP(() => {
    gsap.from(containerRef.current, {
      scrollTrigger: { trigger: containerRef.current },
      y: 100
    });
  });

  return (
    <div ref={containerRef}>
      {/* GSAP가 컨테이너 담당 */}
      <motion.button animate={{ scale: isHovered ? 1.05 : 1 }} />
      {/* Framer가 버튼 담당 */}
    </div>
  );
}

// ❌ 충돌 - 같은 요소에 둘 다
<motion.div 
  ref={gsapRef}           // GSAP가 x: 100 적용
  animate={{ x: 50 }}     // Framer도 x 적용 → 충돌
/>
```

**원칙:** 1 DOM 요소 = 1 애니메이션 도구

### 의존성 최소화

```
✅ CSS로 가능하면 CSS 우선
✅ 라이브러리는 CSS 한계 넘을 때만
```

### 예외 (별도 라이브러리 필요)

| 케이스 | 필요 도구 |
|--------|----------|
| Lottie 애니메이션 | lottie-react |
| WebGL 3D | Three.js / R3F |
| 복잡한 파티클 | tsParticles |
| SVG 복잡 모핑 | flubber 또는 GSAP MorphSVGPlugin |

---

## 3. 성능 원칙

### GPU 가속 속성만 애니메이션

```
✅ transform (x, y, scale, rotate)
✅ opacity
✅ filter (blur, brightness)

❌ width, height
❌ top, left, right, bottom
❌ margin, padding
❌ border-radius (정적 값은 OK)
```

**이유**: transform/opacity는 Composite 단계만 발생. 나머지는 Layout→Paint→Composite 전체 발생.

### will-change는 신중하게

```
✅ 애니메이션 직전에 추가, 완료 후 제거
❌ 모든 요소에 will-change: transform 남발
```

---

## 4. 클린업 원칙

### 모든 애니메이션은 클린업 필수

```
GSAP: useGSAP 훅 사용 (자동 클린업)
Framer Motion: AnimatePresence로 exit 처리
이벤트 리스너: return에서 제거
```

### GSAP 표준 패턴

```tsx
// ✅ useGSAP 사용 (권장)
import { useGSAP } from '@gsap/react';

useGSAP(() => {
  gsap.to('.box', { x: 100 });
}, { scope: containerRef });

// 이벤트 핸들러는 contextSafe 필수
const { contextSafe } = useGSAP({ scope: containerRef });
const handleClick = contextSafe(() => {
  gsap.to('.box', { rotation: 180 });
});
```

### ScrollTrigger 특별 주의

```
✅ 컴포넌트 언마운트 시 kill() 호출
✅ 라우트 전환 시 ScrollTrigger.getAll().forEach(st => st.kill())
```

---

## 5. 구조 원칙

### 애니메이션 정의는 컴포넌트 외부에

```tsx
// ✅ 컴포넌트 외부에 정의
const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function Component() {
  return <motion.div variants={fadeVariants} />;
}

// ❌ 컴포넌트 내부에 인라인 정의
function Component() {
  return <motion.div animate={{ opacity: 1, y: 0 }} />;  // 매 렌더마다 새 객체
}
```

### 복잡한 애니메이션은 커스텀 훅으로 분리

```
✅ useScrollReveal(), useFadeIn() 등 훅으로 캡슐화
✅ 로직과 UI 분리
✅ 테스트 용이
```

### transition 설정 중앙화

```tsx
// ✅ 프로젝트 전역 transition 프리셋
export const transitions = {
  default: { duration: 0.3, ease: 'easeOut' },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  slow: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};
```

---

## 6. 디자인 시스템 통합 원칙

### 기존 컴포넌트 래핑 시 motion() 사용

```tsx
import { motion } from 'framer-motion';
import { Button } from '@mui/material';  // 또는 Chakra, Ant Design 등

const MotionButton = motion(Button);
```

### 디자인 시스템의 토큰 존중

```
✅ 애니메이션 duration은 테마/토큰에서 참조
✅ easing은 테마/토큰에서 참조
❌ 하드코딩된 duration, easing
```

프로젝트에 정의된 transition 토큰이 있다면 우선 사용.

### 스타일 prop과 animate 분리

```tsx
// ✅ 정적 스타일은 디자인 시스템 방식, 동적은 animate
<MotionButton
  sx={{ backgroundColor: 'primary.main' }}  // MUI
  // className="bg-primary"                  // Tailwind/shadcn
  // colorScheme="blue"                      // Chakra
  animate={{ scale: isHovered ? 1.05 : 1 }}  // 동적
/>
```

디자인 시스템의 스타일링 방식(sx, className, props)을 그대로 유지하고, 애니메이션만 별도로 처리.

---

## 7. 접근성 원칙

### prefers-reduced-motion 존중

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 애니메이션 비활성화 또는 단순화
const variants = prefersReducedMotion 
  ? { hidden: {}, visible: {} }  // 모션 없음
  : { hidden: { opacity: 0 }, visible: { opacity: 1 } };
```

### 깜빡임, 빠른 반복 주의

```
❌ 초당 3회 이상 깜빡이는 애니메이션 (광과민성 발작 위험)
✅ 부드러운 전환, 적절한 duration
```

---

## 8. 디버깅 원칙

### 개발 중 마커 활용

```tsx
// GSAP ScrollTrigger 디버깅
scrollTrigger: {
  markers: process.env.NODE_ENV === 'development'
}
```

### React DevTools Profiler로 리렌더링 추적

```
✅ 애니메이션 중 불필요한 리렌더링 확인
✅ 문제 발견 시 useMotionValue, React.memo 적용
```

---

## 체크리스트

컴포넌트 작성 전:
- [ ] 이 애니메이션이 정말 필요한가?
- [ ] CSS만으로 가능한가?
- [ ] 어떤 라이브러리가 적합한가?

컴포넌트 작성 중:
- [ ] 애니메이션 값에 useState 쓰고 있지 않은가?
- [ ] transform/opacity만 애니메이션하고 있는가?
- [ ] variants/transition이 컴포넌트 외부에 정의되어 있는가?
- [ ] 1 DOM 요소에 1 애니메이션 도구만 사용하고 있는가?

컴포넌트 작성 후:
- [ ] 클린업이 제대로 되는가? (Strict Mode에서 테스트)
- [ ] prefers-reduced-motion 대응했는가?
- [ ] 불필요한 리렌더링 없는가? (Profiler 확인)

---

## 금지 패턴

```tsx
// ❌ 1. 애니메이션 값을 useState로
const [x, setX] = useState(0);
useEffect(() => {
  const interval = setInterval(() => setX(prev => prev + 1), 16);
  return () => clearInterval(interval);
}, []);

// ❌ 2. useEffect 안에서 클린업 없는 GSAP
useEffect(() => {
  gsap.to('.box', { x: 100 });  // 클린업 없음!
}, []);

// ❌ 3. width/height 애니메이션
animate={{ width: isOpen ? 300 : 0 }}

// ❌ 4. 매 렌더마다 새 객체 생성
<motion.div animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />

// ❌ 5. 같은 DOM 요소에 Framer + GSAP 혼용
<motion.div ref={gsapRef} animate={{ x }} />  // 둘 다 transform 조작 → 충돌!
// ✅ 같은 컴포넌트 내에서 다른 요소에 각각 적용은 OK
```

---

*v1.1 - Vibe Design Lab*
