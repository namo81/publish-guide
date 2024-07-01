/*
    2023-03-17 : v1.0.0 추가
    2024-05-16 : v1.1.0 - option hidden / disabled 속성관련 추가
    common.js 필요
*/

function nSelectMobile(option){
    let wrap            = typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        nSel            = wrap.querySelector('select'),
        opts            = nSel.options,
        selTitle        = option.title,
        optHeight       = option.optHeight ? Number(option.optHeight) : 30,
        btnCls          = option.btnCls ? option.btnCls : 'btn-sel',
        btnConfirmTx    = option.btnConfirmTx ? option.btnConfirmTx : '확인';

    let body            = document.querySelector('body'),
        selTitArea;

    let selVal,  // 기 선택 text
        selIdx,  // 기 선택 idx
        tempVal, // 임시 선택 text
        optBtns, // 생성된 option 관련 버튼
        btnSel = document.createElement('button'),
        hidden_count; // option hidden 속성 갯수

    let scroll_padding,
        scroll_height;

    nSel.style.display = 'none';
    if(nSel.value) {
        selIdx = nSel.selectedIndex;
        selVal = nSel.options[selIdx].textContent;
    }

    btnSel.classList.add(btnCls);
    btnSel.textContent = nSel.options[nSel.selectedIndex].textContent;
    btnSel.setAttribute('aria-haspopup', 'dialog');
    btnSel.setAttribute('aria-expanded', 'false');
    wrap.appendChild(btnSel);

    let selModal    = document.createElement('div'),
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
    btnWrap.classList.add('btns');
    listUl.classList.add('sel-list');

    btnConfirm.classList.add('btn');
    btnConfirm.classList.add('large');
    btnConfirm.classList.add('main');
    btnClose.classList.add('btn-sel-close');
    btnClose.textContent = '닫기';
    btnConfirm.textContent = btnConfirmTx;

    scrollCnt.appendChild(listUl);
    scrollArea.appendChild(scrollCnt);
    btnWrap.appendChild(btnConfirm);
    modalCnt.appendChild(scrollArea);
    modalCnt.appendChild(btnWrap);
    modalCnt.insertBefore(btnClose, modalCnt.firstChild);
    selModal.appendChild(modalCnt);

    if(selTitle) {
        selTitArea = document.createElement('div');
        selTitArea.classList.add('modal-title');
        selTitArea.setAttribute('tabindex', '0');
        selTitArea.setAttribute('role', 'heading');
        modalCnt.insertBefore(selTitArea, modalCnt.firstChild);
        selTitArea.innerText = selTitle;
    }

    /** observer 관련 옵션 */
    let observerOpt = {
        root : scrollCnt,
        rootMargin : "-30px 0px",
        threshold : 1
    },
    scrollObs;

    /** 스크롤 시 중앙위치 버튼 cls 제어 */
    function scrollCenterSet(ent){
        ent.forEach((entry) => {
            entry.isIntersecting ? entry.target.classList.add('sel') : entry.target.classList.remove('sel');
        });
    }

    /** 리스트 생성 함수 */
    function setList(){
        opts = nSel.options;
        tempVal = selVal; // 선택 value

        hidden_count = 0; // option 중 hidden 속성 가진 갯수

        for(let i=0; i<opts.length; i++){
            if(opts[i].getAttribute('hidden') == null) {
                let dum_li = document.createElement('li'),
                    dum_btn = document.createElement('button');
                dum_btn.setAttribute('type', 'button');
                dum_btn.setAttribute('role', 'option');
                dum_btn.textContent = opts[i].textContent;
                selIdx == i ? dum_btn.setAttribute('aria-selected', true) : dum_btn.setAttribute('aria-selected', false);
                if(opts[i].disabled == true) dum_btn.disabled = true;
                dum_li.appendChild(dum_btn);
                listUl.appendChild(dum_li);
            } else hidden_count++;
        }
        if(opts.length <= 1) return;
        if((opts.length - hidden_count) < 4){
            scroll_height = optHeight * 3;
            scroll_padding = optHeight;
            observerOpt.rootMargin = '-30px 0px';
        } else {
            scroll_height = optHeight * 5;
            scroll_padding = optHeight * 2;
            observerOpt.rootMargin = '-60px 0px';
        }
        scrollArea.style.height = scroll_height + 'px';
        scrollCnt.style.paddingTop = scroll_padding + 'px';
        scrollCnt.style.paddingBottom = scroll_padding + 'px';
        scrollObs = new IntersectionObserver(scrollCenterSet, observerOpt);
        
        // 리스트 버튼 클릭 시 해당 위치로 스크롤 이동
        optBtns = listUl.querySelectorAll('button');
        optBtns.forEach(function(btn, idx){
            btn.addEventListener('click', function(e){
                //scrollCnt.scrollTo(0, optHeight * idx); // css - scroll-behavior:smooth 필요.
                animateScroll(scrollCnt, optHeight * idx, 200);
                tempVal = btn.textContent;
                selConfirm(); // 웹접근성 : 터치 시 해당 값 바로 입력
            });
        });

        let scrollInterval,     // scroll 동작관련 interval 변수
            scrollTopVal,   // 초기 scroll 값
            touchChk = true;    // touch 상태 확인 변수 - 터치 상태로 scroll 이 움직이지 않을 경우를 위한 확인용
        
        /** interval 로 scrolltop 값 비교를 통한 scroll 움직임 상태감지 */
        function scrollChk(area){
            if(scrollTopVal != area.scrollTop) scrollTopVal = area.scrollTop;
            else {
                if(!touchChk) {
                    clearInterval(scrollInterval);
                    scSet(area, area.scrollTop);
                }
            }
        }

        /** 스크롤 끝난 후 위치 조정 */
        function scSet(area, sc){
            let scVal = Math.floor(sc / optHeight),
                scN   = sc % optHeight,
                tgSc, tempIdx;

            scN < optHeight / 2 ? tempIdx = scVal : tempIdx = scVal + 1;
            if(optBtns[tempIdx].disabled == true) { // disabled 일 경우 이전/이후 항목으로 이동
                tempIdx == optBtns.length - 1 ? tempIdx-- : tempIdx++;
            }
            tgSc = tempIdx * optHeight;
            tempVal = optBtns[tempIdx].textContent;
            //area.scrollTo(0, tgSc); // css - scroll-behavior:smooth 필요.
            animateScroll(area, tgSc, 200);
        }

        if(selIdx != 0){
            let tg = getSameTx(optBtns, selVal, false),
                tg_sc = tg.parentNode.getBoundingClientRect().top - scrollCnt.getBoundingClientRect().top - scroll_padding;
            scrollCnt.scrollTo(0, tg_sc);
        } else {
            if(hidden_count != 0) tempVal = optBtns[0].textContent;
        }

        if(scrollCnt.classList.contains('func_on')) return;
        
        scrollCnt.addEventListener('scroll', function(e){
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

    /** object 내 항목 text 비교 후 idx 산출 */
    function getSameTx(obj, val, num){
        for(let i=0; i<obj.length; i++){
            if(obj[i].textContent == val) return num ? i : obj[i];
        }
    }

    /** 리스트 삭제 */
    function removeList(){
        selModal.classList.remove('on');
        btnSel.setAttribute('aria-expended', 'false');
        while ( listUl.hasChildNodes() ) { listUl.removeChild( listUl.firstChild ); }
        body.removeChild(selModal);
        scrollObs.disconnect();
        btnSel.focus();
    }

    /** 리스트 컨펌 */
    function selConfirm(){
        removeList();
        if(selVal == tempVal) return;

        selVal = tempVal;
        selIdx = getSameTx(opts, tempVal, true);
        
        nSel.options[selIdx].selected = true;
        btnSel.textContent = selVal;
        nSel.dispatchEvent(changeEvt);
    }
    btnSel.addEventListener('click', openList);

    /** 리스트 생성 및 열기 */
    function openList(){
        body.appendChild(selModal);
        setList();
        setTimeout(function(){ selModal.classList.add('on') }, 100);
        let tgIdx = selIdx != 0 ? selIdx - hidden_count : 0;
        selTitle ? selTitArea.focus() : optBtns[tgIdx].focus();
        btnSel.setAttribute('aria-expended', 'true');
        btnConfirm.addEventListener('click', selConfirm);
        btnClose.addEventListener('click', removeList);
        modalCnt.addEventListener('transitionend', function() {
            optBtns.forEach(function(btn) { scrollObs.observe(btn.parentNode) });
        });
    }

    this.set_disabled = function(){
        btnSel.disabled = true;
    }
    this.set_enabled = function(){
        btnSel.disabled = false;
    }
}