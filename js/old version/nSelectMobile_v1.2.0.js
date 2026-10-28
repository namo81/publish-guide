/*
    2023-03-17 : v1.0.0 추가
    2024-05-16 : v1.1.0 - option hidden / disabled 속성관련 추가
    common.js 필요
*/

/** ios 스타일 : option 항목 클릭 및 드래그 ------------------------ */
function nSelectDrag(option){
    const select = this;
    let wrap            = typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        nSel            = wrap.querySelector('select'),
        opts            = nSel.options,
        selTitle        = option.title,
        optHeight       = option.optHeight ? Number(option.optHeight) : 30,
        btnCls          = option.btnCls ? option.btnCls : 'btn-sel',
        btnConfirmTx    = option.btnConfirmTx ? option.btnConfirmTx : '확인';

    let body            = document.querySelector('body'),
        selTitArea,
        changeEvt = new Event('change')

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

    selModal.classList.add('n_select');
    modalCnt.classList.add('drag-scroll-area');
    modalCnt.classList.add('select-cnt');
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
        selTitArea.classList.add('select-title');
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

    select.set_disabled = function(){
        btnSel.disabled = true;
    }
    select.set_enabled = function(){
        btnSel.disabled = false;
    }
}

/** ios 스타일 : option 항목 클릭만 ------------------------ */
function nSelect(option){
    const select = this;
    let wrap            = typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        nSel            = wrap.querySelector('select'),
        selTitle        = option.title,
        btnCls          = option.btnCls ? option.btnCls : 'btn-sel';

    let body            = document.querySelector('body'),
        selTitArea,
        changeEvt = new Event('change');

    let opts = nSel.options,
        selVal,  // 기 선택 text
        selIdx,  // 기 선택 idx
        optBtns, // 생성된 option 관련 버튼
        btnSel = document.createElement('button'),
        bodyStyle = document.querySelector('body').style;

    nSel.style.display = 'none';
    if(nSel.value) {
        selIdx = nSel.selectedIndex;
        selVal = nSel.options[selIdx].value;
    }

    btnSel.classList.add(btnCls);
    btnSel.textContent = nSel.options[nSel.selectedIndex].textContent;
    btnSel.setAttribute('type', 'button');
    btnSel.setAttribute('aria-haspopup', 'dialog');
    btnSel.setAttribute('aria-expanded', 'false');
    wrap.appendChild(btnSel);
    if(nSel.disabled == true) btnSel.disabled = true;

    let selModal    = document.createElement('div'),
        modalCnt    = document.createElement('div'),
        scrollArea  = document.createElement('div'),
        listUl      = document.createElement('ul'),
        btnClose    = document.createElement('button');

    selModal.classList.add('n_select');
    if(option.modalCls) selModal.classList.add(option.modalCls);
    modalCnt.classList.add('select-cnt');
    scrollArea.classList.add('scroll-wrap');
    listUl.classList.add('sel-list');

    btnClose.classList.add('btn-sel-close');
    btnClose.textContent = '닫기';

    scrollArea.appendChild(listUl);
    modalCnt.appendChild(scrollArea);
    selModal.appendChild(modalCnt);
    modalCnt.appendChild(btnClose);

    if(selTitle) {
        selTitArea = document.createElement('div');
        selTitArea.classList.add('select-title');
        selTitArea.setAttribute('tabindex', '0');
        selTitArea.setAttribute('role', 'heading');
        modalCnt.insertBefore(selTitArea, modalCnt.firstChild);
        selTitArea.innerText = selTitle;
    }

    /** 리스트 생성 함수 */
    function setList(){
        opts = nSel.options;
        let sel_btn;

        for(let i=0; i<opts.length; i++){
            if(opts[i].getAttribute('hidden') == null) {
                let dum_li = document.createElement('li'),
                    dum_btn = document.createElement('button');
                dum_btn.setAttribute('type', 'button');
                dum_btn.setAttribute('role', 'option');
                dum_btn.dataset.val = opts[i].value;
                dum_btn.textContent = opts[i].textContent;
                if(selVal == opts[i].value) {
                    dum_btn.setAttribute('aria-selected', true);
                    sel_btn = dum_btn;
                } else dum_btn.setAttribute('aria-selected', false);
                if(opts[i].disabled == true) dum_btn.disabled = true;
                dum_li.appendChild(dum_btn);
                listUl.appendChild(dum_li);
            } else null;
        }
        
        // 리스트 버튼 클릭 시 해당 위치로 스크롤 이동
        optBtns = listUl.querySelectorAll('button');
        optBtns.forEach(function(btn, idx){
            btn.addEventListener('click', function(e){
                selConfirm(btn, idx);
            });
        });

        if(sel_btn == null) return;
        let area_top = scrollArea.getBoundingClientRect().top;
        sel_sc = sel_btn.getBoundingClientRect().top - area_top;
        scrollArea.scrollTo(0, sel_sc);
    }

    /** 리스트 삭제 */
    function removeList(){
        pageUnset();
        selModal.classList.remove('on');
        btnSel.setAttribute('aria-expanded', 'false');
        while ( listUl.hasChildNodes() ) { listUl.removeChild( listUl.firstChild ); }
        body.removeChild(selModal);
        btnSel.focus();
    }
    
    /**
     * options 중 동일한 text 를 가진 option index 추출
     * @param {string} tx 버튼 텍스트
    
    function get_opts_idx(tx){
        let opt_idx;
        for(let i=0; i<opts.length; i++){
            if(opts[i].textContent == tx) {
                opt_idx = i;
                break;
            }
        }
        return opt_idx;
    } */

    /**
     * options 중 select 와 동일한 value 를 가진 option index 추출
     * @param {string} val 버튼 텍스트
     */
    function get_opts_idx(val){
        let opt_idx;
        for(let i=0; i<opts.length; i++){
            if(opts[i].value == val) {
                opt_idx = i;
                break;
            }
        }
        return opt_idx;
    }

    /**
     * 리스트 컨펌
     * @param {dom} btn 선택된 버튼
     * @param {number} idx 선택된 버튼의 index
     */
    function selConfirm(btn, idx){
        removeList();

        selVal = btn.dataset.val;
        selIdx = get_opts_idx(btn.dataset.val);
        //selIdx = get_opts_idx(btn.textContent);

        nSel.options[selIdx].selected = true;
        btnSel.textContent = btn.textContent;
        nSel.dispatchEvent(changeEvt);
    }
    btnSel.addEventListener('click', openList);

    /** 리스트 생성 및 열기 */
    function openList(){
        if(nSel.hasAttribute('readonly')) return; // readonly 속성 시 작동 안함 (값이 1개일 경우 등)
        pageSet();
        body.appendChild(selModal);
        selModal.setAttribute('role', 'dialog');
        setList();
        setTimeout(function(){ selModal.classList.add('on') }, 100);
        selTitle ? selTitArea.focus() : optBtns[selIdx].focus();
        btnSel.setAttribute('aria-expanded', 'true');
        btnClose.addEventListener('click', removeList);
    }

    /** 모 페이지 설정 함수 - tab 키 요소 제어 및 화면 overflow 설정 */
	function pageSet(){
		let tabEle		= document.querySelectorAll('a, button, input, select, textarea');
		tabEle.forEach(function(ele){
			if(ele.closest('.modal')) return;
			ele.setAttribute('tabindex','-1');
			ele.setAttribute('aria-hidden', true);
		});
		bodyStyle.overflow = 'hidden';
        body.classList.add('hold');
	}

	/** 모 페이지 설정 해제 - tab 키 요소 제어 및 화면 overflow 설정 해제 */
	function pageUnset() {
		let tabEle		= document.querySelectorAll('a, button, input, select, textarea');
		tabEle.forEach(function(ele){
			if(ele.closest('.modal')) return;
			ele.removeAttribute('tabindex');
			ele.removeAttribute('aria-hidden');
		});
		bodyStyle.overflow = '';
        body.classList.remove('hold');
	}

    // select 변경내역 업데이트 (선택값 변경)
    select.update = function(){
        selIdx = nSel.selectedIndex;
        selVal = nSel.options[selIdx].value;
        btnSel.textContent = nSel.options[selIdx].textContent;
        nSel.disabled == true ? btnSel.disabled = true : btnSel.disabled = false;
    }

    // 버튼 disabled
    select.set_disabled = function(){
        btnSel.disabled = true;
    }
    // 버튼 Enabled
    select.set_enabled = function(){
        btnSel.disabled = false;
    }

    // select 직접 선택
    select.select = nSel;
}