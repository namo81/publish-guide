// calendar
// 서남호(namo) - for m.s.p
// 2024-05-09 : 모바일용 v1.0.0 제작

/*
    wrap     : input 포함 영역
    keyFunc  : 자동 완성 시 실행할 콜백함수
    data     : 데이터 (json 및 배열형식)
*/

function srchMember(option) {
    let wrap	= typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        inp     = wrap.querySelector('input'),
        data    = option.data;
    
    let mail_id,
        id_width,
        hidden_tag = document.createElement('span');

    // 검색 팝업 관련 dom 설정
    let srchModal 	= document.createElement('div'),
        srchList 	= document.createElement('ul');

    srchModal.classList.add('modal-srch');
    srchList.classList.add('srch-list');
    srchModal.appendChild(srchList);

    hidden_tag.classList.add('hidden_tag');
    wrap.appendChild(hidden_tag);

    inp.addEventListener('input', triggerChk);
    inp.addEventListener('focusin', triggerChk);
    wrap.addEventListener('focusout', modalOffDelay);

    /** input 에 입력 발생 시 실행 */
    function triggerChk(e){
        let val = e.target.value,
            tg_tx = checkValue(val);
        if(tg_tx != undefined) srchInputValueCheck(tg_tx);
    }

    /** 입력 시 데이터 - 조건문 일치 확인 */
    function checkValue(val) {
        if(!val.split('@').length) return false;
        mail_id = String(val.split('@')[0]);
        return val.split('@')[1];
    }

    // 입력값과 일치하는 데이터 추출 배열
    let resultArr = new Array();

    /** 입력된 값으로 data 검색 후 일치하는 값 추출하여 resultArr 생성 */
    function srchInputValueCheck(val){
        selection = document.getSelection();
        while (srchList.firstChild) srchList.removeChild(srchList.firstChild); // 생성내용 제거
        resultArr = [];
        for(let o=0; o<data.length; o++){
            if(val.length > 0 && data[o].indexOf(val) == 0 && data[o] != val) {
                resultArr.push(data[o]);
            } 
        }
        resultArr.length > 0 ? makeTargetList() : modalOff();
    }

    /** 조건 일치하는 대상 검색 및 리스트 생성 */
    function makeTargetList(){
        resultArr.forEach(function(name){
            let liTag   = document.createElement('li'),
                btnTag    = document.createElement('button');
            btnTag.setAttribute('type', 'button');
            btnTag.textContent = name;
            liTag.appendChild(btnTag);
            srchList.appendChild(liTag);
            btnTag.addEventListener('click', function(){ targetSelectComp(this.textContent); });
        });
        modalOn();
    }
    
    /** 검색 modal 열기 + (hidden tag 에 id 입력 및 너비 계산 포함) */
    function modalOn(){
        hidden_tag.textContent = mail_id;
        id_width = hidden_tag.offsetWidth + 15;
        wrap.appendChild(srchModal);
        srchModal.style.left = id_width + 'px';
    }

    /** 검색 modal 닫기 */
    function modalOff(){
        if(wrap.querySelector('.modal-srch')) wrap.removeChild(srchModal);
    }
    
    /** 검색 modal 닫기 - delay : focusout 으로 인한 닫기 관련 - target 클릭 시에도 focusout 가 바로 실행되는 것 방지 */
    function modalOffDelay(){
        setTimeout(function(){ modalOff() }, 300);
    }

    /** 검색 후 대상 선택 시 */
    function targetSelectComp(mail_domain){
        inp.value = mail_id + '@' + mail_domain;
        modalOff();
    }
}