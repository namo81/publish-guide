/*
    2023-03-17 : v1.0.0 추가
    common.js 필요
*/

function nSelectMobile(option){
    var wrap            = typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        nSel            = wrap.querySelector('select'),
        opts            = nSel.options,
        selTitle        = option.title,
        optHeight       = option.optHeight ? Number(option.optHeight) : 30,
        btnCls          = option.btnCls ? option.btnCls : 'btn-sel',
        btnConfirmTx    = option.btnConfirmTx ? option.btnConfirmTx : '확인';

    var body            = document.querySelector('body');

    var selVal,selIdx,
        tempVal, tempIdx,
        optBtns,
        btnSel          = document.createElement('button');

    nSel.style.display = 'none';
    if(nSel.value) {
        selVal = nSel.value;
        selIdx = nSel.selectedIndex;
    }

    btnSel.classList.add(btnCls);
    btnSel.textContent = nSel.options[nSel.selectedIndex].textContent;

    wrap.appendChild(btnSel);

    var selModal    = document.createElement('div'),
        modalCnt    = document.createElement('div'),
        scrollArea  = document.createElement('div'),
        scrollCnt   = document.createElement('div'),
        btnWrap     = document.createElement('div'),
        listUl      = document.createElement('ul'),
        btnClose    = document.createElement('button'),
        btnConfirm  = document.createElement('button');

    selModal.classList.add('modal-sel');
    modalCnt.classList.add('modal-cnt');
    scrollArea.classList.add('scroll-wrap');
    scrollCnt.classList.add('scroll-cnt'); // 실제 스크롤 되는 영역
    btnWrap.classList.add('modal-btn-wrap');
    listUl.classList.add('sel-list');

    btnConfirm.classList.add('btn-sel-confirm');
    btnClose.classList.add('btn-sel-close');
    btnClose.textContent = '닫기';
    btnConfirm.textContent = btnConfirmTx;

    scrollCnt.appendChild(listUl);
    scrollArea.appendChild(scrollCnt);
    btnWrap.appendChild(btnConfirm);
    modalCnt.appendChild(scrollArea);
    modalCnt.appendChild(btnWrap);
    modalCnt.appendChild(btnClose);
    selModal.appendChild(modalCnt);

    if(selTitle) {
        var selTitArea    = document.createElement('div');
        selTitArea.classList.add('modal-title');
        modalCnt.insertBefore(selTitArea, modalCnt.firstChild);
        selTitArea.innerText = selTitle;
    }

    function setList(){
        opts = nSel.options;
        tempVal = selVal;
        tempIdx = selIdx;

        for(var i=0; i<opts.length; i++){
            listUl.insertAdjacentHTML('beforeend', '<li><button type="button">'+ opts[i].textContent +'</button></li>');
        }
        if(opts.length <= 1) return;
        if(opts.length < 4){
            scrollArea.style.height = optHeight * 3 + 'px';
            scrollCnt.style.paddingTop = optHeight + 'px';
            scrollCnt.style.paddingBottom = optHeight + 'px';
        } else {
            scrollArea.style.height = optHeight * 5 + 'px';
            scrollCnt.style.paddingTop = optHeight * 2 + 'px';
            scrollCnt.style.paddingBottom = optHeight * 2 + 'px';
        }
        
        // 리스트 버튼 클릭 시 해당 위치로 스크롤 이동
        optBtns = listUl.querySelectorAll('button');
        optBtns.forEach(function(btn, idx){
            btn.addEventListener('click', function(){
                //scrollCnt.scrollTo(0, optHeight * idx); // css - scroll-behavior:smooth 필요.
                animateScroll(scrollCnt, optHeight * idx, 200);
                tempVal = btn.textContent;
                tempIdx = idx;
            });
        });

        var scrollInterval,     // scroll 동작관련 interval 변수
            scrollTopVal,   // 초기 scroll 값
            touchChk = true;    // touch 상태 확인 변수 - 터치 상태로 scroll 이 움직이지 않을 경우를 위한 확인용
            
        function scrollChk(area){ // interval 로 scrolltop 값 비교를 통한 scroll 움직임 상태감지
            if(scrollTopVal != area.scrollTop) scrollTopVal = area.scrollTop;
            else {
                if(touchChk == false) {
                    clearInterval(scrollInterval);
                    scSet(area, area.scrollTop);
                }
            }
        }

        function scSet(area, sc){
            var scVal = Math.floor(sc / optHeight),
                scN   = sc % optHeight,
                tgSc;
            
            scN < optHeight / 2 ? tempIdx = scVal : tempIdx = scVal + 1;
            tgSc = tempIdx * optHeight;
            tempVal = optBtns[tempIdx].textContent;
            //area.scrollTo(0, tgSc); // css - scroll-behavior:smooth 필요.
            animateScroll(area, tgSc, 200);
        }

        if(selIdx != 0){
            scrollCnt.scrollTo(0, optHeight * selIdx);
        }

        if(scrollCnt.classList.contains('func_on')) return;
        
        scrollCnt.addEventListener('scroll', function(){
            clearInterval(scrollInterval);
            scrollInterval = setInterval(function(){
                scrollChk(scrollCnt);
            }, 50);
        });

        scrollCnt.addEventListener('touchstart', function(){
            touchChk = true; // touch 상태 on
        }, {passive : false});

        scrollCnt.addEventListener('touchend', function(){
            touchChk = false; // touch 상태 off
        });
        scrollCnt.classList.add('func_on');
    }

    function removeList(){
        selModal.classList.remove('on');
        while ( listUl.hasChildNodes() ) { listUl.removeChild( listUl.firstChild ); }
        body.removeChild(selModal);
    }

    function selConfirm(){
        if(selIdx != tempIdx && selVal != tempVal) {
            selVal = tempVal;
            selIdx = tempIdx;
        }
        nSel.value = selVal;
        nSel.options[selIdx].selected = true;
        btnSel.textContent = nSel.options[selIdx].textContent;
        nSel.dispatchEvent(changeEvt);
        removeList();
    }

    btnSel.addEventListener('click', openList);

    function openList(){
        body.appendChild(selModal);
        setList();
        setTimeout(function(){ selModal.classList.add('on') }, 100);
        btnConfirm.addEventListener('click', selConfirm);
        btnClose.addEventListener('click', removeList);
    }
}