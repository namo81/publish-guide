# publish-guide

퍼블리싱 작업에 범용으로 활용할 수 있는 화면 / 요소 / 기능 / 버그 해결책 / 폰트 정보 / 디바이스 정보 등을 모아놓은 **자료용 로컬 사이트**입니다.
이 사이트의 요소들은 향후 다른 프로젝트에 그대로 가져다 쓰는 것을 목표로 합니다.

## 폴더 구조

| 폴더 | 내용 |
| --- | --- |
| `01_guide/` | 사이트 전체에 대한 대략적인 가이드 화면 모음 |
| `02_template/` | HTML / CSS / JS 레이아웃 요소 및 스크립트 플러그인 예제 모음 |
| `03_bugs/` | HTML / CSS / JS 관련 버그 및 해결책 모음 |
| `04_accessibility/` | 웹 접근성 관련 자료 (현재 자료 없음) |
| `05_device/` | 모바일 디바이스 해상도, pixel ratio 등 관련 정보 및 정보 확인 링크 목록 |
| `06_font/` | 웹폰트 설정 가이드 및 정보 |
| `07_svg/` | SVG 예시 파일 모음 및 미리보기 |
| `guide/` | 사이트 전체의 가이드용 목록 / 상세화면 관련 CSS·JS (`list-guide.css`, `list-guide.js` 등) |
| `css/` | 사이트 제작 시 기본으로 사용할 CSS 모음 (`layout.css` 등) |
| `js/` | 자체 제작 플러그인 및 사이트에서 사용 중인 외부 플러그인 (외부 라이브러리는 `js/vendor/`) |

- 루트의 `index_*.html`은 각 카테고리의 목록 화면이며, 공통 메뉴는 `include_menu.html`을 SSI(`<!--#include -->`)로 불러옵니다.

## 작성 원칙

### 1. 기본 웹 접근성 준수

완전한 WCAG 감사 수준까지는 아니더라도 기본적인 시맨틱 마크업은 항상 지킵니다.

- 의미에 맞는 태그 사용: `header`, `nav`, `main`, `section`, `article`, `footer` 등
- 폼 요소는 `label`과 연결
- 이미지에는 `alt` 속성
- 헤딩(`h1`~`h6`)은 레벨 순서대로 사용
- ARIA 속성 남발보다 네이티브 시맨틱 태그를 우선
- JS로 만드는 UI(레이어, 셀렉트, 캘린더 등)는 키보드 조작과 포커스 이동(열기/닫기 후 포커스 복귀 등)을 고려

### 2. 재사용성 고려

다른 프로젝트에 그대로 옮겨 쓸 수 있도록 작성합니다.

- 특정 화면에 종속된 하드코딩(고정 id, 고정 문구, 화면 전용 선택자)을 피하고 옵션/클래스로 받도록 작성
- JS 플러그인은 옵션 객체로 설정값(대상 요소, 클래스명, 콜백 등)을 받고, 파일 상단 주석에 옵션 항목과 의존 파일(예: `common.js 필수`)을 명시
- CSS 클래스 네이밍: `base_type-detail_state` 형식 (레벨 구분은 `_`, 같은 레벨의 여러 단어는 `-`)
  - 예: `btn_icon-trash_active`
- 공통요소(`btn`, `tbl`, `inp` 등)는 단순한 기본 클래스만 부여하고, 변형이 필요하면 base 클래스를 수정하지 않고 **추가 클래스**(`type2` 등)를 덧붙여 처리
- 딥 네스팅, base 클래스 오버라이드 지양
- CSS는 전처리기 없이 순수 CSS(Vanilla CSS)로 작성

#### JS 플러그인 구조

- 신규 플러그인은 **class** 구조로 작성 (기존 함수형 플러그인은 다음 버전업 시 class로 전환)
- 옵션 기본값은 `Object.assign({ 기본값 }, option)`으로 병합
- 필수 요소를 찾지 못하는 등 초기화 실패 시 `console.warn` 후 상태값(`ready` 등)으로 표시하고, 공개 메서드는 해당 상태를 확인 후 동작
- 멤버 접근 범위 규칙
  - **접두사 없음** : 공개 API - 옵션 및 파일 상단 주석 [메서드]에 명시하는 항목 (`init()`, `destroy()`, `update()` 등)
  - **`_` 접두사** : 내부용이지만 상속(`extends`)한 자식 class에서 사용·override 할 수 있는 항목 (위치 계산, DOM 생성 등 변형 가능성 있는 로직)
  - **`#private`** : 외부에서 변경 시 동작이 깨지는 항목 (상태값, 이벤트 핸들러, 내부 DOM 참조)
- 이벤트 핸들러는 `#onMove = (e) => { ... }` 형태의 화살표 함수 필드로 선언 (`this` 고정 → `bind` 없이 `removeEventListener` 가능)
- 외부로 꺼내 쓰는 값(옵션 등)은 `#`로 두지 않음 (`Object.assign` / `JSON.stringify` 대상에서 제외되므로)

```js
class nSample {
	#dragging = false;                       // 상태값 → #
	#onMove = (e) => { if (this.#dragging) this._setPos(e.clientX, e.clientY); }; // 핸들러 → #

	constructor(option = {}) {
		this.opt = Object.assign({ gap: 10 }, option); // 공개
		this.init();
	}
	init() { document.addEventListener('pointermove', this.#onMove); }        // 공개 메서드
	destroy() { document.removeEventListener('pointermove', this.#onMove); }
	_setPos(x, y) { /* 자식 class 에서 override 가능 */ }                       // 확장용 → _
}
```

### 3. 버전별 세트 관리

기능을 만들 때는 HTML / CSS / JS를 **버전별 세트**로 관리합니다.

- **JS**: 파일명에 버전 표기 → `플러그인명_vX.Y.Z.js` (예: `nlayer_v6.1.js`, `nCalendar_v3.0.0.js`)
  - 새 버전은 새 파일로 생성하고, 기존 버전 파일은 덮어쓰지 않음
  - 사용하지 않는 이전 버전은 `js/old version/`으로 이동
  - 파일 상단 주석에 버전 이력(날짜 - 버전 : 변경 내용)을 기록
- **HTML**: 해당 버전 JS를 사용하는 예제 화면도 버전을 맞춰 별도 파일로 관리 (예: `02_template/layer_v6.1.html` ↔ `js/nlayer_v6.1.js`)
- **CSS**: 파일명은 버전별로 나누지 않고 **파일 내 주석으로 버전 표기**. 버전 변경 시 CSS 파일 관리는 직접 진행하므로, 작업 시 CSS 파일을 임의로 복제/분리하지 않음

```css
/* -- version : v1.0.0 (YYYY-MM-DD) : 변경 내용 -- */
```

### 4. 언어버전 기준

html / css / js 는 최신 버전을 사용하는걸 전제로 합니다. 단, 아래 기준에 맞추어 가능한 최신 버전으로 적용합니다.

 - 브라우저는 chrome / firefox / safari 최신 버전을 기준으로 합니다.
 - 모바일 ios 는 2026년 9월 기준 사용율이 가장 높은 ios18 이상을 기준으로 합니다.
 - 모바일 android 는 2026년 9월 기준 버전별 사용율 합산이 90% 넘어가는 최소 버전을 기준으로 합니다. (android 12)
 - javascript 는 es8 이상.
   - 위 브라우저 기준에서 지원되는 ES2022 class 문법(클래스 필드, `#private` 필드·메서드)은 사용 가능
