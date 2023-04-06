/*
    2021-11-30 : v1.0.0 추가
    2023-03-22 : v1.0.1 : am/pm 기능 추가
*/

function nTimeSet(option){
    var wrap 		= typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        input 		= wrap.querySelector('input[type=text]'),
        optHeight   = option.optHeight ? option.optHeight : 30,
        halfTime    = option.halfTime ? option.halfTime : false; // 시간 선택 시 am/pm 기능 사용 여부
    
    var hourMaxLimit = halfTime ? 12 : 24,
        ampm, ampmBtns;

    // 시간표기 기본 설정값
    var hourMin 	= option.hourMin ? option.hourMin : 0,
        hourMax 	= option.hourMax ? option.hourMax : hourMaxLimit,
        minMin 		= option.minMin ? option.minMin : 0,
        minMax 		= option.minMax ? option.minMax : 60,
        minStep		= option.minStep ? option.minStep : 1;

    // 기본 구조 생성
    var time_wrap 	= document.createElement('div'),
        roll_wrap	= document.createElement('div'),
        resultTx	= document.createElement('div'),
        hour		= document.createElement('div'),
        min			= document.createElement('div'),
        btns		= document.createElement('div');

    var body        = document.querySelector('body');
    
    // 시간/분/오전,오후 저장용 변수
    var set_hour, set_min, set_ampm;
    
    // 현재 선택 상태표기 설정 (input 값 유무에 다른 설정 포함)
    function setTxVal(){
        if(halfTime) {
            set_ampm    = input.value.length > 0 ? input.value.split(' ')[1] : 'am';
            set_hour 	= input.value.length > 0 ? Number(input.value.split(' ')[0].split(':')[0]) : 12;
            set_min 	= input.value.length > 0 ? Number(input.value.split(' ')[0].split(':')[1]) : 0;
        } else {
            set_hour 	= input.value.length > 0 ? Number(input.value.split(':')[0]) : 0;
            set_min 	= input.value.length > 0 ?Number( input.value.split(':')[1]) : 0;
        }
        halfTime ? resultTx.innerText = setZero(hourTx) + ':' + setZero(minTx) + ' ' +  ampmTx : resultTx.innerText = setZero(hourTx) + ':' + setZero(minTx);
    }
    setTxVal();

    time_wrap.classList.add('time-wrap');
    roll_wrap.classList.add('roll-wrap');
    resultTx.classList.add('result-tx');
    hour.classList.add('area-hour');
    min.classList.add('area-min');
    btns.classList.add('btns');

    time_wrap.appendChild(resultTx);
    time_wrap.appendChild(roll_wrap);
    time_wrap.appendChild(btns);
    roll_wrap.appendChild(hour);
    roll_wrap.appendChild(min);

    var tag_ul = '<ul></ul>',
        hour_ul, min_ul, ampm_ul;
    hour.insertAdjacentHTML('beforeend', tag_ul);
    min.insertAdjacentHTML('beforeend', tag_ul);
    hour_ul = hour.querySelector('ul'),
    min_ul = min.querySelector('ul');

    var btnOk		= document.createElement('button'),
        btnNo		= document.createElement('button');
    btnOk.classList.add('btn', 'confirm');
    btnNo.classList.add('btn', 'cancel');
    btnOk.innerText = '확인';
    btnNo.innerText = '취소';
    btns.appendChild(btnOk);
    btns.appendChild(btnNo);

    // 버튼 추가
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

    // am/pm 기능 사용 시
    if(halfTime) {
        ampm = document.createElement('div');
        ampm.classList.add('area-ampm');
        roll_wrap.appendChild(ampm);
        ampm.insertAdjacentHTML('beforeend', tag_ul);
        ampm_ul = ampm.querySelector('ul');

        var ampmTag = set_ampm == 'am' ? '<li><button type="button" class="on">am</button></li>' : '<li><button type="button">am</button></li>';
        ampmTag += set_ampm == 'pm' ? '<li><button type="button" class="on">pm</button></li>' : '<li><button type="button">pm</button></li>';

        ampm_ul.insertAdjacentHTML('beforeend', ampmTag);
        ampmBtns    = ampm.querySelectorAll('button');
    }

    var hourBtns	= hour.querySelectorAll('button'),
        minBtns 	= min.querySelectorAll('button'),
        btnAll 		= time_wrap.querySelectorAll('li > button');

    Array.prototype.forEach.call(btnAll, function(btn){
        var areaWrap = btn.parentNode.parentNode.parentNode;
        btn.addEventListener('click', function(){
            var scrollVal = btn.offsetTop - (areaWrap.offsetHeight / 2) + (btn.offsetHeight / 2);
            animateScroll(areaWrap, scrollVal, 200);
        });
        btn.addEventListener('keyup', function(e){
            var key = e.keyCode || e.which,
                par = e.target.parentNode.parentNode.parentNode;
            if(key == 13) {
                par == hour ? min.querySelector('button.on').focus() : btnOk.focus();
            }
        });
    });

    var hourTx = 0, minTx = 0,
        ampmTx = 'am',
        hourTimeout,
        minTimeout,
        ampmTimeout;

    function btnSet(area, num){
        var idx 	= Math.floor(num / optHeight),
            tgBtns;
            if(area == hour) tgBtns = hourBtns;
            else if(area == min) tgBtns = minBtns;
            else tgBtns = ampmBtns;
        Array.prototype.forEach.call(tgBtns, function(btn, tgIdx){
            if(idx == tgIdx) {
                btn.classList.add('on');
                if(area == hour) hourTx = btn.innerText;
                else if(area == min) minTx = btn.innerText;
                else ampmTx = btn.innerText;
            } else btn.classList.remove('on');
        });

        halfTime ? resultTx.innerText = setZero(hourTx) + ':' + setZero(minTx) + ' ' +  ampmTx : resultTx.innerText = setZero(hourTx) + ':' + setZero(minTx);
    }
    function scSet(area, sc){
        var scN = sc % optHeight;
        if(scN != 0) {
            scN <= (optHeight/2) ? sc = sc - scN : sc = sc + (optHeight - scN);
            animateScroll(area, sc, 100);
        }
        btnSet(area, sc);
    }

    hour.addEventListener('scroll', function(){
        window.clearTimeout(hourTimeout);
        hourTimeout = window.setTimeout(function(){
            scSet(hour, hour.scrollTop);
        }, 100);
    });

    min.addEventListener('scroll', function(){
        window.clearTimeout(minTimeout);
        minTimeout = window.setTimeout(function(){
            scSet(min, min.scrollTop);
        }, 100);
    });

    if(halfTime) {
        ampm.addEventListener('scroll', function(){
            window.clearTimeout(ampmTimeout);
            ampmTimeout = window.setTimeout(function(){
                scSet(ampm, ampm.scrollTop);
            }, 100);
        });
    }

    // time set
    function scrollSet(){
        var onBtns = roll_wrap.querySelectorAll('button.on');
        Array.prototype.forEach.call(onBtns, function(btn){
            var areaWrap = btn.parentNode.parentNode.parentNode,
                scrollVal = btn.offsetTop - (areaWrap.offsetHeight / 2) + (btn.offsetHeight / 2);
            areaWrap.scrollTop = scrollVal;
        });
    }
    function btnOnSet(){
        Array.prototype.forEach.call(hourBtns, function(btn){
            Number(btn.innerText) == Number(set_hour) ? btn.classList.add('on') : btn.classList.remove('on');
        });
        Array.prototype.forEach.call(minBtns, function(btn){
            Number(btn.innerText) == Number(set_min) ? btn.classList.add('on') : btn.classList.remove('on');
        });
    }

    // time_wrap position
    function timePosSet(){
        var posTop = input.getBoundingClientRect().top + input.offsetHeight + document.documentElement.scrollTop,
            posLeft = input.getBoundingClientRect().left + document.documentElement.scrollLeft,
            inpWidth = input.offsetWidth;
        time_wrap.style.width = inpWidth + 'px';
        time_wrap.style.top = posTop + 'px';
        time_wrap.style.left = posLeft + 'px';
    }

    // time_wrap show / hide
    function timesetOn(){
        body.appendChild(time_wrap);
        timePosSet();
        setTxVal();
        btnOnSet();
        time_wrap.classList.add('show');
        scrollSet();
        outSideClick('.' + time_wrap.classList[0], time_wrap, 'show');
    }

    input.addEventListener('click', timesetOn);
    input.addEventListener('focusin', timesetOn);

    btnOk.addEventListener('click', function(){
        input.value = resultTx.innerText;
        time_wrap.classList.remove('show');
        body.removeChild(time_wrap);
    });

    btnNo.addEventListener('click', function(){
        btnOnSet();
        time_wrap.classList.remove('show');
        body.removeChild(time_wrap);
    });

    // 공통함수
    function setZero(num){
        return num < 10 ? '0' + num : num;
    }
}