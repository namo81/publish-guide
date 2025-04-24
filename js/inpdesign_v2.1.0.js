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
특정 1개 적용 				 : var 변수명 = new nSelectSet('선택자');
select disabled 상태 설정	: 변수명.selectDisable(boolean);

화면내 전체 적용			 : nSelect('클래스명');	
** 화면 내 select 가 1개일 경우 nSelArr.selectDisable(boolean);
   화면 내 select 가 다수일 경우 nSelArr[0].selectDisable(boolean); (disable 설정 필요한 select index 선택)
   만약 전체 업데이트 일 경우 반목문 적용

** select option 변경 : selBtn 클릭 시 매번 option 을 지우고 새로 생성함으로 별도 update 불필요
** select 의 selectIndex 변경 : selectIndex 변경 후 해당 select에 'change' 이벤트 dispatch 해주변 option 재 설정됨
*/

/** select 설정 ------------------------------------------------------------------------ */
var nSelArr;

/** 화면내 동일 선택자 전체 적용 시 */
function nSelect(selector) {
	var nSelectEle = document.querySelectorAll(selector);
	
	if(nSelectEle.length > 1) {
		nSelArr = new Array();
		Array.prototype.forEach.call(nSelectEle, function(el, index, array){
			nSelArr[index] = new nSelectSet(el);
		});
	} 
	else if (nSelectEle.length == 1) nSelArr = new nSelectSet(nSelectEle[0]);
	else null;
}

/** 실제 select 관련 기능 함수 */
function nSelectSet(Ele){
	var selWrap		= typeof Ele === 'string' ? document.querySelector(Ele) : Ele,
		sel			= selWrap.querySelector('select'),
		opts		= sel.querySelectorAll('option'),
		selTitle	= sel.getAttribute('title'),
		firstOp		= '',
		selHtml		= '',
		selList		= null,
		selUl		= null,
		selBtn		= null,
		selBtnTx	= null,
		optHtml		= '';

	/** select 대체 태그 생성 영역 */
	var optionCreate = function(){
		optHtml = '';
		for(i=0; i<opts.length; i++){
			if(opts[i].disabled == true) optHtml += '<li><button type="button" class="btn-sel" disabled>'+opts[i].text+'</button></li>'; 
			else {
				if(opts[i].hidden == true) optHtml += '<li class="hidden"></li>'; 
				else {
					if(opts[i].className) optHtml += '<li><button type="button" class="btn-sel '+ opts[i].className +'">'+opts[i].text+'</button></li>';
					else optHtml += '<li><button type="button" class="btn-sel">'+opts[i].text+'</button></li>';
				}
			}
			if(opts[i].selected == true) firstOp = opts[i].text;
		}
	}, selectCreate = function(){
		if(sel.disabled == true) {
			selHtml += '<button type="button" class="btn-select" title="'+selTitle+'" disabled><span></span></button>';
		} else {
			selHtml += '<button type="button" class="btn-select" title="'+selTitle+'"><span></span></button>',
			selHtml += '<div class="select-list"><ul></ul></div>';
		}
		selWrap.insertAdjacentHTML('beforeend', selHtml);

		selList		= selWrap.querySelector('.select-list'),
		selUl 		= selList.querySelector('ul'),
		selBtn		= selWrap.querySelector('.btn-select'),
		selBtnTx 	= selBtn.querySelector('span');
	}
	selectCreate();	

	function optionAdd(){		
		opts		= sel.querySelectorAll('option');
		while ( selUl.hasChildNodes() ) { selUl.removeChild( selUl.firstChild ); }
		
		optionCreate();
		selBtnTx.innerText = firstOp;
		selUl.insertAdjacentHTML('beforeend', optHtml);
	}
	optionAdd();

	/** 대체 태그 기능 설정 영역 */
	var selBtnClick = function(){
		optionAdd();
		selWrap.classList.add('on');
		selWrap.style.zIndex = 200;
	}, selLeave = function(){
		selWrap.classList.remove('on');
		selWrap.style.zIndex = '';
	}, optBtnClick = function(event){
		var tg		= event.target;
			tgTx	= tg.innerText;
		
		selBtnTx.innerText = tgTx;
		selLeave();
		selBtn.focus();
		for(o=0; o<opts.length; o++){
			if(opts[o].innerText == tgTx) opts[o].selected = true;
		}
		
		// select - change 이벤트 트리거
		/* 크롭은 한줄로 가능
		var changeEvt = new Event('change');*/
		/* IE 등 타 브라우저 */
		var changeEvt = new Event('change', { bubbles: true, cancelable: true });
		sel.dispatchEvent(changeEvt); // 공통문구
	}

	selBtn.addEventListener('click', selBtnClick);
	selWrap.addEventListener('mouseleave',selLeave);
	selUl.addEventListener('click', optBtnClick);
	sel.addEventListener('change', function(){
		optionAdd();
		selBtn.innerText = this.options[this.selectedIndex].textContent;
	});

	return {
		selectDisable : function(bln){
			bln == true ? selBtn.disabled = true : selBtn.disabled = false;
		}
	}
	
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
	var fileWrap	= typeof Ele === 'string' ? document.querySelector(Ele) : Ele,
		fileInp		= fileWrap.querySelector('input[type=file]'),
		placeholder = fileInp.getAttribute('placeholder') == null ? '' : fileInp.getAttribute('placeholder'),
		btnClear,
		urlInp		= null,
		inpHtml		= '';	

	if(fileInp.disabled == true) {
		fileWrap.classList.add('disabled');
		inpHtml += '<input type="text" class="inp-file-url" title="파일 경로" placeholder="'+placeholder+'" readonly disabled>';
	} else inpHtml += '<input type="text" class="inp-file-url" title="파일 경로" placeholder="'+placeholder+'" readonly>';

	let dom_btn = document.createElement('button');
	dom_btn.classList.add('btn-clear');
	dom_btn.setAttribute('type', 'button');
	dom_btn.textContent = '첨부파일 제거';
	btnClear = dom_btn;
	fileWrap.appendChild(btnClear);


	fileWrap.insertAdjacentHTML('beforeend', inpHtml);
	urlInp = fileWrap.querySelector('.inp-file-url');

	var valueSet = function(){
		urlInp.value = fileInp.value;
		btnClear.style.display = 'block';
	}, valueClear = function(){
		fileInp.value = '';
		urlInp.value = '';
		btnClear.style.display = 'none';
		fileInp.dispatchEvent(inputEvt);
	}
	if(fileInp.value.length > 0) valueSet();
	fileInp.addEventListener('change', valueSet);

	if(btnClear != null) {
		btnClear.addEventListener('click',valueClear);
	}
	
	// 외부호출 함수
	this.inpReset = function(){
		valueClear();
	}
	this.inpFileNameShow = function(filename){
		urlInp.value = filename;
		btnClear.style.display = 'block';
	}
}

/* 적용 예시
	nFile('클래스명');
*/

// 텍스트 입력형 input ------------------------------------------------------------------------
/**
 * 텍스트 입력형 input - 화면내 동일 선택자 전체 적용 시
 * @param {string} selector 영역 선택자
 */
function nText(selector){
	var nTextEle = document.querySelectorAll(selector);
	if(nTextEle.length > 1) {
		Array.prototype.forEach.call(nTextEle, function(el, index, array){
			nTextSet(el);
		});
	} 
	else if (nTextEle.length == 1) nTextSet(nTextEle[0]);
	else null;
}
/**
 * input 관련 기능 함수 - 개별 적용 시
 * @param {dom/string} Ele dom 요소 및 영역 선택자
 * @returns 
 */
function nTextSet(Ele){
	let textWrap	= typeof Ele === 'string' ? document.querySelector(Ele) : Ele,
		inp 		= textWrap.querySelector('input');
	
	if(inp.disabled == true || inp.readOnly == true) return;

	let btn_clear 	= document.createElement('button');
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
		inp.dispatchEvent(inputEvt);
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

/** 2중 Range input */
function doubleRange(area, unit, gap){
	const wrap = typeof area === 'string' ? document.querySelector(area) : area,
		r_gap = gap ? parseInt(gap) : 1;

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
	let allBtn = typeof allInp === 'string' ? document.querySelector(allInp) : allInp,
		name   = inpName != undefined ? inpName : allBtn.getAttribute('data-name'),
		inps   = document.querySelectorAll('input[name='+name+']'),
		inpLen = inps.length;
	
	/** 체크된 갯수 리턴 */
	function inpCount(){
		let chkLen = 0;
		for(let i=0; i<inpLen; i++) {
			if(inps[i].checked == true) chkLen++;
		}
		return chkLen;
	}
	function inpsOn(){
		inps.forEach((inp)=> { inp.checked = true; });
	}
	function inpsOff(){
		inps.forEach((inp)=> { inp.checked = false; });
	}

	inps.forEach((inp)=>{
		inp.addEventListener('click', function(){
			inpCount() == inpLen ? allBtn.checked = true : allBtn.checked = false;
		});
	})
	allBtn.addEventListener('click', function(){ this.checked == true ? inpsOn() : inpsOff(); });
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