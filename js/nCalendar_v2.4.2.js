// calendar
// 서남호(namo) - for m.s.p
// 2020-02-24 - fn / extend 만 jquery 활용한 버전 제작 - 추후 패턴 공부 후 fn/extend 모두 제거 예정
// 2020-03-19 - 선택제한 기능추가에 따른 이전/다음 버튼 비활성화 기능 추가
// 2020-08-05 - 달력 외 영역 클릭 시 달력 hide 추가
// 2020-09-24 - v2.1.0 : 기간 제한 관련 기능 정리
// 2020-12-24 - v2.2.0 : jquery 제거
// 2021-12-27 - v2.3.0 : 페이지 고정형 옵션 추가
// 2024-06-18 - v2.4.0 : 일간 - 월간 전환기능 추가 / 일간,월간 달력 함수 조정
// 2024-07-17 - v2.4.1 : 접근성 속성 추가 / 레이어에 띄울 경우 속성(inCalWrap) 추가
// 2024-11-11 - v2.4.1 : 주간기능 추가
// 2025-01-22 - v2.4.1 : 선택날짜 제한기능 추가 (시작일-종료일 간섭 방지용도)
// 2025-01-22 - v2.4.2 : 날짜 계산 방식 변경 및 변수명 정리

function nCalendar(option){
	const calendar = this;
	calendar.input = typeof option.calInp === 'string' ? document.querySelector(option.calInp) : option.calInp;
	calendar.wrap;
	calendar.num;

	let showType        = option.showType || 'input',		// both / button / input
		calTitle 	    = option.calTitle,					// 달력 타이틀
		splitTx 		= option.splitTx || '-',			// 날짜 구분선 '-' 이나 '.' 2가지만 가능
		positionSet	    = option.positionSet || true,		// true : inp 위치에 달력 설정 / fasle : 별도 설정 없음
		gapTop			= option.gapTop || 0,				// 달력 top 위치 gap
		gapLeft			= option.gapLeft || 0,				// 달력 left 위치 gap
		calType         = option.calType || null,			// null: 일반 기본형 ,  month : 월간달력
		week 			= option.week || false,				// 일간달력 전용 - 주간표기 설정
		langType		= option.langType || 'kr',			// kr : 한글, en : 영문 (월~일 표기)
		changeMon       = option.changeMon || false,		// 월 선택 select 활성 여부
		changeYear      = option.changeYear || false,		// 연도 선택 select 활성 여부
		monthShift  	= option.monthShift || false,		// 연/월 선택 시 '월간 달력' 전환 여부 - 일간달력에서만 사용
		yearRange       = option.yearRange || '2000:2050',	// 연도 제한
		showBtnPanel    = option.showBtnPanel || true,		// 하단 버튼 영역 show/hide 선택 - 오늘/닫기 버튼
		closeBtnTx      = option.closeBtnTx || '닫기',		// 닫기 버튼 텍스트
		todayBtnTx      = option.todayBtnTx || '오늘',		// 오늘 버튼 텍스트
		controls        = option.controls || true,			// 이전달/다음달 버튼 show/hide 선택
		nextTx          = option.nextTx || '>',				// 다음달 버튼 텍스트
		prevTx          = option.prevTx || '<',				// 이전달 버튼 텍스트
		enabled_array	= option.enabled_array,				// 활성화할 버튼 배열 (특정 일자만 활성화 하고자 할 경우)
		todayLimit      = option.todayLimit || false,		// 오늘 기준 선택 제한
		todayGap 		= option.todayGap || '0D', 			// 오늘 기준일의 gap 설정 (ex. 내일부터 제한, 5일전까지 제한 등)
		limitType       = option.limitType || 'before',		// 제한 방향 설정 - before : 오늘 이전 날짜 선택 제한 / after : 오늘 이후 날짜 선택 제한
		limitGap 		= option.limitGap || null, 			// 제한 기간 설정 - null : 기한 없음 / nY : n년 / nM : n개월 / nD : n일
		onModal 		= option.onModal || false,			// 팝업 띄울 때 body 스크롤 제거 관련 옵션(true 일 경우 달력 띄우면 body scroll 방지)
		inPage			= option.inPage || false,			// 페이지 고정형 선택
		inTarget		= option.inTarget || null, 			// 페이지 고정할 영역 선택
		inCalWrap		= option.inCalWrap || false;		// 달력의 body 가 아닌 input 과 동일레벨에 위치할지 여부
	
	//초기 날짜 관련 세팅 및 변수 ----------------------------------------------------------------------------
	let now         = new Date(),
		today 		= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0), // 오늘 0시 0분 기준
		todayMS 	= today.getTime(), 		// 오늘 날짜의 ms 값
		activeDay, 							// 선택된 날짜 변수
		activeEndDay, 						// 선택된 날짜 변수(주간달력용)
		showYear, showMonth,				// 달력 그리기용 연/월 변수 (오늘/선택일이 아닌 날짜의 달력을 그릴 경우도 있으므로 필요함.)
		shiftState = false,   				// 월 > 일간 달력 전환 관련 변수
		all_disabled = false;				// 날짜버튼 전체 disabled 설정여부 변수 (외부에서 제어가능)
	
	let body = document.querySelector('body'),
		bodyStyle = body.style;

	// 언어별 요일
	/** 일~토 표기 텍스트 */
	let weekTx = langType == 'kr' ? new Array("일", "월", "화", "수", "목", "금", "토") : new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
	/** 1~12월 영문 텍스트 */
	let monTxEng = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
	
	// 달력번호 - id 뒤에 숫자추가용 (접근성 aria-controls 속성)
	let dum = document.querySelectorAll('.cal-wrap');
	calendar.num = dum.length;

	// 날짜 제한 관련 (v2.1.0) ----------------------------------------------------------------------------
	let todayGapDay, // 오늘 or todayGap 적용된 날짜
		todayGapDayMS, // todayGapDay 의 ms 값
		limitGapDay, // 최종 제한일 (ex : 오늘이전 1년까지 제한일 경우 1년전 오늘)
		limitGapDayMS, // limitGapDay 의 ms 값
		rangeStartDay, rangeEndDay; // 시작일/종료일 간섭방지용 변수

	/**
	 * 기준일 / gap 값을 넣으면 기준일에서 gap 만큼의 날짜를 반환
	 * @param {date} dayVal javascript 날짜 데이터
	 * @param {string} gapVal gap 차이값 (nY : n년 / nM : n개월 / nD : n일)
	 * @returns 기준일에서 gap 차이 만큼의 date 값
	 */
	function calcGapDay(dayVal, gapVal) {
		let val = dayVal, 
			gapY = 0,
			gapM = 0, 
			gapD = 0,
			gapW = 0,
			gapTx;
		if(gapVal != null) {
			if(typeof(gapVal) === 'string') {
				gapTx  = gapVal.substr(-1,1);
				if(gapTx == 'Y') gapY = Number(gapVal.replace('Y',''));
				else if(gapTx == 'M') gapM = Number(gapVal.replace('M',''));
				else if(gapTx == 'W') gapW = Number(gapVal.replace('W',''));
				else gapD = Number(gapVal.replace('D',''));
			} else gapD = gapVal;
		}
		if(gapTx == 'W') {
			let monGap 	= dayVal.getDay() == 0 ? 7 : dayVal.getDay(),
				weekGap = 7 * gapW;
			limitType == 'before' ? val.setDate(val.getDate() - (monGap - weekGap)) : val.setDate(val.getDate() - (monGap + weekGap));
		} else limitType == 'before' ? val = new Date(dayVal.getFullYear() + gapY,  dayVal.getMonth() + gapM,  dayVal.getDate() + gapD) : val = new Date(dayVal.getFullYear() - gapY,  dayVal.getMonth() - gapM,  dayVal.getDate() - gapD); 

		return val;
	}

	// 오늘 제한 및 선택제한 일자 관련 변수 내용 설정
	if(todayLimit == true) {
		todayGapDay = calcGapDay(today, todayGap);
		todayGapDayMS = todayGapDay.getTime();

		if(limitGap != null) {
			limitGapDay = calcGapDay(today, limitGap);
			limitGapDayMS = limitGapDay.getTime();
		}
	}

	//연도 range 관련
	let minYear, maxYear;

	if(yearRange != null){
		minYear = Number(yearRange.split(':')[0]),
		maxYear = Number(yearRange.split(':')[1]);
		if(todayLimit == true) {
			if(limitType == 'after') {
				maxYear = today.getFullYear(); 
				if(limitGap != null) minYear = limitGapDay.getFullYear();
			} else {
				minYear = today.getFullYear(); 
				if(limitGap != null) maxYear = limitGapDay.getFullYear();
			}
		}
	}

	/** 날짜 초기화(오늘 기준) */
	function resetDate(){
		if(shiftState == true) return;
		showYear = today.getFullYear();
		showMonth = today.getMonth();
		activeDay = null;
	}

	/** inp 입력값 대응하여 연/월/일 산출 */
	function dateSetToInp( tg ){ // input 에 값이 있을 경우 해당 값으로 연/월/일 설정
		if(shiftState == true) return;
		let dateTx, dateTxEnd;
		if(!week) dateTx = tg.value;
		else {
			dateTx = tg.value.split('~')[0];
			dateTxEnd = tg.value.split('~')[1];
			activeDay = changeToDate(dateTx);
			activeEndDay = changeToDate(dateTxEnd);
		}
		activeDay = calType == 'month' ? new Date(dateTx.split(splitTx)[0], dateTx.split(splitTx)[1] -1, 1, 0,0,0) : changeToDate(dateTx);
		showYear = activeDay.getFullYear();
		showMonth = activeDay.getMonth();
	}
	
	/* 기본요소 그리기 (wrap/버튼 등) ------------------------------------------------------------------------ */
	let yearObj,			// 연도선택 select / span 요소
		monthObj,			// 월 선택 select / span 요소
		btn_month, 			// 월 선택 달력변경 버튼
		btn_show,			// showType 이 both 나 button 일 경우 버튼
		btn_today, 			// 오늘 / 이번달 버튼
		btn_close,			// 닫기 버튼
		btn_next,			// 다음달/다음연도 버튼
		btn_prev,			// 이전달/이전연도 버튼
		call_item; 			// 달력 호출 요소(input / buttom)

	// 달력 영역 기본구조 생성
	let newCal = document.createElement('div'),
		inbox  = document.createElement('div'),
		calTop = document.createElement('div'), // 달력 상단 제어영역
		calArea = document.createElement('div'), // 달력 테이블 영역
		btnArea = document.createElement('div'), // 오늘/닫기 버튼 감싸는 영역
		calTit;

	if(inPage == true) {
		newCal.classList.add('in-page');
		inTarget != null ? document.querySelector(inTarget).appendChild(newCal) : calendar.input.parentNode.appendChild(newCal);
	} else inCalWrap == true ? calendar.input.parentNode.appendChild(newCal) : document.querySelector('body').appendChild(newCal);

	calendar.wrap = newCal;
	calendar.wrap.classList.add('cal-wrap');
	inbox.classList.add('cal-cnt');
	calTop.classList.add('cal-top');
	calArea.classList.add('cal-area');
	btnArea.classList.add('cal-btns');

	calendar.wrap.setAttribute('tabindex', '0');
	calendar.wrap.setAttribute('role', 'dialog');
	calendar.wrap.setAttribute('id', 'modal-cal_' + calendar.num);
	calendar.wrap.appendChild(inbox);

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
		btn_prev = calendar.wrap.querySelector('.cal-btn.prev'),
		btn_next = calendar.wrap.querySelector('.cal-btn.next');
	}

	/** calTop - 일간 달력 - 월간 전환 생성 */
	function calTop_day_shift(){
		let cntstr = '<button type="button" class="btn_month-sel"><span class="cal-now-tx year"></span> - <span class="cal-now-tx month"></span></button>';
		calTop.insertAdjacentHTML('beforeend', cntstr);
		btn_month = calendar.wrap.querySelector('.btn_month-sel');
		yearObj = calendar.wrap.querySelector('.cal-now-tx.year');
		monthObj = calendar.wrap.querySelector('.cal-now-tx.month');

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
		if(inPage == false) btn_close.addEventListener('click', calClose);
	}

	/** 상단 연도 표기 설정 */
	function yearSet(){
		if(changeYear == true && monthShift == false){
			let yearOpts = yearObj.querySelectorAll('option');
			for(o=0; o< yearOpts.length; o++){
				if(yearOpts[o].value == showYear) yearOpts[o].selected = true;
			}
		} else {
			yearObj.textContent = showYear;
		}
	}

	/* common functions ------------------------------------------------------------------------ */
	/** 달력 생성 위치 설정 함수 */
	function calPosition(){
		if(inPage == true || positionSet == false) return;
		if(inCalWrap) { // 달력이 input 와 동일레벨에 위치할 경우 설정
			calendar.wrap.classList.add('in-wrap');
			calendar.wrap.style.top = '100%';
			return;
		}
		let top		= offset(calendar.input).top,
			left	= offset(calendar.input).left;

		let par = calendar.input.parents();
		for(let p=0; p<par.length; p++){
			if(par[p].style.position == 'fixed') calendar.wrap.style.position = 'fixed';
		}
		calendar.wrap.style.top = top + calendar.input.offsetHeight + gapTop + 'px';
		calendar.wrap.style.left = left + gapLeft + 'px';
	}

	/**
	 * yyyy-mm-dd 형식을 date 값으로 변환 (해당 날짜의 0시 0분 0초 기준)
	 * @param {string} e 날짜형식 (yyyy.mm.dd)
	 * @returns date 값
	 */
	function changeToDate(e){
		let thisY = e.split(splitTx)[0],
			thisM = e.split(splitTx)[1] - 1,
			thisD = e.split(splitTx)[2],
		nowDate = new Date(thisY, thisM, thisD, 0, 0, 0);
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

	/**
	 * 날짜를 0시 0분 0초 기준 ms 값 추출
	 * @param {string} e 날짜형식 (yyyy.mm.dd)
	 * @returns date 의 ms 값
	 */
	function changeToMS(ymd){
		let tg_Date = changeToDate(ymd),
			val = new Date(tg_Date.getFullYear(), tg_Date.getMonth(), tg_Date.getDate(), 0, 0, 0).getTime();
		return val;
	}

	/**
     * 버튼 disabled 설정 ( + 접근성 tab 제거 포함)
     * @param {dom} tg : 버튼
     */
    function btn_dis(tg){
        tg.disabled = true;
        tg.setAttribute('tabindex', '-1');
        tg.setAttribute('aria-hidden', true);
    }

	// close ------------------------------------------------------------------
	/** 달력 닫기 함수 */
	function calClose(){
		calendar.wrap.style.top = '';
		calendar.wrap.style.left = '';
		calendar.wrap.classList.remove('on');
		calendar.input.focus();
		shiftState = false;
		call_item.setAttribute('aria-expanded', false);
		if(inPage == true || onModal == false) return;
		body.classList.remove('hold');
		bodyStyle.overflow = '';
	}
	/** 화면내 띄워진 달력 전체 닫기 -- 체크필요 (달력 외 영역 클릭 시 닫힘 기능으로 인해 필요성 확인) XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */
	function calCloseAll(){
		let wrapAll = document.querySelectorAll('.cal-wrap');
		for(a=0; a<wrapAll.length; a++){
			if(wrapAll[a].classList.contains('in-page')) return;
			wrapAll[a].style.top = '';
			wrapAll[a].style.left = '';
			wrapAll[a].classList.remove('on');
		}
		if(inPage == true || onModal == false) return;
		body.classList.remove('hold');
		bodyStyle.overflow = '';
	}	
	/** 달력 외 영역 클릭 시 달력 hide */
	function com_outSideClick(){
		let body = document.querySelector('body');
		body.addEventListener('mousedown', function(e){
			let tg = e.target;
			if( !tg.closest('.cal-wrap') ) {
				calClose();
				this.removeEventListener('mousedown', arguments.callee);
			}
		});
	}
	
	/** 달력 내용 지우기 */
	function cal_remove(){
		while (calTop.firstChild) calTop.removeChild(calTop.firstChild);
		while (calArea.firstChild) calArea.removeChild(calArea.firstChild);
		if(calendar.wrap.querySelector('.cal-btns')) inbox.removeChild(btnArea);
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
		yearSet();
		monthSet();
		makeCalendar(showYear, showMonth);
		if(todayLimit == true) limitPNSet();
	}

	/** 월간 달력 그리기 */
	function calDraw_mon(){
		top_btm_draw_mon();
		yearSet();
		makeCalendar_mon(showYear);
		if(todayLimit == true) limitPNSet_mon();
	}

	/** 일간-월간 달력 구분 (inp 및 btn을 통한 호출에만 사용) */
	function calShow_type(){
		calType == 'month' ? calShow('month') : calShow();
	}

	/** 달력 보이기 함수 */
	function calShow(type){
		calCloseAll();
		calendar.input.value.length > 0 ? dateSetToInp(calendar.input) : resetDate();
		if(calendar.input.getAttribute('data-start')) rangeStartDay = changeToDate(calendar.input.getAttribute('data-start'));
		if(calendar.input.getAttribute('data-end')) rangeEndDay = changeToDate(calendar.input.getAttribute('data-end'));

		calPosition();
		type == 'month' ? calDraw_mon() : calDraw();
		calendar.wrap.classList.add('on');
		call_item.setAttribute('aria-expanded', true);
		
		if(inPage == false) {
			com_outSideClick(); // 달력 외 영역 클릭 시 달력 hide
			calendar.wrap.focus();
		}
		if(inPage == true || onModal == false) return;
		body.classList.add('hold');
		bodyStyle.overflow = 'hidden';
	}

	// cal showType ------------------------------
	if(showType == 'input'){
		calendar.input.addEventListener('click', calShow_type);
		calendar.input.addEventListener('keyup', function(e){
			let key = e.keyCode || e.which;
			if(key == 9) calShow_type();
		});
		call_item = calendar.input;
	} else if (showType == 'button'){
		calendar.input.insertAdjacentHTML('afterend', '<button type="button" class="btn-cal">달력보기</button>');
		btn_show = calendar.input.nextSibling;
		btn_show.addEventListener('click', calShow_type);
		call_item = btn_show;
	} else {
		calendar.input.insertAdjacentHTML('afterend', '<button type="button" class="btn-cal">달력보기</button>');
		btn_show = calendar.input.nextSibling;
		btn_show.addEventListener('click', calShow_type);
		calendar.input.addEventListener('click', calShow_type);
		calendar.input.addEventListener('keyup', function(e){
			let key = e.keyCode || e.which;
			if(key == 9) calShow_type();
		});
	}
	if(calendar.input.disabled == true) btn_show.disabled = true;
	if(inPage == true) calShow_type();

	function call_item_aria(){
        call_item.setAttribute('aria-controls', calendar.wrap.getAttribute('id'));
        call_item.setAttribute('aria-haspopup', 'dialog');
        call_item.setAttribute('aria-expanded', false);
	}
	call_item_aria();

	/**
	 * 달력 내 클릭 가능 날짜 설정 함수 ( dateBtnSet 함수에 포함 / 향후 이미 그려진 달력에 후처리 시 사용확인 )
	
	function active_btn_set() {
		if(enabled_array == undefined || enabled_array.length == 0) return;
		let btnDates = calendar.wrap.querySelectorAll('td button:not(:disabled)');
		if(calType == 'month') {
			btnDates.forEach((btn)=>{
				let date = btn.getAttribute('data-year') + splitTx + btn.getAttribute('data-month');
				enabled_array.indexOf(date) > -1 ? btn.classList.add('can') : btn.disabled = true;
			});
		} else {
			btnDates.forEach((btn)=>{
				let date = btn.getAttribute('data-date');
				enabled_array.indexOf(date) > -1 ? btn.classList.add('can') : btn.disabled = true;
			});
		}
	} */

	// 주간 달력 관련 함수 ------------------------
	function sellastDay(){
		var lastMon = calcWeekMonDay(now),
			lastSun = new Date(lastMon.getFullYear(), lastMon.getMonth(), lastMon.getDate() + 6);			
		calendar.input.value = changeToYMD(lastMon) + '~' + changeToYMD(lastSun);
	}

	// 선택일이 포함된 주의 월요일 추출
	function calcWeekMonDay(date){
		var monGap 	= date.getDay() == 0 ? 6 : date.getDay() - 1;
		return new Date(date.getFullYear(), date.getMonth(), date.getDate() - monGap, 0, 0, 0);
	}
	// 선택일이 포함된 주의 일요일 추출
	function calcWeekSunDay(date){
		var monGap 	= date.getDay() == 0 ? 6 : date.getDay() - 1,
			calcDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - monGap + 6, 0, 0, 0);
		return calcDate;
	}

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
		if(showMonth > 0) showMonth--;
		else {
			if( showYear > minYear ) showYear--;
			showMonth = 11;
		}
		calDraw();
	}
	/** 다음달 달력 그리기 */
	function nextMonth(){
		if(showMonth < 11) showMonth++;
		else { 
			if( showYear < maxYear ) showYear++;
			showMonth = 0;
		}
		calDraw();
	}
	/** 일간달력 - 연도 select 변경 시 실행 함수 */
	function yearChange(e){
		showYear = e.target.value;
		if(todayLimit == false) { 
			calDraw();
			return;
		}
		let todayGapYear = todayGapDay.getFullYear(),
			todayGapMon  = todayGapDay.getMonth(),
			limitGapYear,
			limitGapMon;
			
		if(limitGapDay) {
			limitGapYear = limitGapDay.getFullYear();
			limitGapMon  = limitGapDay.getMonth();
		}

		if(limitType == 'after') {
			if(showYear == todayGapYear && showMonth > todayGapMon) showMonth = todayGapMon;
			if(limitGap != null && showYear == limitGapYear) showMonth < limitGapMon ? showMonth = limitGapMon : null;
		} else {
			if(showYear == todayGapYear && showMonth < todayGapMon) showMonth = todayGapMon;
			if(limitGap != null && showYear == limitGapYear) showMonth > limitGapMon ? showMonth = limitGapMon : null;
		}
		calDraw();
	}
	/** 월 select 변경 시 실행함수 */
	function monthChange(e){
		showMonth = e.target.value - 1;
		calDraw();
	}

	/** 월 select 설정함수 (limit 에 따른 제한) */
	function monthSet(){
		if(changeMon == false || monthShift == true) {
			monthObj.textContent = showMonth + 1;
			return;
		}
		let monOpts = monthObj.querySelectorAll('option');
		for(o=0; o< monOpts.length; o++){
			if(monOpts[o].value == showMonth + 1) monOpts[o].selected = true;
		}
		if(todayLimit == false) return;
		
		let todayGapYear = todayGapDay.getFullYear(),
			todayGapMon  = todayGapDay.getMonth(),
			limitGapYear,
			limitGapMon,
			sameShowTodayYear = showYear == todayGapYear; // showYear 과 todayGapYear 이 같을 경우

		if(limitGapDay) {
			limitGapYear = limitGapDay.getFullYear();
			limitGapMon  = limitGapDay.getMonth();
		}

		for(o=0; o< monOpts.length; o++){
			monOpts[o].removeAttribute('hidden');
			if(limitType == 'after') {
				if(limitGap == null) {
					if(sameShowTodayYear && monOpts[o].value > todayGapMon + 1) monOpts[o].setAttribute('hidden', true);
				} else {
					if(todayGapYear == limitGapYear) {
						if(sameShowTodayYear) monOpts[o].value > todayGapMon + 1 || monOpts[o].value < limitGapMon + 1 ? monOpts[o].setAttribute('hidden', true) : null;
					} else {
						if(sameShowTodayYear && monOpts[o].value > todayGapMon + 1) monOpts[o].setAttribute('hidden', true);
						else if(showYear == limitGapYear && monOpts[o].value < limitGapMon + 1) monOpts[o].setAttribute('hidden', true);
					}
				}
			} else {
				if(limitGap == null) {
					if(sameShowTodayYear && monOpts[o].value < todayGapMon + 1) monOpts[o].setAttribute('hidden', true);
				} else {
					if(todayGapYear == limitGapYear) {
						if(sameShowTodayYear) monOpts[o].value < todayGapMon + 1 || monOpts[o].value > limitGapMon + 1 ? monOpts[o].setAttribute('hidden', true) : null;
					} else {
						if(sameShowTodayYear && monOpts[o].value < todayGapMon + 1) monOpts[o].setAttribute('hidden', true);
						else if(showYear == limitGapYear && monOpts[o].value > limitGapMon + 1) monOpts[o].setAttribute('hidden', true);
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
			inpDate, inpEndDate;
		if(!week) {
			inpDate = changeToDate(dateBtn.getAttribute('data-date'));
			calendar.input.value = changeToYMD(inpDate);
		} else {
			let curDate = changeToDate(dateBtn.getAttribute('data-date'));
			inpDate 	= calcWeekMonDay(curDate),
			inpEndDate  = calcWeekSunDay(curDate);
			calendar.input.value = changeToYMD(inpDate) + '~' + changeToYMD(inpEndDate);
		}
		
		if(inPage == false) calClose();
		else {
			if(shiftState == true) shiftState = false; // 레이어 팝업에 inPage 달력 표출 시 월 일때 화면 종료 후 다시 일간달력 표출시 에러 제거
			dateSetToInp(calendar.input);
			setMarkReset();
			// setDateMark();
			dateBtn.classList.add('select-day');
		}
		calendar.input.dispatchEvent(changeEvt);
		if(typeof option.activeClick === 'function') option.activeClick(inpDate);
	}

	/** 일간 달력 내 버튼 제한 및 실행기능 적용 */
	function dateBtnSet(){
		let btnDate = calendar.wrap.querySelectorAll('td button');
		btnDate.forEach(function(btn){
			if(all_disabled == true) {
				btn.disabled = true;
				return;
			}
			if(enabled_array != undefined && enabled_array.length > 0) {
				let date = btn.getAttribute('data-date');
				enabled_array.indexOf(date) > -1 ? btn.classList.add('can') : btn.disabled = true;
			}
			btn.addEventListener('click', dateSelect);
			if(todayLimit == true) limitSet(btn);
			limitRangeSet(btn);
		});
	}

	/** todayLimit 관련 달력내 버튼 disabled 설정 함수 */
	function limitSet(tg){
		let tg_btn = tg,
			val = changeToMS(tg_btn.getAttribute('data-date'));
		if(limitType == 'after') {
			if(val > todayGapDayMS) btn_dis(tg_btn);
			if(limitGap != null && val < limitGapDayMS) btn_dis(tg_btn);
		} else {
			if(val < todayGapDayMS) btn_dis(tg_btn);
			if(limitGap != null && val > limitGapDayMS) btn_dis(tg_btn);
		}
	}

	/** 일간 달력 내 기간제한 시(시작일, 종료일 세트관련) */
	function limitRangeSet(tg){
		let tg_btn = tg,
			val = changeToMS(tg_btn.getAttribute('data-date'));
		
		if(rangeStartDay) { if(val < rangeStartDay.getTime()) btn_dis(tg_btn); }
		if(rangeEndDay) { if(val > rangeEndDay.getTime()) btn_dis(tg_btn); }
	}

	/** 오늘 날짜 제한 시 - 이전/다음 버튼 비활성화 */
	function limitPNSet(){
		if(limitType == 'after') {
			showYear >= todayGapDay.getFullYear() && showMonth >= todayGapDay.getMonth() ? btn_next.disabled = true : btn_next.disabled = false;
			if(limitGap != null) showYear <= limitGapDay.getFullYear() && showMonth <= limitGapDay.getMonth() ? btn_prev.disabled = true : btn_prev.disabled = false;
		} else {
			showYear <= todayGapDay.getFullYear() && showMonth <= todayGapDay.getMonth() ? btn_prev.disabled = true : btn_prev.disabled = false;
			if(limitGap != null) showYear >= limitGapDay.getFullYear() && showMonth >= limitGapDay.getMonth() ? btn_next.disabled = true : btn_next.disabled = false;
		}
	}

	/** 오늘 및 선택된 날짜 표기 */
	function setDateMark(){
		let chkBtn = calArea.querySelectorAll('button'),
			activeMS = activeDay ? activeDay.getTime() : null,
			activeEndMS;
		if(week && activeEndDay) activeEndMS = activeEndDay.getTime();
		chkBtn.forEach( (btn) => {
			let tg_Date = changeToMS(btn.getAttribute('data-date'));
			if(tg_Date == todayMS) btn.classList.add('today');
			if(activeDay && tg_Date == activeMS) btn.classList.add('select-day');
			
			if(!week) return;
			if(tg_Date == activeMS) btn.parentNode.classList.add('start');
			if(tg_Date == activeEndMS) btn.parentNode.classList.add('end');
			if(tg_Date >= activeMS && tg_Date <= activeEndMS) btn.parentNode.classList.add('in-range');
		});
	}
	/** setDateMark 함수 실행제한 함수(오늘 및 선택일 포함안된 월일 경우 실행안되게) */
	function dateMark(){
		let showDate = new Date(showYear, showMonth, 1, 0,0,0).getTime(),
			activeInclude, activeEndInclude;
		if(activeDay) activeInclude = new Date(activeDay.getFullYear(), activeDay.getMonth(), 1, 0,0,0).getTime();
		if(week && activeEndDay) activeEndInclude = new Date(activeEndDay.getFullYear(), activeEndDay.getMonth(), 1, 0,0,0).getTime();

		if( showYear == today.getFullYear() && showMonth == today.getMonth() || showYear == activeInclude || showDate == activeEndInclude ) setDateMark();
	}

	/**
	 * 일간 달력 그리기 함수
	 * @param {number} year 그리고자 하는 연도
	 * @param {number} month 그리고자 하는 월
	 */
	function makeCalendar(year, month) {
		let firstYoil = new Date(year, month, 1).getDay(), // 해당 월 1일의 요일값
			nalsu = new Date(year, month + 1, 0).getDate(), // 해당월의 일수
			mon_tx = month + 1;

		let str = "<ul class='cal-yoil'>";
		for(let i = 0; i < weekTx.length; i++){
			str += "<li aria-hidden='true'>" + weekTx[i] + "</li>";
		}
		str += "</ul>";
		str += "<table border ='0'>";
		str += "<caption>" + year + "년" + mon_tx + "월 달력</caption><thead>";
		str += "<tr class='hide'>";
		for(let i = 0; i < weekTx.length; i++){
			str += "<th scope='col' aria-hidden='true'>" + weekTx[i] + "</th>";
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
					str += "<td><button type='button' data-date='"+ year + splitTx + setZero(mon_tx) + splitTx + setZero(no) +"' title='"+ year + splitTx + mon_tx + splitTx + no +" "+ weekTx[col] +"요일'>" + no + "</button></td>";
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
		if(showYear > minYear) showYear--;
		calDraw_mon();
	}
	/** 다음 연도 그리기 */
	function nextYear(){
		if(showYear < maxYear) showYear++;
		calDraw_mon();
	}

	/** 월간달력 - 연도 select 변경 시 실행 함수 */
	function yearChange_mon(e){
		showYear = e.target.value;
		calDraw_mon();
	}
	/** 이번달 포함연도 그리기 */
	function goToMonth(){
		if(shiftState == true) {
			showYear = today.getFullYear();
			showMonth = today.getMonth();
		} else resetDate();
		calDraw_mon();
	}

	// input date write -----------------------
	/** 월간 달력 내 버튼 선택 시 실행함수 */
	function dateSelect_mon(e){
		let dateBtn = e.target.tagName == 'BUTTON' ? e.target : e.target.closest('BUTTON'),
			inpDate = new Date(dateBtn.getAttribute('data-year'), dateBtn.getAttribute('data-month') - 1, 1,0,0,0);

		if(monthShift == true) { 
			showYear = inpDate.getFullYear();
			showMonth = inpDate.getMonth();
			calShow();
			shiftState = false;
		} else {
			calendar.input.value = changeToYMD(inpDate);
			if(inPage == false) calClose();
			else {
				dateSetToInp(calendar.input);
				setMarkReset();
				setDateMark_mon();
			}
			calendar.input.dispatchEvent(changeEvt);
		} 
	}
	/** 월간 달력 내 버튼 제한 및 실행기능 적용 */
	function dateBtnSet_mon(){
		let btnDate = calendar.wrap.querySelectorAll('li button');
		for(b=0; b<btnDate.length; b++){
			btnDate[b].addEventListener('click', dateSelect_mon);
			if(todayLimit == true) limitSet_mon(btnDate[b]);
		}
	}
			
	/** todayLimit 관련 달력내 버튼 disabled 설정 함수 */
	function limitSet_mon(tg){
		let tg_btn = tg,
			tg_year = tg_btn.getAttribute('data-year'),
			tg_mon = tg_btn.getAttribute('data-month') - 1,
			val = new Date(tg_year, tg_mon, 1, 0, 0, 0).getTime(),
			todayMonMs = new Date(todayGapDay.getFullYear(), todayGapDay.getMonth(), 1, 0,0,0).getTime(),
			limitGapMonMs;

		if(limitGapDay) limitGapMonMs = new Date(limitGapDay.getFullYear(), limitGapDay.getMonth(), 1, 0,0,0).getTime();

		if(limitType == 'after') {
			if(val > todayMonMs) btn_dis(tg_btn);
			if(limitGap != null && val < limitGapMonMs) btn_dis(tg_btn);
		} else {
			if(val < todayMonMs) btn_dis(tg_btn);
			if(limitGap != null && val > limitGapMonMs) btn_dis(tg_btn);
		}
	}

	/** 오늘 날짜 제한 시 - 이전/다음 버튼 비활성화 */
	function limitPNSet_mon(){
		if(limitType == 'after') {
			showYear >= todayGapDay.getFullYear() ? btn_next.disabled = true : btn_next.disabled = false;
			if(limitGap != null) showYear <= limitGapDay.getFullYear() ? btn_prev.disabled = true : btn_prev.disabled = false;
		} else {
			showYear <= todayGapDay.getFullYear() ? btn_prev.disabled = true : btn_prev.disabled = false;
			if(limitGap != null) showYear >= limitGapDay.getFullYear() ? btn_next.disabled = true : btn_next.disabled = false;
		}
	}

	/** 이번달 및 선택된 월 표기 */
	function setDateMark_mon(){
		let todayYear = todayGapDay.getFullYear(),
			activeYear = activeDay ? activeDay.getFullYear() : null;
		if(showYear == todayYear || showYear == activeYear) {
		let chkBtn = calArea.querySelectorAll('button');
			chkBtn.forEach( (btn) => {
				let val = btn.getAttribute('data-month') - 1;
				if(val == todayGapDay.getMonth()) btn.classList.add('today');
				if(activeDay && val == activeDay.getMonth()) btn.classList.add('select-day');
			});
		}
	}

	/**
	 * 월간 달력 그리기 함수
	 * @param {number} year 그리고자 하는 연도 
	 */
	function makeCalendar_mon(year) {
		str = "<ul class='cal-month-list'>";		
				
		for(let r=1; r < 13; r++){
			if(langType == 'kr') str += "<li><button type='button' data-year='"+ year +"' data-month='"+ r +"' title='"+ year +"년 "+ r +"월'>" + r + "월</button></li>";
			else str += "<li><button type='button' data-year='"+ year +"' data-month='"+ r +"' title='"+ year +"년 "+ r +"'>" + setZero(monTxEng[r - 1]) + "</button></li>";
		}
		
		str += "</ul>";
		while (calArea.firstChild) calArea.removeChild(calArea.firstChild); // 기존 달력 내용 지우기
		calArea.insertAdjacentHTML('beforeend', str);
		dateBtnSet_mon();
		setDateMark_mon();
	}

	// 외부 호출 함수 ================================================================
	/**
	 * 달력 - input value 기준 업데이트
	 */
	calendar.date_update = function(){
		calShow_type();
	}
	// 달력 전체버튼 disabled 제어
	calendar.date_disabled = function(bln){
		all_disabled = bln;
	}
}