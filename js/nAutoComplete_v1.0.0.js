// calendar
// 서남호(namo) - for m.s.p
// 2023-04-13 : v1.0.0 제작

/*
    wrap     : contentEditable 영역
    keyFunc  : 이름 입력 시 실행할 콜백함수
    data     : 구성원 데이터 (json 및 배열형식)
*/

function srchMember(option) {
    var wrap	= typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        //keyFunc = option.keyFunc,
        data    = option.data;

    var body    = document.querySelector('body');

    var selection, 
        nowRange,   // 초기 @ 입력 시 range 
        srchRange,  // 입력 중 srchInp 의 range
        prtNode,    // range 가 포함된 부모요소
        nowNode,    // 초기 @ 가 입력된 node
        caretIdx;   // @ 실행 전 마지막 커서위치 idx (커서포함 노드 기준)

    // 입력 영역 관련 dom 설정
    var srchItem 	= document.createElement('span'),
        srchIcon 	= document.createElement('span'),
        srchInp 	= document.createElement('span');
            
    srchItem.classList.add('srch-area');
    srchIcon.classList.add('srch-icon');
    srchInp.classList.add('srch-input');

    srchIcon.textContent = '@';
    srchItem.appendChild(srchIcon);
    
    // 검색 팝업 관련 dom 설정
    var srchModal 	= document.createElement('div'),
        modalTit 	= document.createElement('p'),
        srchList 	= document.createElement('ul'),
        listBtns,  // 검색으로 선별된 구성원 버튼 전체
        nowSelNum; // 구성원 버튼 중 현재 up/down 으로 선택된 구성원의 idx

    srchModal.classList.add('modal-srch');
    modalTit.classList.add('modal-tit');
    srchList.classList.add('srch-list');
    srchModal.appendChild(modalTit);
    srchModal.appendChild(srchList);

    wrap.addEventListener('focus', srchFuncOn);
    
    function srchFuncOn(e){
        wrap.addEventListener('keyup', triggerChk);
    }

    // 검색 활성화 상태에서 키보드 입력 시
    function funcKeyOn(){
        wrap.onEvent('keyup', function(e){
            if(e.keyCode == 38) selectMember('up');
            else if(e.keyCode == 40) selectMember('down');
            else if (e.keyCode == 13) {
                listBtns[nowSelNum].dispatchEvent(clickEvt);
            } else srchInputValueCheck(srchInp.textContent.trim());
        });

        wrap.onEvent('keydown', function(e){
            if(srchInp.textContent.length == 1 && e.keyCode == 8 || srchRange.startOffset == 1 && e.keyCode == 37 || e.keyCode == 27) { // esc 키로 영역 삭제할 경우
                e.preventDefault(); // 필수 : 영역 삭제 시 @ 앞의 문구에서 마지막 글자 제거 방지
                cancelSrchMember();
            }
            if(e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13) e.preventDefault();
        });
        wrap.addEventListener('focusout', cancelSrchMember);
    }

    function funcKeyOff(){
        wrap.removeListeners();
        wrap.removeEventListener('focusout', cancelSrchMember);
    }

    // @ 제거 후 node 에 item 추가하는 함수
    function insertSrchInpNode(node, idx, item){
        var newRange = document.createRange();
        newRange.setStart(node, idx - 1);
        newRange.setEnd(node, idx);
        selection.addRange(newRange);
        newRange.deleteContents();
        newRange.insertNode(item);
        newRange.detach();
    }

    // contentEditable 영역 에서 shift + @ 입력 시 실행함수
    function triggerChk(e){
        if(!e.shiftKey || e.keyCode != 50) return;

        selection 	= document.getSelection();
        nowRange 	= selection.getRangeAt(0);
        prtNode 	= nowRange.endContainer.parentNode;

        if(prtNode.tagName == 'A') return;
        var nodes   = prtNode.childNodes;
        
        if(nodes.length == 1) setInputNode(nodes[0]);
        else nodes.forEach(function(node){ if(node == nowRange.endContainer) setInputNode(node); return; });
    }
    
    // shift + @ 입력 시 검색 영역 생성 및 modal 호출
    function setInputNode(node){
        var nodeTxt = node.textContent,
            txIdx   = nowRange.endOffset,
            gap     = 2,
            txItem  = ' @';

        nowNode = node;

        if(nodeTxt.length == 1) { gap = 1; txItem  = '@'; }
        if(!(nodeTxt.substr(txIdx - gap, gap) == txItem)) return;
        
        srchInp.textContent = '\ufeff'; // !!!! - 해당 space 포함하여 검색어로 전달되면, match 에서 전체문구 인지 안됨. trim 으로 제거.
        srchItem.appendChild(srchInp); // esc 로 삭제 시 srchItem 내의 srchInp도 제거가 되서, 매번 추가해주어야 함.
        insertSrchInpNode(node, txIdx, srchItem);
        selection.collapse(srchInp, 1);

        caretIdx = txIdx;

        funcKeyOn();
        modalOn();
    }

    // 검색 modal 열기
    function modalOn(){
        var inpRect = srchItem.getBoundingClientRect();
        body.appendChild(srchModal);
        srchModal.style.top = (inpRect.top + 20) + 'px';
        srchModal.style.left = inpRect.left + 'px';
    }

    // 검색 modal 닫기
    function modalOff(){
        body.removeChild(srchModal);
    }

    var nameArr = new Array(),      // 구성원 이름(사번) 배열
        resultArr = new Array();    // 입력값과 일치하는 구성원 배열
    for(var d=0; d<Object.keys(data).length; d++){
        nameArr.push(data[d].name);
    }

    // 입력된 이름으로 data 검색 후 일치하는 값 추출하여 resultArr 생성
    function srchInputValueCheck(val){
        removeMemberList();
        resultArr = [];
        for(var o=0; o<nameArr.length; o++){
            if(val.length > 0 && nameArr[o].match(val)) {
                resultArr.push(data[o].name + '('+ data[o].cNumber +')');
            }
        }
        makeMemberList();
    }

    function removeMemberList(){
        while (srchList.firstChild) srchList.removeChild(srchList.firstChild);
    }

    // resultArr 기준으로 리스트 생성 / 없을 경우 '없음' 문구 출력
    function makeMemberList(){
        if(resultArr.length < 1) {
            var liTag   = document.createElement('li');
            liTag.textContent = '일치하는 구성원이 없습니다.';
            srchList.appendChild(liTag);
        } else {
            resultArr.forEach(function(name){
                var liTag   = document.createElement('li'),
                    btnTag    = document.createElement('button');
                btnTag.setAttribute('type', 'button');
                btnTag.textContent = name;
                liTag.appendChild(btnTag);
                srchList.appendChild(liTag);
                btnTag.addEventListener('click', function(){ memberSelectConfirm(this.textContent); });
            });
            listBtns = srchList.querySelectorAll('button');
            if(resultArr.length > 0) selectMember();
        }
        srchRange = selection.getRangeAt(0);
    }

    // 검색된 대상버튼 active 클래스 전체 제거
    function listBtnReset(){
        listBtns.forEach(function(btn){
            btn.classList.remove('active');
        });
    }

    // modal 에서 방향키 위/아래로 대상 고르기
    function selectMember(dir){
        if(resultArr.length < 1) return;
        if(dir == 'up') {
            nowSelNum > 0 ? nowSelNum-- : nowSelNum = 0;
        } else if(dir == 'down') {
            nowSelNum < listBtns.length-1 ? nowSelNum++ : nowSelNum = listBtns.length -1;
        } else nowSelNum = 0;
        listBtnReset();
        listBtns[nowSelNum].classList.add('active');
    }

    // 검색 상태에서 esc / left 방향키 / back space 키로 취소할 경우 - @ 문자만 남기기
    function cancelSrchMember(){
        var txAt    = document.createTextNode('@'),
            ccRange = document.createRange();

        ccRange.setStart(nowNode, caretIdx - 1);
        selection.addRange(ccRange);
        prtNode.removeChild(srchItem);
        ccRange.insertNode(txAt);
        ccRange.detach();
        funcKeyOff();
        modalOff();
        selection.collapse(txAt, 1);
    }

    // 검색 후 대상 선택 시
    function memberSelectConfirm(name){
        var aTag        = document.createElement('a'),
            nextSpace   = document.createTextNode('\ufeff');
        aTag.textContent = name.split('(')[0];
        aTag.classList.add('sel-member');
        aTag.setAttribute('href', '#'); // href 속성이 없을 경우 일반 tag 로 인식되어, 삭제 시 a 태그의 style 이 잔존함.

        var instRange = document.createRange();

        instRange.setStart(nowNode, caretIdx - 1);
        selection.addRange(instRange);

        prtNode.removeChild(srchItem);
        
        instRange.insertNode(nextSpace);
        instRange.insertNode(aTag);
        instRange.detach();

        funcKeyOff();
        modalOff();
        removeMemberList();
        selection.collapse(nextSpace, 1);
    }
}