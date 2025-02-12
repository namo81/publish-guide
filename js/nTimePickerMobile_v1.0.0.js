/*
    2023-03-22 : v1.0.0 추가 - 기존 pc용을 mobile용으로 develop
*/

/** time picker (bottom sheet) */
function nTimeSetMobile(option){
    let wrap 		= typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        input 		= typeof option.input === 'string' ? wrap.querySelector(option.input) : option.input,
		inPage		= option.inPage ? option.inPage : false, // 페이지 내 표기 선택
		inTarget	= option.inTarget ? option.inTarget : null, // 페이지 표기 할 영역 선택
        selTitle    = option.title,
        optHeight   = option.optHeight ? option.optHeight : 30,
        gap_count   = option.gap_count ? option.gap_count : 3,
        halfTime    = option.halfTime ? option.halfTime : false, // 시간 선택 시 오전/오후 기능 사용 여부
        halfShow    = option.halfShow ? option.halfShow : false; // 시간 표기 시 오전/오후 표기 사용 여부

    // 공통함수
    function setZero(num){
        return num < 10 ? '0' + num : num;
    }

    // input readonly 일때 android 에서 click 이벤트 안됨 -> input 위에 투명버튼 추가
    let btn_open = document.createElement('button'),
        btnOk		= document.createElement('button'),
        btnNo		= document.createElement('button');

    if(inPage == false){
        btn_open.setAttribute('type', 'button');
        btn_open.setAttribute('aria-haspopup', 'dialog');
        btn_open.setAttribute('aria-expanded', 'false');
        btn_open.classList.add('btn-open');
        btn_open.setAttribute('title', input.value);
        btn_open.textContent = '시간설정 열기 버튼';
        wrap.appendChild(btn_open);
    }
    input.setAttribute('aria-hidden', 'true');
    input.setAttribute('tabindex', '-1');
    
    let hourMaxLimit = halfTime ? 12 : 24,
        ampm_wrap, ampm, ampmBtns;

    // 시간표기 기본 설정값
    let hourMin 	= option.hourMin ? option.hourMin : 0,
        hourMax 	= option.hourMax ? option.hourMax : hourMaxLimit,
        minMin 		= option.minMin ? option.minMin : 0,
        minMax 		= option.minMax ? option.minMax : 60,
        minStep		= option.minStep ? option.minStep : 1;
    
    let scroll_padding = optHeight * gap_count;

    // 기본 구조 생성
    let total_wrap,
        time_wrap 	= document.createElement('div'),
        roll_wrap	= document.createElement('div'),
        hour_wrap	= document.createElement('div'),
        hour		= document.createElement('div'),
        min_wrap	= document.createElement('div'),
        min			= document.createElement('div'),
        btns		= document.createElement('div');

    let body        = document.querySelector('body'),
        bodyStyle   = body.style;
    
    // 시간/분/오전,오후 저장용 변수
    let set_hour, set_min, set_ampm;
    
    /** 현재 선택 상태표기 설정 (input 값 유무에 다른 설정 포함) */
    function setTxVal(){
        if(halfTime) {
            if(halfShow){
                set_ampm    = input.value.length > 0 ? input.value.split(' ')[0] : '오전';
                set_hour 	= input.value.length > 0 ? Number(input.value.split(' ')[1].split(':')[0]) : 12;
                set_min 	= input.value.length > 0 ? Number(input.value.split(' ')[1].split(':')[1]) : 0;
            } else {
                set_hour 	= input.value.length > 0 ? Number(input.value.split(':')[0]) : 0;
                set_min 	= input.value.length > 0 ?Number( input.value.split(':')[1]) : 0;
                if(set_hour >= 12) {
                    set_ampm    = '오후';
                    set_hour    = set_hour == 12 ? 12 : set_hour - 12;
                } else {
                    set_ampm    = '오전';
                }
            }
        } else {
            set_hour 	= input.value.length > 0 ? Number(input.value.split(':')[0]) : 0;
            set_min 	= input.value.length > 0 ?Number( input.value.split(':')[1]) : 0;
        }
    }
    setTxVal();

    // 기본 구조 생성
    time_wrap.classList.add('modal', 'sel-time');
    roll_wrap.classList.add('scroll-select-cnt');
    roll_wrap.classList.add('modal-cnt');
    hour_wrap.classList.add('scroll-wrap');
    hour.classList.add('scroll-cnt', 'area-hour');
    min_wrap.classList.add('scroll-wrap');
    min.classList.add('scroll-cnt', 'area-min');
    btns.classList.add('btns');

    if(inPage == true) {
        inTarget = typeof inTarget === 'string' ? document.querySelector(inTarget) : inTarget;
        inTarget.appendChild(roll_wrap);
        total_wrap = inTarget;
    } else {
        time_wrap.appendChild(roll_wrap);
        total_wrap = time_wrap;
    }

    hour_wrap.appendChild(hour);
    min_wrap.appendChild(min);
    roll_wrap.appendChild(hour_wrap);
    roll_wrap.appendChild(min_wrap);

    hour_wrap.style.height = optHeight * ((gap_count * 2) + 1) + 'px';
    hour.style.padding = scroll_padding + 'px 0px';
    min_wrap.style.height = optHeight * ((gap_count * 2) + 1) + 'px';
    min.style.padding = scroll_padding + 'px 0px';

    let tag_ul = '<ul class="sel-list"></ul>',
        hour_ul, min_ul, ampm_ul;
    hour.insertAdjacentHTML('beforeend', tag_ul);
    min.insertAdjacentHTML('beforeend', tag_ul);
    hour_ul = hour.querySelector('ul'),
    min_ul = min.querySelector('ul');

    if(inPage == false){
        roll_wrap.appendChild(btns);
        btnOk.classList.add('btn');
        btnOk.classList.add('large');
        btnOk.classList.add('main');
        btnNo.classList.add('btn-sel-close');
        btnOk.innerText = '확인';
        btnNo.innerText = '취소';
        btns.appendChild(btnOk);
        roll_wrap.appendChild(btnNo);
    } 

    /** Observer 설정 */
    let observerOpt_ampm,
        observerOpt_hour,
        observerOpt_min,
        obs_ampm,
        obs_hour,
        obs_min;

    observerOpt_ampm = {
        rootMargin : -(scroll_padding - 15) + 'px 0px',
        threshold : 0.9
    }
    observerOpt_hour = {
        root : hour,
        rootMargin : -(scroll_padding - 15) + 'px 0px',
        threshold : 0.9
    }
    observerOpt_min = {
        root : min,
        rootMargin : -(scroll_padding - 15) + 'px 0px',
        threshold : 0.9
    }

    if(checkMobile() == 'ios') { // ios 는 root 요소의 padding 값을 제거한 높이를 기준으로 동작함 (전체높이X)
        observerOpt_ampm.rootMargin = '10px 0px';
        observerOpt_hour.rootMargin = '10px 0px';
        observerOpt_min.rootMargin = '10px 0px';
    }

    obs_hour = new IntersectionObserver(scrollCenterSet, observerOpt_hour);
    obs_min = new IntersectionObserver(scrollCenterSet, observerOpt_min);

    /**
     * 스크롤 시 중앙위치 버튼 cls 제어 함수
     * @param {observe} ent observer 관련 변수
     */
    function scrollCenterSet(ent){
        ent.forEach((entry) => {
            entry.isIntersecting ? entry.target.classList.add('on') : entry.target.classList.remove('on');
        });
    }
    
    /** 시간/분 리스트 버튼 추가 */
    for(let h = hourMin; h<hourMax; h++){
        let tag_tx,
            h_tx;
        if(halfTime) h == 0 ? h_tx = 12 : h_tx = h;
        else h_tx = h;
        tag_tx = h == set_hour ? '<li><button type="button" title="시간" class="on" role="option" aria-selected="true">'+ h_tx +'</button></li>' : '<li><button type="button" title="시간" role="option" aria-selected="false">'+ h_tx +'</button></li>';
        hour_ul.insertAdjacentHTML('beforeend', tag_tx);
    }

    for(let m=minMin; m<minMax; m += minStep){
        let tag_tx = m == set_min ?  '<li><button type="button"title="분" class="on" role="option" aria-selected="true">'+ m +'</button></li>' : '<li><button type="button" title="분" role="option" aria-selected="false">'+ m +'</button></li>';
        min_ul.insertAdjacentHTML('beforeend', tag_tx);
    }

    // 오전/오후 기능 사용 시
    if(halfTime) {
        ampm_wrap   = document.createElement('div');
        ampm        = document.createElement('div');
        ampm_wrap.classList.add('scroll-wrap');
        ampm.classList.add('scroll-cnt', 'area-ampm');
        roll_wrap.insertBefore(ampm_wrap, roll_wrap.firstChild);
        ampm_wrap.appendChild(ampm);
        ampm.insertAdjacentHTML('beforeend', tag_ul);
        ampm_ul = ampm.querySelector('ul');
        ampm_ul.classList.add('sel-list');
        
        ampm_wrap.style.height = optHeight * 7 + 'px';
        ampm.style.padding = optHeight * 3 + 'px 0px';

        let ampmTag = set_ampm == '오전' ? '<li><button type="button" class="on" role="option" aria-selected="true">오전</button></li>' : '<li><button type="button" role="option" aria-selected="false">오전</button></li>';
        ampmTag += set_ampm == '오후' ? '<li><button type="button" class="on" role="option" aria-selected="true">오후</button></li>' : '<li><button type="button" role="option" aria-selected="false">오후</button></li>';

        ampm_ul.insertAdjacentHTML('beforeend', ampmTag);
        ampmBtns    = ampm.querySelectorAll('button');
        
        observerOpt_ampm.root = ampm;
        obs_ampm = new IntersectionObserver(scrollCenterSet, observerOpt_ampm);
    }
    
    // 타이틀 영역
    let selTitArea;
    if(selTitle) {
        selTitArea = document.createElement('div');
        selTitArea.classList.add('modal-title');
        selTitArea.setAttribute('role', 'heading');
        selTitArea.setAttribute('tabindex', '0');
        roll_wrap.insertBefore(selTitArea, roll_wrap.firstChild);
        selTitArea.innerText = selTitle;
    }
    
    // 시간/분 버튼 기능 적용
    let hourBtns	= hour.querySelectorAll('button'),
        minBtns 	= min.querySelectorAll('button'),
        btnAll 		= total_wrap.querySelectorAll('li > button');

    // 시간/분 (오전/오후) 버튼 클릭 시 scroll 이동 설정
    Array.prototype.forEach.call(btnAll, function(btn){
        let areaWrap = btn.parentNode.parentNode.parentNode;
        btn.addEventListener('click', function(){
            let scrollVal = btn.offsetTop - (areaWrap.offsetHeight / 2) + (btn.offsetHeight / 2);
            animateScroll(areaWrap, scrollVal, 200);
            let nextArea = areaWrap.parentNode.nextElementSibling;
            if(nextArea == btns) nextArea.querySelector('button').focus();
            else nextArea.querySelector('button.on').focus();
        });
    });
    
    /**
     * scroll 시 선택된 버튼의 값을 각 변수에 저장
     * @param {dom} area 오전오후/시간/분 영역
     * @param {number} idx 현재 선택된 버튼의 idx값
     */
    function setVal(area, idx){
        if(area == hour) set_hour = hourBtns[idx].textContent;
        else if(area == min) set_min = minBtns[idx].textContent;
        else if(area == ampm) set_ampm = ampmBtns[idx].textContent;
        if(inPage == true) inpValSet();
    }

    /**
     * scroll 기능 설정
     * @param {dom} area 오전오후/시간/분 영역
     */
    function scrollFuncSet(area){
        let tgArea = area,
            tgInterval, tgScTopVal, tgScChk;

        /**
         * scroll 움직임 상태감지 : interval 로 scrolltop 값 비교 (touchout 후에도 scroll 이 마저 움직일 때 이벤트 발생 제한)
         * @param {dom} area 오전오후/시간/분 영역
         */
        function scrollChk(area){
            if(tgScTopVal != area.scrollTop) tgScTopVal = area.scrollTop;
            else {
                if(!tgScChk) {
                    clearInterval(tgInterval);
                    scSet(area, area.scrollTop);
                }
            }
        }

        /**
         * 스크롤 종료 후 가장 가까운 값으로 scroll 조정
         * @param {dom} area 오전오후/시간/분 영역
         * @param {number} sc Scroll top 값
         */
        function scSet(area, sc){
            let scN     = sc % optHeight,
                scVal   = Math.floor(sc / optHeight),
                scIdx, tgSc;

            scN < optHeight / 2 ? scIdx = scVal : scIdx = scVal + 1;
            tgSc = scIdx * optHeight;
            animateScroll(area, tgSc, 200);
            setVal(area, scIdx);
        }

        tgArea.addEventListener('scroll', function(){
            clearInterval(tgInterval);
            tgInterval = setInterval(function(){
                scrollChk(tgArea);
            }, 50);
        });
        tgArea.addEventListener('touchstart', function(){
            tgScChk = true; // touch 상태 on
        }, {passive : false});
    
        tgArea.addEventListener('touchend', function(){
            tgScChk = false; // touch 상태 off
        });
    }
    scrollFuncSet(min);
    scrollFuncSet(hour);
    if(halfTime) scrollFuncSet(ampm);

    /** show - input 값에 따른 scroll 위치 조정 */
    function scrollSet(){
        let onBtns = roll_wrap.querySelectorAll('button.on');
        Array.prototype.forEach.call(onBtns, function(btn){
            let areaWrap = btn.parentNode.parentNode.parentNode,
                scrollVal = btn.offsetTop - (areaWrap.offsetHeight / 2) + (btn.offsetHeight / 2);
            areaWrap.scrollTop = scrollVal;
        });
    }

    /** 현재 선택된 btn 에 on 클래스 추가 / 그외 버튼 on 제거 */
    function btnOnSet(){
        hourBtns.forEach(function(btn){
            if(Number(btn.textContent) == Number(set_hour)) {
                btn.classList.add('on');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('on');
                btn.setAttribute('aria-selected', 'false');
            }
        });
        minBtns.forEach(function(btn){
            if(Number(btn.textContent) == Number(set_min)) {
                btn.classList.add('on');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('on');
                btn.setAttribute('aria-selected', 'false');
            }
        });
        if(halfTime) {
            ampmBtns.forEach(function(btn){
                if(btn.textContent == set_ampm) {
                    btn.classList.add('on');
                    btn.setAttribute('aria-selected', 'true');
                } else {
                    btn.classList.remove('on');
                    btn.setAttribute('aria-selected', 'false');
                }
            });
        }
    }

    /** input 에 선택된 값 넣기 */
    function inpValSet(){
        if(halfTime){
            if(halfShow) input.value = set_ampm + ' ' + setZero(set_hour) + ':' + setZero(set_min)
            else {
                let hourval;
                if(set_ampm == '오전') set_hour == 12 ? hourval = 0 : hourval = set_hour;
                else set_hour == 12 ? hourval = 12 : hourval = Number(set_hour) + 12;
                input.value = setZero(hourval) + ':' + setZero(set_min);
            }
        } else input.value = setZero(set_hour) + ':' + setZero(set_min);
        if(inPage == false) input.dispatchEvent(changeEvt);
    }

    /** time_wrap show 함수 */
    function timesetOn(){
        body.appendChild(time_wrap);
        setTxVal();
        btnOnSet();
        setTimeout(function(){ time_wrap.classList.add('on') }, 100);
        scrollSet();
        btn_open.setAttribute('aria-expanded', 'true');
        selTitle ? selTitArea.focus() : btnAll[0].focus();
        roll_wrap.addEventListener('transitionend', function() {
            hourBtns.forEach(function(btn) { obs_hour.observe(btn) });
            minBtns.forEach(function(btn) { obs_min.observe(btn) });
            if(halfTime) ampmBtns.forEach(function(btn) { obs_ampm.observe(btn) });
        });
        bodyStyle.overflow = 'hidden';
        body.classList.add('hold');
    }

    /** time_wrap 닫기 함수 */
    function timesetOff(){
        time_wrap.classList.remove('on');
        body.removeChild(time_wrap);
        btn_open.setAttribute('aria-expanded', 'false');
        obs_hour.disconnect();
        obs_min.disconnect();
        if(halfTime) obs_ampm.disconnect();
        bodyStyle.overflow = '';
        body.classList.remove('hold');
    }

    /**
     * 외부함수 - input 기준 오전오후/시간/분 scroll 위치 정렬
     */
    this.time_update = function(){
        setTxVal();
        btnOnSet();
        scrollSet();
    }

    if(inPage == true) {
        hourBtns.forEach(function(btn) { obs_hour.observe(btn) });
        minBtns.forEach(function(btn) { obs_min.observe(btn) });
        if(halfTime) ampmBtns.forEach(function(btn) { obs_ampm.observe(btn) });
        return;
    }
    input.addEventListener('change', function(){
        btn_open.setAttribute('title', input.value);
    });
    btn_open.addEventListener('click', timesetOn);

    // 확인 버튼 클릭 시
    btnOk.addEventListener('click', function(){
        inpValSet();
        timesetOff();
    });

    // 취소 버튼 클릭 시
    btnNo.addEventListener('click', timesetOff);
}

/**
 * number selector - scroll &amp; input
 * @param {object} option option.area : 적용 영역 (선택자 string or dom 요소)
 * @returns null
 */
function nNumberSelector(option){
    const wrap = typeof option.area === 'string' ? document.querySelector(option.area) : option.area;

    let num_min = option.min ? option.min : 0,
        num_max = option.max;

    if(num_max == undefined) return;

    let temp_val;
    
    let inp = wrap.querySelector('input'),
        num_height = option.num_height ? option.num_height : 30,
        total_height = num_height * 3;

    let scroll_wrap	= document.createElement('div'),
        scroll		= document.createElement('ul'),
        numbers;
    
    scroll_wrap.classList.add('scroll-wrap');
    scroll.classList.add('sel-list');

    for(let i = num_min; i<num_max; i++){
        let tag_tx;
        tag_tx =  '<li><button type="button" class="num-tx">'+ i +'</button></li>';
        scroll.insertAdjacentHTML('beforeend', tag_tx);
    }
    scroll_wrap.appendChild(scroll);
    wrap.appendChild(scroll_wrap);

    wrap.style.height = total_height + 'px';
    scroll_wrap.style.padding = num_height + 'px 0px';
    numbers = scroll_wrap.querySelectorAll('.num-tx');

    observerOpt = {
        root : scroll_wrap,
        rootMargin : -(num_height -20) + 'px 0px',
        threshold : 1
    }

    if(checkMobile() == 'ios') { // ios 는 root 요소의 padding 값을 제거한 높이를 기준으로 동작함 (전체높이X)
        observerOpt.rootMargin = '10px 0px';
    }
    
    obs = new IntersectionObserver(scrollCenterSet, observerOpt);

    /** 스크롤 시 중앙위치 버튼 cls 제어 */
    function scrollCenterSet(ent){
        ent.forEach((entry) => {
            entry.isIntersecting ? entry.target.parentNode.classList.add('on') : entry.target.parentNode.classList.remove('on');
        });
    }

    /**
     * scroll 기능 설정
     * @param {dom} area 스크롤되는 영역 dom
     */
    function scrollFuncSet(area){
        let tgArea = area,
            tgInterval, tgScTopVal, tgScChk;

        /**
         * scroll 움직임 상태감지 : interval 로 scrolltop 값 비교 (touchout 후에도 scroll 이 마저 움직일 때 이벤트 발생 제한)
         * @param {dom} area 오전오후/시간/분 영역
         */
        function scrollChk(area){
            if(tgScTopVal != area.scrollTop) tgScTopVal = area.scrollTop;
            else {
                if(!tgScChk) {
                    clearInterval(tgInterval);
                    scSet(area, area.scrollTop);
                }
            }
        }

        /**
         * 스크롤 종료 후 가장 가까운 값으로 scroll 조정
         * @param {dom} area 오전오후/시간/분 영역
         * @param {number} sc Scroll top 값
         */
        function scSet(area, sc){
            let scN     = sc % num_height,
                scVal   = Math.floor(sc / num_height),
                scIdx, tgSc;

            scN < num_height / 2 ? scIdx = scVal : scIdx = scVal + 1;
            tgSc = scIdx * num_height;
            animateScroll(area, tgSc, 200);
            setVal(scIdx);
        }

        tgArea.addEventListener('scroll', function(){
            clearInterval(tgInterval);
            tgInterval = setInterval(function(){
                scrollChk(tgArea);
            }, 50);
        });
        tgArea.addEventListener('touchstart', function(){
            tgScChk = true; // touch 상태 on
        }, {passive : false});
    
        tgArea.addEventListener('touchend', function(){
            tgScChk = false; // touch 상태 off
        });
    }
    scrollFuncSet(scroll_wrap);

    numbers.forEach(function(btn){
        btn.addEventListener('click', function(){ 
            wrap.classList.add('inp');
            inp.focus();
        });
        obs.observe(btn);
    });

    /** inp 에 현재 scroll된 숫자를 value 로 설정 */
    function setVal(idx) {
        inp.value = numbers[idx].textContent;
    }

    /** show - input 값에 따른 scroll 위치 조정 */
    function scrollSet(){
        numbers.forEach(function(btn){
            if(btn.textContent == inp.value) scroll_wrap.scrollTop = btn.parentNode.offsetTop - num_height;
        });
    }
    scrollSet();

    inp.addEventListener('focusin', function(){
        temp_val = inp.value;
    })
    inp.addEventListener('focusout', scrollReStart);
    inp.addEventListener('keyup', function(e){
        if(e.keyCode == 13) scrollReStart();
    });

    /** input > 스크롤 전환 */
    function scrollReStart(){
        if(inp.value < num_min || inp.value >= num_max) {
            inp.value = temp_val;
        } 
        scrollSet();
        wrap.classList.remove('inp');
    }
}