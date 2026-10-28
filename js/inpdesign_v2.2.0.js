/*-- input design --*/
/*-- 서남호 --*/
/*-- 2018-01-11 - checkbox/radio/select/file 통합본 수정 --*/
/*-- 2018-01-17 - disabled 추가 --*/
/*-- 2019-09-05 - v1.1 변수 추가 및 사용방법 변경 // select 부모영역 설정 추가 (상황에 따라 리스트 위로 뜨도록) --*/
/*-- 2019-12-11 - v1.2 select - option 속성 관련 추가 --*/
/*-- 2020-01-15 - v2.0.0 - radio, checkbox 기능 제거(css로만 적용) 및 jquery 제거버전 진행  */
/*-- 2023-10-06 - v2.1.0 - select - option 변경관련 - 클릭 시 매번 새로 생성하도록 -> optionUpdate 기능변경  */
/*-- 2024-06-11 - v2.1.0 - 2중 Range input 추가  */
/*-- 2026-10-27 - v2.1.0 - 오류 수정 및 개선 (구조 유지)
	- n_select : option class 지정 시 클릭 선택 안되던 오류, value 중복 option 오선택, selectedIndex -1 시 오류 수정
	             listbox 구조(ul) 정리, label 연결, 닫힌 상태 방향키 열기, Enter 중복 토글 방지, 외부클릭 리스너 누적 수정, 값 변경 시에만 change 발생
	- n_dropdown : 취소 버튼(.btn-cancel) / ESC / 포커스 이탈 시 취소, aria-expanded·aria-controls, 외부클릭 리스너 누적 수정, label 없는 항목 오류 수정
	- nFile / nFileSet : new 없이 호출 시 전역변수 생성 오류 수정, 파일명 표시(fakepath 제거 / 다중 선택), placeholder 따옴표 깨짐 수정
	- nTextSet : 미정의 변수(keyupEvt) 오류 수정, 삭제 버튼 클릭 전에 사라지던 문제 수정, textarea 지원
	- nTextCount : 요소 누락 오류 방지, 한글 조합 중 잘림 방지, aria-describedby 연결, form reset 대응
	- checkAll : name 특수문자 오류 수정, indeterminate(일부 선택) 표시, change 이벤트 기반으로 변경
	- checkAllDepth : depth 제한 없는 구조로 변경 (dep1~3 고정 → 무제한), indeterminate 표시
	- radioSelectTg : 선택 없을 때 초기 영역 노출 오류 수정, 방향키 선택 대응(change), name 특수문자 대응
	- chk_tgl_ctrl : disabled → inert 방식으로 변경
	- inpValueCheck : 영문 정규식 특수문자 허용 / 한글 정규식 '|' 허용 오류 수정, 조합 개수 제한 해제, 한글 조합 중 처리 제외, 커서 위치 유지
	                  직접 정규식 g 플래그 보장, 선택자 일치 input 전체 적용
*/

// !! common.js 필수


/* 적용 예시 - file 및 input 동일
특정 1개 적용 				 : var 변수명 = new n_select('선택자');
select disabled 상태 설정	: 변수명.selectDisable(boolean);

화면내 전체 적용			 : n_selects('클래스명');	
** 화면 내 select 가 1개일 경우 nSelArr.selectDisable(boolean);
   화면 내 select 가 다수일 경우 nSelArr[0].selectDisable(boolean); (disable 설정 필요한 select index 선택)
   만약 전체 업데이트 일 경우 반목문 적용

** select option 변경 : selBtn 클릭 시 매번 option 을 지우고 새로 생성함으로 별도 update 불필요
** select 의 selectIndex 변경 : selectIndex 변경 후 해당 select에 'change' 이벤트 dispatch 해주변 option 재 설정됨
*/

/** select 설정 ------------------------------------------------------------------------ */
/** 
 * 2026-03-20 - 웹접근성 관련 속성 추가 (aria-haspopup, aria-controls, aria-expanded, aria-selected, aria-activedescendant) 및 키보드 기능 추가 (Tab, Enter, ArrowUp, ArrowDown)
 */
let nSelArr;

/** 화면내 동일 선택자 전체 적용 시 */
function n_selects(selector) {
	let nSelectEle = document.querySelectorAll(selector);
	
	if(nSelectEle.length > 1) {
		nSelArr = new Array();
		Array.prototype.forEach.call(nSelectEle, function(el, index, array){
			nSelArr[index] = new n_select(el);
		});
	} 
	else if (nSelectEle.length == 1) nSelArr = new n_select(nSelectEle[0]);
	else null;
}

/** 실제 select 관련 기능 함수 */
function n_select(Ele){
	const nSelect = this;
	nSelect.wrap		= typeof Ele === 'string' ? document.querySelector(Ele) : Ele;

	const sel 		= nSelect.wrap ? nSelect.wrap.querySelector('select') : null;
	if(!sel) {
		console.warn('n_select : 대상 영역 또는 select 요소를 찾을 수 없습니다. (' + Ele + ')');
		return;
	}

	const selTitle	= sel.getAttribute('title'),
		selList		= createDom('div', 'option-list'),
		selUl		= createDom('ul'),
		selBtn		= createDom('button', 'btn-select');

	selList.classList.add('simple-scroll');
	let opts		= sel.querySelectorAll('option'),
		now_sel_btn, // 현재 선택된 버튼
		now_sel_num = -1, // 키보드 이동 위치 (보이는 option 기준 index / 없으면 -1)
		btn_opts    = [],
		now_active_btn; // 현재 active 된 버튼 (키보드 이동 시)

	const selUid = 'nsel_' + Math.random().toString(36).slice(2, 11), // select 요소 고유 id (화면 내 여러개 선언 시 구분용)
		listId = selUid + '_list',
		activeOptId = selUid + '_active';

	let clickEvt = new Event('click', { bubbles: true }); // selUl 에 위임된 클릭 이벤트까지 전달되도록 bubbles 필요

	/** 옵션 리스트 생성 - 리스트 호출 시 매번 실행 */
	function optionCreate(){
		while ( selUl.hasChildNodes() ) { selUl.removeChild( selUl.firstChild ); }
		btn_opts    = [];
		now_active_btn = null;
		now_sel_btn = null;
		now_sel_num = -1;
		let visibleIdx = -1;
		opts.forEach((opt, idx)=>{
			if(opt.hidden == true) return;
			visibleIdx++;
			let li = createDom('li'),
				btn = createDom('button', 'btn-sel');
			li.setAttribute('role', 'none');
			btn.textContent = opt.textContent;
			btn.dataset.val = opt.value;
			btn.dataset.idx = idx; // option index (value 중복 대비)
			if(opt.disabled == true) btn.disabled = true;
			if(opt.className) btn.classList.add(...opt.className.split(/\s+/).filter(Boolean)); // option 클래스 추가 (기존 btn-sel 유지)
			if(opt.selected == true) {
				selBtn.textContent = opt.textContent;
				btn.classList.add('select');
				btn.setAttribute('aria-selected', true);
				now_sel_btn = btn;
				now_sel_num = visibleIdx;
			} else {
				btn.classList.remove('select');
				btn.setAttribute('aria-selected', false);
			}
			btn.setAttribute('role', 'option');
			btn.setAttribute('tabindex', -1);
			li.appendChild(btn);
			selUl.appendChild(li);
			btn_opts.push(btn);
		});
	}

	/** select 리스트 영역 생성 - 호출 시 1회 실행 */
	function selectCreate(){
		if(selTitle != undefined) selBtn.setAttribute('title', selTitle);
		if(sel.disabled == true) selBtn.disabled = true;
		if(sel.classList.contains('readonly')) {
			selBtn.disabled = true;
			selBtn.classList.add('readonly');
		}

		selBtn.id = selUid + '_btn';
		selBtn.setAttribute('role', 'combobox');
		selBtn.setAttribute('aria-expanded', false);
		selBtn.setAttribute('aria-haspopup', 'listbox');
		selBtn.setAttribute('aria-controls', listId);
		selUl.setAttribute('role', 'listbox'); // option 버튼의 직접 상위에 listbox 지정 (ul > li[role=none] > button[role=option])
		selUl.id = listId;

		// select 에 연결된 label 이 있으면 "label + 선택값" 으로 읽히도록 연결 (select 숨김 시 label 연결이 끊어지므로)
		const label = sel.labels && sel.labels[0];
		if(label) {
			if(!label.id) label.id = selUid + '_label';
			selBtn.setAttribute('aria-labelledby', label.id + ' ' + selBtn.id);
			label.addEventListener('click', (e)=>{ e.preventDefault(); selBtn.focus(); });
		}

		nSelect.wrap.appendChild(selBtn);
		nSelect.wrap.appendChild(selList);
		selList.appendChild(selUl);
		selUl.addEventListener('click', optBtnClick); // option 버튼 클릭 이벤트 위임 (option 재생성 시마다 매번 바인딩 할 필요 없음)
	}
	selectCreate();

	function setActiveDescendant(idx){
		if(idx < 0 || idx >= btn_opts.length) {
			if(now_active_btn) now_active_btn.removeAttribute('id');
			now_active_btn = null;
			selBtn.removeAttribute('aria-activedescendant');
			return;
		}
		const activeBtn = btn_opts[idx];
		if(now_active_btn && now_active_btn !== activeBtn) now_active_btn.removeAttribute('id');
		activeBtn.id = activeOptId;
		now_active_btn = activeBtn;
		selBtn.setAttribute('aria-activedescendant', activeOptId);
	}

	/** 버튼 텍스트 설정 */
	function set_selBtn_tx(){
		opts = sel.querySelectorAll('option');
		const opt = sel.options[sel.selectedIndex];
		selBtn.textContent = opt ? opt.textContent : '';
		nSelect.wrap.classList.toggle('not-sel', !opt || opt.hidden); // 선택값이 없거나 hidden option(placeholder) 일 경우
	}
	set_selBtn_tx();

	/** 리스트 오픈 시 키보드 기능 설정 */
	function selKeySet(e){
		if(e.key == 'Escape' || e.key == 'Tab') selLeave();
		else if(e.key == 'ArrowUp') {
			e.preventDefault();
			if(now_sel_num > 0) now_sel_num--;
			else if(now_sel_num < 0) now_sel_num = 0;
			optHover(now_sel_num, 'up');
		} else if(e.key == 'ArrowDown') {
			e.preventDefault();
			if(now_sel_num < btn_opts.length - 1) now_sel_num++;
			optHover(now_sel_num, 'down');
		} else if(e.key == 'Enter') {
			e.preventDefault(); // 포커스된 selBtn 의 기본 click(리스트 토글) 중복 실행 방지
			if(btn_opts[now_sel_num]) btn_opts[now_sel_num].dispatchEvent(clickEvt);
		}
	}

	/** 리스트가 닫힌 상태에서 방향키 입력 시 리스트 열기 (combobox 키보드 패턴) */
	function selBtnKeydown(e){
		if(nSelect.wrap.classList.contains('on') || selBtn.disabled) return;
		if(e.key == 'ArrowDown' || e.key == 'ArrowUp') {
			e.preventDefault();
			selBtnClick();
		}
	}

	/** 리스트 외 영역 클릭 시 닫기 (리스트 열림 동안에만 등록) */
	function outsideClick(e){
		if(!nSelect.wrap.contains(e.target)) selLeave();
	}

	/** 키보드 관련 버튼 hover 설정 */
	function optHover(idx, direction){
		if(btn_opts.length < 1) return;
		if(btn_opts[idx].disabled == true) {
			if(direction == 'up' && idx > 0) {
				optHover(idx - 1, direction);
				now_sel_num = idx - 1;
			} else if(direction == 'down' && idx < btn_opts.length - 1) {
				optHover(idx + 1, direction);
				now_sel_num = idx + 1;
			}
			return;
		}
		btn_opts.forEach((btn, index)=>{
			if(index == idx) {
				btn.classList.add('hover');
				btn.scrollIntoView({ block: 'nearest' });
			} else btn.classList.remove('hover');
		});
		setActiveDescendant(idx);
	}

	/** option 목록 그리기 */
	function optionAdd(){
		set_selBtn_tx(); // opts 갱신 포함
		optionCreate();
		setActiveDescendant(now_sel_num);
	}

	/** 리스트가 열릴 때 화면 하단 공간이 부족하면 위로 열리도록 방향 설정 */
	function directionSet(){
		const btnRect    = selBtn.getBoundingClientRect(),
			spaceBelow = window.innerHeight - btnRect.bottom,
			spaceAbove = btnRect.top;

		nSelect.wrap.classList.toggle('upward', selList.offsetHeight > spaceBelow && spaceAbove > spaceBelow);
	}

	/** 리스트 열기 (이미 열려있을 경우 닫기) */
	function selBtnClick(){
		if(nSelect.wrap.classList.contains('on')) { selLeave(); return; }

		optionAdd();
		if(now_sel_btn) {
			now_sel_btn.classList.add('hover');
			setActiveDescendant(now_sel_num);
		}
		nSelect.wrap.classList.add('on');
		nSelect.wrap.style.zIndex = 200;
		selBtn.setAttribute('aria-expanded', true);
		directionSet();
		document.addEventListener('keydown', selKeySet);
		document.addEventListener('pointerdown', outsideClick); // common.js outSideClick_this 는 닫기 방식에 따라 리스너가 누적되어 자체 처리로 변경
	}

	/** 리스트 닫기 */
	function selLeave(){
		nSelect.wrap.classList.remove('on', 'upward');
		nSelect.wrap.style.zIndex = '';
		selBtn.setAttribute('aria-expanded', false);
		btn_opts.forEach((btn)=>{ btn.classList.remove('hover') });
		if(now_active_btn) now_active_btn.removeAttribute('id');
		now_active_btn = null;
		selBtn.removeAttribute('aria-activedescendant');
		document.removeEventListener('keydown', selKeySet);
		document.removeEventListener('pointerdown', outsideClick);
	}

	/** 리스트 내 option 버튼 클릭 시 (selUl 에 위임된 이벤트) */
	async function optBtnClick(event){
		const tg = event.target.closest('.btn-sel');
		if(!tg || tg.disabled) return;

		const tgIdx = Number(tg.dataset.idx),
			changed = sel.selectedIndex !== tgIdx;

		selBtn.focus();
		sel.selectedIndex = tgIdx; // value 대신 index 로 선택 (value 가 중복된 option 대비)
		set_selBtn_tx();

		if(changed) sel.dispatchEvent(new Event('change', { bubbles: true })); // 값이 바뀐 경우에만 change 발생

		await waitRender(); // common.js 에 정의된 waitRender() 함수 호출 - 렌더링 완료 후 selLeave() 실행
		selLeave();
	}

	selBtn.addEventListener('click', selBtnClick);
	selBtn.addEventListener('keydown', selBtnKeydown);
	sel.addEventListener('change', set_selBtn_tx); // 외부에서 selectedIndex 변경 후 change dispatch 시 버튼 텍스트 갱신 (selectedIndex -1 대응)

	nSelect.select = sel;
	nSelect.btn = selBtn;
	nSelect.selectDisable = function(bln){
		selBtn.disabled = bln;
		if(bln) selLeave();
	}
}

/** select형태 dropdown------------------------------------------------------------------------
 * 체크박스 다중 선택 + 확인 / 취소
 * - 확인 버튼 : '.btn-confirm' (없을 경우 리스트 내 첫 번째 '.btn')
 * - 취소 버튼 : '.btn-cancel' (선택) - 리스트 닫기 및 열기 전 체크 상태로 복원
 * - 외부 클릭 / ESC / 포커스가 영역 밖으로 이동 시 취소와 동일하게 처리
 */
function n_dropdown(area){
	const dropdown = this;
	dropdown.wrap = typeof area === 'string' ? document.querySelector(area) : area;

	let btn_open = dropdown.wrap ? dropdown.wrap.querySelector('.btn-select') : null,
		list = dropdown.wrap ? dropdown.wrap.querySelector('.option-list') : null;
	if(!btn_open || !list) {
		console.warn('n_dropdown : .btn-select / .option-list 요소를 찾을 수 없습니다. (' + area + ')');
		return;
	}

	let items = list.querySelectorAll('li'),
		btn_confirm = list.querySelector('.btn-confirm') || list.querySelector('.btn:not(.btn-cancel)'),
		btn_cancel = list.querySelector('.btn-cancel'),
		btn_tx = btn_open.textContent, // 버튼 텍스트 (선택 항목이 없을 때 표시 / 초기는 '선택')
		arr_tx = new Array(); // 열기 전 check 상태 저장 배열 - 취소 시 복원용

	// 접근성 속성 (버튼 - 목록 연결)
	if(!list.id) list.id = 'ndrop_' + Math.random().toString(36).slice(2, 11);
	btn_open.setAttribute('aria-expanded', 'false');
	btn_open.setAttribute('aria-controls', list.id);

	/** 리스트 열기 */
	function listOpen(){
		items = list.querySelectorAll('li');
		chk_state_save();
		dropdown.wrap.classList.add('on');
		btn_open.setAttribute('aria-expanded', 'true');
		document.addEventListener('pointerdown', outsideClick); // common.js outSideClick 은 버튼으로 닫을 때 리스너가 누적되어 자체 처리로 변경
	}

	/** 리스트 닫기 - restore : 열기 전 상태로 복원(취소) 여부 */
	function listClose(restore){
		if(!dropdown.wrap.classList.contains('on')) return;
		if(restore) chk_state_set();
		dropdown.wrap.classList.remove('on');
		btn_open.setAttribute('aria-expanded', 'false');
		document.removeEventListener('pointerdown', outsideClick);
	}

	function outsideClick(e){
		if(!dropdown.wrap.contains(e.target)) listClose(true);
	}

	btn_open.addEventListener('click', ()=>{
		dropdown.wrap.classList.contains('on') ? listClose(true) : listOpen();
	});

	// ESC : 취소 후 버튼으로 포커스 복귀
	dropdown.wrap.addEventListener('keydown', (e)=>{
		if(e.key !== 'Escape' || !dropdown.wrap.classList.contains('on')) return;
		e.stopPropagation();
		listClose(true);
		btn_open.focus();
	});

	// 키보드로 영역 밖으로 포커스 이동 시 취소
	dropdown.wrap.addEventListener('focusout', (e)=>{
		if(e.relatedTarget && !dropdown.wrap.contains(e.relatedTarget)) listClose(true);
	});

	/** 체크된 상태 저장 */
	function chk_state_save(){
		arr_tx = [];
		items.forEach((item, idx)=>{
			let chk = item.querySelector('input');
			arr_tx[idx] = chk ? chk.checked : false;
		});
	}

	/** 배열 기준 체크 상태 설정 */
	function chk_state_set(){
		items.forEach((item, idx)=>{
			let chk = item.querySelector('input');
			if(chk) chk.checked = !!arr_tx[idx];
		});
	}

	/** 체크 배열 기준 텍스트 반환 */
	function chk_items(){
		let arr_chk = new Array(),
			total = 0;
		items.forEach((item)=>{
			let chk = item.querySelector('input'),
				label = item.querySelector('label');
			if(!chk) return;
			total++;
			if(chk.checked == true) arr_chk.push(label ? label.textContent.trim() : chk.value);
		});
		btn_open.classList.toggle('sel', arr_chk.length > 0);
		if(arr_chk.length == 0) return btn_tx;
		else if(arr_chk.length == total) return '전체';
		else if(arr_chk.length == 1) return arr_chk[0];
		else return arr_chk[0] + ' 외 ' + (arr_chk.length -1) + '개';
	}

	if(btn_confirm) {
		btn_confirm.addEventListener('click', ()=>{
			btn_open.textContent = chk_items();
			listClose(false);
			btn_open.focus();
			dropdown.wrap.dispatchEvent(new Event('change', { bubbles: true })); // 확인 시 영역에 change 이벤트 발생 (외부 연동용)
		});
	}
	if(btn_cancel) {
		btn_cancel.addEventListener('click', ()=>{
			listClose(true);
			btn_open.focus();
		});
	}

	btn_open.textContent = chk_items();

	dropdown.btn = btn_open;
	/** 체크된 input 배열 반환 */
	dropdown.getChecked = function(){
		return Array.from(list.querySelectorAll('input:checked'));
	}
}

// file 설정 ------------------------------------------------------------------------
/**
 * 화면내 동일 선택자 전체 적용 시
 * @param {string} selector 선택자
 */
function nFile(selector) {
	const nFileEle = document.querySelectorAll(selector),
		arr = [];
	nFileEle.forEach((el)=>{ arr.push(new nFileSet(el)); }); // new 없이 호출 시 this 가 window 가 되어 전역변수가 생기던 문제 수정
	return arr.length == 1 ? arr[0] : arr;
}

/**
 * file 관련 기능 함수
 * @param {dom/string} Ele 파일기능 적용할 영역 선택자 or dom
 */
function nFileSet(Ele){
	if(!(this instanceof nFileSet)) return new nFileSet(Ele); // new 없이 호출해도 동작하도록
	const nFile = this;
	nFile.wrap = typeof Ele === 'string' ? document.querySelector(Ele) : Ele;
	nFile.input = nFile.wrap ? nFile.wrap.querySelector('input[type=file]') : null;
	if(!nFile.input) {
		console.warn('nFileSet : 대상 영역 또는 input[type=file] 요소를 찾을 수 없습니다. (' + Ele + ')');
		return;
	}

	let placeholder = nFile.input.getAttribute('placeholder') || '';

	// 파일명 표시용 input / 삭제 버튼 생성 (html 문자열 대신 dom 생성 - placeholder 에 따옴표 포함 시 깨짐 방지)
	let in_set = createDom('span', 'in-set'),
		urlInp = createDom('input', 'inp-file-url'),
		btnClear = createDom('button', 'btn-clear');

	urlInp.type = 'text';
	urlInp.classList.add('input-box');
	urlInp.title = '선택된 파일';
	urlInp.placeholder = placeholder;
	urlInp.tabIndex = -1;
	urlInp.readOnly = true;
	urlInp.setAttribute('aria-hidden', 'true'); // 파일명은 input[type=file] 이 직접 읽어주므로 중복 낭독 방지
	if(nFile.input.disabled == true) {
		nFile.wrap.classList.add('disabled');
		urlInp.disabled = true;
	}
	btnClear.textContent = '첨부파일 제거';
	btnClear.style.display = 'none';

	in_set.appendChild(urlInp);
	in_set.appendChild(btnClear);
	nFile.input.after(in_set);

	/** 선택된 파일명 표시 (C:\fakepath 경로 대신 파일명 / 다중 선택 시 '외 n개') */
	function valueSet(){
		const files = nFile.input.files;
		if(!files || files.length == 0) {
			urlInp.value = '';
			btnClear.style.display = 'none';
			return;
		}
		urlInp.value = files.length > 1 ? files[0].name + ' 외 ' + (files.length - 1) + '개' : files[0].name;
		if(nFile.input.disabled != true) btnClear.style.display = 'block';
	}
	function valueClear(){
		nFile.input.value = '';
		urlInp.value = '';
		btnClear.style.display = 'none';
		nFile.input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
		nFile.input.dispatchEvent(new Event('change', { bubbles: true })); // 값 변경 알림
		nFile.input.focus();
	}
	valueSet();

	nFile.input.addEventListener('change', valueSet);
	nFile.input.addEventListener('focusin', ()=>{ nFile.wrap.classList.add('focus') });
	nFile.input.addEventListener('focusout', ()=>{ nFile.wrap.classList.remove('focus') });

	btnClear.addEventListener('click',valueClear);
	
	// 외부호출 함수
	nFile.inpReset = function(){
		valueClear();
	}
	nFile.inpFileNameShow = function(filename){
		urlInp.value = filename;
		if(nFile.input.disabled != true) btnClear.style.display = 'block';
	}
}

/* 적용 예시
	nFile('클래스명');
*/

// 텍스트 입력형 input ------------------------------------------------------------------------
/**
 * 텍스트 입력형 input - 화면내 동일 선택자 전체 적용 시
 * @param {string} selector 
 */
function nText(selector){
	const nTextEle = document.querySelectorAll(selector);
	if(nTextEle.length > 1) {
		Array.prototype.forEach.call(nTextEle, function(el){
			nTextSet(el);
		});
	} 
	else if (nTextEle.length == 1) nTextSet(nTextEle[0]);
	else null;
}

/**
 * 실제 input 관련 기능 함수 - 개별 적용 시
 * input 입력 시 내용 삭제 버튼 show 및 삭제 기능 적용
 * @param {dom/string} Ele 대상 요소 dom / 선택자
 */
function nTextSet(Ele){
	const textWrap	= typeof Ele === 'string' ? document.querySelector(Ele) : Ele,
		inp 		= textWrap ? textWrap.querySelector('input, textarea') : null;

	if(!inp) {
		console.warn('nTextSet : 대상 영역 또는 input 요소를 찾을 수 없습니다. (' + Ele + ')');
		return;
	}
	if(inp.disabled == true || inp.readOnly == true) return;
	if(textWrap.querySelector(':scope > .btn-clear')) return; // 중복 적용 방지

	const btn_clear 	= document.createElement('button');
	btn_clear.setAttribute('type', 'button');
	btn_clear.classList.add('btn-clear');
	btn_clear.textContent = '내용 삭제';
	btn_clear.setAttribute('tabindex', -1);
	textWrap.appendChild(btn_clear);

	inp.addEventListener('focus', btnControl);
	inp.addEventListener('input', btnControl);
	textWrap.addEventListener('focusout', btnHide);
	btn_clear.addEventListener('mousedown', (e)=>{ e.preventDefault(); }); // 마우스/터치 클릭 시 input 포커스 유지 (버튼이 먼저 숨겨지는 문제 방지)

	btn_clear.addEventListener('click', function(){
		inp.value = '';
		inp.focus();
		btnControl();
		inp.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); // 내용 삭제 시 input 에 입력이벤트 발생 (vue v-model 동작관련)
		inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true })); // 미정의 변수(keyupEvt) 참조 오류 수정 - keyup 감지 로직 대응
	});

	function btnControl(){
		if(inp.value.length > 0 && inp.readOnly == false && inp.disabled == false) {
			btn_clear.setAttribute('tabindex', 0);
			btn_clear.classList.add('on');
		} else {
			btn_clear.setAttribute('tabindex', -1);
			btn_clear.classList.remove('on');
		}
	};
	/** input / 삭제버튼 밖으로 포커스가 나갈 때만 숨김 (삭제버튼 클릭 전에 사라지던 문제 수정) */
	function btnHide(e){
		if(e.relatedTarget && textWrap.contains(e.relatedTarget)) return;
		setTimeout(function(){
			if(textWrap.contains(document.activeElement)) return;
			btn_clear.classList.remove('on');
			btn_clear.setAttribute('tabindex', -1);
		}, 150);
	};
}

/* 적용예시
	nText('.inp-label');
	nTextSet('.inp-label');
*/

/**
 * input 입력 시 입력글자수 count
 * @param {dom/string} area 영역 선택자 or dom
 */
function nTextCount(area){
	let wrap = typeof area === 'string' ? document.querySelector(area) : area,
		inp = wrap ? wrap.querySelector('input, textarea') : null,
		count = wrap ? wrap.querySelector('.inp-count') : null,
		tx = wrap ? wrap.querySelector('.inp-count .now') : null,
		maxTx = wrap ? wrap.querySelector('.inp-count .max') : null,
		maxLength = inp && inp.getAttribute('maxlength') ? parseInt(inp.getAttribute('maxlength'), 10) : null;

	if(!inp || !tx) {
		console.warn('nTextCount : input(textarea) 또는 .inp-count .now 요소를 찾을 수 없습니다. (' + area + ')');
		return;
	}

	if(maxTx && maxLength) maxTx.textContent = maxLength;

	// 스크린리더 : input 포커스 시 글자 수 안내가 함께 읽히도록 연결
	if(count) {
		if(!count.id) count.id = 'ncount_' + Math.random().toString(36).slice(2, 11);
		const described = (inp.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
		if(described.indexOf(count.id) < 0) inp.setAttribute('aria-describedby', described.concat(count.id).join(' '));
	}

	function updateCount(e){
		if(e && e.isComposing) { // 한글 조합 중에는 글자 수만 표시 (조합 중 값 변경 시 입력이 깨지는 문제 방지)
			tx.textContent = inp.value.length;
			return;
		}
		if(maxLength && inp.value.length > maxLength) inp.value = inp.value.slice(0, maxLength); // 길이 초과 시 추가입력부분 제거
		tx.textContent = inp.value.length;
	}

	inp.addEventListener('input', updateCount);
	inp.addEventListener('compositionend', updateCount);
	if(inp.form) inp.form.addEventListener('reset', ()=>{ setTimeout(updateCount, 0) }); // form reset 시 카운트 초기화
	updateCount();

	return { update : updateCount }; // 스크립트로 값 변경 후 카운트 갱신용
}


// 기타 기능 ------------------------------------------------------------------------
/** 2중 Range input */
function doubleRange(area, unit, gap){
	const wrap = typeof area === 'string' ? document.querySelector(area) : area,
		r_gap = gap ? parseInt(gap) : 1;

	let inputEvt = new Event('input', { bubbles: true, cancelable: true });

	let inp_left = wrap.querySelector('.r_left'),
		inp_right = wrap.querySelector('.r_right'),
		range = wrap.querySelector('.range'),
		thumb_l = wrap.querySelector('.thumb.left'),
		thumb_l_tx = thumb_l.querySelector('.tx'),
		thumb_r = wrap.querySelector('.thumb.right'),
		thumb_r_tx = thumb_r.querySelector('.tx');

	let min = parseInt(inp_left.getAttribute('min')),
		max = parseInt(inp_left.getAttribute('max'));
	
	inp_left.addEventListener('input', function(){
		let val = Math.min(this.value, inp_right.value - r_gap),
			pos = parseInt(((val - min) / (max - min)) * 100);
		this.value = val;
		range.style.left = pos + '%';
		thumb_l.style.left = pos + '%';
		thumb_l_tx.textContent = val + unit;
	})
	inp_right.addEventListener('input', function(){
		let val = Math.max(this.value, parseInt(inp_left.value) + r_gap),
			pos = parseInt(((val - min) / (max - min)) * 100);
		this.value = val;
		range.style.right = 100 - pos + '%';
		thumb_r.style.right = 100 - pos + '%';
		thumb_r_tx.textContent = val + unit;
	});

	inp_left.dispatchEvent(inputEvt);
	inp_right.dispatchEvent(inputEvt);
}
/* 적용예시
	let d_range = new doubleRange('영역 선택자', '표시 단위', 최소간격(2개 버튼 사이));
*/


/** 2중 Range input - 영역 설정 */
function doubleRange_area(option){
	const range = this;
	range.wrap = typeof option.area === 'string' ? document.querySelector(option.area) : option.area;

	const slider = range.wrap.querySelector('.range-slider'),
	 	r_gap = option.gap ? Number(option.gap) : 0.5;

	let inputEvt = new Event('input', { bubbles: true, cancelable: true });

	let range_arr = option.range_tx,
		range_single = false,
		inp_left = range.wrap.querySelector('.r_left'),
		inp_right = range.wrap.querySelector('.r_right'),
		thumb_l = range.wrap.querySelector('.thumb.left'),
		thumb_r = range.wrap.querySelector('.thumb.right');

	let pos_1, pos_2,
		ranges = [];

	function create_range(){
		ranges = [];
		for(let i=0; i<range_arr.length; i++){
			let item = createDom('p', 'range');
			item.textContent = range_arr[i];
			item.classList.add('step' + i);
			slider.appendChild(item);
			ranges.push(item);
		}
		if(range_arr.length > 2) {
			range_single = false;
			if(inp_left.value >= inp_right.value) {
				inp_left.value = inp_right.value - r_gap;
				inp_left.dispatchEvent(inputEvt);
			}
		} else range_single = true;
	}
	create_range();

	function remove_range(){
		ranges.forEach((item)=>{
			slider.removeChild(item);
		});
	}

	function range_pos(){
		ranges[0].style.right = (100 - pos_1) + '%';
		ranges[1].style.left = pos_1 + '%';
		if(ranges.length == 3) {
			ranges[1].style.right = (100 - pos_2) + '%';
			ranges[ranges.length - 1].style.left = pos_2 + '%';
		} 
	}

	let min = Number(inp_left.getAttribute('min')),
		max = Number(inp_left.getAttribute('max'));
	
	inp_left.addEventListener('input', function(){
		let val = range_single ? this.value : Math.min(this.value, inp_right.value - r_gap);
		if(val == min) val = r_gap + min;
		if(val == max) val = max - r_gap;
		pos_1 = Number(((val - min) / (max - min)) * 100);
		this.value = val;
		thumb_l.style.left = pos_1 + '%';
		range_pos();
	})

	inp_right.addEventListener('input', function(){
		let val = Math.max(this.value, Number(inp_left.value) + r_gap);
		if(val == max) val = max - r_gap;
		pos_2 = Number(((val - min) / (max - min)) * 100);
		this.value = val;
		thumb_r.style.right = 100 - pos_2 + '%';
		range_pos();
	});

	inp_left.dispatchEvent(inputEvt);
	inp_right.dispatchEvent(inputEvt);

	// range 영역 업데이트
	range.range_update = function(range){
		range_arr = range;
		remove_range();
		create_range();
		range_pos()
	}

	// 최소값 변경
	range.min_update = function(val){
		inp_left.setAttribute('min', val);
		inp_right.setAttribute('min', val);
		min = Number(inp_left.getAttribute('min'));
		inp_left.dispatchEvent(inputEvt);
		inp_right.dispatchEvent(inputEvt);
	}
}


/**
 * Input 입력에 따른 버튼 활성화 기능
 * @param {dom/string} area 적용할 영역(input 및 버튼포함 영역 선택자)
 * @param {string} tgbtn 제어할 버튼 선택자
 * @param {dom/string} inpCls 적용할 input 요소 or 선택자 / 없을 경우 area 내에 있는 text / password input 전체가 대상
 */
function inpChkBtn(area, tgbtn, inpCls){
	let wrap 	= document.querySelector(area),
		inps 	= inpCls ? wrap.querySelectorAll(inpCls) : wrap.querySelectorAll('input[type=text], input[type=password]'),
		btn	 	= wrap.querySelector(tgbtn);

	function inpChk(){
		let chkNum = new Array();
		for(let i=0; i<inps.length; i++){
			if(inps[i].value.length > 0) chkNum[i] = 1;
			else chkNum[i] = 0;
		}
		chkNum.indexOf(0) >= 0 ? btn.disabled = true : btn.disabled = false;
	}
	for(let i=0; i<inps.length; i++){
		inps[i].addEventListener('input', inpChk);
	}
}

/**
 * check 전체선택 기능
 * @param {dom / string} allInp 전체선택 기능 적용할 input 요소 or 선택자
 * @param {string} inpName 제어될 input 들의 name 값
 */
function checkAll(allInp, inpName){
	let inpAll = typeof allInp === 'string' ? document.querySelector(allInp) : allInp;
	if(!inpAll) {
		console.warn('checkAll : 전체선택 input 을 찾을 수 없습니다. (' + allInp + ')');
		return;
	}
	let name   = inpName != undefined ? inpName : inpAll.getAttribute('data-name'),
		inps   = document.querySelectorAll('input[name="' + name + '"]:not(:disabled)'), // name 에 [] 등 특수문자 포함 시 오류 방지 (따옴표)
		inpLen = inps.length,
		syncing = false; // 전체선택으로 하위 항목 변경 중 여부 (change 연쇄 실행 방지)

	/** 체크된 갯수 리턴 */
	function inpCount(){
		let chkLen = 0;
		inps.forEach((inp)=>{ if(inp.checked == true) chkLen++; });
		return chkLen;
	}
	/** 하위 항목 일괄 설정 - 상태가 바뀐 항목에 change 이벤트 발생 (외부 연동용) */
	function inpsSet(bln){
		syncing = true;
		inps.forEach((inp)=> {
			if(inp.checked === bln) return;
			inp.checked = bln;
			inp.dispatchEvent(new Event('change', { bubbles: true }));
		});
		syncing = false;
		inpAllSet();
	}
	/** 하위 항목 상태에 따라 전체선택 상태 설정 (일부 선택 시 indeterminate) */
	function inpAllSet(){
		if(syncing) return;
		const cnt = inpCount(),
			before = inpAll.checked,
			state = cnt == inpLen && cnt != 0;
		inpAll.checked = state;
		inpAll.indeterminate = cnt > 0 && cnt < inpLen;
		if(before !== state) inpAll.dispatchEvent(new Event('change', { bubbles: true }));
	}
	inps.forEach((inp)=>{ inp.addEventListener('change', inpAllSet); }); // click → change : 키보드 / 스크립트(change dispatch) 변경에도 대응
	inpAll.addEventListener('click', function(){ inpsSet(this.checked); });

	inpAllSet();
}

/**
 * check 다중 depth 전체선택 기능 (depth 제한 없음)
 * @param {dom / string} area 기능 적용할 영역
 * @param {string} selector 대상 checkbox 선택자 - 기본 'input[type=checkbox]'
 * 구조 : 각 checkbox 는 li(또는 부모 요소) 안에 위치하고, 하위 항목은 같은 li 안의 ul 에 배치
 *  - 상위 체크 시 모든 하위 항목 체크 / 해제
 *  - 하위 항목이 모두 체크되면 상위 체크, 일부만 체크되면 상위는 indeterminate(일부 선택) 상태
 * ex) li > input.dep1 + label + ul > li > input.dep2 + label + ul > li > input.dep3 ...
 */
function checkAllDepth(area, selector){
	const wrap = typeof area === 'string' ? document.querySelector(area) : area;
	if(!wrap) {
		console.warn('checkAllDepth : 대상 영역을 찾을 수 없습니다. (' + area + ')');
		return;
	}
	const inps = Array.from(wrap.querySelectorAll(selector || 'input[type=checkbox]')),
		boxOf = new Map(),		// checkbox → 소속 항목 요소
		ownerOf = new Map(),	// 항목 요소 → checkbox
		parentOf = new Map(),	// checkbox → 상위 checkbox
		childrenOf = new Map();	// checkbox → 직계 하위 checkbox 배열
	let syncing = false;

	/** checkbox 가 속한 항목 요소 (li 우선, 없으면 부모 요소 / label 로 감싼 경우 label 의 부모) */
	function getBox(inp){
		const li = inp.closest('li');
		if(li && wrap.contains(li)) return li;
		const parent = inp.parentElement;
		return parent.tagName == 'LABEL' ? parent.parentElement : parent;
	}

	inps.forEach((inp)=>{
		const box = getBox(inp);
		boxOf.set(inp, box);
		if(!ownerOf.has(box)) ownerOf.set(box, inp); // 항목 내 첫 번째 checkbox 가 해당 항목의 대표
		childrenOf.set(inp, []);
	});
	inps.forEach((inp)=>{
		// 상위 요소를 따라 올라가며 가장 가까운 상위 항목의 checkbox 를 부모로 지정
		let el = boxOf.get(inp).parentElement;
		while(el && el !== wrap.parentElement) {
			const owner = ownerOf.get(el);
			if(owner && owner !== inp) {
				parentOf.set(inp, owner);
				childrenOf.get(owner).push(inp);
				break;
			}
			el = el.parentElement;
		}
	});

	/** 상태 변경 + 변경된 항목에 change 이벤트 (외부 연동용 / 내부 처리는 syncing 으로 무시) */
	function setState(inp, checked, indeterminate){
		const changed = inp.checked !== checked;
		inp.checked = checked;
		inp.indeterminate = indeterminate;
		if(changed) inp.dispatchEvent(new Event('change', { bubbles: true }));
	}

	/** 하위 전체 설정 (disabled 항목 제외) */
	function setDescendants(inp, checked){
		childrenOf.get(inp).forEach((child)=>{
			if(child.disabled) return;
			setState(child, checked, false);
			setDescendants(child, checked);
		});
	}

	/** 직계 하위 상태 기준으로 상위 상태 계산 */
	function calcState(inp){
		const children = childrenOf.get(inp).filter((child)=> !child.disabled);
		if(children.length == 0) return;
		const all = children.every((child)=> child.checked),
			some = children.some((child)=> child.checked || child.indeterminate);
		setState(inp, all, !all && some);
	}

	/** 상위 방향으로 상태 갱신 */
	function updateAncestors(inp){
		let parent = parentOf.get(inp);
		while(parent) {
			calcState(parent);
			parent = parentOf.get(parent);
		}
	}

	inps.forEach((inp)=>{
		inp.addEventListener('change', ()=>{
			if(syncing) return;
			syncing = true;
			inp.indeterminate = false;
			setDescendants(inp, inp.checked);
			updateAncestors(inp);
			syncing = false;
		});
	});

	// 초기 상태 동기화 - 문서 역순(하위 → 상위)으로 계산
	syncing = true;
	inps.slice().reverse().forEach(calcState);
	syncing = false;
}

/**
 * radio 선택 시 관련 영역 show/hide - 타겟지정 방식 (radio 와 영역 순서가 맞지 않을 경우)
 * @param {dom or string} area 설정할 영역
 * @param {string} name radio name값
 * @param {function} func 콜백함수 - 선택 변경 시 실행 func(input, target)
 * radio 의 data-target 에 표시할 영역 클래스명(점 없이) 지정 - 여러 radio 가 같은 영역을 지정 가능
 * 선택되지 않은 radio 의 영역은 숨김 처리 (fieldset 일 경우 disabled 로 전송 제외)
 */
function radioSelectTg(area, name, func){
	let wrap = typeof area === 'string' ? document.querySelector(area) : area;
	if(!wrap) {
		console.warn('radioSelectTg : 대상 영역을 찾을 수 없습니다. (' + area + ')');
		return;
	}
	let inps = wrap.querySelectorAll('input[name="' + name + '"]'), // name 특수문자 대응 (따옴표)
		tgs = new Array();

	/** data-target 에 해당하는 영역 목록 */
	function getTargets(inp){
		const tgCls = inp.getAttribute('data-target');
		return tgCls ? Array.from(wrap.querySelectorAll('.' + tgCls)) : [];
	}

	function tgReset(){
		tgs.forEach((tg)=>{
			tg.style.display = 'none';
			if(tg.tagName == 'FIELDSET') tg.disabled = true;
		});
	}
	function tgSetOn(tg){
		tg.style.display = '';
		if(tg.tagName == 'FIELDSET') tg.disabled = false;
	}
	function tgSet(inp){
		tgReset();
		let my_tg = getTargets(inp);
		my_tg.forEach((tg)=>{ tgSetOn(tg) });
		if(typeof func === 'function') {
			my_tg.length ? my_tg.forEach((tg)=>{ func(inp, tg) }) : func(inp);
		}
	}
	inps.forEach((inp)=>{
		getTargets(inp).forEach((tg)=>{ if(tgs.indexOf(tg) < 0) tgs.push(tg); }); // 중복 영역 제외
		inp.addEventListener('change', function(){ if(inp.checked) tgSet(inp); }); // click → change : 방향키 선택에도 대응
	});

	// 초기 상태 : 선택된 radio 기준으로 설정 (선택된 radio 가 없으면 전체 숨김)
	const checked = Array.from(inps).find((inp)=> inp.checked);
	checked ? tgSet(checked) : tgReset();
}

/**
 * input 체크여부에 따른 target 영역 비활성화 (inert 적용)
 * @param {dom / string} area 요소 선택 제한 영역 선택자
 * @param {dom / string} inp input or input 선택자
 * @param {string} target target 영역 선택자
 * @param {function} func 콜백함수 - func(비활성화 여부 boolean)
 * 체크 해제 시 target 영역에 inert 속성 부여 (클릭 / 포커스 / 스크린리더 접근 차단) - 스타일은 css [inert] 로 지정
 * ※ inert 는 form 전송에서 제외되지 않으므로, 전송 제외가 필요하면 콜백에서 처리
 * ※ 제어용 checkbox 가 target 영역 안에 있을 경우, checkbox(및 label)를 포함하지 않은 하위 요소에만 inert 적용
 */
function chk_tgl_ctrl(area, inp, target, func){
	let wrap = typeof area === 'string' ? document.querySelector(area) : area,
		tgl_inp = wrap ? (typeof inp === 'string' ? wrap.querySelector(inp) : inp) : null,
		tgl_area = wrap ? wrap.querySelector(target) : null;

	if(!tgl_inp || !tgl_area) {
		console.warn('chk_tgl_ctrl : 대상 input 또는 target 영역을 찾을 수 없습니다.');
		return;
	}

	/** inert 적용 대상 - target 영역 안에 제어용 checkbox 가 있으면 checkbox / label 을 포함하지 않은 하위 요소 */
	function getInertTargets(){
		const keep = [tgl_inp].concat(Array.from(tgl_inp.labels || []));
		if(!keep.some((el)=> tgl_area.contains(el))) return [tgl_area];

		const result = [];
		(function collect(parent){
			Array.from(parent.children).forEach((child)=>{
				if(keep.indexOf(child) > -1) return;
				if(keep.some((el)=> child.contains(el))) collect(child); // checkbox 를 포함한 요소는 내부로 들어가서 처리
				else result.push(child);
			});
		})(tgl_area);
		return result;
	}
	const inertTargets = getInertTargets();

	function stateSet(){
		const off = !tgl_inp.checked;
		inertTargets.forEach((el)=>{ el.inert = off; });
		tgl_area.classList.toggle('inert', off); // 영역 전체 스타일 지정용 클래스
		if(typeof func === 'function') func(off);
	}
	tgl_inp.addEventListener('change', stateSet); // click → change : 스크립트로 change dispatch 시에도 대응
	stateSet();
}

/**
 * 시작일-종료일 input 에 대한 달력 기능 선언
 * @param {dom / string} s_input 영역 선택자 or dom
 * @param {string} s_input 시작일(시) input 선택자
 * @param {string} e_input 종료일(시) input 선택자
 * @param {boolean} layer 레이어에 위치하는 달력 여부
 * @param {boolean} time 시간기능 추가여부
 */
function cal_range_set(area, s_input, e_input, layer, time){
	let wrap = typeof area === 'string' ? document.querySelector(area) : area;
	let inp_s = wrap.querySelector(s_input),
		inp_e = wrap.querySelector(e_input);

	let start_opt = {
		calInp : inp_s,
		todayLimit : true,
		limitType : 'before'
	}
	let end_opt = {
		calInp : inp_e,
		todayLimit : true,
		limitType : 'before'
	}
	if(layer == true) {
		start_opt.inCalWrap = true;
		end_opt.inCalWrap = true;
	}
	if(time == true) {
		start_opt.setTime = true;
		end_opt.setTime = true;
	}

	let startDay = new nCalendar(start_opt);
	let endDay = new nCalendar(end_opt);
	cal_range_chk(startDay.input, endDay.input, time);
}

/**
 * 시작일-종료일 input 2개 세트 - 입력값 비교
 * @param {dom} s_input 시작일 input
 * @param {dom} e_input 종료일 input
 * @param {boolean} time 알럿문구 - 시간포함 여부
 */
function cal_range_chk(s_input, e_input, time){
	let tx_alert_se = '시작일은 종료일 이후로 설정할 수 없습니다.',
		tx_alert_es = '종료일은 시작일 이전으로 설정할 수 없습니다.';
	if(time == true) {
		tx_alert_se = '시작일시는 종료일시 이후로 설정할 수 없습니다.'
		tx_alert_es = '종료일시는 시작일시 이전으로 설정할 수 없습니다.'
	}
	
	s_input.addEventListener('change', function(){
		let s_date = new Date(this.value),
			e_date = new Date(e_input.value);
		if(e_date == undefined) return;
		if(s_date.valueOf() > e_date.valueOf()) {
			alert(tx_alert_se);
			this.value = null;
		}
	});
	e_input.addEventListener('change', function(){
		let e_date = new Date(this.value),
			s_date = new Date(s_input.value);
		if(s_date == undefined) return;
		if(e_date.valueOf() < s_date.valueOf()) {
			alert(tx_alert_es);
			this.value = null;
		}
	});
}

/* input 입력 '-' 추가 관련 */
/**
 * input - 전화번호 자동 하이픈
 * @param {string / dom} inp 대상 input
 * @param {string} type 휴대폰 / 로컬전화(local) / 사업자번호(company) / 생년월일(birth) 구분
 */
function input_num_chk(inp, type){
	let input = typeof inp === 'string' ? document.querySelector(inp) : inp;

	function inp_set(type){
		input.addEventListener('input', function(){
			switch(type) {
				case 'local' :
					autoHypen_Local(this);
					break;
				case 'company' :
					autoHypen_company(this);
					break;
				case 'birth' :
					autoHypen_birth(this);
					break;
				default:
					autoHypen_phone(this);
					break;
			}
		});
	}
	inp_set(type);

	this.changeType = function(type){
		inp_set(type);
	}
	this.input = input;
}

/** 휴대폰 */
function autoHypen_phone(target) {
	target.value = target.value.replace(/[^0-9]/g, '')
	.replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
}
/** 로컬 전화 */
function autoHypen_Local(target) {
	let val = target.value;
	if(val.startsWith("02")) {
		target.setAttribute('maxlength', 12);
		target.value = target.value.replace(/[^0-9]/g, '')
		.replace(/^(\d{2})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
	} else {
		target.setAttribute('maxlength', 13);
		target.value = target.value.replace(/[^0-9]/g, '')
		.replace(/^(\d{3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
	}
}
/** 사업자번호 */
function autoHypen_company(target) {
	target.value = target.value.replace(/[^0-9]/g, '')
	.replace(/^(\d{0,3})(\d{0,2})(\d{0,5})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
}
/** 생년월일 */
function autoHypen_birth(target) {
	target.value = target.value.replace(/[^0-9]/g, '')
	.replace(/^(\d{0,4})(\d{0,2})(\d{0,2})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
}

/**
 * 입력값 제한 함수 (숫자/한글/영문)
 * @param {string / dom} area 대상 input 선택자(일치하는 input 전체 적용) 또는 dom
 * @param {string / RegExp} reg 제거할 문자 정규식 (직접 지정 시 / data-type 무시) - ex : '[^a-z0-9]' → 영문 소문자·숫자 외 제거
 * data-type : num(숫자) / eng(영문) / kor(한글) - 공백으로 조합 가능 (ex : data-type="num eng")
 *  - num 단독일 경우 공백 불가 / 그 외에는 공백 허용
 */
function inpValueCheck(area, reg){
	const inps = typeof area === 'string' ? document.querySelectorAll(area) : (area ? [area] : []);
	if(inps.length == 0) {
		console.warn('inpValueCheck : 대상 input 을 찾을 수 없습니다. (' + area + ')');
		return;
	}
	inps.forEach((inp)=>{ inpValueCheckSet(inp, reg); });
}

/** inpValueCheck - input 1개 적용 */
function inpValueCheckSet(inp, reg){
	const allow = { num : '0-9', eng : 'a-zA-Z', kor : 'ㄱ-ㅎㅏ-ㅣ가-힣' }; // '|' 가 허용문자에 포함되던 오류 / 영문에 특수문자(!~z 범위)가 포함되던 오류 수정
	let regEx;

	if(reg != null) {
		// 직접 지정 : 전체 문자에 적용되도록 g 플래그 보장 (기존 : 첫 번째 문자만 제거)
		regEx = reg instanceof RegExp ? new RegExp(reg.source, reg.flags.indexOf('g') > -1 ? reg.flags : reg.flags + 'g') : new RegExp(reg, 'g');
	} else {
		const types = (inp.getAttribute('data-type') || '').split(/\s+/).filter((t)=> allow[t]);
		if(types.length == 0) {
			console.warn('inpValueCheck : data-type(num / eng / kor) 또는 정규식(reg)이 필요합니다.', inp);
			return;
		}
		const space = (types.length == 1 && types[0] == 'num') ? '' : '\\s';
		regEx = new RegExp('[^' + types.map((t)=> allow[t]).join('') + space + ']', 'g');
	}

	function valueCheck(e){
		if(e && e.isComposing) return; // 한글 조합 중에는 처리하지 않음 (조합 중 값 변경 시 글자가 중복/깨지는 문제) → compositionend 에서 처리
		const val = inp.value,
			newVal = val.replace(regEx, '');
		if(val === newVal) return; // 변경이 없으면 값 재설정 안 함 (커서 위치 유지)

		// 커서 위치 유지 : 커서 앞쪽에서 제거된 글자 수만큼 이동
		const pos = inp.selectionStart,
			before = pos == null ? null : val.slice(0, pos).replace(regEx, '').length;
		inp.value = newVal;
		if(before != null) {
			try { inp.setSelectionRange(before, before); } catch(err) { /* selection 미지원 type(number 등) */ }
		}
	}

	inp.addEventListener('input', valueCheck);
	inp.addEventListener('compositionend', valueCheck);
	valueCheck(); // 초기값 확인
}
/* ex
	inpValueCheck('[data-type]');				// data-type 이 있는 input 전체
	inpValueCheck('.inp-id', '[^a-z0-9]');		// 직접 정규식 지정 - 영문 소문자 / 숫자 외 제거
*/