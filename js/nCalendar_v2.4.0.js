// calendar
// 서남호(namo) - for m.s.p
// 2020-02-24 - fn / extend 만 jquery 활용한 버전 제작 - 추후 패턴 공부 후 fn/extend 모두 제거 예정
// 2020-03-19 - 선택제한 기능추가에 따른 이전/다음 버튼 비활성화 기능 추가
// 2020-08-05 - 달력 외 영역 클릭 시 달력 hide 추가
// 2020-09-24 - v2.1.0 : 기간 제한 관련 기능 정리
// 2020-12-24 - v2.2.0 : jquery 제거
// 2021-12-27 - v2.3.0 : 페이지 고정형 옵션 추가
// 2024-06-18 - v2.4.0 : 일간 - 월간 전환기능 추가 / 일간,월간 달력 함수 조정

function nCalendar(option){

	let calInp          = typeof option.calInp === 'string' ? document.querySelector(option.calInp) : option.calInp,
		showType        = option.showType ? option.showType : 'button',						// both / button / input
		calTitle 	    = option.calTitle,													// 달력 타이틀
		splitTx 		= option.splitTx ? option.splitTx : '-',							// 날짜 구분선 '-' 이나 '.' 2가지만 가능
		positionSet	    = option.positionSet != undefined ? option.positionSet : true,		// true : inp 위치에 달력 설정 / fasle : 별도 설정 없음
		gapTop			= option.gapTop ? option.gapTop : 0,								// 달력 top 위치 gap
		gapLeft			= option.gapLeft ? option.gapLeft : 0,								// 달력 left 위치 gap
		calType         = option.calType ? option.calType : null,							// null: 일반 기본형 ,  month : 월간달력
		langType		= option.langType ? option.langType : 'kr',							// kr : 한글, en : 영문 (월~일 표기)
		changeMon       = option.changeMon != undefined ? option.changeMon : true,			// 월 선택 select 활성 여부
		changeYear      = option.changeYear != undefined ? option.changeYear : true,		// 연도 선택 select 활성 여부
		monthShift  	= option.monthShift != undefined ? option.monthShift : false,		// 연/월 선택 시 '월간 달력' 전환 여부 - 일간달력에서만 사용
		yearRange       = option.yearRange ? option.yearRange : '2019:2040',				// 연도 제한
		showBtnPanel    = option.showBtnPanel != undefined ? option.showBtnPanel : true,	// 하단 버튼 영역 show/hide 선택 - 오늘/닫기 버튼
		closeBtnTx      = option.closeBtnTx ? option.closeBtnTx : '닫기',					// 닫기 버튼 텍스트
		todayBtnTx      = option.todayBtnTx ? option.todayBtnTx : '오늘',					// 오늘 버튼 텍스트
		controls        = option.controls != undefined ? option.controls : true,			// 이전달/다음달 버튼 show/hide 선택
		nextTx          = option.nextTx ? option.nextTx : '>',								// 다음달 버튼 텍스트
		prevTx          = option.prevTx ? option.prevTx : '<',								// 이전달 버튼 텍스트
		todayLimit      = option.todayLimit ? option.todayLimit : false,					// 오늘 기준 선택 제한
		todayGap 		= option.todayGap ? option.todayGap : '0D', 						// 오늘 기준일의 gap 설정 (ex. 내일부터 제한, 5일전까지 제한 등)
		limitType       = option.limitType ? option.limitType : 'before',					// 제한 방향 설정 - before : 오늘 이전 날짜 선택 제한 / after : 오늘 이후 날짜 선택 제한
		limitGap 		= option.limitGap ? option.limitGap : null, 						// 제한 기간 설정 - null : 기한 없음 / nY : n년 / nM : n개월 / nD : n일
		inPage			= option.inPage ? option.inPage : false,							// 페이지 내 표기 선택
		inTarget		= option.inTarget ? option.inTarget : null							// 페이지 표기 할 영역 선택
	
	//초기 날짜 관련 세팅 및 변수 ----------------------------------------------------------------------------
	let now         = new Date(),
		thisYear    = now.getFullYear(), 	// 오늘 날짜 포함된 연도 - today 설정용
		thisMonth   = now.getMonth(),		// 오늘 날짜 포함된 월
		today       = now.getDate(),		// 오늘 날짜
		nowVal 		= new Date(thisYear, thisMonth, today, 0, 0, 0).valueOf(), // 오늘 날짜의 valueOf 값
		activeYear, activeMonth, activeDay, // 선택된 날짜용 변수
		activeVal, 							// 선택된 날짜의 valueOf 값
		year, month, day,					// 달력 생성용 변수
		firstDay,							// 해당 월의 첫째 날 
		firstYoil,							// 해당 월 첫째날의 요일 값
		shiftState = false;   				// 월 > 일간 달력 전환 관련 변수

	// 언어별 요일/월 표기 및 윤달 관련
	/** 각 월의 요일수 */
	let nalsu = new Array(31,28,31,30,31,30,31,31,30,31,30,31);
	/** 일~토 표기 텍스트 */
	let weekTx = langType == 'kr' ? new Array("일", "월", "화", "수", "목", "금", "토") : new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
	/** 1~12월 영문 텍스트 */
	let monTxEng = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");

	/** 2월 윤년 체크 함수 */
	function nalsu29(){ year % 4 === 0 && year % 100 !== 0 || year % 400 === 0 ? nalsu[1] = 29 : nalsu[1] = 28;	}

	// 날짜 제한 관련 (v2.1.0) ----------------------------------------------------------------------------
	let limitDay, // 오늘 or todayGap 적용된 날짜
		limitDayVal, // limitDay 의 valueOf 값
		limitMonVal, // limitDay 가 포함된 달 1일의 valueOf 값
		limitY, limitM, limitD, 
		limitGapDay, // 최종 제한일 (ex : 오늘이전 1년까지 제한일 경우 1년전 오늘)
		limitGapDayVal, // limitGapDay 의 valueOf 값
		limitGapMonVal, // limitGapDay 가 포함된 달 1일의 valueOf 값
		limitGapY, limitGapM, limitGapD;

	/**
	 * 기준일 / gap 값을 넣으면 기준일에서 gap 만큼의 날짜를 반환
	 * @param {date} dayVal javascript 날짜 데이터
	 * @param {string} gapVal gap 차이값 (nY : n년 / nM : n개월 / nD : n일)
	 * @returns 기준일에서 gap 차이 만큼의 date 값
	 */
	function com_calcGapDay(dayVal, gapVal) {
		let val, 
			gapY = 0,
			gapM = 0, 
			gapD = 0;
		if(gapVal != null) {
			if(typeof(gapVal) === 'string') {
				let gapTx  = gapVal.substr(-1,1);
				if(gapTx == 'Y') gapY = Number(gapVal.replace('Y',''));
				else if(gapTx == 'M') gapM = Number(gapVal.replace('M',''));
				else gapD = Number(gapVal.replace('D',''));
			} else gapD = gapVal;
		}
		limitType == 'before' ? val = new Date(dayVal.getFullYear() + gapY,  dayVal.getMonth() + gapM,  dayVal.getDate() + gapD, 0, 0, 0) : val = new Date(dayVal.getFullYear() - gapY,  dayVal.getMonth() - gapM,  dayVal.getDate() - gapD, 0, 0, 0);
		return val;
	}

	// 오늘 제한 및 선택제한 일자 관련 변수 내용 설정
	if(todayLimit == true) {
		limitDay = com_calcGapDay(now, todayGap);
		limitDayVal = limitDay.valueOf();
		limitY = limitDay.getFullYear();
		limitM = limitDay.getMonth();
		limitD = limitDay.getDate();
		limitMonVal = new Date(limitY, limitM, 1, 0, 0, 0).valueOf();

		if(limitGap != null) {
			limitGapDay = com_calcGapDay(limitDay, limitGap);
			limitGapDayVal = limitGapDay.valueOf();
			limitGapY = limitGapDay.getFullYear();
			limitGapM = limitGapDay.getMonth();
			limitGapD = limitGapDay.getDate();
			limitGapMonVal = new Date(limitGapY, limitGapM, 1, 0, 0, 0).valueOf();
		}
	}

	//연도 range 관련
	let minYear, maxYear;

	if(yearRange != null){
		minYear = Number(yearRange.split(':')[0]),
		maxYear = Number(yearRange.split(':')[1]);
		if(todayLimit == true) {
			if(limitType == 'after') {
				maxYear = limitY; 
				if(limitGap != null) minYear = limitGapY;
			} else {
				minYear = limitY;
				if(limitGap != null) maxYear = limitGapY;
			}
		}
	}

	/** 일간달력 - 매월 1일의 요일 추출 */
	function chkFirstYoil(){
		firstDay	= new Date(year, month, 1);
		firstYoil	= firstDay.getDay();			
		nalsu29();
	}
	/** 날짜 초기화(오늘 기준) */
	function resetDate(){
		if(shiftState == true) return;
		year	= thisYear;
		month	= thisMonth;
		day		= today;
	}
	/** inp 입력값 대응하여 연/월/일 산출 */
	function dateSetToInp( tg ){ // input 에 값이 있을 경우 해당 값으로 연/월/일 설정
		if(shiftState == true) return;
		let dateTx = tg.value;
		year = Number(dateTx.split(splitTx)[0]);
		month = Number(dateTx.split(splitTx)[1]) -1;
		day = Number(dateTx.split(splitTx)[2]);
		// 선택된 날짜용 변수 설정
		activeYear = year;
		activeMonth = month;
		activeDay = day;
	}
	
	/* 기본요소 그리기 (wrap/버튼 등) ------------------------------------------------------------------------ */
	let inp	= calInp, 	// input
		wrap,               // 달력 영역 전체
		yearObj,			// 연도선택 select / span 요소
		monthObj,			// 월 선택 select / span 요소
		btn_month, 			// 월 선택 달력변경 버튼
		btn_show,			// shiwType 가 both 나 button 일 경우 버튼
		btn_today, 			// 오늘 / 이번달 버튼
		btn_close,			// 닫기 버튼
		btn_next,			// 다음달/다음연도 버튼
		btn_prev;			// 이전달/이전연도 버튼

	// 달력 영역 기본구조 생성
	let newCal = document.createElement('div'),
		inbox  = document.createElement('div'),
		calTop = document.createElement('div'), // 달력 상단 제어영역
		calArea = document.createElement('div'), // 달력 테이블 영역
		btnArea = document.createElement('div'), // 오늘/닫기 버튼 감싸는 영역
		calTit;

	if(inPage == true) {
		newCal.classList.add('in-page');
		inTarget != null ? document.querySelector(inTarget).appendChild(newCal) : inp.parentNode.appendChild(newCal);
	} else document.querySelector('body').appendChild(newCal);	
	wrap = newCal;
	wrap.classList.add('cal-wrap');
	inbox.classList.add('cal-cnt');
	calTop.classList.add('cal-top');
	calArea.classList.add('cal-area');
	btnArea.classList.add('cal-btns');

	wrap.setAttribute('tabindex', '0');
	wrap.appendChild(inbox);

	/** 타이틀 영역 */
	if(calTitle != undefined) {
		calTit = document.createElement('div');
		calTit.classList.add('cal-title');
		calTit.textContent = calTitle;
		inbox.appendChild(calTit);
	}
	
	inbox.appendChild(calTop);
	inbox.appendChild(calArea);

	// calTop 관련 기능 ------------------------------------------------------------------
	/** calTop - 이전/다음 버튼 생성 */
	function com_calTop_PN(){
		calTop.insertAdjacentHTML('afterbegin', '<button type="button" class="cal-btn prev">'+prevTx+'</button>');
		calTop.insertAdjacentHTML('beforeend', '<button type="button" class="cal-btn next">'+nextTx+'</button>');
		btn_prev = wrap.querySelector('.cal-btn.prev'),
		btn_next = wrap.querySelector('.cal-btn.next');
	}
	/** calTop - 일간 달력 - 월간 전환 생성 */
	function calTop_day_shift(){
		let cntstr = '<button type="button" class="btn_month-sel"><span class="cal-now-tx year"></span> - <span class="cal-now-tx month"></span></button>';
		calTop.insertAdjacentHTML('beforeend', cntstr);
		btn_month = wrap.querySelector('.btn_month-sel');
		yearObj = wrap.querySelector('.cal-now-tx.year');
		monthObj = wrap.querySelector('.cal-now-tx.month');

		btn_month.addEventListener('click', function(){
			shiftState = true;
			calShow('month');
		});
	}

	/**
	 * select 생성 함수 (option 값이 순차적 숫자만 가능)
	 * @param {number} min 최소값
	 * @param {number} max 최대값
	 * @param {string} cls class 명
	 * @param {string} title title 값
	 * @returns 생성된 select
	 */
	function createSelect(min, max, cls, title){
		let sel = document.createElement('select');
		sel.classList.add(cls);
		sel.setAttribute('title', title);

		for(let i = min; i < max + 1; i++){
			let option = document.createElement("option");
			option.value = i;
			option.text = i;
			sel.appendChild(option);
		}
		return sel;
	}

	/** calTop - 일간 달력용 표기 생성 */
	function calTop_day(){
		// 상단 - 연도 타이틀 생성
		if(changeYear == true){
			let sel_year = createSelect(minYear, maxYear, 'sel-year', '연도 선택');
			calTop.appendChild(sel_year);
			yearObj = sel_year;
		} else {
			let cntstr = document.createElement('span');
			cntstr.classList.add('cal-now-tx');
			cntstr.classList.add('year');
			calTop.appendChild(cntstr);
			yearObj = cntstr;
		}
		// 상단 - 월 타이틀 생성
		if(changeMon == true){
			let sel_mon = createSelect(1, 12, 'sel-month', '월 선택');
			calTop.appendChild(sel_mon);
			monthObj = sel_mon;
		} else {
			let cntstr = document.createElement('span');
			cntstr.classList.add('cal-now-tx');
			cntstr.classList.add('month');
			calTop.appendChild(cntstr);
			monthObj = cntstr;
		}
	}
	
	/** calTop - 월간 달력용 표기 생성 */
	function calTop_mon(){
		// 상단 - 연도 타이틀 생성
		if(changeYear == true && monthShift == false){
			let sel_year = createSelect(minYear, maxYear, 'sel-year', '연도 선택');
			calTop.appendChild(sel_year);
			yearObj = sel_year;
		} else {
			let cntstr = document.createElement('span');
			cntstr.classList.add('cal-now-tx');
			cntstr.classList.add('year');
			calTop.appendChild(cntstr);
			yearObj = cntstr;
		}
	}

	/** 하단 버튼영역 생성 */
	function btnArea_set(){
		inbox.appendChild(btnArea);
		if(todayBtnTx != null){
			let btn_t = document.createElement('button');
			btn_t.classList.add('btn-cal-today');
			btn_t.setAttribute('type', 'button');
			btn_t.textContent = todayBtnTx;
			btnArea.appendChild(btn_t);
			btn_today = btn_t;
		}
		if(closeBtnTx != null && inPage == false){
			let btn_c = document.createElement('button');
			btn_c.classList.add('btn-cal-close');
			btn_c.setAttribute('type', 'button');
			btn_c.textContent = closeBtnTx;
			btnArea.appendChild(btn_c);
			btn_close = btn_c;
		}
		if(inPage == false) btn_close.addEventListener('click', com_calClose);
	}

	/** 상단 연도 표기 설정 */
	function com_yearSet(){
		if(changeYear == true && monthShift == false){
			let yearOpts = yearObj.querySelectorAll('option');
			for(o=0; o< yearOpts.length; o++){
				if(yearOpts[o].value == year) yearOpts[o].selected = true;
			}
		} else {
			yearObj.textContent = year;
		}
	}

	/* common functions ------------------------------------------------------------------------ */
	/** 달력 생성 위치 설정 함수 */
	function com_calPosition(){
		if(inPage == true || positionSet == false) return;
		let top		= offset(inp).top,
			left	= offset(inp).left;

		let par = inp.parents();
		for(let p=0; p<par.length; p++){
			if(par[p].style.position == 'fixed') wrap.style.position = 'fixed';
		}
		wrap.style.top = top + inp.offsetHeight + gapTop + 'px';
		wrap.style.left = left + gapLeft + 'px';
	}

	/**
	 * yyyy-mm-dd 형식을 date 값으로 변환
	 * @param {string} e 날짜형식 (yyyy.mm.dd)
	 * @returns date 값
	 */
	function changeToDate(e){
		let thisY = e.split(splitTx)[0],
		thisM = e.split(splitTx)[1] - 1,
		thisD = e.split(splitTx)[2],
		nowDate = new Date(thisY, thisM, thisD);
		return nowDate;
	}
	/**
	 * date 값을 yyyy-mm-dd 형식으로 변환
	 * @param {date} e date 값
	 * @returns yyyy.mm / yyyy.mm.dd 형식 string 값
	 */
	function changeToYMD(e){
		let thisY = e.getFullYear(),
		thisM = e.getMonth() + 1,
		thisD = e.getDate(),
		nowDate;
		if(thisM < 10) thisM = '0'+thisM;
		if(thisD < 10) thisD = '0'+thisD;
		nowDate = calType == 'month' ? ''+thisY+splitTx+thisM+'' : ''+thisY+splitTx+thisM+splitTx+thisD+'';
		return nowDate;
	}

	// close ------------------------------------------------------------------
	/** 달력 닫기 함수 */
	function com_calClose(){
		wrap.style.top = '';
		wrap.style.left = '';
		wrap.classList.remove('on');
		inp.focus();
		shiftState = false;
	}
	/** 화면내 띄워진 달력 전체 닫기 */
	function com_calCloseAll(){
		let wrapAll = document.querySelectorAll('.cal-wrap');
		for(a=0; a<wrapAll.length; a++){
			if(wrapAll[a].classList.contains('in-page')) return;
			wrapAll[a].style.top = '';
			wrapAll[a].style.left = '';
			wrapAll[a].classList.remove('on');
		}
	}	
	/** 달력 외 영역 클릭 시 달력 hide */
	function com_outSideClick(){
		let body = document.querySelector('body');
		body.addEventListener('mousedown', function(e){
			let tg = e.target;
			if( !tg.closest('.cal-wrap') ) {
				com_calClose();
				this.removeEventListener('mousedown', arguments.callee);
			}
		});
	}
	
	/** 달력 내용 지우기 */
	function cal_remove(){
		while (calTop.firstChild) calTop.removeChild(calTop.firstChild);
		while (calArea.firstChild) calArea.removeChild(calArea.firstChild);
		if(wrap.querySelector('.cal-btns')) inbox.removeChild(btnArea);
		while (btnArea.firstChild) btnArea.removeChild(btnArea.firstChild);
	}
	
	/** 선택날짜 클래스 제거 */
	function setMarkReset(){
		let chkBtn = calArea.querySelectorAll('button');
		Array.prototype.forEach.call(chkBtn, function(btn){
			btn.classList.remove('select-day');
		});
	}

	
	/* 달력 그리기 및 호출 ------------------------------------------------------------------------ */
	/** 일간 달력 그리기 */
	function calDraw(){
		top_btm_draw();
		com_yearSet();
		monthSet();
		chkFirstYoil();
		makeCalendar(firstYoil, nalsu[month], year, month + 1);
		if(todayLimit == true) limitPNSet();
	}

	/** 월간 달력 그리기 */
	function calDraw_mon(){
		top_btm_draw_mon();
		com_yearSet();
		makeCalendar_mon(year);
		if(todayLimit == true) limitPNSet_mon();
	}

	/** 일간-월간 달력 구분 (inp 및 btn을 통한 호출에만 사용) */
	function calShow_type(){
		calType == 'month' ? calShow('month') : calShow();
	}

	/** 달력 보이기 함수 */
	function calShow(type){
		com_calCloseAll();
		inp.value.length > 0 ? dateSetToInp(inp) : resetDate();
		com_calPosition();
		type == 'month' ? calDraw_mon() : calDraw();
		wrap.classList.add('on');
		wrap.focus();
		
		if(inPage == false) com_outSideClick(); // 달력 외 영역 클릭 시 달력 hide
	}

	// cal showType ------------------------------
	if(showType == 'input'){
		inp.addEventListener('click', calShow_type);
		inp.addEventListener('keyup', function(e){
			let key = e.keyCode || e.which;
			if(key == 9) calShow_type();
		});
	} else if (showType == 'button'){
		inp.insertAdjacentHTML('afterend', '<button type="button" class="btn-cal">달력보기</button>');
		btn_show = inp.nextSibling;
		btn_show.addEventListener('click', calShow_type);
	} else {
		inp.insertAdjacentHTML('afterend', '<button type="button" class="btn-cal">달력보기</button>');
		btn_show = inp.nextSibling;
		btn_show.addEventListener('click', calShow_type);
		inp.addEventListener('click', calShow_type);
		inp.addEventListener('keyup', function(e){
			let key = e.keyCode || e.which;
			if(key == 9) calShow_type();
		});
	}
	if(inp.disabled == true) btn_show.disabled = true;

	/* 일간 달력 전용 함수 ============================================================================================================================================== */
	/** 일간달력 calTop / btnArea 영역 그리기 */
	function top_btm_draw(){
		cal_remove();

		if(monthShift == true) calTop_day_shift();
		else calTop_day();
		
		if(changeYear == true) yearObj.addEventListener('change',yearChange);		
		if(changeMon == true) monthObj.addEventListener('change',monthChange);

		if(controls == true) {
			com_calTop_PN();
			btn_prev.addEventListener('click', prevMonth);
			btn_next.addEventListener('click', nextMonth);
		}

		// 하단 오늘/닫기 버튼 영역
		if(showBtnPanel == true) {
			btnArea_set();
			if(btn_today.textContent != todayBtnTx) btn_today.textContent = todayBtnTx;
			btn_today.addEventListener('click',goToday);
		}
	}

	// cal reDraw ------------------------------
	/** 이전달 달력 그리기 */
	function prevMonth(){
		if(month > 0) month--;
		else {
			if( year > minYear ) year--;
			month = 11;
		}
		calDraw();
	}
	/** 다음달 달력 그리기 */
	function nextMonth(){
		if(month < 11) month++;
		else { 
			if( year < maxYear ) year++;
			month = 0;
		}
		calDraw();
	}
	/** 일간달력 - 연도 select 변경 시 실행 함수 */
	function yearChange(e){
		year = e.target.value;
		if(todayLimit == false) { 
			calDraw();
			return;
		}			
		if(limitType == 'after') {
			if(year == limitY) month > limitM ? month = limitM : null;
			if(limitGap != null && year == limitGapY) month < limitGapM ? month = limitGapM : null;
		} else {
			if(year == limitY) month < limitM ? month = limitM : null;
			if(limitGap != null && year == limitGapY) month > limitGapM ? month = limitGapM : null;
		}
		calDraw();
	}
	/** 월 select 변경 시 실행함수 */
	function monthChange(e){
		month = e.target.value - 1;
		calDraw();
	}

	/** 월 select 설정함수 (limit 에 따른 제한) */
	function monthSet(){
		if(changeMon == false || monthShift == true) {
			monthObj.textContent = month + 1;
			return;
		}
		let monOpts = monthObj.querySelectorAll('option');
		for(o=0; o< monOpts.length; o++){
			if(monOpts[o].value == month + 1) monOpts[o].selected = true;
		}
		if(todayLimit == false) return;
		for(o=0; o< monOpts.length; o++){
			monOpts[o].style.display = 'block';
			if(limitType == 'after') {
				if(limitGap == null) {
					if(year == limitY && monOpts[o].value > limitM + 1) monOpts[o].style.display = 'none';
				} else {
					if(limitY == limitGapY) {
						if(year == limitY) monOpts[o].value > limitM + 1 || monOpts[o].value < limitGapM + 1 ? monOpts[o].style.display = 'none' : null;
					} else {
						if(year == limitY && monOpts[o].value > limitM + 1) monOpts[o].style.display = 'none';
						else if(year == limitGapY && monOpts[o].value < limitGapM + 1) monOpts[o].style.display = 'none';
					}
				}
			} else {
				if(limitGap == null) {
					if(year == limitY && monOpts[o].value < limitM + 1) monOpts[o].style.display = 'none';
				} else {
					if(limitY == limitGapY) {
						if(year == limitY) monOpts[o].value < limitM + 1 || monOpts[o].value > limitGapM + 1 ? monOpts[o].style.display = 'none' : null;
					} else {
						if(year == limitY && monOpts[o].value < limitM + 1) monOpts[o].style.display = 'none';
						else if(year == limitGapY && monOpts[o].value > limitGapM + 1) monOpts[o].style.display = 'none';
					}
				}
			}
		}
	}

	/** 오늘 날짜 포함월 그리기 */
	function goToday(){
		resetDate();
		calDraw();
	}

	// input date write -----------------------
	/** 일간 달력 내 버튼 선택 시 실행함수 */
	function dateSelect(e){
		let dateBtn = e.target.tagName == 'BUTTON' ? e.target : e.target.closest('BUTTON'),
			inpDate = new Date(dateBtn.getAttribute('data-date'));

		inp.value = changeToYMD(inpDate);
		if(inPage == false) com_calClose();
		else {
			dateSetToInp(inp);
			setMarkReset();
			setDateMark();
		}
		inp.dispatchEvent(changeEvt);
	}
	/** 일간 달력 내 버튼 제한 및 실행기능 적용 */
	function dateBtnSet(){
		let btnDate = wrap.querySelectorAll('td button');
		for(b=0; b<btnDate.length; b++){
			btnDate[b].addEventListener('click', dateSelect);
			if(todayLimit == true) limitSet(btnDate[b]);
		}
	}

	/** todayLimit 관련 달력내 버튼 disabled 설정 함수 */
	function limitSet(tg){
		let tg_btn = tg,
			val = new Date(tg_btn.getAttribute('data-date') + 'T00:00:00').valueOf();

		if(limitType == 'after') {
			if(val > limitDayVal) tg_btn.disabled = true;
			if(limitGap != null && val < limitGapDayVal) tg_btn.disabled = true;
		} else {
			if(val < limitDayVal) tg_btn.disabled = true;
			if(limitGap != null && val > limitGapDayVal ) tg_btn.disabled = true;
		}
	}

	/** 오늘 날짜 제한 시 - 이전/다음 버튼 비활성화 */
	function limitPNSet(){
		if(limitType == 'after') {
			year >= limitY && month >= limitM ? btn_next.disabled = true : btn_next.disabled = false;
			if(limitGap != null) year <= limitGapY && month <= limitGapM ? btn_prev.disabled = true : btn_prev.disabled = false;
		} else {
			year <= limitY && month <= limitM ? btn_prev.disabled = true : btn_prev.disabled = false;
			if(limitGap != null) year >= limitGapY && month >= limitGapM ? btn_next.disabled = true : btn_next.disabled = false;
		}
	}

	/** 오늘 및 선택된 날짜 표기 */
	function setDateMark(){
		let chkBtn = calArea.querySelectorAll('button');
		activeVal = new Date(activeYear, activeMonth, activeDay, 0, 0, 0).valueOf();
		chkBtn.forEach( (btn) => {
			let tg_Date = new Date(btn.getAttribute('data-date'));
				tg_year = tg_Date.getFullYear(),
				tg_mon  = tg_Date.getMonth(),
				tg_day  = tg_Date.getDate(),
				val = new Date(tg_year, tg_mon, tg_day, 0, 0, 0).valueOf();
			if(val == nowVal) btn.classList.add('today');
			if(val == activeVal) btn.classList.add('select-day');
		});
	}
	/** setDateMark 함수 실행제한 함수(오늘 및 선택일 포함안된 월일 경우 실행안되게) */
	function dateMark(){
		if( year == thisYear && month == thisMonth || year == activeYear && month == activeMonth) setDateMark();
	}

	/**
	 * 일간 달력 그리기 함수
	 * @param {number} firstYoil 해당 월 1일의 요일값
	 * @param {number} nalsu 해당월의 일수
	 * @param {number} year 그리고자 하는 연도
	 * @param {number} month 그리고자 하는 월
	 */
	function makeCalendar(firstYoil, nalsu, year, month) {
		let str= "";
		str = "<table border ='0'>";
		str += "<caption>" + year + "년" + month + "월 달력</caption><thead>";
		str += "<tr>";
		for(let i = 0; i < weekTx.length; i++){
			str += "<th scope='col'>" + weekTx[i] + "</th>";
		}
		str += "</tr>";
		str += "</thead><tbody>";
				
		// 날 수 채우기
		let no = 1;
		let currentCell = 0;
		let ju = Math.ceil((nalsu + firstYoil) / 7);
		//alert("이번달은 " + ju + " 주 동안 계속됩니다");
		for(let r=0; r < ju; r++){
			str += "<tr style='text-align:center'>";
			for(let col=0; col < 7; col++){
				if(currentCell < firstYoil || no > nalsu){
					str += "<td>&nbsp;</td>";
					currentCell++;
				} else {
					str += "<td><button type='button' data-date='"+ year + splitTx + month + splitTx + no +"'>" + no + "</button></td>";
					no++;
				}
				
			}
			str += "</tr>";
		}
		while (calArea.firstChild) calArea.removeChild(calArea.firstChild);
		calArea.insertAdjacentHTML('beforeend', str);
		dateBtnSet();
		dateMark();
	}

	/* 월간 달력 전용 함수 ============================================================================================================================================== */
	/** 일간달력 calTop / btnArea 영역 그리기 */
	function top_btm_draw_mon(){
		cal_remove();
		calTop_mon();
		if(changeYear == true) yearObj.addEventListener('change',yearChange_mon);
		if(controls == true) {
			com_calTop_PN();
			btn_prev.addEventListener('click', prevYear);
			btn_next.addEventListener('click', nextYear);
		}
		
		// 하단 오늘/닫기 버튼 영역
		if(showBtnPanel == true) {
			btnArea_set();
			if(todayBtnTx == '오늘') btn_today.textContent = '이번달';
			btn_today.addEventListener('click', goToMonth);
		}
	}

	// cal reDraw ------------------------------
	/** 이전 연도 그리기 */
	function prevYear(){
		if(year > minYear) year--;
		calDraw_mon();
	}
	/** 다음 연도 그리기 */
	function nextYear(){
		if(year < maxYear) year++;
		calDraw_mon();
	}

	/** 월간달력 - 연도 select 변경 시 실행 함수 */
	function yearChange_mon(e){
		year = e.target.value;
		calDraw_mon();
	}
	/** 이번달 포함연도 그리기 */
	function goToMonth(){
		if(shiftState == true) {
			year	= thisYear;
			month	= thisMonth;
		} else resetDate();
		calDraw_mon();
	}

	// input date write -----------------------
	/** 월간 달력 내 버튼 선택 시 실행함수 */
	function dateSelect_mon(e){
		let dateBtn = e.target.tagName == 'BUTTON' ? e.target : e.target.closest('BUTTON'),
			inpDate = new Date(dateBtn.getAttribute('data-year'), dateBtn.getAttribute('data-month') - 1, 1);
		console.log(dateBtn.getAttribute('data-year'))
		if(monthShift == true) { 
			year = inpDate.getFullYear();
			month = inpDate.getMonth();
			calShow();
			shiftState = false;
		} else {
			inp.value = changeToYMD(inpDate);
			if(inPage == false) com_calClose();
			else {
				dateSetToInp(inp);
				setMarkReset();
				setDateMark_mon();
			}
			inp.dispatchEvent(changeEvt);
		} 
	}
	/** 월간 달력 내 버튼 제한 및 실행기능 적용 */
	function dateBtnSet_mon(){
		let btnDate = wrap.querySelectorAll('li button');
		for(b=0; b<btnDate.length; b++){
			btnDate[b].addEventListener('click', dateSelect_mon);
			if(todayLimit == true) limitSet_mon(btnDate[b]);
		}
	}
			
	/** todayLimit 관련 달력내 버튼 disabled 설정 함수 */
	function limitSet_mon(tg){
		let tg_btn = tg,
			tg_year = tg_btn.getAttribute('data-year'),
			tg_mon = tg_btn.getAttribute('data-month') - 1;
			val = new Date(tg_year, tg_mon, 1, 0, 0, 0).valueOf();

		if(limitType == 'after') {
			if(val > limitMonVal) tg_btn.disabled = true;
			if(limitGap != null && val < limitGapMonVal) tg_btn.disabled = true;
		} else {
			if(val < limitMonVal) tg_btn.disabled = true;
			if(limitGap != null && val > limitGapMonVal ) tg_btn.disabled = true;
		}
	}

	/** 오늘 날짜 제한 시 - 이전/다음 버튼 비활성화 */
	function limitPNSet_mon(){
		if(limitType == 'after') {
			year >= limitY ? btn_next.disabled = true : btn_next.disabled = false;
			if(limitGap != null) year <= limitGapY ? btn_prev.disabled = true : btn_prev.disabled = false;
		} else {
			year <= limitY ? btn_prev.disabled = true : btn_prev.disabled = false;
			if(limitGap != null) year >= limitGapY ? btn_next.disabled = true : btn_next.disabled = false;
		}
	}

	/** 이번달 및 선택된 월 표기 */
	function setDateMark_mon(){
		if( year != thisYear && year != activeYear) return;
		let chkBtn = calArea.querySelectorAll('button');
		chkBtn.forEach( (btn) => {
			let val = btn.getAttribute('data-month') - 1
			if(val == thisMonth) btn.classList.add('today');
			if(val == activeMonth) btn.classList.add('select-day');
		});
	}

	/**
	 * 월간 달력 그리기 함수
	 * @param {number} year 그리고자 하는 연도 
	 */
	function makeCalendar_mon(year) {
		str = "<ul class='cal-month-list'>";		
				
		for(let r=1; r < 13; r++){
			if(langType == 'kr') str += "<li><button type='button' data-year='"+ year +"' data-month='"+ r +"'>" + r + "월</button></li>";
			else str += "<li><button type='button' data-year='"+ year +"' data-month='"+ r +"'>" + monTxEng[r - 1] + "</button></li>";
		}
		
		str += "</ul>";
		while (calArea.firstChild) calArea.removeChild(calArea.firstChild); // 기존 달력 내용 지우기
		calArea.insertAdjacentHTML('beforeend', str);
		dateBtnSet_mon();
		setDateMark_mon();
	}
}