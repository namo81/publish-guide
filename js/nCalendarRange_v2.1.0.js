// calendar
// 서남호(namo) - for m.s.p
// 2020-09-29 - ver2.0.0 - 기본달력 base 로 기간 달력 재 작업
// 2020-11-04 - ver2.1.0 - jquery 완전 제거
// 2020-12-03 - ver2.1.0 - 동일날짜 선택 가능 (동일날짜 2번 클릭 시 시작일/종료일 모두 해당일자로 설정)

function nCalendarRange(option){

	let wrap            = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
		inCalWrap		= option.inCalWrap ? option.inCalWrap : false,				// 달력의 body 가 아닌 wrap 내부에 위치할지 설정
		showType        = option.showType ? option.showType : 'button',				// both / button / input
		inpSingle 		= option.inpSingle ? option.inpSingle : false, 				// true : input 1개에 기간 입력 / false : input 시작일,종료일 각각 일 경우
		cal_pos 		= option.cal_pos ? option.cal_pos : null, 					// 'right' / null - 달력이 input 바로 아래 위치할 때 좌측/우측 기준위치
		dualCal         = option.dualCal != null ? option.dualCal : true,			// true: 표출달력 2개 / false : 표출달력 1개
		dayType			= option.dayType ? option.dayType : 'kr',					// kr : 한글, en : 영문 (월~일 표기)
		yearRange       = option.yearRange ? option.yearRange : '2019:2040',		// 연도 제한
		showBtnPanel    = option.showBtnPanel != null ? option.showBtnPanel : true,	// 하단 버튼 영역 show/hide 선택 - 오늘/닫기 버튼
		closeBtnTx      = option.closeBtnTx ? option.closeBtnTx : '닫기',			// 닫기 버튼 텍스트
		todayBtnTx      = option.todayBtnTx ? option.todayBtnTx : '오늘',			// 오늘 버튼 텍스트
		applyBtnTx      = option.applyBtnTx ? option.applyBtnTx : '확인',			// 확인(날짜 결정) 버튼 텍스트
		controls        = option.controls != null ? option.controls : true,			// 이전달/다음달 버튼 show/hide 선택
		nextTx          = option.nextTx ? option.nextTx : '>',						// 다음달 버튼 텍스트
		prevTx          = option.prevTx ? option.prevTx : '<',						// 이전달 버튼 텍스트
		rangeLimit      = option.rangeLimit ? option.rangeLimit : null,				// 시작일-종료일 설정가능 최대 기간 제한 : Number 형식
		todayLimit      = option.todayLimit ? option.todayLimit : false,			// 오늘 기준 선택 제한
		todayGap 		= option.todayGap ? option.todayGap : '0D', 				// 오늘 기준일의 gap 설정 (ex. 내일부터 제한, 5일전까지 제한 등)
		limitType       = option.limitType ? option.limitType : 'before',			// 제한 방향 설정 - before : 오늘 이전 날짜 선택 제한 / after : 오늘 이후 날짜 선택 제한
		limitGap 		= option.limitGap ? option.limitGap : null, 				// 제한 기간 설정 - null : 기한 없음 / nY : n년 / nM : n개월 / nD : n일
		activeCal;
		
	// 날짜 제한 관련 ----------------------------------------------------------------------------
	let now = new Date(),
		limitDay, // 오늘 or todayGap 적용된 날짜
		limitY, limitM, limitD, 
		limitGapDay, // 최종 제한일 (ex : 오늘이전 1년까지 제한일 경우 1년전 오늘)
		limitGapY, limitGapM, limitGapD;

	// limit 관련 최종 제한일 계산 함수
	let calcGapDay = function(dayVal, gapVal) {
		let val, 
			gapY = 0,
			gapM = 0, 
			gapD = 0;
		if(gapVal != null) {
			if(typeof gapVal  === 'string') {
				let gapTx  = gapVal.substr(-1,1);
				if(gapTx == 'Y') gapY = Number(gapVal.replace('Y',''));
				else if(gapTx == 'M') gapM = Number(gapVal.replace('M',''));
				else gapD = Number(gapVal.replace('D',''));
			} else gapD = gapVal;
		}
		limitType == 'before' ? val = new Date(dayVal.getFullYear() + gapY,  dayVal.getMonth() + gapM,  dayVal.getDate() + gapD) : val = new Date(dayVal.getFullYear() - gapY,  dayVal.getMonth() - gapM,  dayVal.getDate() - gapD);
		return val;
	}

	if(todayLimit == true) {
		limitDay = calcGapDay(now, todayGap);
		limitY = limitDay.getFullYear();
		limitM = limitDay.getMonth();
		limitD = limitDay.getDate();

		if(limitGap != null) {
			limitGapDay = calcGapDay(limitDay, limitGap);
			limitGapY = limitGapDay.getFullYear();
			limitGapM = limitGapDay.getMonth();
			limitGapD = limitGapDay.getDate();
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
	
	/* 기본요소 그리기 (wrap/버튼 등) ------------------------------------------------------------------------ */
	let inp,							// input 이 1개일 경우
		inpStart, 						// input 이 2개일 경우 시작일 inp
		inpEnd, 						// input 이 2개일 경우 종료일 inp
		cals,							// 페이지 내 달력 전체
		calWrap,               			// 달력 영역 전체
		leftArea, 						// 좌측 영역 전체
		rightArea,						// 우측 영역 전체
		leftCal,         		    	// 달력 테이블 영역 (2개일 경우 좌측 달력)
		rightCal, 						// 우측 달력 테이블 영역
		leftTop,         		    	// 좌측 달력 상단 영역
		rightTop, 						// 우측 달력 상단 영역
		leftTx,							// 좌측 연/월 표기 영역
		rightTx, 						// 우측 연/월 표기 영역
		btn,							// shiwType 가 both 나 button 일 경우 버튼
		todayBtn, closeBtn, applyBtn, 	// 오늘 / 닫기 / 확인 버튼
		nextM, prevM;					// 이전, 다음 버튼

	let startDate, endDate; // 입력용 값

	if(inpSingle == true) {
		inp 		= wrap.querySelector('input');
	} else {
		inpStart 	= wrap.querySelector('.start');
		inpEnd 		= wrap.querySelector('.end');
	}

	// 달력 기본 영역 그리기 (calWrap, 좌,우 영역, 상단버튼영역, 이전-다음 버튼 등) --------------------------------------------
	if(inCalWrap) {
		wrap.insertAdjacentHTML('beforeend', '<div class="cal-wrap range" tabindex="0"><div class="cal-left"><div class="cal-area"></div></div></div>');
		cals = wrap.querySelectorAll('.cal-wrap');
	} else {
		document.querySelector('body').insertAdjacentHTML('beforeend', '<div class="cal-wrap range" tabindex="0"><div class="cal-left"><div class="cal-area"></div></div></div>');
		cals = document.querySelectorAll('.cal-wrap');
	}
	calWrap = cals[cals.length - 1];

	leftArea = calWrap.querySelector('.cal-left');
	leftCal = leftArea.querySelector('.cal-area');

	leftArea.insertAdjacentHTML('afterbegin', '<div class="cal-top"></div>');
	leftTop = leftArea.querySelector('.cal-top');

	let cntLeft = "";

	if(dualCal == false) {
		cntLeft += '<button type="button" class="cal-btn prev">'+prevTx+'</button>';
		cntLeft += '<p class="tx-yearMon"></p>';
		cntLeft += '<button type="button" class="cal-btn next">'+nextTx+'</button>';
	} else {
		calWrap.classList.add('dual');
		calWrap.insertAdjacentHTML('beforeend', '<div class="cal-right"><div class="cal-area"></div></div>');
		rightArea = calWrap.querySelector('.cal-right');
		rightCal = rightArea.querySelector('.cal-area');

		rightArea.insertAdjacentHTML('afterbegin', '<div class="cal-top"></div>');
		rightTop = rightArea.querySelector('.cal-top');
				
		let cntRight = "";
		cntLeft += '<button type="button" class="cal-btn prev">'+prevTx+'</button>';
		cntLeft += '<p class="tx-yearMon"></p>';
		cntRight += '<p class="tx-yearMon"></p>';
		cntRight += '<button type="button" class="cal-btn next">'+nextTx+'</button>';

		rightTop.insertAdjacentHTML('beforeend', cntRight);
		rightTx = rightTop.querySelector('.tx-yearMon');
	}
	
	leftTop.insertAdjacentHTML('beforeend', cntLeft);
	leftTx = leftTop.querySelector('.tx-yearMon');
	prevM = calWrap.querySelector('.cal-btn.prev'),
	nextM = calWrap.querySelector('.cal-btn.next');

	if(controls == true) {
		prevM.addEventListener('click', prevMonth);
		nextM.addEventListener('click', nextMonth);
	} else {
		prevM.style.display = 'none';
		nextM.style.display = 'none';
	}

	// 달력 초기 생성 시 달력obj 값 전달
	if(typeof option.activeCal === 'function') option.activeCal(calWrap);

	// close ---------------------------------
	let calClose = function(){
		calWrap.style.top = '';
		calWrap.style.left = '';
		calWrap.classList.remove('on');
		startDate = null;
		endDate = null;
		inpSingle == true ? inp.focus() : inpStart.focus();
	},
	calCloseAll = function(){
		let wrapAll = document.querySelectorAll('.cal-wrap');
		for(a=0; a<wrapAll.length; a++){
			wrapAll[a].style.top = '';
			wrapAll[a].style.left = '';
			wrapAll[a].classList.remove('on');
		}
	},
	// 달력 외 영역 클릭 시 달력 hide
	outSideClick = function(){
		let body = document.querySelector('body');
		body.addEventListener('mousedown', function(e){
			let tg = e.target;
			if( !tg.closest('.cal-wrap') ) {
				calClose();
				this.removeEventListener('mousedown', arguments.callee);
			}
		});
	}

	// 하단 오늘/확인/닫기 버튼 추가 및 기능 적용
	if(showBtnPanel == true) {
		calWrap.insertAdjacentHTML('beforeend', '<div class="cal-btns"></div>');
		btnArea = calWrap.querySelector('.cal-btns');
		if(todayBtnTx != null){
			btnArea.insertAdjacentHTML('beforeend', '<button type="button" class="btn-cal-today">'+todayBtnTx+'</button>');
			todayBtn = calWrap.querySelector('.btn-cal-today');
		}
		if(applyBtnTx != null){
			btnArea.insertAdjacentHTML('beforeend', '<button type="button" class="btn-cal-apply">'+applyBtnTx+'</button>');
			applyBtn = calWrap.querySelector('.btn-cal-apply');
		}
		if(closeBtnTx != null){
			btnArea.insertAdjacentHTML('beforeend', '<button type="button" class="btn-cal-close">'+closeBtnTx+'</button>');
			closeBtn = calWrap.querySelector('.btn-cal-close');
		}

		todayBtn.addEventListener('click', goToday);
		closeBtn.addEventListener('click', calClose);
		applyBtn.addEventListener('click', dateInput);
	}

	function btn_tab_on(){
		btn_state_on(todayBtn);
		btn_state_on(closeBtn);
		btn_state_on(applyBtn);
	}
	function btn_state_on(btn){
		if(btn.getAttribute('tabindex') == -1) {
			btn.removeAttribute('tabindex');
			btn.setAttribute('aria-hidden', false);
		}
	}

	/* year, month, day 설정 ------------------------------------------------------------------------ */
	//초기 날짜 관련 세팅 및 변수	
	let thisYear    = now.getFullYear(), 	// 오늘 날짜 포함된 연도 - today 설정용
		thisMonth   = now.getMonth(),		// 오늘 날짜 포함된 월
		today       = now.getDate(),		// 오늘 날짜
		year, 								// 연도 (달력 2개 일 경우 좌측 달력 연도)
		month,  							// 월 (달력 2개 일 경우 좌측 달력 월)
		day, 								// 일 (달력 2개 일 경우 좌측 달력 일)
		rightYear, 							// 달력 2개일 경우 우측 달력 연도
		rightMon, 							// 달력 2개일 경우 우측 달력 월
		leftFirstDay,						// 좌측 달력 월의 첫째 날 
		leftYoil,							// 좌측 달력 월 첫째날의 요일 값
		rightFirstDay,						// 우측 달력 월의 첫째날
		rightYoil,							// 우측 달력 월 첫째날의 요일 값
		weekTx;								// 요일 표기 변수

	// 각 월의 요일 수
	let nalsu = new Array(31,28,31,30,31,30,31,31,30,31,30,31);	
	// 요일 표기
	dayType == 'kr' ? weekTx = new Array("일", "월", "화", "수", "목", "금", "토") : weekTx = new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
	//2월은 윤년 체크
	let nalsu29 = function(){
		year % 4 === 0 && year % 100 !== 0 || year % 400 === 0 ? nalsu[1] = 29 : nalsu[1] = 28;
	}
		
	let chkFirstYoil = function(){ // 각 월의 첫째날 요일 계산
		leftFirstDay	= new Date(year, month, 1);
		rightFirstDay   = new Date(year, month + 1, 1);
		if(limitType == 'after') {
			leftFirstDay	= new Date(year, month - 1, 1);
			rightFirstDay   = new Date(year, month, 1);
		}
		
		leftYoil		= leftFirstDay.getDay();
		rightYoil 		= rightFirstDay.getDay();
		rightYear 		= rightFirstDay.getFullYear();
		rightMon 		= rightFirstDay.getMonth();
		
		nalsu29();
	}, resetDate = function(){ // 연/월/일을 오늘 기준으로 재설정
		year	= thisYear,
		month	= thisMonth,
		day		= today;
	}, dateSetToInp = function(){ // input 에 입력된 값이 있을 경우, 해당 값 데이터 적용
		let dateStartTx, dateEndTx;
		if(inpSingle == true) {
			let dateTx = inp.value;
				dateStartTx = dateTx.split(' ~ ')[0],
				dateEndTx	= dateTx.split(' ~ ')[1];
		} else {
			dateStartTx = inpStart.value,
			dateEndTx 	= inpEnd.value;
		}
		if(limitType == 'after') {
			year = Number(dateEndTx.split('-')[0]);
			month = Number(dateEndTx.split('-')[1]) -1;
			day = Number(dateEndTx.split('-')[2]);
		} else {
			year = Number(dateStartTx.split('-')[0]);
			month = Number(dateStartTx.split('-')[1]) -1;
			day = Number(dateStartTx.split('-')[2]);
		}
		startDate = changeToDate(dateStartTx),
		endDate = changeToDate(dateEndTx);
	}

	/* draw ------------------------------------------------------------------------ */
	let calDraw = function(){
		chkFirstYoil();

		makeCalendar(leftYoil, nalsu[month], year, month + 1, leftCal);
		leftTx.innerText = ''+year+'년 '+(month +1)+'월';

		if(dualCal == true) {
			makeCalendar(rightYoil, nalsu[rightMon], rightYear, rightMon + 1, rightCal);
			rightTx.innerText = ''+rightYear+'년 '+(rightMon +1)+'월';
			if(limitType == 'after') {
				let left_mon = leftFirstDay.getMonth(),
					left_year = leftFirstDay.getFullYear();
				makeCalendar(leftYoil, nalsu[left_mon], left_year, left_mon + 1, leftCal);
				leftTx.innerText = ''+left_year+'년 '+(left_mon + 1)+'월';
			}
		} 
		if(todayLimit == true) limitPNSet();
		if(startDate != null) setDateMark();
	}, calShow = function(){
		calCloseAll();
		let tg = inpSingle == true ? inp : inpStart;
		tg.value.length > 0 ? dateSetToInp() : resetDate();
		calPosition();
		calDraw();
		calWrap.classList.add('on');
		calWrap.focus();
		applyBtn.disabled = true;
		btn_tab_on();
		outSideClick(); // 달력 외 영역 클릭 시 달력 hide
	}

	/* click ------------------------------------------------------------------------ */
	// 달력 표기 방식 (버튼 클릭 / input 클릭 or focus) ------------------------------
	if(showType == 'both' || showType == 'button') {
		wrap.insertAdjacentHTML('beforeend','<button type="button" class="btn-cal">달력보기</button>');
		btn = wrap.querySelector('.btn-cal');

		btn.addEventListener('click', calShow);
	}

	if(showType == 'both' || showType == 'input') {
		if(inpSingle == true) {
			inp.addEventListener('click', calShow);
			inp.addEventListener('keyup', function(e){
				let key = e.keyCode || e.which;
				if(key == 9) calShow();
			});
		} else {
			inpStart.addEventListener('click', calShow);
			inpStart.addEventListener('keyup', function(e){
				let key = e.keyCode || e.which;
				if(key == 9) calShow();
			});
			inpEnd.addEventListener('click', calShow);
			inpEnd.addEventListener('keyup', function(e){
				let key = e.keyCode || e.which;
				if(key == 9) calShow();
			});
		}
	}

	// cal reDraw ------------------------------
	/** 달력 연도제한관련 prev / next버튼 비활성화 */
	function prevNextBtnChk(){
		if(year == minYear && month == 0) prevM.disabled = true;
		if(year == maxYear && month == 11) nextM.disabled = true;
	}

	function prevMonth(){
		if(month > 0) month--;
		else {
			if( year > minYear ) year--;
			month = 11;
		}
		if(nextM.disabled == true) nextM.disabled = false;
		calDraw();
	}
	function nextMonth(){
		if(month < 11) month++;
		else { 
			if( year < maxYear ) year++;
			month = 0;
		}
		if(prevM.disabled == true) prevM.disabled = false;
		calDraw();
	}

	function goToday(){
		resetDate();
		calDraw();
	}

	// input date write ---------------------------
	let clearRangeClass = function() {
		let td = calWrap.querySelectorAll('td');
		for(t=0; t < td.length; t++) {
			td[t].classList.remove('start');
			td[t].classList.remove('end');
			td[t].classList.remove('in-range');
		}
	}, dateSelect = function(e){
		let dateBtn = e.target.tagName == 'BUTTON' ? e.target : e.target.closest('BUTTON'),
			tdDate = changeToDate(dateBtn.getAttribute('data-date'));

		if(endDate == null && startDate == null || endDate != null && startDate != null) {
			clearRangeClass();
			startDate = changeToDate(dateBtn.getAttribute('data-date'));
			endDate = null;
			dateBtn.parentNode.classList.add('start');
			if(rangeLimit != null) setRnageDisabled();
			applyBtn.disabled = true;
		} else if(startDate != null && endDate == null ){
			if(rangeLimit == null) {
				if( tdDate >= startDate ) {
					endDate = changeToDate(dateBtn.getAttribute('data-date'));
					dateBtn.parentNode.classList.add('end');
					applyBtn.disabled = false;
				} else {
					clearRangeClass();
					startDate = changeToDate(dateBtn.getAttribute('data-date'));
					if(rangeLimit != null) setRnageDisabled();
					dateBtn.parentNode.classList.add('start');
				}
			} else {
				if( tdDate >= startDate && tdDate < startDate.valueOf() + (60 * 60 * 24 * 1000 * rangeLimit)){
					endDate = changeToDate(dateBtn.getAttribute('data-date'));						
					dateBtn.parentNode.classList.add('end');
					applyBtn.disabled = false;
					setRnageEnabled();
				} else {
					alert('기간 선택은 시작일 이후 '+set.rangeLimit+'일 이내여야 합니다.');
				}
			}
		}
		
	}, dateBtnSet = function(){
		let btnDate = calWrap.querySelectorAll('td button');
		for(b=0; b<btnDate.length; b++){
			btnDate[b].addEventListener('click', dateSelect);
			btnDate[b].addEventListener('mouseover', dateBgSet);
			if(todayLimit == true) limitSet(btnDate[b]);
		}
		prevNextBtnChk();
	}

	// 시작일-종료일 최종 input 에 설정하기 및 달력 닫기.
	function dateInput(){
		if(inpSingle == true) {
			inp.value = changeToYMD(startDate) + ' ~ ' + changeToYMD(endDate);
			inp.dispatchEvent(changeEvt);
		} else {
			inpStart.value = changeToYMD(startDate);
			inpEnd.value = changeToYMD(endDate);
			inpStart.dispatchEvent(changeEvt);
		}			
		calClose();
	}

	/* 기타 기능 ------------------------------------------------------------------------ */
	// 오늘 날짜 제한 기능 관련
	let limitSet = function(e){
		let tg = e,
			tgDate = tg.getAttribute('data-date');
		if(limitType == 'after') {
			if(changeToDate(tgDate) > limitDay) tg.disabled = true;
			if(limitGap != null) if(changeToDate(tgDate) < limitGapDay) tg.disabled = true;
		} else {
			if(changeToDate(tgDate) < limitDay) tg.disabled = true;
			if(limitGap != null) if(changeToDate(tgDate) > limitGapDay) tg.disabled = true;
		}
	},
	// 오늘 날짜 제한 시 - 이전/다음 버튼 비활성화
	limitPNSet = function(){
		tg_ena_set(prevM);
		tg_ena_set(nextM);
		if(limitType == 'after') {
			year >= limitY && month >= limitM ? tg_dis_set(nextM) : tg_ena_set(nextM);
			if(limitGap != null) year <= limitGapY && month <= limitGapM ? tg_dis_set(prevM) : tg_ena_set(prevM);
		} else {
			year <= limitY && month <= limitM ? tg_dis_set(prevM) : tg_ena_set(prevM);
			if(limitGap != null) year >= limitGapY && month >= limitGapM ? tg_dis_set(nextM) : tg_ena_set(nextM);
		}
	},
	// 선택 된 날짜 표기
	setDateMark = function(){
		let chkTds = calWrap.querySelectorAll('td');
		for(i=0; i<chkTds.length; i++){
			let btn = chkTds[i].querySelector('button');
			if(btn != null) {
				let btnDate = changeToDate(btn.getAttribute('data-date')).valueOf();
				if(endDate == null) {
					if(btnDate == startDate.valueOf()) chkTds[i].classList.add('start');
					if(rangeLimit != null) setRnageDisabled();
				} else {
					if(btnDate == startDate.valueOf()) chkTds[i].classList.add('start');
					if(btnDate == endDate.valueOf()) chkTds[i].classList.add('end');
					if(btnDate > startDate.valueOf() && btnDate < endDate.valueOf()) chkTds[i].classList.add('in-range');
					if(rangeLimit != null) setRnageEnabled();
				} 
			}
		}
	},		
	// 시작 - 종료일 사이 날짜 마우스 over 시 bg 컬러 변경
	dateBgSet = function(e){
		if(startDate != null && endDate == null) {
			let td 		= calWrap.querySelectorAll('td'),
				btn 	= e.target.tagName == 'BUTTON' ? e.target : e.target.closest('BUTTON'),
				eDate 	= changeToDate(btn.getAttribute('data-date'));
			for(t=0; t < td.length; t++) {
				let tdBtn = td[t].querySelector('button');
				if(tdBtn != null) {
					thisBtnDate = changeToDate(tdBtn.getAttribute('data-date'));
					thisBtnDate > startDate && thisBtnDate < eDate ? td[t].classList.add('in-range') : td[t].classList.remove('in-range');
				}
			}
		}
	},
	// 시작일 선택 후 rangeLimit 이외 기간 버튼 비활성화
	setRnageDisabled = function(){
		let btns = calWrap.querySelectorAll('td button');
		for(b=0; b<btns.length; b++){
			let date = changeToDate(btns[b].getAttribute('data-date'));
			if( date < startDate || date > startDate.valueOf() + (60 * 60 * 24 * 1000 * rangeLimit - 1)) btns[b].disabled = true;
		}
	},
	// 종료일 선택 후 rangeLimit 이외 기간 버튼 활성화
	setRnageEnabled = function(){			
		let btns = calWrap.querySelectorAll('td button');
		for(b=0; b<btns.length; b++){
			btns[b].disabled = false;
			if(todayLimit == true ) limitSet(btns[b]);
		}
	}

	function tg_dis_set(tg){
		tg.disabled = true;
		tg.setAttribute('tabindex', '-1');
		tg.setAttribute('aria-hidden', true);
	}
	function tg_ena_set(tg){
		tg.disabled = false;
		tg.removeAttribute('tabindex');
		tg.removeAttribute('aria-hidden');
	}

	// 달력 날짜 그리기 함수 -----------------------------------------------------------------
	function makeCalendar(firstYoil, nalsu, year, month, tgCal) {
		if(month < 10) month = '0'+month;
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
					let dayNum = no < 10 ? '0'+no : no;
					str += "<td><button type='button' data-date='"+year+"-"+month+"-"+dayNum+"'>" + no + "</button></td>";
					no++;
				}
				
			}
			//str += "<td>&nbsp;</td>";
			
			str += "</tr>";
		}
		while (tgCal.firstChild) tgCal.removeChild(tgCal.firstChild); // 기존 달력 내용 지우기
		tgCal.insertAdjacentHTML('beforeend', str);
		dateBtnSet();
	}

	/* common functions --------------------------------------- */
	// 달력 생성 위치 설정 함수
	function calPosition(){
		if(inCalWrap) { // 달력이 wrap 내부일 경우 설정
			calWrap.classList.add('in-wrap');
			calWrap.style.top = '100%';
			return;
		}
		let top		= offset(wrap).top,
			left	= offset(wrap).left;

		let par = wrap.parents();
		for(let p=0; p<par.length; p++){
			if(par[p].style.position == 'fixed') calWrap.style.position = 'fixed';
		}

		calWrap.style.top = top + wrap.offsetHeight + 'px';
		calWrap.style.left = left + 'px';

		if(cal_pos == 'right') calWrap.style.transform = 'translateX(calc(-100% + '+ wrap.offsetWidth +'px))';
	}

	// yyyy-mm-dd 형식을 date 값으로 변환
	function changeToDate(e){
		let thisY = e.split('-')[0],
		thisM = e.split('-')[1] - 1,
		thisD = e.split('-')[2],
		nowDate = new Date(thisY, thisM, thisD);
		return nowDate;
	}
	// date 값을 yyyy-mm-dd 형식으로 변환
	function changeToYMD(e){
		let thisY = e.getFullYear(),
		thisM = e.getMonth() + 1,
		thisD = e.getDate(),
		nowDate;
		if(thisM < 10) thisM = '0'+thisM;
		if(thisD < 10) thisD = '0'+thisD;
		nowDate = ''+thisY+'-'+thisM+'-'+thisD+'';
		return nowDate;
	}

}

/*
1. 각종 option 값 내부 변수화
2. input 에 value 유무 확인 및 그에 따른 기본일자 설정
3. 추가 제한 사항 확인
   - 선택 제한 기능 (오늘 이후, 이전 / 오늘부터 몇일전/몇일후부터 제한 / 최대 선택 가능 기간 설정 / 선택 가능기간 설정 )
   - 제한 기능에 따른 비활성화 제어
4. 달력 화면 내 요소 그리기 및 기능 설정

*/