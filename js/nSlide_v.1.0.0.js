/*
    nSlide
    2022-04-15 : v.1.0.0 ���� start
 */

/* 
    wrap : ��ü ���� - string / dom ���
    container : ���� �����̴� ��� ���� - string
    slidePos : ���� ��� ǥ�� ���� - string
    posType : ���� ��� ǥ�� Ÿ�� ('bullet' / 'number') �⺻�� bullet
    autoplay : �ڵ� ��� ���� boolean - �⺻�� false
    contWidth : ��ʿ��� width
    contHeight : ��ʿ��� height

    ctrlBtn : ����/���� ��ư ��� ���� boolean - �⺻�� true
    ctrlBtnPrev : ���� ��ư
    ctrlBtnNext : ������ư
    ctrlBtnPs : play / stop ��ư

    activeInit : ��� �ʱ� ���� �� �ݹ��Լ�
    activeStart : ��� �̵� ���� �� �ݹ��Լ�
    activeEnd : ��� �̵� �� �ݹ��Լ�
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

    var nowNum      = 0, // ���� Ȱ��ȭ item index
        wrapWidth   = wrap.offsetWidth,
        contWidth   = 0; // container �ʺ�

    // item �� idx �Ӽ� �߰�
    function itemIdxSet(){
        Array.prototype.forEach.call(items, function(item, idx){
            item.setAttribute('data-idx', idx);
        });
    }

    // container / item �ʺ� ����
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

    // ����/���� ��� �Լ� - loop false
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
    // ����/���� ��� �Լ� - loop true
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


    // ��� ���� �̺�Ʈ
    container.addEventListener('transitionend', moveEndFunc);
    function moveEndFunc(){
        if(typeof activeEnd === 'function') activeEnd(nowNum);
        container.style.transitionDuration = '0s';
    }

    // ���� Ȱ��ȭ ��� active Ŭ���� ����
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

    // �ʱ� ����
    itemIdxSet();
    widthInit();
    if(ctrlBtn) btnSet();
    if(loop == true) createDummy();
}