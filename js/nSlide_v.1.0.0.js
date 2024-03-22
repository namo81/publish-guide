/*
    nSlide
    2022-04-15 : v.1.0.0 제작 start
 */

/*
    용어정리
    cont / container    : slide-container (slide item들을 감싸는 영역)
    item                : slide item
    pos                 : 현재 배너 위치 표기 영역
*/

/* 
    wrap        : 전체 영역 - string / dom 요소
    container   : 실제 움직이는 배너 영역 - string
    slidePos    : 배너 갯수 및 활성화 표기 영역 - string
    posType     : 배너 갯수 및 활성화 표기 타입 ('bullet' / 'number') 기본은 bullet
    autoplay    : 자동 재생 여부 - 100 이하거나 null 일 경우 자동재생X / 100 이상일 경우 해당 시간마다 자동재생
    contWidth   : 배너영역 width
    contHeight  : 배너영역 height
    viewCount   : 한 화면에 보여야 할 배너 갯수

    ctrlBtn     : 이전/다음 버튼 사용 여부 boolean - 기본은 false
    ctrlBtnPrev : 이전 버튼
    ctrlBtnNext : 다음버튼
    ctrlBtnPs   : play / stop 버튼 (재생 상태에서 버튼 stop 일때 클래스 없음 / 일시정지 상태일 때 버튼 play 일때 'on' 클래스 )

    activeInit  : 기능 초기 설정 시 콜백함수
    activeStart : 배너 이동 시작 시 콜백함수
    activeEnd   : 배너 이동 후 콜백함수
 */

function nSlide(option){
    var wrap        = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        mobile      = option.mobile ? option.mobile : false,
        container   = option.container ? wrap.querySelector(option.container) : wrap.querySelector('.slide-container'),
        slidePos    = option.slidePos ? wrap.querySelector(option.slidePos) : null,
        posType     = option.posType ? option.posType : 'bullet',
        autoplay    = option.autoplay ? option.autoplay : null,
        loop        = option.loop ? option.loop : false,
        viewCount   = option.viewCount ? option.viewCount : 1,
        width       = option.width ? option.width : 1,
        height      = option.height ? option.height : 1,
        ctrlBtn     = option.ctrlBtn ? option.ctrlBtn : false,
        ctrlBtnPrev = option.ctrlBtnPrev ? option.ctrlBtnPrev : '.btn-slide-ctrl.prev',
        ctrlBtnNext = option.ctrlBtnNext ? option.ctrlBtnNext : '.btn-slide-ctrl.next',
        ctrlBtnPs   = option.ctrlBtnPs ? option.ctrlBtnPs : '.btn-slide-ps',
        activeInit  = option.activeInit,
        activeStart = option.activeStart,
        activeEnd  	= option.activeEnd;

    var items       = wrap.querySelectorAll('.slide-item'),
        itemLen     = items.length,
        allItems    = items,
        items_a_tags; // slide item 내 'a' 태그 있을 경우 취합할 변수 (pc 에서 mousedown/mouseup 발생 시 click 방지용)

    var nowNum      = 0, // 활성화 item index - dummy 포함 (위치 조정 용)
        itemNum     = 0, // 활성화 item index - dummy 제외 (item idx 호출용)
        targetX,         // 배너 이동 목표 위치
        wrapWidth   = wrap.clientWidth,
        wrapOffLeft = wrap.offsetLeft,
        itemWidth   = Math.floor((wrapWidth * width) / viewCount),
        wrapRect    = wrap.getBoundingClientRect(),
        countGap    = width < 1 ? itemWidth * (viewCount + 1) : itemWidth * viewCount, // loop 상태에서 dummy 가 앞에 붙을 경우 초기 1번 위치설정을 위한 num
        contWidth   = 0; // container 너비

    var autoSliding,        // 자동롤링 변수
        autoChk     = true; // play/stop 버튼 클릭에 따른 auto slide 상태 boolean

    var posItems, nowNumTx; // 배너 갯수 및 활성화 표기 관련 변수
    
    // 현재 상태 저장용 object 생성 및 설정
    var slideArr   = new Object();
    function objDataSet(){
        slideArr.now = itemNum;
        slideArr.wrapWidth = wrapWidth;
    }
    objDataSet();

    // nowNum 변경 시 실행
    Object.defineProperty(slideArr, 'changeNum', {
        set: function(val) {
            this.now = val;
            if(slidePos != null) setPos();
        }
    });

    // item 에 idx 속성 추가
    function itemIdxSet(){
        items.forEach(function(item, idx){
            item.setAttribute('data-idx', idx);
        });
    }

    // container / item 너비 설정
    function widthInit(){
        contWidth = itemWidth * allItems.length;
        container.style.width = contWidth + 'px';
        if(loop == true) {
            countGap = width < 1 ? itemWidth * (viewCount + 1) : itemWidth * viewCount;
        } else countGap = 0;
        allItems.forEach(function(item){
            item.style.width = itemWidth + 'px';
        });
        targetX = (itemWidth * nowNum) + countGap;
        container.style.transform = 'translate3d(-'+ targetX +'px, 0, 0)';
    }

    // 버튼 설정 ----------------------------------------------------------------------------------------------------
    var btnPrev, btnNext, btnPs;

    // 이전/다음 버튼 설정
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

    btnPs = wrap.querySelector(ctrlBtnPs);
    if(btnPs) {
        btnPs.addEventListener('click', function(){
            if(this.classList.contains('on')) {
                autoSliding = setInterval(autoFunc, autoplay);
                this.classList.remove('on');
                autoChk = true;
            } else {
                clearInterval(autoSliding);
                this.classList.add('on');
                autoChk = false;
            }
        });
    }

    // 배너 위치 표기 설정 ----------------------------------------------------------------------------------------------------
    function banPosSet(){
        if(posType == 'bullet'){
            var piHtml = '<ul>';
            for(var p=0; p<itemLen; p++){
                piHtml += '<li><span class="pos-item" data-num="'+p+'">'+ (p + 1) + '번째 배너' +'</span></li>';
            }
            piHtml += '</ul>';
            slidePos.insertAdjacentHTML('afterbegin', piHtml);
            posItems = slidePos.querySelectorAll('li');
        } else {
            var piHtml = '<p><span class="now">'+(nowNum + 1)+'</span> / <span>'+itemLen+'</span></p>';
            slidePos.insertAdjacentHTML('afterbegin', piHtml);
            nowNumTx = slidePos.querySelector('.now');
        }
    }
    function setPos(){
        if(posType == 'bullet'){
            posItems.forEach(function(item){
                item.classList.remove('on');
            });
            posItems[itemNum].classList.add('on');
        } else nowNumTx.innerText = itemNum + 1;
    }
    if(slidePos != null) {
        banPosSet();
        setPos();
    }

    // loop 일 경우 앞/뒤 dummy 생성 ----------------------------------------------------------------------------------------------------
    function createDummy(){
        var addNum = width < 1 ? viewCount + 1 : viewCount; // width가 1 이하여서 이전,다음 배너가 보일 경우 추가 dummy 필요
        for(var s=0; s<addNum; s++){
           var cNode = items[s].cloneNode(true);
           container.appendChild(cNode);
        }
        for(var e=itemLen - 1; e>itemLen - addNum - 1; e--){
            var cNode = items[e].cloneNode(true);
            container.insertBefore(cNode, container.firstChild);
        }
        container.style.transform = 'translate3d(-'+ countGap + 'px, 0,0)';
        allItems = wrap.querySelectorAll('.slide-item');
    }

    // 이전/다음 움직임 관련 ----------------------------------------------------------------------------------------------------
    // 실제 모션
    function motionRun(){
        container.style.transitionDuration = '500ms';
        container.style.transform = 'translate3d(-'+ targetX +'px, 0, 0)';
    }

    // 이전/다음 모션 함수 - loop false
    function banMove(direc){
        if(direc == 'next') {
            if(nowNum < itemLen - 1) nowNum++;
            else {
                if(autoplay != null) clearInterval(autoSliding);
            }
        } else {
            if(nowNum > 0) nowNum--;
        }
        targetX = (itemWidth * nowNum) + countGap;
        motionRun();
    }

    // 이전/다음 모션 함수 - loop true
    function banMoveLoop(direc){
        if(direc == 'next') nowNum < itemLen ? nowNum++ : nowNum = 1;
        else nowNum > -viewCount ? nowNum-- : nowNum = itemLen - viewCount - 1;   
        targetX = (itemWidth * nowNum) + countGap;
        motionRun();
    }
    // 버튼 mousedown 시 위치 초기화 설정 - loop true 일 경우
    function banMoveResetFirst(){
        if(nowNum == itemLen) {
            container.style.transitionDuration = '0s';
            container.style.transform = 'translate3d(-'+ countGap + 'px, 0,0)';
            targetX = countGap;
        }
    }
    function banMoveResetLast(){
        if(nowNum == -viewCount) {
            container.style.transitionDuration = '0s';
            container.style.transform = 'translate3d(-'+ (contWidth - countGap - itemWidth) + 'px, 0,0)';
            targetX = contWidth - countGap - itemWidth;
        }
    }
    
    // 모션 시작 이벤트
    container.addEventListener('transitionstart', moveStartFunc);
    function moveStartFunc(){
        if(typeof activeStart === 'function') activeStart(itemNum, nowNum);
    }

    // 모션 종료 이벤트
    container.addEventListener('transitionend', moveEndFunc);
    function moveEndFunc(){
        slideActiveChk();
        if(typeof activeEnd === 'function') activeEnd(itemNum, nowNum);
        if(loop) loopPosReset();
    }

    // 배너영역 drag 및 swiper 관련 ----------------------------------------------------------------------------------------------------
    var touchSX, touchEX,
        touchSY,
        direcCount = 0,
        direcChk;

    // 위치 초기화 (1 > 마지막 / 마지막 > 1 이동 후 위치 초기화)
    function loopPosReset(){
        if(nowNum == itemLen) {
            banMoveResetFirst();
            nowNum = 0;
        }
        else if(nowNum == -viewCount) {
            banMoveResetLast();
            nowNum = itemLen - viewCount;
        }
    }

    // 초기 터치 방향 체크 (모바일에서 상하/좌우 스크롤 방향 체크)
    function touchDirec(touch){
        numX = touchSX - touch.pageX;
        numY = touchSY - touch.pageY;
        if(Math.abs(numX) > Math.abs(numY)) direcChk = 'horive';
        else direcChk = 'verti'; 
        direcCount ++;
    }

    // 플리킹 or 마우스 그래그 기능
    if(mobile) {
        container.addEventListener('touchstart', function(e){
            e.stopPropagation();
            var touch = e.touches[0] || e.changedTouches[0];
            touchSX = touch.pageX;
            touchSY = touch.pageY;
            
            direcCount = 0;
    
            if(loop == true) loopPosReset();
            if(autoplay != null) clearInterval(autoSliding);
            
            container.onEvent('touchmove', function(e){
                var touch = e.touches[0] || e.changedTouches[0],
                    gapX = touchSX - touch.pageX;
                    
                if(direcCount < 1 ) touchDirec(touch);
                if(direcChk != 'horive') return;

                container.style.transitionDuration = '0s';
                container.style.transform = 'translate3d(-'+ (targetX + gapX) +'px, 0, 0)';
            });
        });
    
        container.addEventListener('touchend', function(e){
            container.removeListeners('touchmove');
            if(autoplay != null && autoChk == true) autoSliding = setInterval(autoFunc, autoplay);
            
            if(direcChk != 'horive') return;

            var touch = e.touches[0] || e.changedTouches[0];
            touchEX = touch.pageX;
            if(Math.abs(touchEX - touchSX) > 20) {
                if((touchEX - touchSX) < 0) {
                    loop == true ? banMoveLoop('next') : banMove('next');
                } else {
                    loop == true ? banMoveLoop('prev') : banMove('prev');
                }
            } else motionRun();
        });
    } else {
        items_a_tags = container.querySelectorAll('a');
        container.addEventListener('mousedown', function(e){
            e.preventDefault();
            touchSX = e.layerX;
            
            if(loop == true) loopPosReset();
            if(autoplay != null) clearInterval(autoSliding);
            
            container.onEvent('mousemove', function(e){
                var gapX = touchSX - e.layerX;
                container.style.transitionDuration = '0s';
                container.style.transform = 'translate3d(-'+ (targetX + gapX) +'px, 0, 0)';
                if(items_a_tags.length <= 0 || Math.abs(gapX) < 10) return;
                items_a_tags.forEach(function(tag){
                    tag.classList.add('non-click');
                });
            });
        });
    
        container.addEventListener('mouseup', function(e){
            container.removeListeners('mousemove');
            if(autoplay != null && autoChk == true) autoSliding = setInterval(autoFunc, autoplay);
            touchEX = e.layerX;
            if(Math.abs(touchEX - touchSX) > 20) {
                if((touchEX - touchSX) < 0) {
                    loop == true ? banMoveLoop('next') : banMove('next');
                } else {
                    loop == true ? banMoveLoop('prev') : banMove('prev');
                }
            } else motionRun();
            if(items_a_tags.length <= 0) return;
            items_a_tags.forEach(function(tag){
                if(tag.classList.contains('non-click')) tag.classList.remove('non-click');
            });
        });
    }

    // 현재 활성화 배너 active 클래스 제어
    function slideActiveChk(){
        allItems.forEach(function(item){
            var thisRect = item.getBoundingClientRect();
            if (thisRect.left >= wrapRect.left && thisRect.right <= Math.ceil((wrapRect.right / viewCount) + wrapOffLeft)) {
                item.classList.add('active');
                itemNum = item.getAttribute('data-idx');
                slideArr.changeNum = itemNum;
            } else item.classList.remove('active');
        });
    }

    // 브라우저 resize 대응
    window.addEventListener('resize', resizeSet);
    function resizeSet(){
        wrapWidth   = wrap.offsetWidth;
        itemWidth   = Math.floor((wrapWidth * width) / viewCount);
        wrapRect    = wrap.getBoundingClientRect();
        widthInit();
    }

    // 초기 설정
    itemIdxSet();
    if(loop == true) createDummy();
    widthInit();
    if(ctrlBtn) btnSet();
    if(typeof activeInit === 'function') activeInit(itemLen);

    function autoFunc(){
        if(loop == true) {
            banMoveResetFirst();
            banMoveLoop('next');
        } else {
            banMove('next');
            if(nowNum == itemLen - 1) clearInterval(autoSliding);
        }
    }
    
    if(autoplay != null) {
        // 브라우저 화면이 보이지 않을 경우 자동롤링 제어 (탭 이동 / 브라우저 최소화 등)
        document.addEventListener('visibilitychange', function() {
            document.visibilityState === 'visible' && autoChk == true ? autoSliding = setInterval(autoFunc, autoplay) : clearInterval(autoSliding);
        });
        // wrap 이 화면 내 보이지 않을 경우 자동롤링 제어
        let observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                entry.isIntersecting ? autoSliding = setInterval(autoFunc, autoplay) : clearInterval(autoSliding);
            });
        });
        observer.observe(wrap);
    }

    // 외부 호출 함수
    this.goPos = function(num){
        nowNum = num;
        targetX = (itemWidth * num) + countGap;
        motionRun();
    }
}