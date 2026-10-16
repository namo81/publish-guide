/**
 * nDragnDrop - 화면 내 요소 Drag & Drop (리스트 순서변경 / 특정 영역 드롭)
 *
 * [버전 이력]
 * 2020-11-10 - v1.0.0 : 1차 완성 (Chrome / IE10 이상)
 * 2020-12-11 - v1.0.0 : update 관련 수정 (리스트에 새 요소 추가 시 배열 초기화 및 obj 변수 재설정)
 * 2026-10-08 - v1.0.1 : 오류 수정 및 기능 보완
 *   - 좌표 계산을 getBoundingClientRect 기준으로 변경 (드래그 중 실시간 계산)
 *     : 순서 변경 후 위치 배열이 갱신되지 않던 오류, 문서/wrap 스크롤 시 위치 오차, gapObj 수동 보정 문제 해결
 *   - 높이가 다른 아이템 간 순서 변경 시 깜빡임(반복 교체) 방지 - 아이템 중앙을 넘었을 때만 이동
 *   - removeDummy 내 변수 선언 오류(전역변수 누수) 및 dummy 미삭제(transitionend 미발생) 오류 수정
 *   - drag 종료 후 obj 목록에 dummy 가 포함되던 오류 / removeDrag 시 이벤트가 정상 해제되지 않던 오류 수정
 *   - obj 는 objWrap 의 직계 자식만 대상으로 처리 (하위에 중첩된 동일 태그 오인식 방지)
 *   - Pointer Events 적용 (마우스 + 터치 지원), 마우스 좌클릭만 드래그 실행
 *   - dummy 복제 시 id / name 속성 제거 (id 중복 및 radio 그룹 충돌 방지)
 *   - 드래그 중 ESC 키로 취소, 드래그 후 click 이벤트 실행 방지
 *   - sequence : 키보드(방향키) 순서 변경 지원
 *   - 콜백(sequence) 에 변경 후 / 변경 전 index 전달, 상태 클래스명 옵션 추가
 *   - common.js 의존 제거
 *
 * [의존 파일] 없음
 * [지원 브라우저] Pointer Events 지원 브라우저 (Chrome, Edge, Firefox, Safari 13 이상) / IE 미지원
 *
 * [옵션]
 *  wrap       : (필수) 기능 설정 wrap 영역 - css 선택자 or element
 *  objWrap    : (필수) wrap 내 드래그 아이템을 직접 포함하는 요소 - css 선택자 or element
 *  obj        : (필수) 드래그 아이템 - css 선택자 (objWrap 의 직계 자식만 대상)
 *  func       : (필수) 'sequence' (리스트 순서변경) / 'dnd' (특정 영역 드롭)
 *  area       : (dnd 필수) 드롭 영역 - css 선택자 (wrap 내부에서 검색)
 *  selector   : 아이템 내 드래그 핸들 - css 선택자 / 없을 경우 아이템 자체
 *               ※ 핸들에는 touch-action:none 이 적용되므로, 모바일에서는 핸들(selector) 사용 권장 (아이템 전체 적용 시 해당 영역 터치 스크롤 불가)
 *  gap        : 드래그 시작으로 판단할 이동 거리(px) - 기본 10 (단순 클릭 시 실행 방지용)
 *  keyboard   : sequence 일 때 키보드 순서변경 사용 여부 - 기본 true
 *               (핸들에 포커스 후 ↑/← : 앞으로, ↓/→ : 뒤로 / 포커스 불가 요소일 경우 tabindex="0" 자동 부여)
 *  classDummy : 마우스를 따라다니는 복제 요소 클래스 - 기본 'dummy'
 *  classGhost : 드래그 중인 원본 아이템 클래스 - 기본 'ghost'
 *  classOver  : (dnd) 드롭 가능 영역 위에 있을 때 영역에 붙는 클래스 - 기본 'drop-over'
 *  active     : 완료 후 콜백
 *               sequence : function(item, newIdx, oldIdx)
 *               dnd      : function(item, area) - 영역 밖에서 놓을 경우 area = null
 *  gapObj     : v1.0.1 부터 자동 계산되므로 불필요 (지정해도 무시)
 *
 * [메서드]
 *  removeDrag() : 기능 제거
 *  dragUpdate() : 아이템 추가/삭제 후 재설정
 *  reStart()    : removeDrag 후 재실행
 */

function nDragnDrop(option){
	const nDrag = this;

	// 외부 설정 변수
	const wrap 		= typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
		objWrap 	= !wrap ? null : typeof option.objWrap === 'string' ? wrap.querySelector(option.objWrap) : option.objWrap,
		selector 	= option.selector,
		func 		= option.func,
		active 		= option.active,
		gap 		= typeof option.gap === 'number' ? option.gap : 10,
		useKey 		= func === 'sequence' && option.keyboard !== false,
		clsDummy 	= option.classDummy || 'dummy',
		clsGhost 	= option.classGhost || 'ghost',
		clsOver 	= option.classOver || 'drop-over';

	if(!wrap || !objWrap) {
		console.warn('nDragnDrop : wrap / objWrap 요소를 찾을 수 없습니다.');
		return;
	}
	if(func !== 'sequence' && func !== 'dnd') {
		console.warn('nDragnDrop : func 옵션은 \'sequence\' 또는 \'dnd\' 로 설정해야 합니다.');
		return;
	}

	// 공통 변수
	let handles = [], 		// 이벤트가 연결된 핸들 목록 (해제용)
		dragDown = false, 	// pointer down 여부
		dragMove = false, 	// 실제 드래그 시작 여부 (gap 이상 이동)
		pointerId = null, 	// 드래그 중인 pointer id (멀티터치 대응)
		dummy = null, 		// 드래그 될 요소 복사본 (실제 마우스 따라다니는 요소)
		targetItem = null, 	// 드래그 될 요소
		dropArea = null, 	// (dnd) 현재 위치한 드롭 영역
		oldIdx, 			// (sequence) 드래그 전 index
		originNext, 		// 드래그 전 다음 노드 (취소 시 원위치용)
		startX, startY, 	// pointer 최초 위치 (viewport 기준)
		lastX, lastY, 		// pointer 최종 위치 (viewport 기준)
		touchX, touchY, 	// 최초 클릭 시 아이템 내 pointer 위치
		cbLeft = 0, cbTop = 0; // dummy(fixed) 기준점 보정값 - 상위 요소에 transform 등이 있어 viewport 기준이 아닐 경우

	// objWrap 직계 자식 중 obj 에 해당하는 요소 (dummy 제외)
	const getItems = function(){
		return Array.prototype.filter.call(objWrap.children, function(el){
			return el.matches(option.obj) && !el.classList.contains(clsDummy);
		});
	},
	// 핸들이 속한 아이템 (objWrap 의 직계 자식)
	getItem = function(el){
		while(el && el.parentNode !== objWrap) el = el.parentNode;
		return el;
	},
	getAreas = function(){
		return option.area ? Array.prototype.slice.call(wrap.querySelectorAll(option.area)) : [];
	},
	inRect = function(x, y, r){
		return x > r.left && x < r.right && y > r.top && y < r.bottom;
	},
	// 폼 요소에서 시작한 경우 드래그 제외 (입력/선택 가능하도록)
	isFormEl = function(el){
		return el.closest && el.closest('input, textarea, select, [contenteditable="true"]');
	};

	// dummy 생성
	const setDummy = function(){
		const rect = targetItem.getBoundingClientRect();
		dummy = targetItem.cloneNode(true);
		dummy.removeAttribute('id');
		Array.prototype.forEach.call(dummy.querySelectorAll('[id], [name]'), function(el){
			el.removeAttribute('id');
			el.removeAttribute('name');
		});
		dummy.classList.add(clsDummy);
		dummy.setAttribute('aria-hidden', 'true');

		const s = dummy.style;
		s.position 		= 'fixed';
		s.left 			= '0';
		s.top 			= '0';
		s.margin 		= '0';
		s.boxSizing 	= 'border-box';
		s.width 		= rect.width + 'px';
		s.height 		= rect.height + 'px';
		s.transition 	= 'none';
		s.pointerEvents = 'none';
		objWrap.appendChild(dummy);

		if(window.getComputedStyle(dummy).zIndex === 'auto') s.zIndex = '1000';
		// left/top 0 일 때의 실제 위치 = fixed 기준점
		const dRect = dummy.getBoundingClientRect();
		cbLeft = dRect.left;
		cbTop = dRect.top;
	},
	moveDummy = function(){
		dummy.style.left = (lastX - touchX - cbLeft) + 'px';
		dummy.style.top = (lastY - touchY - cbTop) + 'px';
	},
	// dummy 삭제 (animate : 원본 위치로 이동 모션 후 삭제)
	removeDummy = function(animate){
		const el = dummy;
		dummy = null;
		if(!el) return;

		const remove = function(){
			if(el.parentNode) el.parentNode.removeChild(el);
		};
		if(!animate) {
			remove();
			return;
		}
		const r = targetItem.getBoundingClientRect();
		el.style.transition = 'left .2s, top .2s';
		el.style.left = (r.left - cbLeft) + 'px';
		el.style.top = (r.top - cbTop) + 'px';
		el.addEventListener('transitionend', remove, { once: true });
		setTimeout(remove, 300); // 위치 변화가 없어 transitionend 가 발생하지 않는 경우 대비
	};

	// func : 'sequence' - dummy 중심이 다른 아이템의 중앙을 넘으면 순서 변경
	const checkSeq = function(){
		const dr = dummy.getBoundingClientRect(),
			cx = dr.left + dr.width / 2,
			cy = dr.top + dr.height / 2,
			tr = targetItem.getBoundingClientRect(),
			items = getItems(),
			tIdx = items.indexOf(targetItem);

		for(let i = 0; i < items.length; i++){
			if(items[i] === targetItem) continue;
			const r = items[i].getBoundingClientRect();
			if(!inRect(cx, cy, r)) continue;

			// 같은 행이면 가로 기준, 아니면 세로 기준
			const sameRow = Math.abs(r.top - tr.top) < Math.min(r.height, tr.height) / 2,
				pos = sameRow ? cx : cy,
				mid = sameRow ? r.left + r.width / 2 : r.top + r.height / 2;

			if(i < tIdx && pos < mid) objWrap.insertBefore(targetItem, items[i]);
			else if(i > tIdx && pos > mid) objWrap.insertBefore(targetItem, items[i].nextSibling);
			break;
		}
	},
	// func : 'dnd' - dummy 중심이 위치한 드롭 영역 확인 (영역이 겹칠 경우 마지막 영역)
	checkDrop = function(){
		const dr = dummy.getBoundingClientRect(),
			cx = dr.left + dr.width / 2,
			cy = dr.top + dr.height / 2,
			areas = getAreas();
		let over = null;

		for(let d = 0; d < areas.length; d++){
			if(inRect(cx, cy, areas[d].getBoundingClientRect())) over = areas[d];
		}
		if(over === dropArea) return;
		if(dropArea) dropArea.classList.remove(clsOver);
		dropArea = over;
		if(dropArea) dropArea.classList.add(clsOver);
	},
	check = function(){
		if(func === 'sequence') checkSeq();
		else checkDrop();
	};

	// 드래그 종료 공통 처리
	const resetDrag = function(){
		dragDown = false;
		dragMove = false;
		pointerId = null;
		document.removeEventListener('keydown', escCancel);
		targetItem.classList.remove(clsGhost);
	},
	// 드래그 직후 발생하는 click 무시 (링크 이동 등 방지)
	stopClick = function(e){
		e.preventDefault();
		e.stopPropagation();
	},
	suppressClick = function(){
		document.addEventListener('click', stopClick, true);
		setTimeout(function(){
			document.removeEventListener('click', stopClick, true);
		}, 0);
	},
	// 드래그 취소 (원위치)
	cancelDrag = function(){
		if(!dragDown) return;
		if(!dragMove) {
			dragDown = false;
			pointerId = null;
			return;
		}
		resetDrag();
		if(func === 'sequence') objWrap.insertBefore(targetItem, originNext);
		removeDummy(false);
		if(dropArea) {
			dropArea.classList.remove(clsOver);
			dropArea = null;
		}
	},
	escCancel = function(e){
		if(e.key === 'Escape' || e.key === 'Esc') {
			e.preventDefault();
			cancelDrag();
		}
	};

	// 이벤트 핸들러
	const dragStart = function(e){
		if(dragDown) return;
		if(e.pointerType === 'mouse' && e.button !== 0) return; // 마우스는 좌클릭만
		if(isFormEl(e.target)) return;

		targetItem = getItem(this);
		if(!targetItem) return;

		const r = targetItem.getBoundingClientRect();
		touchX = e.clientX - r.left;
		touchY = e.clientY - r.top;
		startX = lastX = e.clientX;
		startY = lastY = e.clientY;
		pointerId = e.pointerId;
		dropArea = null;
		dragDown = true;
	},
	drag = function(e){
		if(!dragDown || e.pointerId !== pointerId) return;
		lastX = e.clientX;
		lastY = e.clientY;

		if(!dragMove) {
			if(Math.abs(lastX - startX) <= gap && Math.abs(lastY - startY) <= gap) return;
			dragMove = true;
			oldIdx = getItems().indexOf(targetItem);
			originNext = targetItem.nextSibling;
			setDummy();
			targetItem.classList.add(clsGhost);
			document.addEventListener('keydown', escCancel);
		}
		e.preventDefault();
		moveDummy();
		check();
	},
	dragEnd = function(e){
		if(!dragDown || e.pointerId !== pointerId) return;
		if(!dragMove) {
			dragDown = false;
			pointerId = null;
			return;
		}
		resetDrag();
		suppressClick();

		if(func === 'sequence') {
			removeDummy(true);
			if(typeof active === 'function') active(targetItem, getItems().indexOf(targetItem), oldIdx);
		} else {
			removeDummy(false);
			if(dropArea) dropArea.classList.remove(clsOver);
			if(typeof active === 'function') active(targetItem, dropArea);
		}
	},
	pointerCancel = function(e){
		if(e.pointerId === pointerId) cancelDrag();
	},
	// 드래그 중 스크롤 될 경우 위치 재확인
	scrollCheck = function(){
		if(dragMove) check();
	},
	// 텍스트 선택 및 브라우저 기본 드래그(이미지/링크) 방지
	preventMouse = function(e){
		if(e.button === 0 && !isFormEl(e.target)) e.preventDefault();
	},
	preventNative = function(e){
		e.preventDefault();
	},
	// func : 'sequence' 키보드 순서 변경
	keyMove = function(e){
		if(e.target !== this || dragDown) return;
		const item = getItem(this),
			items = getItems(),
			idx = items.indexOf(item);
		let to;

		if(e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'Up' || e.key === 'Left') to = idx - 1;
		else if(e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'Down' || e.key === 'Right') to = idx + 1;
		else return;

		e.preventDefault();
		if(to < 0 || to >= items.length) return;

		if(to < idx) objWrap.insertBefore(item, items[to]);
		else objWrap.insertBefore(item, items[to].nextSibling);
		this.focus(); // DOM 이동 시 포커스가 해제되므로 복귀
		if(typeof active === 'function') active(item, to, idx);
	};

	// 초기 실행 (드래그 요소 기능 설정)
	const dragInit = function(){
		if(handles.length) return; // 중복 실행 방지

		getItems().forEach(function(item){
			const el = selector ? item.querySelector(selector) : item;
			if(!el) return;

			const h = { el: el, touchAction: el.style.touchAction, addTab: false };
			el.addEventListener('pointerdown', dragStart);
			el.addEventListener('mousedown', preventMouse);
			el.addEventListener('dragstart', preventNative);
			el.style.touchAction = 'none';
			if(useKey) {
				if(el.tabIndex < 0 && !el.hasAttribute('tabindex')) {
					el.setAttribute('tabindex', '0');
					h.addTab = true;
				}
				el.addEventListener('keydown', keyMove);
			}
			handles.push(h);
		});
		document.addEventListener('pointermove', drag);
		document.addEventListener('pointerup', dragEnd);
		document.addEventListener('pointercancel', pointerCancel);
		document.addEventListener('scroll', scrollCheck, true);
	};
	dragInit();

	// 기능 제거
	nDrag.removeDrag = function(){
		cancelDrag();
		handles.forEach(function(h){
			h.el.removeEventListener('pointerdown', dragStart);
			h.el.removeEventListener('mousedown', preventMouse);
			h.el.removeEventListener('dragstart', preventNative);
			h.el.removeEventListener('keydown', keyMove);
			h.el.style.touchAction = h.touchAction;
			if(h.addTab) h.el.removeAttribute('tabindex');
		});
		handles = [];
		document.removeEventListener('pointermove', drag);
		document.removeEventListener('pointerup', dragEnd);
		document.removeEventListener('pointercancel', pointerCancel);
		document.removeEventListener('scroll', scrollCheck, true);
	};

	// 아이템 추가/삭제 후 재설정
	nDrag.dragUpdate = function(){
		nDrag.removeDrag();
		dragInit();
	};

	nDrag.reStart = function(){
		dragInit();
	};
}
