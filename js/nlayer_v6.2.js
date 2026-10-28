/**
 * nlayer - 레이어 팝업 / 알럿(nAlert) / 컨펌(nConfirm) / 토스트(nToast)
 *
 * [버전 이력]
 * 2025-07-07 - v6.0.0 : 레이어 기능 단순화
 * 2025-10-22 - v6.1.0 : class 구조로 변경
 * 2026-10-21 - v6.2.0 : 오류 수정 및 웹접근성 보완
 *   - aria-labelledby 에 타이틀 "문구"가 들어가던 오류 수정 → .layer-title 의 id 연결 (없으면 title 옵션으로 aria-label)
 *   - 열리지 않은 레이어에서 hide() 호출 시 오류(tabEle undefined) 수정 / 중복 show·hide 방지
 *   - layer 요소 · 타이틀이 없을 때 오류 대신 console.warn + ready 상태값으로 처리
 *   - 배경 비활성화 방식 변경 : focus 요소 개별 inert → 레이어 외 형제 요소 전체 inert (tabindex / iframe 등 누락 방지)
 *     다중 레이어는 열린 순서(stack) 기준으로 최상위 레이어 외 모두 비활성화, 기존에 inert 였던 요소는 건드리지 않음
 *   - body overflow 복원 시 기존 inline 값 유지
 *   - ESC 키로 최상위 레이어 닫기 (escClose 옵션)
 *   - 닫기 후 포커스 복귀 : show(요소) 인자 > focus_item 옵션 > 열기 전 포커스 요소 순
 *   - 포커스 가능한 요소가 없으면 레이어 자체에 포커스 (tabindex="-1")
 *   - 이미 role 이 있으면 덮어쓰지 않음 (alertdialog 가 dialog 로 바뀌던 오류 수정)
 *   - nAlert / nConfirm : 전역 변수(window.dom) 누수 · 고정 id 중복 수정, 타이틀/본문 aria 연결, ESC 지원
 *     콜백은 레이어가 닫히고 포커스가 복귀된 뒤 실행 (콜백에서 다른 팝업을 열어도 포커스 충돌 없음)
 *   - nToast : CSS animation 이 없을 때(prefers-reduced-motion 등) 토스트가 남아있던 문제 수정
 *   - destroy() / state() 메서드 추가, common.js 의존 제거
 *
 * [의존 파일] 없음
 *
 * [옵션] new nlayer({ ... })
 *  layer       : (필수) 레이어 요소 - css 선택자 or element
 *  title       : 레이어 타이틀 (aria-label 용) - 레이어 내 '.layer-title' 요소가 없을 경우 필수
 *  clsLayer    : 레이어 공통 클래스 - 기본 'layer'
 *  clsClose    : 레이어 내 닫기 버튼 클래스 - 기본 'close-layer'
 *  clsShow     : show 상태 클래스 - 기본 'show'
 *  clsHold     : 레이어 오픈 시 body 에 추가되는 클래스 - 기본 'hold'
 *  focus_item  : 닫기 후 포커스 될 요소 - css 선택자 or element (없으면 열기 전 포커스 요소로 복귀)
 *  escClose    : ESC 키로 닫기 - 기본 true
 *  activeShow  : show 완료 후 콜백
 *  activeClose : hide 완료 후 콜백
 *
 * [메서드]
 *  show(returnFocus) : 레이어 열기 - returnFocus(선택) : 닫기 후 포커스 될 요소
 *  hide()            : 레이어 닫기
 *  state()           : show 상태 반환 (true / false) - layer_state() 동일
 *  setActiveShow(fn) / setActiveClose(fn) : 콜백 설정
 *  destroy()         : 이벤트 제거
 *
 * [속성]
 *  ready : 초기화 성공 여부 / data.layer : 레이어 요소
 */

class nlayer {
	static #stack = [];				// 열린 레이어 (마지막 = 최상위)
	static #inertEls = new Set();	// 플러그인이 inert 를 부여한 요소
	static #locked = false;			// body 스크롤 잠금 여부
	static #bodyOverflow = '';		// 잠금 전 body inline overflow 값
	static #holdCls = 'hold';
	static #uid = 0;

	static FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, iframe, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

	/** 고유 id 생성 */
	static createId(prefix = 'nlayer') {
		return prefix + '-' + (++nlayer.#uid);
	}

	#activeShow = null;
	#activeClose = null;
	#returnFocus = null;

	#onClose = () => this.hide();
	#onKeydown = (e) => {
		if (e.key !== 'Escape' || !this.option.escClose) return;
		if (nlayer.#stack[nlayer.#stack.length - 1] !== this) return; // 최상위 레이어만
		e.stopPropagation();
		this.hide();
	};

	constructor(option = {}) {
		this.option = Object.assign({
			layer : undefined,
			title : undefined,
			clsLayer : 'layer',
			clsClose : 'close-layer',
			clsShow : 'show',
			clsHold : 'hold',
			focus_item : undefined,
			escClose : true
		}, option);
		this.data = {};
		this.ready = false;

		this.setActiveShow(this.option.activeShow, true);
		this.setActiveClose(this.option.activeClose, true);

		this.data.layer = nlayer.#getEl(this.option.layer);
		if (!this.data.layer) {
			console.warn('nlayer : layer 요소를 찾을 수 없습니다. (' + this.option.layer + ')');
			return;
		}
		this.data.body = document.body;
		this.data.focus_item = nlayer.#getEl(this.option.focus_item);

		this._setA11y();

		this.data.btn_close = this.data.layer.querySelectorAll('.' + this.option.clsClose);
		this.data.btn_close.forEach((btn) => btn.addEventListener('click', this.#onClose));
		this.data.layer.addEventListener('keydown', this.#onKeydown);

		this.ready = true;
	}

	/** 선택자 or element → element */
	static #getEl(target) {
		return typeof target === 'string' ? document.querySelector(target) : (target || null);
	}

	/** 열린 레이어 stack 기준으로 배경 비활성화(inert) 및 body 스크롤 잠금 갱신 */
	static #updatePage() {
		const body = document.body,
			top = nlayer.#stack[nlayer.#stack.length - 1];

		nlayer.#inertEls.forEach((el) => el.removeAttribute('inert'));
		nlayer.#inertEls.clear();

		if (!top) {
			if (nlayer.#locked) {
				body.classList.remove(nlayer.#holdCls);
				body.style.overflow = nlayer.#bodyOverflow;
				nlayer.#locked = false;
			}
			return;
		}

		// 최상위 레이어 → body 까지 올라가며 각 단계의 형제 요소 비활성화
		let el = top.data.layer;
		while (el && el !== body && el.parentElement) {
			Array.from(el.parentElement.children).forEach((sib) => {
				if (sib === el || sib.hasAttribute('inert') || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(sib.tagName)) return;
				sib.setAttribute('inert', '');
				nlayer.#inertEls.add(sib);
			});
			el = el.parentElement;
		}

		if (!nlayer.#locked) {
			nlayer.#bodyOverflow = body.style.overflow;
			nlayer.#holdCls = top.option.clsHold;
			body.style.overflow = 'hidden';
			body.classList.add(nlayer.#holdCls);
			nlayer.#locked = true;
		}
	}

	/** 접근성 속성 설정 (role / 이름) */
	_setA11y() {
		const layer = this.data.layer,
			titleEl = layer.querySelector('.layer-title');

		if (!layer.hasAttribute('role')) layer.setAttribute('role', 'dialog');

		if (this.option.title) layer.setAttribute('aria-label', this.option.title);
		else if (titleEl) {
			if (!titleEl.id) titleEl.id = layer.id ? layer.id + '-title' : nlayer.createId('nlayer-title');
			layer.setAttribute('aria-labelledby', titleEl.id);
		} else console.warn('nlayer : 레이어 타이틀이 없습니다. (.layer-title 요소 또는 title 옵션 필요)');
	}

	/** 레이어 내 첫 번째 포커스 요소로 이동 - 없으면 레이어 자체 */
	_focusFirst() {
		const layer = this.data.layer,
			target = Array.from(layer.querySelectorAll(nlayer.FOCUSABLE)).find((el) => !el.disabled && el.getClientRects().length > 0);

		if (target) target.focus();
		else {
			if (!layer.hasAttribute('tabindex')) layer.setAttribute('tabindex', '-1');
			layer.focus();
		}
	}

	/** 레이어 보이기 */
	show(returnFocus) {
		if (!this.ready || this.state()) return;

		this.#returnFocus = nlayer.#getEl(returnFocus) || this.data.focus_item || document.activeElement;

		void this.data.layer.offsetWidth; // alert / confirm 관련 (dom 생성 직후 클래스 추가 시 transition 무시 방지)
		this.data.layer.classList.add(this.option.clsShow);
		this.data.layer.setAttribute('aria-modal', 'true');

		nlayer.#stack.push(this);
		nlayer.#updatePage();
		this._focusFirst(); // focus 로 인해 화면 밖 > 안으로 이동하는 모션 무시될 가능성 있음. 필요 시 .layer.direct 클래스 사용

		if (this.#activeShow) this.#activeShow();
	}

	/** 레이어 닫기 */
	hide() {
		if (!this.ready || !this.state()) return;

		this.data.layer.classList.remove(this.option.clsShow);
		this.data.layer.removeAttribute('aria-modal');

		const idx = nlayer.#stack.indexOf(this);
		if (idx > -1) nlayer.#stack.splice(idx, 1);
		nlayer.#updatePage();

		const target = this.#returnFocus;
		this.#returnFocus = null;
		if (target && target.isConnected && typeof target.focus === 'function') target.focus();

		if (this.#activeClose) this.#activeClose();
	}

	/** 레이어 show/hide 상태 리턴 */
	state() {
		return !!this.data.layer && this.data.layer.classList.contains(this.option.clsShow);
	}
	layer_state() {
		return this.state();
	}

	/** 콜백 설정(show) - option 이후 설정용 */
	setActiveShow(func, silent) {
		if (typeof func === 'function') this.#activeShow = func;
		else if (!silent) console.warn('nlayer : setActiveShow 의 인자는 함수(function)이어야 합니다.');
	}
	/** 콜백 설정(hide) - option 이후 설정용 */
	setActiveClose(func, silent) {
		if (typeof func === 'function') this.#activeClose = func;
		else if (!silent) console.warn('nlayer : setActiveClose 의 인자는 함수(function)이어야 합니다.');
	}

	/** 이벤트 제거 */
	destroy() {
		if (!this.ready) return;
		this.hide();
		this.data.btn_close.forEach((btn) => btn.removeEventListener('click', this.#onClose));
		this.data.layer.removeEventListener('keydown', this.#onKeydown);
		this.ready = false;
	}
}

/** 알럿 기능 (객체 생성 없이 함수로 호출)
* nAlert(option); - 생성된 nlayer 객체 반환
* ment : 문구 (필수) - 줄바꿈(\n) 은 <br> 로 변환, html 사용 가능
* title : 타이틀
* btnTx : 버튼 텍스트 - 없을 경우 '확인'
* active : 닫힌 후 실행함수 (확인 버튼 / ESC)
* focus_item : 팝업 닫기 후 focus 될 요소 지정 (없으면 호출 전 포커스 요소)
*/
function nAlert(option = {}) {
	const id = nlayer.createId('nAlert'),
		ment = String(option.ment == null ? '' : option.ment).replace(/\n/g, '<br>'),
		title = option.title,
		btnTx = option.btnTx == null ? '확인' : option.btnTx;

	let html = '<div class="layer alert" id="' + id + '" role="alertdialog" aria-describedby="' + id + '-desc">';
		html += '<div class="inbox"><div class="layer-cnt">';
		if (title) html += '<div class="layer-top layer-title" id="' + id + '-title">' + title + '</div>';
		html += '<div class="layer-mid">';
		html += '<div class="layer-ment" id="' + id + '-desc">' + ment + '</div>';
		html += '<div class="btns"><button type="button" class="btn medium main close-alert">' + btnTx + '</button></div>';
		html += '</div></div></div></div>';

	document.body.insertAdjacentHTML('beforeend', html);
	const dom = document.getElementById(id);

	const alertLayer = new nlayer({
		layer : dom,
		title : title ? undefined : '알림',
		clsClose : 'close-alert',
		focus_item : option.focus_item,
		activeClose : () => {
			alertLayer.destroy();
			dom.remove();
			if (typeof option.active === 'function') option.active();
		}
	});
	alertLayer.show();
	return alertLayer;
}

/** 컨펌 기능 (객체 생성 없이 함수로 호출)
* nConfirm(option); - 생성된 nlayer 객체 반환
* ment : 문구 (필수) - 줄바꿈(\n) 은 <br> 로 변환, html 사용 가능
* title : 타이틀
* btnTxConfirm : 컨펌 버튼 텍스트 - 없을 경우 '확인'
* btnTxCancel : 취소 버튼 텍스트 - 없을 경우 '취소'
* activeConfirm : 컨펌버튼 클릭 후 실행함수
* activeCancel : 취소버튼 클릭 / ESC 후 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정 (없으면 호출 전 포커스 요소)
*/
function nConfirm(option = {}) {
	const id = nlayer.createId('nConfirm'),
		ment = String(option.ment == null ? '' : option.ment).replace(/\n/g, '<br>'),
		title = option.title,
		btnTxConfirm = option.btnTxConfirm == null ? '확인' : option.btnTxConfirm,
		btnTxCancel = option.btnTxCancel == null ? '취소' : option.btnTxCancel;

	let html = '<div class="layer confirm" id="' + id + '" role="alertdialog" aria-describedby="' + id + '-desc">';
		html += '<div class="inbox"><div class="layer-cnt">';
		if (title) html += '<div class="layer-top layer-title" id="' + id + '-title">' + title + '</div>';
		html += '<div class="layer-mid">';
		html += '<div class="layer-ment" id="' + id + '-desc">' + ment + '</div>';
		html += '<div class="btns">';
		html += '<button type="button" class="btn medium confirm-cancel">' + btnTxCancel + '</button>';
		html += '<button type="button" class="btn medium main confirm-ok">' + btnTxConfirm + '</button>';
		html += '</div></div></div></div></div>';

	document.body.insertAdjacentHTML('beforeend', html);
	const dom = document.getElementById(id);
	let confirmed = false;

	const confirmLayer = new nlayer({
		layer : dom,
		title : title ? undefined : '확인 요청',
		clsClose : 'confirm-cancel',
		focus_item : option.focus_item,
		activeClose : () => {
			confirmLayer.destroy();
			dom.remove();
			const cb = confirmed ? option.activeConfirm : option.activeCancel;
			if (typeof cb === 'function') cb();
		}
	});

	dom.querySelector('.confirm-ok').addEventListener('click', () => {
		confirmed = true;
		confirmLayer.hide();
	});

	confirmLayer.show();
	return confirmLayer;
}

/** Toast 기능
* nToast('내용', '추가 클래스')
* 표시 시간은 CSS animation 기준 - animation 이 없을 경우 3초 후 제거
*/
function nToast(ment, addCls) {
	// 기존 토스트가 있는 상태에서 다시 호출할 경우 기존 토스트 제거
	const beforeToast = document.querySelector('.toast');
	if (beforeToast) beforeToast.remove();

	document.body.insertAdjacentHTML('beforeend', '<div class="toast' + (addCls ? ' ' + addCls : '') + '" role="alert"><div class="toast-cnt">' + ment + '</div></div>');

	const toast = document.body.lastElementChild,
		toastCnt = toast.querySelector('.toast-cnt'),
		removeToast = () => toast.remove();

	toast.classList.add('show');
	if (getComputedStyle(toastCnt).animationName === 'none') setTimeout(removeToast, 3000);
	else toastCnt.addEventListener('animationend', removeToast, { once : true });
}
