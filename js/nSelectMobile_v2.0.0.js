/**
 * nSelectMobile - 모바일용 select (select 클릭 시 하단에 option 목록 표출)
 *
 * [버전 이력]
 * 2023-03-17 - v1.0.0 : 추가 (nSelectDrag / nSelect)
 * 2024-05-16 - v1.1.0 : option hidden / disabled 속성 관련 추가
 * 2026-10-27 - v2.0.0 (AI) : nSelectDrag / nSelect 통합 → class nSelectMobile (drag 옵션으로 드래그 선택 on/off)
 *   - 목록을 열 때마다 확인/닫기/transitionend 이벤트가 중복 등록되어 2회차부터 오류(removeChild)가 나던 문제 수정
 *   - aria-expended 오타로 aria-expanded 가 갱신되지 않던 문제 수정
 *   - 선택값을 text 로 비교하여 같은 text 의 option 이 있으면 잘못 선택되던 문제 → option index 기준으로 변경
 *   - value 가 빈 option(placeholder 등) 선택 상태 / option 1개 이하일 때 열기 시 오류 수정
 *   - (drag) 중앙 판정 rootMargin 이 30px 기준 고정값이라 optHeight 변경 시 잘못 판정되던 문제 → scrollTop 기준 계산
 *   - (drag) 스크롤 끝에서 index 초과 오류 / 연속 disabled 항목 위에 멈추던 문제 수정, 터치 없이(휠 등) 스크롤 시 위치 보정 안되던 문제 수정
 *   - (click) 전역변수(sel_sc) 누수, hidden option 이 있을 때 포커스 대상 index 가 어긋나던 문제 수정
 *   - 값이 바뀌지 않았을 때 change 이벤트 미발생, change 이벤트 bubbles 적용
 *   - 버튼 type="button" 지정 (form 내부 submit 방지), select disabled / readonly 공통 적용
 *   - 배경 처리 : tabindex / aria-hidden 일괄 변경(기존 tabindex 소실) → 모달 외 형제 요소 inert 처리
 *   - 접근성 : 모달 aria-modal / 이름 연결, listbox-option 구조, label 연결, ESC 닫기, 닫기 후 포커스 복귀
 *   - form reset 시 버튼 텍스트 동기화, update() / open() / close() / destroy() 메서드 정리
 *   - common.js 의존 제거 (animateScroll → 네이티브 smooth scroll)
 *
 * [의존 파일] 없음
 *
 * [옵션] new nSelectMobile({ ... })
 *  area         : (필수) select 를 감싼 영역 - css 선택자 or element
 *  title        : 목록 상단 타이틀 (모달 이름으로도 사용 / 없으면 연결된 label 텍스트)
 *  drag         : 드래그(터치 스크롤) 선택 사용 - 기본 false
 *                 true  : 휠 형태 목록 - 스크롤 후 '확인' 버튼으로 선택 / 항목 클릭 시 즉시 선택
 *                 false : 일반 목록 - 항목 클릭 시 즉시 선택
 *  optHeight    : (drag) 항목 1개 높이(px) - 기본 40 (항목 높이에 inline 으로 적용)
 *  btnCls       : select 대신 표시되는 버튼 클래스 - 기본 'btn-sel'
 *  modalCls     : 모달에 추가할 클래스
 *  btnConfirmTx : (drag) 확인 버튼 텍스트 - 기본 '확인'
 *  btnCloseTx   : 닫기 버튼 텍스트 - 기본 '닫기'
 *  activeChange : 값 변경 후 콜백 - function(select, value, index)
 *
 * [메서드]
 *  open() / close()  : 목록 열기 / 닫기
 *  update()          : select 값 · disabled 상태를 버튼에 반영 (스크립트로 select 값 변경 후 호출)
 *  set_disabled() / set_enabled() : 사용 불가 / 가능 (select disabled 동시 변경)
 *  destroy()         : 기능 제거 (원래 select 표시)
 *
 * [속성]
 *  ready : 초기화 성공 여부 / select : 원본 select 요소 / button : 생성된 버튼
 *
 * ※ select 에 readonly 속성이 있으면 목록이 열리지 않음 (값이 1개일 경우 등)
 */

class nSelectMobile {
	static #uid = 0;

	#opened = false;
	#tempIdx = -1;			// (drag) 임시 선택 option index
	#optBtns = [];			// 생성된 option 버튼
	#inertEls = [];			// 열기 시 inert 를 부여한 요소
	#bodyOverflow = '';
	#scrollTimer = null;
	#rafId = 0;
	#touching = false;
	#form = null;

	#onOpen = () => this.open();
	#onClose = () => this.close();
	#onConfirm = () => this.#confirm(this.#tempIdx);
	#onKeydown = (e) => {
		if (e.key !== 'Escape') return;
		e.stopPropagation();
		this.close();
	};
	#onListClick = (e) => {
		const btn = e.target.closest('button[data-idx]');
		if (!btn || btn.disabled) return;
		this.#confirm(Number(btn.dataset.idx));
	};
	#onScroll = () => {
		cancelAnimationFrame(this.#rafId);
		this.#rafId = requestAnimationFrame(() => this._markCenter());
		clearTimeout(this.#scrollTimer);
		this.#scrollTimer = setTimeout(() => { if (!this.#touching) this._snap(); }, 120);
	};
	#onTouchStart = () => { this.#touching = true; };
	#onTouchEnd = () => {
		this.#touching = false;
		this.#onScroll(); // 관성 스크롤이 없을 경우에도 위치 보정
	};
	#onReset = () => setTimeout(() => this.update(), 0);

	constructor(option = {}) {
		this.opt = Object.assign({
			area : undefined,
			title : '',
			drag : false,
			optHeight : 40,
			btnCls : 'btn-sel',
			modalCls : '',
			btnConfirmTx : '확인',
			btnCloseTx : '닫기',
			activeChange : null
		}, option);
		this.opt.optHeight = Number(this.opt.optHeight) || 40;
		this.ready = false;

		this.wrap = typeof this.opt.area === 'string' ? document.querySelector(this.opt.area) : this.opt.area;
		this.select = this.wrap ? this.wrap.querySelector('select') : null;
		if (!this.select) {
			console.warn('nSelectMobile : area 또는 area 내 select 요소를 찾을 수 없습니다. (' + this.opt.area + ')');
			return;
		}

		this.id = nSelectMobile.createId();
		this._createButton();
		this._createModal();

		this.#form = this.select.form;
		if (this.#form) this.#form.addEventListener('reset', this.#onReset);

		this.ready = true;
	}

	/** 고유 id 생성 */
	static createId() {
		return 'nSelectMobile-' + (++nSelectMobile.#uid);
	}

	/** select 대신 표시될 버튼 생성 */
	_createButton() {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.id = this.id + '-btn';
		btn.className = this.opt.btnCls;
		btn.setAttribute('aria-haspopup', 'dialog');
		btn.setAttribute('aria-expanded', 'false');

		// select 에 연결된 label 이 있으면 "label + 선택값" 으로 읽히도록 연결
		const label = this.select.labels && this.select.labels[0];
		if (label) {
			if (!label.id) label.id = this.id + '-label';
			btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id);
		}

		this.select.style.display = 'none';
		this.wrap.appendChild(btn);
		btn.addEventListener('click', this.#onOpen);
		this.button = btn;
		this.update();
	}

	/** 목록 모달 생성 (drag 여부에 따라 구조 분기) */
	_createModal() {
		const drag = this.opt.drag,
			modal = document.createElement('div'),
			cnt = document.createElement('div'),
			scrollWrap = document.createElement('div'),
			list = document.createElement('ul'),
			btnClose = document.createElement('button');

		modal.className = 'n_select' + (this.opt.modalCls ? ' ' + this.opt.modalCls : '');
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-modal', 'true');
		cnt.className = drag ? 'select-cnt drag-scroll-area' : 'select-cnt';
		scrollWrap.className = 'scroll-wrap';
		list.className = 'sel-list';
		list.setAttribute('role', 'listbox');
		btnClose.type = 'button';
		btnClose.className = 'btn-sel-close';
		btnClose.textContent = this.opt.btnCloseTx;

		// 모달 이름 : title 옵션 > label 텍스트
		const label = this.select.labels && this.select.labels[0],
			titleTx = this.opt.title || (label ? label.textContent.trim() : '');
		if (this.opt.title) {
			const title = document.createElement('h2');
			title.className = 'select-title';
			title.id = this.id + '-title';
			title.tabIndex = -1;
			title.textContent = this.opt.title;
			cnt.appendChild(title);
			modal.setAttribute('aria-labelledby', title.id);
			this.titleEl = title;
		} else {
			modal.setAttribute('aria-label', titleTx || '항목 선택');
		}

		if (drag) {
			const scrollCnt = document.createElement('div'),
				btnWrap = document.createElement('div'),
				btnConfirm = document.createElement('button');

			scrollCnt.className = 'scroll-cnt'; // 실제 스크롤 되는 영역
			btnWrap.className = 'btns';
			btnConfirm.type = 'button';
			btnConfirm.className = 'btn large main';
			btnConfirm.textContent = this.opt.btnConfirmTx;

			cnt.appendChild(btnClose);
			scrollCnt.appendChild(list);
			scrollWrap.appendChild(scrollCnt);
			btnWrap.appendChild(btnConfirm);
			cnt.appendChild(scrollWrap);
			cnt.appendChild(btnWrap);

			scrollCnt.addEventListener('scroll', this.#onScroll, { passive : true });
			scrollCnt.addEventListener('touchstart', this.#onTouchStart, { passive : true });
			scrollCnt.addEventListener('touchend', this.#onTouchEnd);
			scrollCnt.addEventListener('touchcancel', this.#onTouchEnd);
			btnConfirm.addEventListener('click', this.#onConfirm);

			this.scrollEl = scrollCnt;
			this.btnConfirm = btnConfirm;
		} else {
			scrollWrap.appendChild(list);
			cnt.appendChild(scrollWrap);
			cnt.appendChild(btnClose);
			this.scrollEl = scrollWrap;
		}

		modal.appendChild(cnt);
		list.addEventListener('click', this.#onListClick);
		btnClose.addEventListener('click', this.#onClose);
		modal.addEventListener('keydown', this.#onKeydown);

		this.modal = modal;
		this.list = list;
		this.btnClose = btnClose;
	}

	/** option 목록 생성 (hidden option 제외) */
	_setList() {
		const opts = this.select.options,
			selIdx = this.select.selectedIndex,
			drag = this.opt.drag,
			h = this.opt.optHeight;

		this.list.textContent = '';
		this.#optBtns = [];

		for (let i = 0; i < opts.length; i++) {
			if (opts[i].hidden) continue;
			const li = document.createElement('li'),
				btn = document.createElement('button');
			li.setAttribute('role', 'none');
			if (drag) li.style.height = h + 'px';
			btn.type = 'button';
			btn.setAttribute('role', 'option');
			btn.setAttribute('aria-selected', String(i === selIdx));
			btn.dataset.idx = i;
			btn.dataset.val = opts[i].value;
			btn.textContent = opts[i].textContent;
			btn.disabled = opts[i].disabled;
			li.appendChild(btn);
			this.list.appendChild(li);
			this.#optBtns.push(btn);
		}

		if (drag) this._setDragArea();
	}

	/** (drag) 스크롤 영역 높이 / 여백 설정 및 선택 항목 위치로 이동 */
	_setDragArea() {
		const h = this.opt.optHeight,
			rows = this.#optBtns.length < 4 ? 3 : 5,
			pad = Math.floor(rows / 2) * h;

		this.scrollEl.parentNode.style.height = rows * h + 'px';
		this.scrollEl.style.height = '100%';
		this.scrollEl.style.paddingTop = pad + 'px';
		this.scrollEl.style.paddingBottom = pad + 'px';

		let pos = this.#optBtns.findIndex((btn) => Number(btn.dataset.idx) === this.select.selectedIndex);
		if (pos < 0 || this.#optBtns[pos].disabled) pos = this.#nearEnabled(0);
		this.#tempIdx = pos < 0 ? -1 : Number(this.#optBtns[pos].dataset.idx);
		this.scrollEl.scrollTop = Math.max(pos, 0) * h;
		this._markCenter();
	}

	/** (drag) 현재 중앙 위치 index */
	_centerPos() {
		const pos = Math.round(this.scrollEl.scrollTop / this.opt.optHeight);
		return Math.min(Math.max(pos, 0), this.#optBtns.length - 1);
	}

	/** (drag) 중앙 위치 항목에 'sel' 클래스 */
	_markCenter() {
		const pos = this._centerPos();
		this.#optBtns.forEach((btn, i) => btn.parentNode.classList.toggle('sel', i === pos));
	}

	/** (drag) 스크롤 종료 후 가장 가까운 선택 가능 항목으로 위치 보정 */
	_snap() {
		const pos = this.#nearEnabled(this._centerPos());
		if (pos < 0) return;
		const top = pos * this.opt.optHeight;
		this.#tempIdx = Number(this.#optBtns[pos].dataset.idx);
		if (Math.abs(this.scrollEl.scrollTop - top) > 1) this.scrollEl.scrollTo({ top : top, behavior : 'smooth' });
	}

	/** 기준 위치에서 가장 가까운 disabled 아닌 항목 위치 (없으면 -1) */
	#nearEnabled(pos) {
		const btns = this.#optBtns;
		for (let d = 0; d < btns.length; d++) {
			if (btns[pos + d] && !btns[pos + d].disabled) return pos + d;
			if (btns[pos - d] && !btns[pos - d].disabled) return pos - d;
		}
		return -1;
	}

	/** 열기 시 포커스 대상 */
	_focusFirst() {
		const selBtn = this.#optBtns.find((btn) => btn.getAttribute('aria-selected') === 'true' && !btn.disabled),
			target = this.titleEl || selBtn || this.#optBtns.find((btn) => !btn.disabled) || this.btnClose;
		target.focus({ preventScroll : true });
	}

	/** 모달 외 영역 비활성화 및 스크롤 잠금 */
	#lockPage() {
		const body = document.body;
		this.#inertEls = Array.from(body.children).filter((el) => el !== this.modal && !el.hasAttribute('inert') && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName));
		this.#inertEls.forEach((el) => el.setAttribute('inert', ''));
		this.#bodyOverflow = body.style.overflow;
		body.style.overflow = 'hidden';
		body.classList.add('hold');
	}
	#unlockPage() {
		const body = document.body;
		this.#inertEls.forEach((el) => el.removeAttribute('inert'));
		this.#inertEls = [];
		body.style.overflow = this.#bodyOverflow;
		body.classList.remove('hold');
	}

	/** 선택 확정 */
	#confirm(idx) {
		this.close();
		if (idx < 0 || idx === this.select.selectedIndex) return;

		this.select.selectedIndex = idx;
		this.update();
		this.select.dispatchEvent(new Event('change', { bubbles : true }));
		if (typeof this.opt.activeChange === 'function') this.opt.activeChange(this.select, this.select.value, idx);
	}

	/** 목록 열기 */
	open() {
		if (!this.ready || this.#opened || this.button.disabled || this.select.disabled || this.select.hasAttribute('readonly')) return;
		if (this.select.options.length === 0) return;

		this.#opened = true;
		document.body.appendChild(this.modal);
		this._setList();
		this.#lockPage();
		this.button.setAttribute('aria-expanded', 'true');

		void this.modal.offsetWidth; // transition 적용을 위한 reflow
		this.modal.classList.add('on');

		if (!this.opt.drag) {
			// 선택 항목이 보이도록 스크롤
			const selBtn = this.#optBtns.find((btn) => btn.getAttribute('aria-selected') === 'true');
			if (selBtn) this.scrollEl.scrollTop = selBtn.getBoundingClientRect().top - this.scrollEl.getBoundingClientRect().top;
		}
		this._focusFirst();
	}

	/** 목록 닫기 */
	close() {
		if (!this.#opened) return;
		this.#opened = false;

		clearTimeout(this.#scrollTimer);
		cancelAnimationFrame(this.#rafId);
		this.modal.classList.remove('on');
		this.#unlockPage();
		this.modal.remove();
		this.list.textContent = '';
		this.#optBtns = [];
		this.button.setAttribute('aria-expanded', 'false');
		this.button.focus();
	}

	/** select 값 / disabled 상태를 버튼에 반영 */
	update() {
		if (!this.button) return;
		const opt = this.select.options[this.select.selectedIndex];
		this.button.textContent = opt ? opt.textContent : '';
		this.button.disabled = this.select.disabled;
	}

	set_disabled() {
		if (!this.ready) return;
		this.select.disabled = true;
		this.update();
	}
	set_enabled() {
		if (!this.ready) return;
		this.select.disabled = false;
		this.update();
	}

	/** 기능 제거 */
	destroy() {
		if (!this.ready) return;
		this.close();
		this.button.removeEventListener('click', this.#onOpen);
		this.button.remove();
		this.select.style.display = '';
		if (this.#form) this.#form.removeEventListener('reset', this.#onReset);
		this.ready = false;
	}
}
