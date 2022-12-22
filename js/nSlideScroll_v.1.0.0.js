/*
    nSlideScroll
    2022-07-07 : v.1.0.0 제작 start
 */

function nSlideScroll(option){
    var wrap        = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        area        = option.container ? wrap.querySelector(option.container) : wrap.querySelector('.slide-area'),
        slidePos    = option.slidePos ? wrap.querySelector(option.slidePos) : null,
        gap         = option.gap ? option.gap : 0,
        posType     = option.posType ? option.posType : 'bullet',
        autoplay    = option.autoplay ? option.autoplay : null,
        viewCount   = option.viewCount ? option.viewCount : 'auto',
        ctrlBtn     = option.ctrlBtn ? option.ctrlBtn : true,
        ctrlBtnPrev = option.ctrlBtnPrev ? option.ctrlBtnPrev : '.btn-slide-ctrl.prev',
        ctrlBtnNext = option.ctrlBtnNext ? option.ctrlBtnNext : '.btn-slide-ctrl.next',
        ctrlBtnPs   = option.ctrlBtnPs ? option.ctrlBtnPs : '.btn-slide-ps',
        activeInit  = option.activeInit,
        activeStart = option.activeStart,
        activeEnd  	= option.activeEnd;

    var items       = area.querySelectorAll('.slide-item'), // 아이템 전체
        nowNum      = 0,
        sclArr      = new Array(); // 아이템 scroll left 값용 배열

    /* scroll animation */
    function easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }

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

   /* var wrap	= typeof area === 'string' ? document.querySelector(area) : area,
        list 	= wrap.querySelector('ul'),
        items	= wrap.querySelectorAll('li'),
        listW 	= 0,
        gap 	= gap ? gap : 0;

    Array.prototype.forEach.call(items, function(item){
        listW += item.offsetWidth;
        item.addEventListener('click', btnClick);
    });
    list.style.width = listW + 'px'; 

    var classOff = function(){
        Array.prototype.forEach.call(items, function(item){
            item.classList.remove('on');
        });
    }

    function btnClick(e){
        if(e.target.tagName != 'BUTTON') return;
        var tgLi = e.target.parentNode;
        classOff();
        tgLi.classList.add('on');
        var tgL = tgLi.offsetLeft - (wrap.offsetWidth / 2) + (tgLi.offsetWidth / 2) - gap;
        animateScroll(wrap, tgL, 300);
    }

    function scrollInit(){
        var tgLi = list.querySelector('li.on'),
            tgL = tgLi.offsetLeft - (wrap.offsetWidth / 2) + (tgLi.offsetWidth / 2) - gap;
        wrap.scrollLeft = tgL;
    }
    scrollInit();*/
}