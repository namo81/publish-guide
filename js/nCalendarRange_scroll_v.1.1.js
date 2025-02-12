/**
 * area (dom/string) : 달력 연계할 input 을 포함한 영역
 * inp_single(boolean) : input 을 1개만 사용할 경우 - true 일 경우 inp_start/inp_end 옵션은 무시됨.
 * inp_start (dom) : 시작일 input - 별도 dom 지정 없을 경우 area 내 'start' 클래스를 가진 input 으로 설정
 * inp_end (dom) : 시작일 input - 별도 dom 지정 없을 경우 area 내 'end' 클래스를 가진 input 으로 설정
 * btn (dom) : 달력 호출버튼 - 별도 지정 없을 경우 'open-cal' 클래스를 가진 버튼으로 설정
 * 
 * inPage (boolean) : 페이지 내 삽입여부 (기본은)
 * inTarget (dom/string) : inPage 가 true 일 경우 달력 넣을 영역 dom / 선택자
 * calTitle (string) : 달력 제목
 * beforeLimit (number) : 오늘 이전 몇일까지 선택가능하게할지 date 값
 * show_year (boolean) : 연도 표기를 2자리로 할지 여부 (기본은 false)
 * activeConfirm : 컨펌 버튼 클릭 시 실행함수
 */


/** 달력 기능 ================================================================== */
function nCalendarRangeScroll(option){
    let inPage          = option.inPage ? option.inPage : false,
        inTarget        = typeof option.inTarget === 'string' ? document.querySelector(option.inTarget) : option.inTarget,
        inp_single      = option.inp_single ? option.inp_single : false,
        calTitle        = option.calTitle,
        beforeLimit     = option.beforeLimit ? option.beforeLimit : null,
        shot_year       = option.shot_year ? option.shot_year : false,
        activeConfirm   = option.activeConfirm;

    let wrap, inp_start, inp_end, btn_open;

    let body = document.querySelector('body'),
        bodyStyle = body.style;
    
    if(inPage == false) {
        wrap        = typeof option.area === 'string' ? document.querySelector(option.area) : option.area;
        btn_open    = option.btn ? option.btn : wrap.querySelector('.open-cal');
        if(inp_single == true) inp_start = wrap.querySelector('input[type=text]');
        else {
            inp_start   = option.inp_start ? option.inp_start : wrap.querySelector('.start');
            inp_end     = option.inp_end ? option.inp_end : wrap.querySelector('.end');
        }
    }

    let startDate   = null,
        endDate     = null;
    
    let now         = new Date(),
        today       = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        monArr      = new Array(), // 오늘 / 90일전 / 그 사이 날짜를 포함하는 월의 배열 */
        cal_height,
        dateBtns,
        limitDay;
    
    if(beforeLimit != null) limitDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - beforeLimit);
    /**
     * dom 요소 생성 및 클래스 추가
     * @param {string} type 만들고자 하는 태그명
     * @param {string / object} cls 추가하고자 하는 클래스
     * @returns cls 클래스를 가진 dom 요소
     */
    function createEle(type, cls){
        let dom = document.createElement(type);
        if(typeof cls === 'string') dom.classList.add(cls);
        else cls.forEach((tx)=>{ dom.classList.add(tx); })
        return dom;
    }

    // 기본정보 설정 =====================================================================================
    /** 요일 표기 (일~월) */
    let weekTx = new Array("일","월","화","수","목","금","토");
    /** 배열 : 각 월의 요일 수 */
    let nalsu = new Array(31,28,31,30,31,30,31,31,30,31,30,31);	
    /** 2월 윤년 체크 */
    let nalsu29 = function(year){
        year % 4 === 0 && year % 100 !== 0 || year % 400 === 0 ? nalsu[1] = 29 : nalsu[1] = 28;
    }
    nalsu29(now.getFullYear());
    
    /** 요일 영역 생성 */
    function setYoil(){
        let str = '';
        for(let i = 0; i < weekTx.length; i++){
            str += "<li aria-hidden='hidden'>" + weekTx[i] + "</li>";
        }
        calYoil.insertAdjacentHTML('beforeend',str);
    }
    
    // 달력번호 - id 뒤에 숫자추가용 (접근성 aria-controls 속성)
	let dum = document.querySelectorAll('.cal-wrap'),
    cal_num = dum.length;

    // 그리기 설정 (기본달력 / inPage 달력) =====================================================================================
    // 달력 modal 구조 생성
	let newCal = createEle('div', 'cal-wrap'),
        inbox  = createEle('div', 'cal-cnt'),
        calTop = createEle('div', 'cal-top'), // 달력 상단 제어영역
        calTit = createEle('h2', 'cal-title'),
        btn_close = createEle('button', 'btn-cal-close');

    // 기간 달력 스크롤 영역 구조 생성
    let range_wrap = createEle('div', 'cal_range_scroll'),
        scrollArea  = createEle('div', 'scroll-box'),
        calArea = createEle('div', 'cal-area'), // 달력 테이블 영역
        calInfo = createEle('div', 'cal-info'),
        calYoil = createEle('ul', 'cal-yoil'),
        dateInfo = createEle('div', 'date-info'),
        info_start = createEle('p', ['sel-date', 'start']),
        info_end = createEle('p', ['sel-date', 'end']),
        startTx = createEle('strong', 'srch-date'),
        endTx = createEle('strong', 'srch-date'),
        btnArea = createEle('div', 'btns'), // 버튼 영역
        btn_confirm = createEle('button', ['btn', 'large', 'main']);
    
    setYoil();

    calInfo.appendChild(dateInfo);
    calInfo.appendChild(calYoil);
    info_start.textContent = '시작일';
    info_end.textContent = '종료일';
    info_start.appendChild(startTx);
    info_end.appendChild(endTx);
    dateInfo.appendChild(info_start);
    dateInfo.appendChild(info_end);

    scrollArea.appendChild(calArea);

    btn_confirm.setAttribute('type', 'button');
    btn_confirm.textContent = '선택완료';
    btnArea.appendChild(btn_confirm);

    range_wrap.appendChild(calInfo);
    range_wrap.appendChild(scrollArea);
    range_wrap.appendChild(btnArea);

    if(inPage == true) inTarget.appendChild(range_wrap);
    else {
        newCal.appendChild(inbox);
        newCal.setAttribute('id', 'modal-cal_' + cal_num);
        newCal.setAttribute('role', 'dialog');
        newCal.setAttribute('tabindex', 0);
        if(calTitle != undefined) {
            calTit.textContent = calTitle;
            calTop.appendChild(calTit);
            inbox.appendChild(calTop);
        }
        inbox.appendChild(range_wrap);
        inbox.appendChild(btn_close);
        body.appendChild(newCal);

        btn_open.setAttribute('aria-controls', newCal.getAttribute('id'));
        btn_open.setAttribute('aria-haspopup', 'dialog');
        btn_open.setAttribute('aria-expended', false);

        btn_open.addEventListener('click', calShow);
        btn_close.addEventListener('click', calClose);
        btn_confirm.addEventListener('click', calConfirm);
    }

    /** 달력 보이기 */
    function calShow(){
        calInit();
        newCal.classList.add('on');
        newCal.focus();
        btn_open.setAttribute('aria-expended', true);
        body.classList.add('hold');
        bodyStyle.overflow = 'hidden';
    }
    
    /** 달력 닫기 */
    function calClose(){
        newCal.classList.remove('on');
        btn_open.setAttribute('aria-expended', false);
        inp_start.focus();
        body.classList.remove('hold');
        bodyStyle.overflow = '';
    }
    
    /** 달력 컨펌 */
    function calConfirm(){
        let start_tx = startTx.textContent,
            end_tx = endTx.textContent;
        if(inp_single == true) {
            inp_start.value = shot_year == true ? start_tx.substr(2) + ' ~ ' + end_tx.substr(2) : start_tx + ' ~ ' + end_tx;
            inp_start.dispatchEvent(changeEvt);
        } else {
            inp_start.value = shot_year == true ? start_tx.substr(2) : start_tx;
            inp_end.value = shot_year == true ? end_tx.substr(2) : end_tx;
            inp_start.dispatchEvent(changeEvt);
            inp_end.dispatchEvent(changeEvt);
        }
        if(typeof activeConfirm === 'function') activeConfirm();
        calClose();
    }
    
    /** 컨펌 버튼 활성화 제어 */
    function btn_dis_ctrl(){
        if(startDate != null && endDate != null) {
            btn_confirm.disabled = false;
            btn_confirm.focus();
        } else btn_confirm.disabled = true;
    }

    /** input 날짜 여부 확인 - 일반 달력형 */
    function inpGetDate(){
        if(inp_single == true) {
            let val = inp_start.value;
            if(val.length > 0){
                let s_date = val.split(' ~ ')[0],
                    e_date = val.split(' ~ ')[1];
                if(shot_year == true) {
                    s_date = '20' + s_date;
                    e_date = '20' + e_date;
                }
                startTx.textContent = s_date;
                endTx.textContent = e_date;
            }
            return;
        }
        if(inp_start.value.length > 0) {
            let s_date = inp_start.value;
            if(shot_year == true) s_date = '20' + s_date;
            startTx.textContent = s_date;
        }
        if(inp_end.value.length > 0) {
            let e_date = inp_end.value;
            if(shot_year == true) e_date = '20' + e_date;
            endTx.textContent = e_date;
        }
    }

    /** 입력된 날짜 여부 확인 - inPgae 일 경우 */
    function getDataDate(){
        if(startTx.textContent.length > 0) {
            let s_date = startTx.textContent;
            startDate = convertToDate(s_date, '-');
            startTx.textContent = s_date;
        }
        if(endTx.textContent.length > 0) {
            let e_date = endTx.textContent;
            endDate = convertToDate(e_date, '-');
            endTx.textContent = e_date;
        }
    }

    let viewGap15; // 이번달 - 시작일포함 달 간의 개월차이 숫자값
    /** viewGap15 산출 - 이번달 - 시작일포함 달 간의 개월차이 숫자값 */
    function calcGap(){
        if(startDate == undefined) { viewGap15 = 3; }
        else {
            let viewDateGap = (today.valueOf() - startDate.valueOf()) / (60 * 60 * 24 * 1000);
            viewGap15 = Math.ceil(viewDateGap / 15) < 3 ? 3 : Math.ceil(viewDateGap / 15); // 계산값이 2 이하일 경우 2 고정 (2024-03-26 수정 : 최소값 3)
        }
    }

    /** 이번달 - 시작일포함달 및 사이에 포함된 달의 배열 생성 */
    function monCalc(){
        let tempArr = new Array();
        for(let i=0; i<viewGap15; i++){
            let gapDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (15 * i));
            tempArr.push(gapDate.getFullYear() + '-' + gapDate.getMonth() + '-1');
        }
        monArr = tempArr.filter((item, idx) => tempArr.indexOf(item) === idx);
    }

    /** monArr 기준 이전달 산출 */
    function caldPrevMon(){
        let nowFirst = monArr[monArr.length - 1],
            splitTx = nowFirst.split('-'),
            tempY   = Number(splitTx[0]),
            tempM   = Number(splitTx[1]) - 1,
            tgDate  = new Date(tempY, tempM, 1);
        return tgDate.getFullYear() + '-' + tgDate.getMonth() + '-1';
    }

    /**
     * monArr에 따라 달력 그리기 실행
     * @param {array} arr - monArr
     */
    function calDrawFromArr(arr){
        while (calArea.firstChild) calArea.removeChild(calArea.firstChild);
        for(let i= 0; i < arr.length; i++){
            calDrawRun(arr[i]);
        }
    }

    /**
     * 달력 그리기 실행
     * @param {date} date 그리고자 하는 달력의 date (YYYY.MM.DD) 형식의 string
     */
    function calDrawRun(date){
        let splitTx = date.split('-'),
            tempY   = Number(splitTx[0]),
            tempM   = Number(splitTx[1]),
            firstD  = new Date(tempY, tempM, 1);
        makeCalendar(firstD.getDay(), nalsu[tempM], tempY, tempM + 1);
    }

    /** 달력 내 버튼 기능 활성화
     * @param {dom} area : 달력 영역(.cal)
     */
    function calBtnOn(area){
        let btns = area.querySelectorAll('td button');
        Array.prototype.forEach.call(btns, function(btn){
            dateStateSet(btn);
            btn.addEventListener('click', dateBtnClick);
        });
        dateBtns = calArea.querySelectorAll('td button'); // 전체버튼 변수 업데이트
    }

    /** 스크롤 감지 관련 */
    let scrollChk = document.createElement('p')
        scrollChk.classList.add('scroll-trigger');
        scrollChk.setAttribute('tabindex', -1);
    scrollArea.appendChild(scrollChk);

    /** observer 관련 옵션 */
    let observerOpt = {
        root : scrollArea,
        threshold : 0.99
    }

    let obsr1 = new IntersectionObserver(preMonAdd, observerOpt);
    obsr1.observe(scrollChk);
    
    /**
     * 이전달 달력 추가
     * @param {entry} ent observer 데이터
     */
    function preMonAdd(ent){
        ent.forEach((entry) => {
            if(entry.isIntersecting) {
                let tgDate = caldPrevMon();
                monArr.push(tgDate);
                calDrawRun(tgDate);
                setTimeout(function(){ // ios 보정용 settimeout
                    scrollArea.scrollTo(0, (cal_height + 25)); // 25 는 cal 에 설정된 margin-top 값
                }, 10)
            }
        })
    }

    /**
     * 달력 날짜 그리기 함수
     * @param {number} fYoil 지정 월 1일의 요일값
     * @param {number} nalsu 지정 월 날수
     * @param {number} year 지정 연도
     * @param {number} month 지정 월
     */
    function makeCalendar(fYoil, nalsu, year, month) {        
        let monthDate = month < 10 ? '0'+month : month,
            div_cal   = document.createElement('div');

        let str = "";
        str += "<p class='cal-year-mon' tabindex='-1'>" + year + '-' + monthDate + "</p>";
        str += "<table border ='0'>";
        str += "<caption>" + year + "년" + month + "월 달력</caption><thead class='hide'>";
        str += "<tr>";
        for(let i = 0; i < weekTx.length; i++){
            str += "<th scope='col' aria-hidden='hidden'>" + weekTx[i] + "</th>";
        }
        str += "</tr>";
        str += "</thead><tbody>";
        
        /** 날 수 채우기 */
        let no = 1,
            currentCell = 0,
            ju = Math.ceil((nalsu + fYoil) / 7);
        for(let r=0; r < ju; r++){
            str += "<tr>";
            for(let col=0; col < 7; col++){
                if(currentCell < fYoil || no > nalsu){
                    str += "<td>&nbsp;</td>";
                    currentCell++;
                } else {
                    let dayNum = no < 10 ? '0'+no : no;
                    if(col == 0) str += "<td class='sun'><button type='button' data-date='"+year+"-"+monthDate+"-"+dayNum+"' title='"+year+"-"+monthDate+"-"+dayNum+" "+weekTx[col]+"요일'>" + no + "</button></td>";
                    else if(col == 6) str += "<td class='sat'><button type='button' data-date='"+year+"-"+monthDate+"-"+dayNum+"' title='"+year+"-"+monthDate+"-"+dayNum+" "+weekTx[col]+"요일'>" + no + "</button></td>";
                    else str += "<td><button type='button' data-date='"+year+"-"+monthDate+"-"+dayNum+"' title='"+year+"-"+monthDate+"-"+dayNum+" "+weekTx[col]+"요일'>" + no + "</button></td>";
                    no++;
                }
            }            
            str += "</tr>";
        }
        str += "</tbody></table>";
        div_cal.classList.add('cal');
        div_cal.insertAdjacentHTML('beforeend', str);
        calArea.insertBefore(div_cal, calArea.firstChild);
        cal_height = div_cal.offsetHeight;
        calBtnOn(div_cal);
    }

    /** 달력 생성 후 날짜 버튼 표기 설정(시작일/종료일 등) + 비활성화 설정 */
    function dateStateSet(e){
		let tg          = e,
			tgDate      = tg.getAttribute('data-date'),
            thisValue   = convertToDate(tgDate, '-').valueOf();
        if(thisValue > today.valueOf()) btn_dis(tg);
        if(beforeLimit != null && thisValue < limitDay.valueOf()) btn_dis(tg);
        if(thisValue == today.valueOf()) tg.parentNode.classList.add('today');

        if(startDate) { 
            if(thisValue == startDate.valueOf()) tg.parentNode.classList.add('start', 'in-range'); 
            if(thisValue == endDate.valueOf()) tg.parentNode.classList.add('end', 'in-range');
            if(thisValue > startDate.valueOf() && thisValue < endDate.valueOf()) tg.parentNode.classList.add('in-range');
        };
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

    /** 선택 날짜 관련 클래스 전체 제거 */
    function selClassClear(){
        if(calArea.querySelector('td.start')) calArea.querySelector('td.start').classList.remove('start');
        if(calArea.querySelector('td.end')) calArea.querySelector('td.end').classList.remove('end');
        if(calArea.querySelector('td.select')) calArea.querySelector('td.select').classList.remove('select');
        let ranges = calArea.querySelectorAll('td.in-range');
        Array.prototype.forEach.call(ranges, function(range){ range.classList.remove('in-range') });
    }

    /** 시작일 설정 */
    function onSetStartDate(date){
        startDate = date;
        startTx.setAttribute('data-date', convertToYMD((startDate), '-'));
        startTx.textContent = convertToYMD(startDate, '-');
    }
    /** 종료일 설정 */
    function onSetEndDate(date){
        endDate = date;
        endTx.setAttribute('data-date', convertToYMD((endDate), '-'));
        endTx.textContent = convertToYMD(endDate, '-');
    }

    /** 날짜 클릭 시 실행 */
    function dateBtnClick(e){
        let tg      = e.target,
            tgDate  = convertToDate(tg.getAttribute('data-date'), '-');
        if(startDate && endDate || !startDate && !endDate) {
            selClassClear();
            tg.parentNode.classList.add('start');
            endDate = null;
            onSetStartDate(tgDate);
        } else if(startDate && !endDate) {
            let thisValue = tgDate.valueOf(),
                startValue = startDate.valueOf();
            if( thisValue >= startValue){
                tg.parentNode.classList.add('end');
                onSetEndDate(tgDate);
                dateRangeBgSet();
            } else {
                onSetEndDate(startDate);
                onSetStartDate(tgDate);
                let firstTd = calArea.querySelector('td.start');
                selClassClear();
                firstTd.classList.remove('start');
                firstTd.classList.add('end');
                tg.parentNode.classList.add('start');
                dateRangeBgSet();
            }
        }
        btn_dis_ctrl();
    };

    /** 날짜 클릭 - 기간 달력에서 '종료일' 클릭 시 실행 */
    function dateRangeBgSet(){
        let startValue  = startDate.valueOf(),
            endValue    = endDate.valueOf();
        
        Array.prototype.forEach.call(dateBtns, function(dateBtn){
            let dateBtnVal = convertToDate(dateBtn.getAttribute('data-date'), '-').valueOf();
            dateBtnVal >= startValue && dateBtnVal <= endValue ? dateBtn.parentNode.classList.add('in-range') : dateBtn.parentNode.classList.remove('in-range');
        });
    };


    /** 달력 내부 스크롤 위치 설정 */
    function calScrollSet(){
        scrollArea.scrollTo(0, 0);
        let tgObj = endDate ? calArea.querySelector('.end button') : calArea.querySelector('.today button'),
            scVal = tgObj.getBoundingClientRect().top - scrollArea.getBoundingClientRect().top - (scrollArea.clientHeight / 2);
        scrollArea.scrollTo(0, scVal);
    }
    /**
     * 시작일 / 종료일 기준 버튼 활성화( value_update 함수용 )
     * @param {date} sDate 시작일
     * @param {date} eDate 종료일
     */
    function setDate(sDate, eDate){
        let setDateVal_s = sDate,
            setDateVal_e = eDate ? eDate : null;
        Array.prototype.forEach.call(dateBtns, function(dateBtn){
            let thisDate = dateBtn.getAttribute('data-date');
            thisDate == setDateVal_s ? dateBtn.dispatchEvent(clickEvt) : null;
            if(setDateVal_e) thisDate == setDateVal_e ? dateBtn.dispatchEvent(clickEvt) : null;
        });
    }
    
    /** 달력 초기화 */
    function calInit(){
        if(inPage == false) inpGetDate();
        getDataDate()
        calcGap();
        monCalc();
        calDrawFromArr(monArr);
        setDate(startDate, endDate);
        calScrollSet();
        btn_dis_ctrl();
    }
    calInit();
    
    // 외부호출 =============================================================
    
    /** 달력 리셋(오늘날짜) */
    this.calReset = function(){
        selClassClear();
        onSetStartDate(today);
        onSetEndDate(today);
    }

    /** 달력 내 버튼 활성/비활성 (배열 기준) */
    this.calBtnSet = function(array){
        Array.prototype.forEach.call(dateBtns, function(dateBtn){ 
            let date = dateBtn.getAttribute('data-date');
            array.indexOf(date) != -1 ? dateBtn.disabled = false : dateBtn.disabled = true;
        });
    }

    /** input 값 재 적용 */
    this.value_update = calInit();

    /** input 선택 */
    this.start = inp_start;
    this.end = inp_end;
}