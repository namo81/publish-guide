// javascript 함수 =====================================================

let clickEvt = new Event('click', { bubbles: true, cancelable: true }),
	changeEvt = new Event('change', { bubbles: true, cancelable: true }),
	inputEvt = new Event('input', { bubbles: true, cancelable: true });

/** 안드로이드 / ios 구분 */
function checkMobile() {
	let mobileType = navigator.userAgent.toLowerCase();
	if (mobileType.indexOf('android') > -1) {
		return 'android';
	}
	else if (mobileType.indexOf('iphone') > -1 || mobileType.indexOf('ipad') > -1 || mobileType.indexOf('ipod') > -1) {
		return 'ios';
	}
};

/** 화면이 현재 모니터에 보이고 있는지 체크하는 이벤트
document.addEventListener("visibilitychange", ()=>{
	if(document.hidden) 안보일 때 실행!!
	else 보일 때 실행!!

	// 조건문 추가 예시
	if (document.visibilityState === "visible")
	if (document.visibilityState === "hidden")
}) */

/** 이벤트 추가 함수 - 이벤트 추가 시 listener 를 별도 배열로 보관 - 추후 삭제 가능하도록. 
 * ex : object.onEvent('', function...)
*/
HTMLElement.prototype.onEvent = function (eventType, callBack, useCapture) {
	this.addEventListener(eventType, callBack, useCapture);
	if (!this.myListeners) {
		this.myListeners = [];
	};
	this.myListeners.push({ eType: eventType, callBack: callBack });
	return this;
};

/** 이벤트 제거 함수 
 * ex : object.removeListeners()
*/
HTMLElement.prototype.removeListeners = function () {
	if (this.myListeners) {
		for (var i = 0; i < this.myListeners.length; i++) {
			this.removeEventListener(this.myListeners[i].eType, this.myListeners[i].callBack);
		};
		delete this.myListeners;
	};
};

/** parents 기능 함수 - 부모요소 배열 반환 
 * ex : object.parents(selector)
*/
Element.prototype.parents = function(selector) {
	var elements = [];
	var elem = this;
	var ishaveselector = selector !== undefined;
 
	while ((elem = elem.parentElement) !== null) {
		if (elem.nodeType !== Node.ELEMENT_NODE) continue;  
		if (!ishaveselector || elem.matches(selector)) elements.push(elem);
	} 
	return elements;
};

/** offset 함수
 * ex : offset(object).top / offset(object).left
*/
function offset(elem) {
    if(!elem) elem = this;

    var x = elem.offsetLeft;
    var y = elem.offsetTop;

    while (elem = elem.offsetParent) {
        x += elem.offsetLeft;
        y += elem.offsetTop;
    }

    return { left: x, top: y };
}

/** index 반환 함수 
 * ex : getIndex(object)
*/
function getIndex( elm ){ 
    var c = elm.parentNode.children, i = 0;
    for(; i < c.length; i++ )
        if( c[i] == elm ) return i;
}

/** dom요소 style값 가져오기(타켓요소, 가져올 style, 가상요소) - 가상요소는 없을 경우 무시 가능 
 * ex : getStyle(dom요소, 'position', ':after');
*/
function getStyle(target, value, pseudo){
	return window.getComputedStyle(target, pseudo).getPropertyValue(value);	
}

/** padding, margin 값을 분류하여 top / right / bottom / left 의 object로 반환
 * ex : getStyleArr('20px') / getStyleArr('20px 20px') ...
*/
function getStyleArr(val){
	var regex 		= /[^0-9]/g,
		valArr 		= val.split(' '),
		styleArr 	= new Object();
	valArr.forEach(function(val, idx){
		valArr[idx] = Number(val.replace(regex, ''));
	});
	styleArr.top = valArr[0];
	if(valArr.length == 1) {
		styleArr.right 	= valArr[0];
		styleArr.bottom = valArr[0];
		styleArr.left 	= valArr[0];
	} else if(valArr.length == 2){
		styleArr.right 	= valArr[1];
		styleArr.bottom = valArr[0];
		styleArr.left 	= valArr[1];
	} else if(valArr.length == 3){
		styleArr.right 	= valArr[1];
		styleArr.bottom = valArr[2];
		styleArr.left 	= valArr[1];
	} else {
		styleArr.right 	= valArr[1];
		styleArr.bottom = valArr[2];
		styleArr.left 	= valArr[3];
	}
	return styleArr;
}

/** 콤마 넣기 */
function comma(str) {
	str = String(str);
	return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}

/** 콤마 풀기 */
function uncomma(str) {
	str = String(str);
	return str.replace(/[^\d]+/g, '');
}

/**
 * 배열에서 tx 와 동일한 요소 제거
 * @param {array} arr 배열
 * @param {string} tx 제거할 문구
 */
function arr_del(arr, tx){
	let findIndex = arr.indexOf(tx);
	if(findIndex > -1) { arr.splice(findIndex, 1); }
}

/**
 * 숫자 크기에 따른 순위 배열 반환
 * @param {array} data 데이터 배열(숫자로만 구성)
 * @returns 원본 배열 기준으로 해당 배열 내 숫자들의 크기 순서 배열 반환 (작은 숫자가 앞번호)
 */
function num_rank_calc(data) {
    let num = data.slice().sort((a, b) => a - b)
    return data.map(el => num.indexOf(el) + 1);
}

/**
 * replace all 기능 
 * @param {string} str 변경할 문구
 * @param {string} searchStr 지워질 글자
 * @param {string} replaceStr 대체할 글자
 * @returns 변경된 전체 문구
 * ex : replaceAll(변경할 문구, 지워질 글자, 대체할 글자);
 */
function replaceAll(str, searchStr, replaceStr) {
	return str.split(searchStr).join(replaceStr);
}

/** 숫자가 10 이하일 경우 앞에 '0' 붙이기 */
function setZero(num){
	return num < 10 ? '0' + num : num;
}

/**
 * yyyy-mm-dd 형식을 date 값으로 변환 
 * @param {string} e YYYY.MM.DD 형식
 * @param {string} sType 날짜 구분자 (./- 등)
 * @returns date 값
 */
function convertToDate(e, sType){
	var thisY = e.split(sType)[0],
	thisM = e.split(sType)[1] - 1,
	thisD = e.split(sType)[2],
	nowDate = new Date(thisY, thisM, thisD);
	return nowDate;
}
/**
 * date 값을 yyyy-mm-dd 형식으로 변환 
 * @param {date} e date 값
 * @param {string} sType 날짜 구분자 (./- 등)
 * @param {boolean} y2 연도 2자릿수표현 boolean
 * @returns YYYY.MM.DD 형식 반환
 */
function convertToYMD(e, sType, y2){
	var thisY = e.getFullYear(),
	thisM = e.getMonth() + 1,
	thisD = e.getDate(),
	nowDate;
	if(y2 == true) {
		thisY = thisY.toString();
		thisY = thisY.substr(2, 3);
	}
	if(thisM < 10) thisM = '0'+thisM;
	if(thisD < 10) thisD = '0'+thisD;
	nowDate = ''+thisY + sType + thisM + sType + thisD+'';
	return nowDate;
}

/**
 * date 값을 mm/dd 형식으로 변환
 * @param {date} e date 값
 * @param {string} sType 날짜 구분자 (./- 등)
 * @returns mm.dd 형식 string
 */
function convertToMD(e, sType){
    var thisM = e.getMonth() + 1,
    thisD = e.getDate();
    return '' + setZero(thisM) + sType + setZero(thisD)+'';
}

/**
 * date값 or 'yyyy-mm-dd 형식'을 'yyyy년 mm월 dd일' 형식으로 변환 
 * @param {date} date date값 or YYYY.MM.DD 형식의 string
 * @param {string} sType 날짜 구분자 (./- 등)
 * @returns yyyy년 mm월 dd일
 */
function convertToYMD_kr(date, sType){
	let date_tx = typeof date === 'string' ? date : convertToYMD(date, sType);
	return date_tx.split(sType)[0] + '년 ' + date_tx.split(sType)[1] + '월 ' + date_tx.split(sType)[2] + '일';
}

/**
 * 공통 함수 : 특정 영역 외 클릭 감지 
 * @param {string} area 부모요소 검색용 css selector
 * @param {dom} target 제어될 html dom 요소
 * @param {string} cls 삭제할 class
 * ex : var wrapArea = document.querySelector('.chk-area');
 * ex : outSideClick('.chk-area', wrapArea, 'show');
 */
function outSideClick(area, target, cls){
	var body = document.querySelector('body');
	body.addEventListener('mousedown', function(e){
		var tg = e.target;
		if( !tg.closest(area)) {
			target.classList.remove(cls);
			body.removeEventListener('mousedown', arguments.callee);
		}
	});
}

/**
 * dom 요소 생성 함수
 * @param {string} type html tag명
 * @param {string} cls 태그에 추가할 클래스
 * @returns 생성된 html dom 요소
 */
function createDom(type, cls){
	let dom = document.createElement(type);
	if(cls != undefined) dom.classList.add(cls);
	if(type == 'button') dom.setAttribute('type', 'button');
	return dom;
}


/**
 * 특정 요소 전체의 특정 클래스 제거
 * @param {array} tg 요소 배열
 * @param {string} cls 제거할 클래스
 */
function clsClear(tg, cls){
	tg.forEach((item)=>{
		item.classList.remove(cls);
	})
}

/** tab menu 기능 - 페이지 전체 동일 기능 적용(탭 안의 탭 등 depth 구조일 경우 사용불가) */
function nTab(selector){
	var nTabEle = document.querySelectorAll(selector);
	if(nTabEle.length > 1) {
		nTabEle.forEach(function(el, index, array){
			nTabSet(el);
		});
	} 
	else if (nTabEle.length == 1) nTabSet(nTabEle[0]);
	else null;
}

function nTabSet(Ele){
	var tabWrap	= Ele,
		tabBtn	= tabWrap.querySelectorAll('.tab-menu a'),
		tabLi	= tabWrap.querySelectorAll('.tab-menu li'),
		tabCnt	= tabWrap.querySelectorAll('.tab-cnt'),
		tgCnt	= '',
		showNum	= 0;

	var tabCntHide = function(){
		for(i=0; i<tabCnt.length; i++){
			tabCnt[i].style.display = 'none';
		}
	}

	// 화면 로드 시 활성화된 버튼에 맞는 컨텐츠 show
	for(i=0; i<tabLi.length; i++){
		if(tabLi[i].classList.contains('on')) showNum = i;
	}
	tabCntHide();
	tabCnt[showNum].style.display = 'block';

	// tab menu 클릭 기능
	var tabClick = function(event){
		var btn;
		event.target.tagName != 'A' ? btn = event.target.parentElement : btn = event.target;
		// 클릭 시 a 태그 내부에 있는 태그 클릭 시 btn 을 a 태그로 설정

		tgCnt = btn.getAttribute('href');
		for(i=0; i<tabLi.length; i++){
			tabLi[i].classList.remove('on');
		}
		btn.parentElement.classList.add('on');
		tabCntHide();
		tabWrap.querySelector(tgCnt).style.display = 'block';
	}

	for(i=0; i<tabBtn.length; i++){
		tabBtn[i].addEventListener('click', tabClick);
	}	
}

/** tab 메뉴 개별 설정형
 *	var 변수명 = new nTabMenu({
 *      wrap     : '.tab-wrap', - 탭 메뉴 및 컨텐츠를 포함하는 영역 선택자
 *      menu     : '.tab-menu', - 탭 메뉴 선택자
 *      tabCnt   : '.tab-cnt'   - 탭 컨텐츠 선택자,
 * 	   	active   : function(cnt, btn){ - 콜백함수
 * 			cnt - 활성화된 영역
 * 			btn - 클릭된 버튼
 * 	   	}
 *   });
*/
function nTabMenu(option){
	var tabWrap	= document.querySelector(option.wrap),
		tabBtn	= tabWrap.querySelectorAll(option.menu + ' a'),
		tabCnt	= tabWrap.querySelectorAll(option.tabCnt);

	function tabCntHide(){
		tabCnt.forEach(function(cnt){
			cnt.style.display = 'none';
			cnt.setAttribute('aria-hidden', true);
		});
	}
	tabCntHide();

	function tabBtnOff(){
		tabBtn.forEach(function(btn){
			btn.classList.remove('on');
			btn.setAttribute('aria-selected', false);
		});
	}

	// tab menu 클릭 기능
	function tabClick(e) {
		let btn = e.target.tagName != 'A' ? e.target.closest('a') : e.target, // 클릭 시 a 태그 내부에 있는 태그 클릭 시 btn 을 a 태그로 설정
			tg_cnt = tabWrap.querySelector(btn.getAttribute('href'));

		e.preventDefault(); // 클릭 시 scroll 이동 방지

		tabBtnOff();
		btn.classList.add('on');
		btn.setAttribute('aria-selected', true);

		tabCntHide();
		tg_cnt.style.display = '';
		tg_cnt.setAttribute('aria-hidden', false);

		if(option.active === 'function') option.active(tg_cnt, btn);
	}

	tabBtn.forEach(function(btn){
		btn.setAttribute('role', 'tab');
		btn.setAttribute('aria-controls', btn.getAttribute('href').split('#')[1]);
		btn.setAttribute('aria-selected', false);
		btn.addEventListener('click', tabClick);

		let tg_cnt = tabWrap.querySelector(btn.getAttribute('href'));
		tg_cnt.setAttribute('role', 'tabpanel');
		tg_cnt.setAttribute('aria-labelledby', btn.getAttribute('id'));

		if(btn.classList.contains('on')) {
			btn.setAttribute('aria-selected', true);
			tg_cnt.style.display = '';
			tg_cnt.setAttribute('aria-hidden', false);
		}
	});
}

/**
 * check 전체 선택 제어 기능
 * @param {string} allcls 전체 input 의 선택자
 * @param {string} inpcls 대상요소들의 name 명
 */
function checkAll(allcls, inpcls){
	let allBtn = document.querySelector(allcls),
		name   = inpName != undefined ? inpName : allBtn.getAttribute('data-name'),
		inps   = document.querySelectorAll('input[name='+name+']'),
		inpLen = inps.length;

	let changeEvt = new Event('change');

	let inpsOn = function(){
		for(let i=0; i<inpLen; i++) {
			inps[i].checked = true;
			inps[i].dispatchEvent(changeEvt);
		}
	}, inpsOff = function(){
		for(let i=0; i<inpLen; i++) {
			inps[i].checked = false;
			inps[i].dispatchEvent(changeEvt);
		}
	}, inpCount = function(){
		let chkLen = 0;
		for(let i=0; i<inpLen; i++) {
			if(inps[i].checked == true) chkLen++;
		}
		return chkLen;
	}, inpsChk = function(idx){
		inps[idx].addEventListener('click', function(){
			inpCount() == inpLen ? allBtn.checked = true : allBtn.checked = false;
		});
	}

	allBtn.addEventListener('click', function(){
		this.checked == true ? inpsOn() : inpsOff();
	});

	for(let i=0; i<inpLen; i++) {
		inpsChk(i);
	}
}

// 말풍선 요소 - 단일 사용
function nBalloonTgl(area) {
	var wrap 	= typeof area === 'string' ? document.querySelector(area) : area,
		btn 	= wrap.querySelector('.btn-bln'),
		clsBtn 	= wrap.querySelector('.btn-bln-close');
		
		btn.addEventListener('click', function(){ wrap.classList.toggle('on'); });
		if(!clsBtn) return;
		clsBtn.addEventListener('click', function(){ wrap.classList.remove('on'); });
}

// 말풍선 요소 - 다수 적용
function nBalloonTgls(selector) {
	var nBallEle = document.querySelectorAll(selector);

	if(nBallEle.length > 1) {
		nBallEle.forEach(function(el, index, array){
			nBalloonTgl(el);
		});
	} 
	else if (nBallEle.length == 1) nBalloonTgl(nBallEle[0]);
	else null;
}
// ex 단독 : nBalloonTgl('css 선택자' or element);
// ex 다수 : nBalloonTgls('css 선택자');


// 좌우 스크롤 메뉴 기능 (뷰가드ai 적용)
function scrollMenuSet(area, gap){
	var wrap	= typeof area === 'string' ? document.querySelector(area) : area,
		list 	= wrap.querySelector('ul'),
		items	= wrap.querySelectorAll('li'),
		listW 	= 0,
		gap 	= gap ? gap : 0;

	var moveChk		= false, // pc일 경우 mousemove 여부 체크
		clickChk 	= true,  // pc일 경우 mousemove 에 따른 click 기능 제어용 변수
		nowScLeft	= 0;
	
	items.forEach(function(item){
		listW += item.offsetWidth;
		item.addEventListener('click', btnClick);
	});
	list.style.width = listW + 'px'; 

	var classOff = function(){
		items.forEach(function(item){
			item.classList.remove('on');
		});
	}

	function btnClick(e){
		if(clickChk == false) {
			clickChk = true;
			return;
		}
		if(e.target.tagName != 'BUTTON' && e.target.tagName != 'A' ) return;
		var tgLi = e.target.parentNode;
		classOff();
		tgLi.classList.add('on');
		var tgL = tgLi.offsetLeft - (wrap.offsetWidth / 2) + (tgLi.offsetWidth / 2) - gap;
		animateScroll(wrap, tgL, 300);
		nowScLeft = tgL;
	}

	function scrollInit(){
		var tgLi = list.querySelector('li.on'),
			tgL = tgLi.offsetLeft - (wrap.offsetWidth / 2) + (tgLi.offsetWidth / 2) - gap;
		wrap.scrollLeft = tgL;
	}
	scrollInit();

	// pc 일 경우
	if ( !navigator.userAgent.match(/Android/i) && !navigator.userAgent.match(/iPhone/i) ){
		var startX;
		wrap.addEventListener('mousedown', function(e){
			moveChk = false;
			startX = e.pageX;			
			wrap.onEvent('mousemove', function(e){
				moveChk = true;
				wrap.scrollTo(nowScLeft + (startX - e.pageX), 0);
			});
		});
		wrap.addEventListener('mouseup', function(e){
			moveChk ? clickChk = false : clickChk = true;
			wrap.removeListeners('mousemove');
			nowScLeft = wrap.scrollLeft;
		});
	}
}


/* scroll animation */
function animateScroll(scrollObj, targetVal, duration, direction, gap){
	var scrollEle 	= typeof scrollObj === 'string' ? document.querySelector(scrollObj) : scrollObj,
		gapPos 		= gap ? gap : 0,
		dur			= duration ? duration : 500;
	
	var currentPos = direction == 'x' ? scrollEle.scrollLeft : scrollEle.scrollTop,
		targetPos  = targetVal - gapPos;
	
	animateScrollTo();

	function animateScrollTo() {
		var startTime = new Date().getTime();
		var endTime = new Date().getTime() + dur;

		var scrollTo = function() {
			var now = new Date().getTime(),
				passed = now - startTime,
				ease = easeOutQuad(passed / dur);
			if (now <= endTime) {
				if(direction == 'x') scrollEle.scrollLeft = currentPos + (targetPos - currentPos) * ease;
				else scrollEle.scrollTop = currentPos + (targetPos - currentPos) * ease;
				requestAnimationFrame(scrollTo);
			}
		};
		requestAnimationFrame(scrollTo);
	};
}
// ex : animateScroll(스크롤될 영역, 목표 스크롤값, 애니메이션 시간, 방향, 목표 스크롤값에 적용된 gap);

/* ease func */
function easeInSine(x) { return 1 - Math.cos((x * Math.PI) / 2); }
function easeOutSine(x) { return Math.sin((x * Math.PI) / 2); }
function easeInOutSine(x) {	return -(Math.cos(Math.PI * x) - 1) / 2; }

function easeInQuad(x) { return x * x; }
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function easeInOutQuad(x){ return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

function easeInCubic(x) { return x * x * x; }
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

function easeInQuart(x) { return x * x * x * x; }
function easeOutQuart(x) { return 1 - Math.pow(1 - x, 4); }
function easeInOutQuart(x) { return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; }

function easeInQuint(x) { return x * x * x * x * x; }
function easeOutQuint(x) { return 1 - Math.pow(1 - x, 5); }
function easeInOutQuint(x) { return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2; }

function easeInExpo(x) { return x === 0 ? 0 : Math.pow(2, 10 * x - 10); }
function easeOutExpo(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function easeInOutExpo(x) {
	return x === 0
		? 0
		: x === 1
		? 1
		: x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
		: (2 - Math.pow(2, -20 * x + 10)) / 2;
}

function easeInCirc(x) { return 1 - Math.sqrt(1 - Math.pow(x, 2)); }
function easeOutCirc(x) { return Math.sqrt(1 - Math.pow(x - 1, 2)); }
function easeInOutCirc(x) {
	return x < 0.5
	  ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
	  : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}