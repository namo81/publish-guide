/*
    2023-03-22 : v1.0.0 추가 - 기존 pc용을 mobile용으로 develop
*/

function nTimeSetMobile(option){
    var wrap 		= typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        input 		= wrap.querySelector('input[type=text]'),
        selTitle    = option.title,
        optHeight   = option.optHeight ? option.optHeight : 30,
        halfTime    = option.halfTime ? option.halfTime : false, // 시간 선택 시 오전/오후 기능 사용 여부
        halfShow    = option.halfShow ? option.halfShow : false; // 시간 표기 시 오전/오후 표기 사용 여부
    
    var hourMaxLimit = halfTime ? 12 : 24,
        ampm_wrap, ampm, ampmBtns;

    // 시간표기 기본 설정값
    var hourMin 	= option.hourMin ? option.hourMin : 0,
        hourMax 	= option.hourMax ? option.hourMax : hourMaxLimit,
        minMin 		= option.minMin ? option.minMin : 0,
        minMax 		= option.minMax ? option.minMax : 60,
        minStep		= option.minStep ? option.minStep : 1;

    // 기본 구조 생성
    var time_wrap 	= document.createElement('div'),
        roll_wrap	= document.createElement('div'),
        hour_wrap	= document.createElement('div'),
        hour		= document.createElement('div'),
        min_wrap	= document.createElement('div'),
        min			= document.createElement('div'),
        btns		= document.createElement('div');

    var body        = document.querySelector('body');
    
    // 시간/분/오전,오후 저장용 변수
    var set_hour, set_min, set_ampm;
    
    // 현재 선택 상태표기 설정 (input 값 유무에 다른 설정 포함)
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
    time_wrap.classList.add('modal-sel', 'sel-time');
    roll_wrap.classList.add('modal-cnt');
    hour_wrap.classList.add('scroll-wrap');
    hour.classList.add('scroll-cnt', 'area-hour');
    min_wrap.classList.add('scroll-wrap');
    min.classList.add('scroll-cnt', 'area-min');
    btns.classList.add('btns');

    time_wrap.appendChild(roll_wrap);
    hour_wrap.appendChild(hour);
    min_wrap.appendChild(min);
    roll_wrap.appendChild(hour_wrap);
    roll_wrap.appendChild(min_wrap);
    roll_wrap.appendChild(btns);

    hour_wrap.style.height = optHeight * 7 + 'px';
    hour.style.padding = optHeight * 3 + 'px 0px';
    min_wrap.style.height = optHeight * 7 + 'px';
    min.style.padding = optHeight * 3 + 'px 0px';

    var tag_ul = '<ul></ul>',
        hour_ul, min_ul, ampm_ul;
    hour.insertAdjacentHTML('beforeend', tag_ul);
    min.insertAdjacentHTML('beforeend', tag_ul);
    hour_ul = hour.querySelector('ul'),
    min_ul = min.querySelector('ul');

    var btnOk		= document.createElement('button'),
        btnNo		= document.createElement('button');
    btnOk.classList.add('btn-sel-confirm');
    btnNo.classList.add('btn-sel-close');
    btnOk.innerText = '확인';
    btnNo.innerText = '취소';
    btns.appendChild(btnOk);
    btns.appendChild(btnNo);
    
    // 시간/분 리스트 버튼 추가
    for(var h = hourMin; h<hourMax; h++){
        var tag_tx,
            h_tx;
        if(halfTime) h == 0 ? h_tx = 12 : h_tx = h;
        else h_tx = h;
        tag_tx = h == set_hour ? '<li><button type="button" class="on">'+ h_tx +'</button></li>' : '<li><button type="button">'+ h_tx +'</button></li>';
        hour_ul.insertAdjacentHTML('beforeend', tag_tx);
    }

    for(var m=minMin; m<minMax; m += minStep){
        var tag_tx = m == set_min ?  '<li><button type="button" class="on">'+ m +'</button></li>' : '<li><button type="button">'+ m +'</button></li>';
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
        
        ampm_wrap.style.height = optHeight * 7 + 'px';
        ampm.style.padding = optHeight * 3 + 'px 0px';

        var ampmTag = set_ampm == '오전' ? '<li><button type="button" class="on">오전</button></li>' : '<li><button type="button">오전</button></li>';
        ampmTag += set_ampm == '오후' ? '<li><button type="button" class="on">오후</button></li>' : '<li><button type="button">오후</button></li>';

        ampm_ul.insertAdjacentHTML('beforeend', ampmTag);
        ampmBtns    = ampm.querySelectorAll('button');
    }
    
    // 타이틀 영역
    if(selTitle) {
        var selTitArea    = document.createElement('div');
        selTitArea.classList.add('modal-title');
        roll_wrap.insertBefore(selTitArea, roll_wrap.firstChild);
        selTitArea.innerText = selTitle;
    }

    // 시간/분 버튼 기능 적용
    var hourBtns	= hour.querySelectorAll('button'),
        minBtns 	= min.querySelectorAll('button'),
        btnAll 		= time_wrap.querySelectorAll('li > button');

    // 시간/분 (오전/오후) 버튼 클릭 시 scroll 이동 설정
    Array.prototype.forEach.call(btnAll, function(btn){
        var areaWrap = btn.parentNode.parentNode.parentNode;
        btn.addEventListener('click', function(){
            var scrollVal = btn.offsetTop - (areaWrap.offsetHeight / 2) + (btn.offsetHeight / 2);
            animateScroll(areaWrap, scrollVal, 200);
        });
    });
    
    // scroll 시 선택된 버튼의 값을 각 변수에 저장
    function setVal(area, idx){
        if(area == hour) set_hour = hourBtns[idx].innerText;
        else if(area == min) set_min = minBtns[idx].innerText;
        else if(area == ampm) set_ampm = ampmBtns[idx].innerText;
    }

    // scroll 기능 설정
    function scrollFuncSet(area){
        var tgArea = area,
            tgInterval, tgScTopVal, tgScChk;

        function scrollChk(area){ // interval 로 scrolltop 값 비교를 통한 scroll 움직임 상태감지
            if(tgScTopVal != area.scrollTop) tgScTopVal = area.scrollTop;
            else {
                if(!tgScChk) {
                    clearInterval(tgInterval);
                    scSet(area, area.scrollTop);
                }
            }
        }

        function scSet(area, sc){
            var scN     = sc % optHeight,
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

    // show - input 값에 따른 scroll 위치 조정
    function scrollSet(){
        var onBtns = roll_wrap.querySelectorAll('button.on');
        Array.prototype.forEach.call(onBtns, function(btn){
            var areaWrap = btn.parentNode.parentNode.parentNode,
                scrollVal = btn.offsetTop - (areaWrap.offsetHeight / 2) + (btn.offsetHeight / 2);
            areaWrap.scrollTop = scrollVal;
        });
    }

    // 현재 선택된 btn 에 on 클래스 추가 / 그외 버튼 on 제거
    function btnOnSet(){
        hourBtns.forEach(function(btn){
            Number(btn.innerText) == Number(set_hour) ? btn.classList.add('on') : btn.classList.remove('on');
        });
        minBtns.forEach(function(btn){
            Number(btn.innerText) == Number(set_min) ? btn.classList.add('on') : btn.classList.remove('on');
        });
        if(halfTime) {
            ampmBtns.forEach(function(btn){
                btn.innerText == set_ampm ? btn.classList.add('on') : btn.classList.remove('on');
            });
        }
    }

    // input 에 선택된 값 넣기
    function inpValSet(){
        if(halfTime){
            if(halfShow) input.value = set_ampm + ' ' + setZero(set_hour) + ':' + setZero(set_min)
            else {
                var hourval;
                if(set_ampm == '오전') set_hour == 12 ? hourval = 0 : hourval = set_hour;
                else set_hour == 12 ? hourval = 12 : hourval = Number(set_hour) + 12;
                input.value = setZero(hourval) + ':' + setZero(set_min);
            }
        } else input.value = setZero(set_hour) + ':' + setZero(set_min);
    }

    // time_wrap show 함수
    function timesetOn(){
        body.appendChild(time_wrap);
        setTxVal();
        btnOnSet();
        time_wrap.classList.add('on');
        scrollSet();
    }

    input.addEventListener('click', timesetOn);

    // 확인 버튼 클릭 시
    btnOk.addEventListener('click', function(){
        inpValSet();
        time_wrap.classList.remove('on');
        body.removeChild(time_wrap);
    });

    // 취소 버튼 클릭 시
    btnNo.addEventListener('click', function(){
        btnOnSet();
        time_wrap.classList.remove('on');
        body.removeChild(time_wrap);
    });

    // 공통함수
    function setZero(num){
        return num < 10 ? '0' + num : num;
    }
}