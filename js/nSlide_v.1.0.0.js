/*
    nSlide
    2022-04-15 : v.1.0.0 제작 start
 */

/* 
    wrap : 전체 영역 - string / dom 요소
    container : 실제 움직이는 배너 영역 - string
    slidePos : 현재 배너 표기 영역 - string
    posType : 현재 배너 표기 타입 ('bullet' / 'number') 기본은 bullet
    autoplay : 자동 재생 여부 boolean - 기본은 false
    contWidth : 배너영역 width
    contHeight : 배너영역 height

    ctrlBtn : 이전/다음 버튼 사용 여부 boolean - 기본은 true
    ctrlBtnPrev : 이전 버튼
    ctrlBtnNext : 다음버튼
    ctrlBtnPs : play / stop 버튼

    activeInit : 기능 초기 설정 시 콜백함수
    activeStart : 배너 이동 시작 시 콜백함수
    activeEnd : 배너 이동 후 콜백함수
 */

function nSlide(option){
    var wrap        = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        container   = option.container ? wrap.querySelector(option.container) : wrap.querySelector('.slide-container'),
        slidePos    = wrap.querySelector(option.slidePos),
        posType     = option.posType ? option.posType : 'bullet',
        autoplay    = option.autoplay ? option.autoplay : false,
        delay       = option.delay ? option.delay : 3000,
        loop        = option.loop ? option.loop : false,
        viewCount   = option.viewCount ? option.viewCount : 1,
        width       = option.width ? option.width : '100%',
        height      = option.height ? option.height : '100%',
        ctrlBtn     = option.ctrlBtn ? option.ctrlBtn : true,
        ctrlBtnPrev = option.ctrlBtnPrev ? option.ctrlBtnPrev : '.btn-slide-ctrl.prev',
        ctrlBtnNext = option.ctrlBtnNext ? option.ctrlBtnNext : '.btn-slide-ctrl.next',
        ctrlBtnPs   = option.ctrlBtnPs ? option.ctrlBtnPs : '.btn-slide-ps',
        activeInit  = option.activeInit,
        activeStart = option.activeStart,
        activeEnd  	= option.activeEnd;

    var items       = wrap.querySelectorAll('.slide-item'),
        itemLen     = items.length;

    var nowNum      = 0, // 현재 활성화 item index
        wrapWidth   = wrap.offsetWidth,
        contWidth   = 0; // container 너비

    // item 에 idx 속성 추가
    function itemIdxSet(){
        Array.prototype.forEach.call(items, function(item, idx){
            item.setAttribute('data-idx', idx);
        });
    }

    // container / item 너비 설정
    function widthInit(){
        contWidth = wrapWidth * itemLen;
        container.style.width = contWidth + 'px';
        Array.prototype.forEach.call(items, function(item){
            item.style.width = wrapWidth + 'px';
        });
    }

    var btnPrev, btnNext, btnPs;
    function btnSet(){
        btnPrev = wrap.querySelector(ctrlBtnPrev),
        btnNext = wrap.querySelector(ctrlBtnNext);

        if(loop == false) {
            btnPrev.addEventListener('click', function(){ banMove('prev'); });
            btnNext.addEventListener('click', function(){ banMove('next'); });
        } else {
            btnPrev.addEventListener('click', function(){ banMoveLoop('prev'); });
            btnNext.addEventListener('click', function(){ banMoveLoop('next'); });
        }
    }
    
    function createDummy(){

    }

    // 이전/다음 모션 함수 - loop false
    function banMove(direc){
        if(direc == 'next') {
            if(nowNum < itemLen - 1) nowNum++;
        } else {
            if(nowNum > 0) nowNum--;
        }
        container.style.transform = 'translate(-'+ wrapWidth * nowNum +'px, 0)';
        container.style['msTransform'] = 'translate(-'+ wrapWidth * nowNum +'px, 0)';
        container.style.transitionDuration = '.5s';
        container.style['transition'] = '.5s';
        slideActiveChk();
    }
    // 이전/다음 모션 함수 - loop true
    function banMoveLoop(direc){
        if(direc == 'next') {
            if(nowNum < itemLen - 1) nowNum++;
        } else {
            if(nowNum > 0) nowNum--;
        }
        container.style.transform = 'translate(-'+ wrapWidth * nowNum +'px, 0)';
        container.style.transitionDuration = '.5s';
        slideActiveChk();
    }


    // 모션 종료 이벤트
    container.addEventListener('transitionend', moveEndFunc);
    function moveEndFunc(){
        if(typeof activeEnd === 'function') activeEnd(nowNum);
        container.style.transitionDuration = '0s';
    }

    // 현재 활성화 배너 active 클래스 제어
    function slideActiveChk(){
        Array.prototype.forEach.call(items, function(item, idx){
            //idx == nowNum ? item.classList.add('active') : item.classList.remove('active');
            idx == nowNum ? funcAddClass(item, 'active') : funcRemoveClass(item, 'active');
        });
    }

    window.addEventListener('resize', resizeSet);
    function resizeSet(){
        wrapWidth    = wrap.offsetWidth;
        widthInit();
    }

    // 초기 설정
    itemIdxSet();
    widthInit();
    if(ctrlBtn) btnSet();
    if(loop == true) createDummy();
}