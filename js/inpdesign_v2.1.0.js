/*-- input design --*/
/*-- 서남호 --*/
/*-- 2018-01-11 - checkbox/radio/select/file 통합본 수정 --*/
/*-- 2018-01-17 - disabled 추가 --*/
/*-- 2019-09-05 - v1.1 변수 추가 및 사용방법 변경 // select 부모영역 설정 추가 (상황에 따라 리스트 위로 뜨도록) --*/
/*-- 2019-12-11 - v1.2 select - option 속성 관련 추가 --*/
/*-- 2020-01-15 - v2.0.0 - radio, checkbox 기능 제거(css로만 적용) 및 jquery 제거버전 진행  */
/*-- 2023-10-06 - v2.1.0 - select - option 변경관련 - 클릭 시 매번 새로 생성하도록 -> optionUpdate 기능변경  */
/*-- 2024-06-11 - v2.1.0 - 2중 Range input 추가  */

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

	const sel 		= nSelect.wrap.querySelector('select'),
		selTitle	= sel.getAttribute('title'),
		selList		= createDom('div', 'select-list'),
		selUl		= createDom('ul'),
		selBtn		= createDom('button', 'btn-select');
	
	let opts		= sel.querySelectorAll('option'),
		now_sel_btn, // 현재 선택된 버튼
		now_sel_num = 0,
		btn_opts    = [],
		now_active_btn; // 현재 active 된 버튼 (키보드 이동 시)

	const selUid = 'nsel_' + Math.random().toString(36).slice(2, 11), // select 요소 고유 id (화면 내 여러개 선언 시 구분용)
		listId = selUid + '_list',
		activeOptId = selUid + '_active';

	let clickEvt = new Event('click');

	/** 옵션 리스트 생성 - 리스트 호출 시 매번 실행 */
	function optionCreate(){
		while ( selUl.hasChildNodes() ) { selUl.removeChild( selUl.firstChild ); }
		btn_opts    = [];
		now_active_btn = null;
		let visibleIdx = -1;
		opts.forEach((opt, idx)=>{
			if(opt.hidden == true) return;
			visibleIdx++;
			let li = createDom('li'),
				btn = createDom('button', 'btn-sel');
			btn.textContent = opt.textContent;
			btn.dataset.val = opt.value;
			if(opt.disabled == true) btn.disabled = true;
			if(opt.className) btn.className = opt.className;
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
			btn.addEventListener('click', optBtnClick);
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

		selBtn.setAttribute('role', 'combobox');
		selBtn.setAttribute('aria-expanded', false);
		selBtn.setAttribute('aria-haspopup', 'listbox');
		selBtn.setAttribute('aria-controls', listId);
		selList.setAttribute('role', 'listbox');
		selList.id = listId;

		nSelect.wrap.appendChild(selBtn);
		nSelect.wrap.appendChild(selList);
		selList.appendChild(selUl);
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
		let tx = opts[0].textContent;
		opts.forEach(function(opt){
			if(opt.selected == true) tx = opt.textContent;
			if(opt.selected && opt.hidden) nSelect.wrap.classList.add('not-sel');
		});
		selBtn.textContent = tx;
	}
	set_selBtn_tx();

	/** 리스트 오픈 시 키보드 기능 설정 */
	function selKeySet(e){
		if(e.key == 'Escape' || e.key == 'Tab') selLeave();
		else if(e.key == 'ArrowUp') {
			e.preventDefault();
			if(now_sel_num > 0) now_sel_num--;
			optHover(now_sel_num, 'up');
		} else if(e.key == 'ArrowDown') {
			e.preventDefault();
			if(now_sel_num < btn_opts.length - 1) now_sel_num++;
			optHover(now_sel_num, 'down');
		} else if(e.key == 'Enter' && btn_opts[now_sel_num]) btn_opts[now_sel_num].dispatchEvent(clickEvt);
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
			index == idx ? btn.classList.add('hover') : btn.classList.remove('hover');
		});
		setActiveDescendant(idx);
	}

	/** option 목록 그리기 */
	function optionAdd(){
		opts		= sel.querySelectorAll('option');
		optionCreate();
		set_selBtn_tx();
		setActiveDescendant(now_sel_num);
	}

	/** 리스트 열기 */
	function selBtnClick(){
		optionAdd();
		if(now_sel_btn) {
			now_sel_btn.classList.add('hover');
			setActiveDescendant(now_sel_num);
		}
		nSelect.wrap.classList.add('on');
		nSelect.wrap.style.zIndex = 200;
		selBtn.setAttribute('aria-expanded', true);
		document.addEventListener('keydown', selKeySet);
		outSideClick_this('.n-select', nSelect.wrap, nSelect.wrap, 'on', ()=>{ selLeave() });
	}

	/** 리스트 닫기 */
	function selLeave(){
		nSelect.wrap.classList.remove('on');
		nSelect.wrap.style.zIndex = '';
		selBtn.setAttribute('aria-expanded', false);
		if(now_active_btn) now_active_btn.removeAttribute('id');
		now_active_btn = null;
		selBtn.removeAttribute('aria-activedescendant');
		document.removeEventListener('keydown', selKeySet);
	}

	/** 리스트 내 option 버튼 클릭 시 */
	async function optBtnClick(event){
		let tg		= event.target;
			tgTx	= tg.textContent,
			tgVal   = tg.dataset.val;
		
		selBtn.textContent = tgTx;
		selBtn.focus();
		opts.forEach(function(opt){
			if(opt.value == tgVal) opt.selected = true;
		});
		nSelect.wrap.classList.remove('not-sel');
		
		let changeEvt = new Event('change');
		sel.dispatchEvent(changeEvt);

		await waitRender();
		selLeave();
	}

	selBtn.addEventListener('click', selBtnClick);
	sel.addEventListener('change', function(){
		selBtn.textContent = this.options[this.selectedIndex].textContent;
	});

	nSelect.select = sel;
	nSelect.btn = selBtn;
	nSelect.selectDisable = function(bln){
		selBtn.disabled = bln;
	}
}

/** select형태 dropdown------------------------------------------------------------------------ */
function n_dropdown(area){
	const dropdown = this;
	dropdown.wrap = typeof area === 'string' ? document.querySelector(area) : area;

	let btn_open = dropdown.wrap.querySelector('.btn-select'),
		list = dropdown.wrap.querySelector('.select-list'),
		items = list.querySelectorAll('li'),
		btn_confirm = list.querySelector('.btn'),
		btn_tx = btn_open.textContent, // 버튼 텍스트 (취소 시 원래 텍스트로 돌아가기용 변수 / 초기는 '선택')
		arr_tx = new Array(); // check 상태 저장 배열 - 체크된 항목 텍스트 반환 함수(chk_items)에서 사용
	
	btn_open.addEventListener('click', ()=>{ 
		items = list.querySelectorAll('li');
		dropdown.wrap.classList.toggle('on');
		if(dropdown.wrap.classList.contains('on')) chk_state_save();
		else chk_state_set();
		
		outSideClick('.n-select', dropdown.wrap, 'on', chk_state_set);
	});
	
	/** 체크된 상태 저장 */
	function chk_state_save(){
		items.forEach((item, idx)=>{
			let chk = item.querySelector('input');
			chk.checked == true ? arr_tx[idx] = true : arr_tx[idx] = false;
		});
	}

	/** 배열 기준 체크 상태 설정 */
	function chk_state_set(){
		items.forEach((item, idx)=>{
			let chk = item.querySelector('input');
			chk.checked = arr_tx[idx];
		});
	}

	/** 체크 배열 기준 텍스트 반환 */
	function chk_items(){
		let arr_chk = new Array();
		items.forEach((item, idx)=>{
			let chk = item.querySelector('input'),
				tx = item.querySelector('label').textContent;
			if(chk.checked == true) {
				arr_chk.push(tx);
			}
		});
		arr_chk.length == 0 ? btn_open.classList.remove('sel') : btn_open.classList.add('sel');
		if(arr_chk.length == 0) return btn_tx;
		else if(arr_chk.length == items.length) return '전체';
		else if(arr_chk.length == 1) return arr_chk[0];
		else return arr_chk[0] + ' 외 ' + (arr_chk.length -1) + '개';
	}

	btn_confirm.addEventListener('click', ()=>{
		chk_state_save();
		btn_open.textContent = chk_items();
		dropdown.wrap.classList.remove('on');
	});

	btn_open.textContent = chk_items();

	dropdown.btn = btn_open;
}

// file 설정 ------------------------------------------------------------------------
/**
 * 화면내 동일 선택자 전체 적용 시
 * @param {string} selector 선택자
 */
function nFile(selector) {
	var nFileEle = document.querySelectorAll(selector);

	if(nFileEle.length > 1) {
		Array.prototype.forEach.call(nFileEle, function(el, index, array){
			nFileSet(el);
		});
	} 
	else if (nFileEle.length == 1) nFileSet(nFileEle[0]);
	else null;
}

/**
 * file 관련 기능 함수
 * @param {dom/string} Ele 파일기능 적용할 영역 선택자 or dom
 */
function nFileSet(Ele){
	const nFile = this;
	nFile.wrap = typeof Ele === 'string' ? document.querySelector(Ele) : Ele,
	nFile.input = nFile.wrap.querySelector('input[type=file]');

	let placeholder = nFile.input.getAttribute('placeholder') == null ? '' : nFile.input.getAttribute('placeholder'),
		btnClear,
		urlInp		= null,
		inpHtml		= '';	
		
	let inputEvt = new Event('input', { bubbles: true, cancelable: true });

	if(nFile.input.disabled == true) {
		nFile.wrap.classList.add('disabled');
		inpHtml += '<input type="text" class="inp-file-url input-box" title="파일 경로" placeholder="'+placeholder+'" tabindex="-1" readonly disabled>';
	} else inpHtml += '<input type="text" class="inp-file-url input-box" title="파일 경로" placeholder="'+placeholder+'" tabindex="-1" readonly>';

	let in_set = createDom('span', 'in-set'),
	dom_btn = createDom('button', 'btn-clear');
	dom_btn.setAttribute('type', 'button');
	dom_btn.textContent = '첨부파일 제거';
	btnClear = dom_btn;
	
	in_set.insertAdjacentHTML('beforeend', inpHtml);
	in_set.appendChild(btnClear);
	nFile.input.after(in_set);

	urlInp = nFile.wrap.querySelector('.inp-file-url');

	function valueSet(){
		urlInp.value = nFile.input.value;
		if(nFile.input.disabled != true) btnClear.style.display = 'block';
	}
	function valueClear(){
		nFile.input.value = '';
		urlInp.value = '';
		btnClear.style.display = 'none';
		nFile.input.dispatchEvent(inputEvt);
		nFile.input.focus();
	}
	if(nFile.input.value.length > 0) valueSet();

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
		inp 		= textWrap.querySelector('input');
	
	if(inp.disabled == true || inp.readOnly == true) return;

	const btn_clear 	= document.createElement('button');
	btn_clear.setAttribute('type', 'button');
	btn_clear.classList.add('btn-clear');
	btn_clear.textContent = '내용 삭제';
	textWrap.appendChild(btn_clear);

	inp.addEventListener('focus', btnControl);
	inp.addEventListener('focusout', btnHide);
	inp.addEventListener('input', btnControl);
	inp.addEventListener('propertychange', btnControl);

	btn_clear.addEventListener('click', function(e){
		inp.value = '';
		inp.focus();
		btn_clear.classList.remove('on');
		let inputEvt = new Event('input', { bubbles: true, cancelable: true });
		inp.dispatchEvent(inputEvt); // 내용 삭제 시 input 에 입력이벤트 발생 (vue v-model 동작관련)
		inp.dispatchEvent(keyupEvt); // 내용 삭제 시 input 에 입력이벤트 발생 (vue v-model 동작관련)
	});

	function btnControl(e){
		if(e.target.value.length > 0 && e.target.readOnly == false) {
			btn_clear.setAttribute('tabindex', 0);
			btn_clear.classList.add('on');
		} else {
			btn_clear.setAttribute('tabindex', -1);
			btn_clear.classList.remove('on');
		}
	};
	function btnHide(){
		setTimeout(function(){ btn_clear.classList.remove('on') }, 50);
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
		inp = wrap.querySelector('input, textarea'),
		tx = wrap.querySelector('.inp-count .now'),
		maxTx = wrap.querySelector('.inp-count .max'),
		maxLength = inp.getAttribute('maxlength') ? parseInt(inp.getAttribute('maxlength'), 10) : null;
	
	function updateCount(e){
		if(maxLength && inp.value.length > maxLength) inp.value = inp.value.slice(0, maxLength); // 길이 초과 시 추가입력부분 제거
		tx.textContent = inp.value.length;

		if (maxTx && maxLength) maxTx.textContent = maxLength;
	}
	
	inp.addEventListener('input', updateCount);
	updateCount();
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
	let inpAll = typeof allInp === 'string' ? document.querySelector(allInp) : allInp,
		name   = inpName != undefined ? inpName : inpAll.getAttribute('data-name'),
		inps   = document.querySelectorAll('input[name='+name+']:not(:disabled)'),
		inpLen = inps.length;
		
	let changeEvt = new Event('change');
	
	/** 체크된 갯수 리턴 */
	function inpCount(){
		let chkLen = 0;
		for(let i=0; i<inpLen; i++) {
			if(inps[i].checked == true) chkLen++;
		}
		return chkLen;
	}
	function inpsSet(bln){
		inps.forEach((inp)=> { inp.checked = bln; });
	}
	function inpAllSet(){
		inpCount() == inpLen && inpCount() != 0 ? inpAll.checked = true : inpAll.checked = false;
		inpAll.dispatchEvent(changeEvt);
	}
	inps.forEach((inp)=>{ inp.addEventListener('click', inpAllSet); });
	inpAll.addEventListener('click', function(){ this.checked == true ? inpsSet(true) : inpsSet(false); });

	inpAllSet();
}

/**
 * check 2중 중첩 전체선택 기능
 * @param {dom / string} area 기능 적용할 영역
 */
function checkAllDepth(area){
	const wrap = typeof area === 'string' ? document.querySelector(area) : area;
	let dep1s = wrap.querySelectorAll('.dep1'),
		dep2s = wrap.querySelectorAll('.dep2'),
		dep3s = wrap.querySelectorAll('.dep3');

	function chkSet(items, bln){
		items.forEach((item)=>{ item.checked = bln });
	}

	dep1s.forEach(function(dep1){
		let all_child = dep1.parentNode.querySelectorAll('.dep2, .dep3');
		dep1.addEventListener('click', function(){
			this.checked == true ? chkSet(all_child, true) : chkSet(all_child, false);
		});
	});

	dep2s.forEach(function(dep2){
		let ul = dep2.closest('ul'),
			parent = ul.parentNode.querySelector('.dep1'),
			siblings = ul.querySelectorAll('.dep2'),
			childs = dep2.parentNode.querySelectorAll('.dep3');
		dep2.addEventListener('click', function(){
			this.checked == true ? chkSet(childs, true) : chkSet(childs, false);
		});
		dep2.addEventListener('change', function(){
			let states = Array.from(siblings).every(item => item.checked),
				changeEvt = new Event('change', { bubbles: true, cancelable: true });
			parent.checked = states;
			parent.dispatchEvent(changeEvt);
		})
	});
	
	dep3s.forEach(function(dep3){
		let parent = dep3.closest('ul').parentNode.querySelector('.dep2'),
			siblings = dep3.closest('ul').querySelectorAll('.dep3');
		dep3.addEventListener('click', function(){
			let states = Array.from(siblings).every(item => item.checked),
				changeEvt = new Event('change', { bubbles: true, cancelable: true });
			parent.checked = states;
			parent.dispatchEvent(changeEvt);
		});
	});
}

/**
 * radio 선택 시 관련 영역 show/hide - 타겟지정 방식 (radio 와 영역 순서가 맞지 않을 경우)
 * @param {dom or string} area 설정할 영역
 * @param {string} name radio name값
 * @param {function} func 콜백함수 - input 클릭 시 실행
 * input 은 다수 - 제어할 대상은 1개일 경우 제어할 대상을 show 할 input 에 'show' 클래스 추가
 */
function radioSelectTg(area, name, func){
	let wrap = typeof area === 'string' ? document.querySelector(area) : area,
		inps = wrap.querySelectorAll('input[name='+name+']'),
		tgs = new Array();

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
		let my_tg;
		if(inp.getAttribute('data-target') != undefined) {
			my_tg = wrap.querySelectorAll('.' + inp.getAttribute('data-target'));
			my_tg.forEach((tg)=>{ tgSetOn(tg) });
			
		}
		if(typeof func === 'function') { 
			my_tg ? my_tg.forEach((tg)=>{ func(inp, tg) }) : func(inp); 
		}
	}
	inps.forEach((inp)=>{
		if(inp.getAttribute('data-target') != undefined) {
			let my_tg = wrap.querySelectorAll('.' + inp.getAttribute('data-target'));
			my_tg.forEach((tg)=>{ tgs.push(tg); });
			
		}
		inp.addEventListener('click', function(){ tgSet(inp); });
	});

	inps.forEach((inp)=>{ if(inp.checked == true) tgSet(inp); });
}

/**
 * input 체크여부에 따른 target 영역 내 요소 disabled 설정
 * @param {dom / string} area 요소 선택 제한 영역 선택자
 * @param {dom / string} inp ipnut or input 선택자
 * @param {string} target target 영역 선택자
 * @param {function} func 콜백함수
 */
function chk_tgl_ctrl(area, inp, target, func){
	let wrap = typeof area === 'string' ? document.querySelector(area) : area,
		tgl_inp = typeof inp === 'string' ? wrap.querySelector(inp) : inp,
		tgl_area = wrap.querySelector(target);
	
	if(tgl_area.tagName == 'FIELDSET') {
		tgl_inp.addEventListener('click', function(){
			tgl_inp.checked == true ? tgl_area.disabled = false : tgl_area.disabled = true;
			if(typeof func === 'function') func(!tgl_inp.checked);
		});
		tgl_inp.checked == true ? tgl_area.disabled = false : tgl_area.disabled = true;
		return;
	}
	let tg_inps = tgl_area.querySelectorAll('select, input, button, a');

	function areaSet(bln){
		tg_inps.forEach((inp)=> { 
			if(inp == tgl_inp) return;
			inp.disabled = bln;
		});
	}
	function stateSet(){
		tgl_inp.checked == true ? areaSet(false) : areaSet(true);
		if(typeof func === 'function') func(!tgl_inp.checked);
	}
	tgl_inp.addEventListener('click', stateSet);
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
 * @param {string / dom} area 대상 input 선택자 및 dom
 * @param {regEx} reg 정규식 (특정 정규식을 직접 적용할 경우)
 */
function inpValueCheck(area, reg){
	let inp 	= typeof area === 'string' ? document.querySelector(area) : area,
		type	= inp.getAttribute('data-type').split(' '),
		regEx;

	if(reg == null) {
		if(type.length == 1) {
			if(type.indexOf('num') != -1) regEx = new RegExp("[^0-9]", "gi");
			else if(type.indexOf('eng') != -1) regEx = new RegExp("[0-9]|[^\!-z\\s]", "gi");
			else if(type.indexOf('kor') != -1) regEx = new RegExp("[^ㄱ-ㅎ|ㅏ-ㅣ|가-힣\\s]", "g");
		} else {
			if(type.indexOf('num') != -1 && type.indexOf('eng') != -1) regEx = new RegExp("[^0-9\!-z\s]", "gi");
			else if(type.indexOf('num') != -1 && type.indexOf('kor') != -1) regEx = new RegExp("[^0-9|ㄱ-ㅎ|ㅏ-ㅣ|가-힣\\s]", "gi");
			else if(type.indexOf('eng') != -1 && type.indexOf('kor') != -1) regEx = new RegExp("[^a-z|ㄱ-ㅎ|ㅏ-ㅣ|가-힣\\s]", "gi");
		}
	} else regEx = new RegExp(reg);

	inp.addEventListener('input', function(){
		inp.value = inp.value.replace(regEx, '');
	});
}
/* ex
  - 숫자 input 에 'num' 클래스 
         inpValueCheck('선택자');
*/