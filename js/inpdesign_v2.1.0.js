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

/** 화면내 동일 선택자 전체 적용 시 */
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

/** 실제 file 관련 기능 함수 */
function nFileSet(Ele){
	var fileWrap	= typeof Ele === 'string' ? document.querySelector(Ele) : Ele,
		fileInp		= fileWrap.querySelector('input[type=file]'),
		placeholder = fileInp.getAttribute('placeholder') == null ? '' : fileInp.getAttribute('placeholder'),
		btnClear	= fileWrap.querySelector('.btn-clear'),
		urlInp		= null,
		inpHtml		= '';	

	if(fileInp.disabled == true) {
		fileWrap.classList.add('disabled');
		inpHtml += '<input type="text" class="inp-file-url" title="파일 경로" placeholder="'+placeholder+'" readonly disabled>';
	} else inpHtml += '<input type="text" class="inp-file-url" title="파일 경로" placeholder="'+placeholder+'" readonly>';

	fileWrap.insertAdjacentHTML('beforeend', inpHtml);
	urlInp = fileWrap.querySelector('.inp-file-url');

	var valueSet = function(){
		urlInp.value = fileInp.value;
		btnClear.style.display = 'block';
	}, valueClear = function(){
		fileInp.value = '';
		urlInp.value = '';
		btnClear.style.display = 'none';
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

/** 화면내 동일 선택자 전체 적용 시 */
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

/** 실제 input 관련 기능 함수 - 개별 적용 시 */
function nTextSet(Ele){
	var textWrap	= typeof Ele === 'string' ? document.querySelector(Ele) : Ele,
		inp 		= textWrap.querySelector('input'),
		btnClear	= textWrap.querySelector('.btn-clear');
	
	inp.addEventListener('focus', btnControl);
	inp.addEventListener('input', btnControl);
	inp.addEventListener('propertychange', btnControl);

	function btnControl(e){
		if(e.target.value.length > 0) btnClear.style.display = 'block';
		else btnClear.style.display = 'none';
	};

	btnClear.addEventListener('click', function(e){
		inp.value = '';
		e.target.style.display = 'none';
	});
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

/* 실행문 예시 ---------------------------------------------------
window.onload = function(){

	nSelect('.inp-select');
	//nSelArr.selectUpdate();

	nFile('.inp-file');

	nText('.inp-label');
};
*/