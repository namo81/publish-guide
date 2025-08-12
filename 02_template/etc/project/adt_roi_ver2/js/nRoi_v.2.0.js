/*
2022-02-08 : 도형수정 기능 추가
2022-05-03 : 클릭 횟수 표기 / undo 기능추가 / 도형 완성 전 polyline > 완성 후 polygon 변환
2022-07-06 : redo 기능 추가
2022-08-05 : 라인 수정 - 화살표 반전을 위한 배열 뒤집기 기능 / 수정 추가 모드
2022-08-18 : 함수명 재설정 및 수정 시 도형 점 다시 찍기 기능추가
2025-05-12 : 선교차 체크 추가
*/

/* ===== 공통함수 ========================================================== */
let arrEnabled = function(items){
    Array.prototype.forEach.call(items, function(item){
        item.disabled = false;
    });
}, arrDisabled = function(items){
    Array.prototype.forEach.call(items, function(item){
        item.disabled = true;
    });
}, arrCheckFalse = function(items){
    Array.prototype.forEach.call(items, function(item){
        item.checked = false;
    });
}, listCountChk = function(tg){
    let items = tg.querySelectorAll('li'),
        result = 0;
    Array.prototype.forEach.call(items, function(item){
        if(item.parentNode == tg) result++;
    });
    return result;
}

SVGElement.prototype.onSvgEvent = function (eventType, callBack, useCapture) {
	this.addEventListener(eventType, callBack, useCapture);
	if (!this.myListeners) {
		this.myListeners = [];
	};
	this.myListeners.push({ eType: eventType, callBack: callBack });
	return this;
};

SVGElement.prototype.removeSvgListeners = function () {
	if (this.myListeners) {
		for (let i = 0; i < this.myListeners.length; i++) {
			this.removeEventListener(this.myListeners[i].eType, this.myListeners[i].callBack);
		};
		delete this.myListeners;
	};
};

// 2024.05 : 시간용 select option 생성 - (영역, 최대값, 최소값)
function optionSet(area, max, min){
    let wrap	 = typeof area === 'string' ? document.querySelector(area) : area,
        minNum 	 = min ? min : 0,
        optionTx = '';
    for(let i=minNum; i<max+1; i++){
        optionTx += '<option value="'+ i +'">'+ i +'</option>';
    }
    wrap.insertAdjacentHTML('beforeend', optionTx);
}

// class reset
function classReset(items, cls){
    Array.prototype.forEach.call(items, function(item){
        item.classList.remove(cls);
    });
}

// option 제거
function optionRemove(area){
    let wrap	 = typeof area === 'string' ? document.querySelector(area) : area;
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
}

// 분/초 를 초로 계산
function convertToSec(min, sec){
    return Number(min * 60) + Number(sec);
}
// 초를 '00:00' 으로 변환
function convertToMS(sec){
    let val_min = Math.floor(sec / 60),
        val_sec = sec % 60;
    val_min < 10 ? val_min = '0' + val_min : val_min = val_min;
    val_sec < 10 ? val_sec = '0' + val_sec : val_sec = val_sec;
    return val_min + ':' + val_sec;
}

// 2025-05-12 선교차 검증 함수
function doSegmentsIntersect(p1, p2, q1, q2) {
    function orientation(a, b, c) {
        if(!b[1]) return;
        const val = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
        if (val === 0) return 0;
        return val > 0 ? 1 : 2;
    }
    function onSegment(a, b, c) {
        return Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
    }
    const o1 = orientation(p1, p2, q1);
    const o2 = orientation(p1, p2, q2);
    const o3 = orientation(q1, q2, p1);
    const o4 = orientation(q1, q2, p2);
  
    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, p2, q2)) return true;
    if (o3 === 0 && onSegment(q1, q2, p1)) return true;
    if (o4 === 0 && onSegment(q1, q2, p2)) return true;
  
    return false;
}
/* 2025-05-12 선교차 실행 함수
function checkPolygonSelfIntersection(points) {
    const n = points.length;
    for (let i = 1; i < n; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        for (let j = i + 1; j < n; j++) {
            // 인접한 변, 같은 변, 첫-끝 변은 제외
            if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
            const q1 = points[j];
            const q2 = points[(j + 1) % n];
            if (doSegmentsIntersect(p1, p2, q1, q2)) {
                return true;
            }
        }
    }
    return false;
}*/
// 2025-05-12 선교차 실행 함수 (index 및 그리기 상태 인자 추가)
function checkPolygonLineIntersectionAtIndex(points, index, draw) {
    const n = points.length;
    // polygon이므로 인덱스 wrap-around 필요
    const prev = (index - 1 + n) % n;
    const next = (index + 1) % n;
  
    // 검사 대상: [prev, index], [index, next]
    const testSegments = draw ? [ [points[prev], points[index]] ] : 
    [ [points[prev], points[index]],
      [points[index], points[next]] ];
  
    // 모든 선분 쌍 중, 검사 대상과 겹치지 않는 선분만 비교
    for (const [a, b] of testSegments) {
      for (let j = 0; j < n; j++) {
        const c = points[j];
        const d = points[(j + 1) % n];
  
        // 자기 자신, 인접 변은 제외
        // (a,b)와 (c,d)가 같은 변이거나 인접한 경우는 건너뜀
        if (
          (a === c && b === d) || (a === d && b === c) || // 같은 선분
          a === c || a === d || b === c || b === d        // 인접
        ) continue;
  
        if (doSegmentsIntersect(a, b, c, d)) {
          return true;
        }
      }
    }
    return false;
}

// IE 대응 : svg 요소 classlist 관련 적용
!function(){
	function copyProperty(prop, from, to){
		let desc = Object.getOwnPropertyDescriptor(from, prop);
		Object.defineProperty(to, prop, desc);
	}
	if ('classList' in HTMLElement.prototype && !('classList' in Element.prototype)) {  // ie11
		copyProperty('classList', HTMLElement.prototype, Element.prototype);
	}
	if ('contains' in HTMLElement.prototype && !('contains' in Element.prototype)) { // ie11
		copyProperty('contains', HTMLElement.prototype, Element.prototype);
	}
	if ('getElementsByClassName' in HTMLElement.prototype && !('getElementsByClassName' in Element.prototype)) { // ie11
		copyProperty('getElementsByClassName', HTMLElement.prototype, Element.prototype);
	}
}();

function nRoiSvg(option){
    const roi = this;    
    let wrap 			= typeof option.target == 'string' ? document.querySelector(option.target) : option.target,
        svgArea 		= option.svgArea ? option.svgArea : wrap.querySelector('.roi-board'),
        svg				= svgArea.querySelector('svg'),
        svgBox 			= svg.getBoundingClientRect(),
        ignoreMode      = option.ignoreMode == null ? true : option.ignoreMode,
        nowGroup,		// 현재 그리는 중이거나 선택된 svg group
        nowGroupNum,      // 현재 선택된 group 의 idx number
        drawState 		= 'ready', // 대기 : ready / 그리는 중 : ing / 그리기 종료 : end
        modifyState     = false,   // 수정모드 인지 판단 변수
        drawName,
        drawObjType, 	// 그리기 요소 타입 구분(poly/line)
        drawAreaType,	// 그리기 영역 타입 구분 (주시/제외/객체)
        drawNum = 0,	// 화면 내 그려진 요소 넘버링 변수 (화면 로드 후 계속 증가함)
    
        // 그리기 관련 변수
        clickNum 		= 0,
        maxPolyNum 		= option.maxPolyNum ? option.maxPolyNum : 12,
        maxLineNum 		= option.maxLineNum ? option.maxLineNum : 6,
        direction,		// 라인일 경우 - 화살표 방향관련 변수

        // 배열 / 유사배열 변수
        svgGroups,		// 화면에 그려진 svg g 요소 관련 유사배열
        defaultArr 		= new Object(), // 초기 입력 / 최종 출력 데이터용 object
        pointArr 		= new Array(), // 그리기용 임시 배열 (도형 좌표용)
        redoArr         = new Array(), // redo 용 임시 배열
        tempArr         = new Array(),
        circles         = null, // 모서리 circle 도형 관리용 변수
        
        // 타입별 카운트용 변수
        countFocus = 0,  // 화면 내 침탐 영역 갯수
        countExc   = 0,  // 화면 내 무시 영역 갯수
        countIgnore   = 0;  // 화면 내 객체무시 영역 갯수

    if(option.defaultArr != undefined) {
        defaultArr = JSON.parse(JSON.stringify(option.defaultArr)); // 배열 깊은 복사 (화면에 2개 이상 표현 시 이슈 제거)
    }

    /* ===== 모바일 이미지 비율관련 ========================================================== */
    // 영역 - 원본이미지 비율 계산
    let viewWid,
        bgImg       = wrap.querySelector('.img img'),
        imgWid  	= bgImg.naturalWidth ? bgImg.naturalWidth : 640,
        imgHei  	= bgImg.naturalHeight ? bgImg.naturalHeight : 480,
        toOriginRatio,
        toCalcRatio;

        viewWid = option.setWidth ? option.setWidth : wrap.offsetWidth;

        toOriginRatio   = imgWid / viewWid,
        toCalcRatio  = viewWid / imgWid;

    /* === callback 함수 ===================== */
    /*    
        activeStart    // 그리기 시작 시 실행되는 callback
        activeEnd      // esc키 클릭을 통한 그리기 완료 시 실행되는 callback
        activeClick    // svg 그리기 시 클릭할 때 마다 실행되는 callback - clicknum 전달
        checkUndo      // undo 기능 실행 시 마지막 요소만 남았을 때 실행 callback
        checkRedo      // redo 기능 실행 시 마지막 redo 일 경우 실행 callback
    */

     /* 배열 값 치환
        arr		 : 원본 배열
        tgArr 	 : 비율 변경 값 입력 될 배열
        type 	 : 'toOrigin' 일 경우 영역 좌표 > 이미지 좌표로 변경 / 값이 null 일 경우 이미지 좌표 > 영역 좌표로 변경
    */
    /*function arrayTrans(arr, type){
        let tgArr = new Array();
        for(let i=0; i<arr.length; i++){
            tgArr[i] = new Array();
            for(let o=0; o<arr[i].length; o++){
                type == 'toOrigin' ? tgArr[i][o] = Math.round(arr[i][o] * toOriginRatio) : tgArr[i][o] = Math.round(arr[i][o] * toCalcRatio);
            }
        }
        return tgArr;
    }*/
    // 배열 변환 - px 위치 <-> 이미지 비율위치
    function arrayTrans(arr, type){
        let tgArr = new Array();
        for(let i=0; i<arr.length; i++){
            tgArr[i] = new Array();
            for(let o=0; o<arr[i].length; o++){
                if(type == 'toOrigin'){
                    tgArr[i][0] = Math.round(arr[i][0] * toOriginRatio);
                    tgArr[i][1] = Math.round(arr[i][1] * toOriginRatio);
                } else {
                    tgArr[i][0] = Math.round(arr[i][0] * toCalcRatio);
                    tgArr[i][1] = Math.round(arr[i][1] * toCalcRatio);
                }
            }
        }
        return tgArr;
    }

    // 배열 복사
    function arrayCopy(arr){
        let tgArr = new Array();
        for(let i=0; i<arr.length; i++){
            tgArr[i] = new Array();
            for(let o=0; o<arr[i].length; o++){
                tgArr[i][0] = arr[i][0];
                tgArr[i][1] = arr[i][1];
            }
        }
        return tgArr;
    }

    /* ===== 공통함수 ================================================================================== */
    // 각 타입별 카운트 추가/삭제 함수
    function typeCountUpdate(){
        countFocus  = svgArea.querySelectorAll('svg > g').length;
        countExc    = svgArea.querySelectorAll('.except').length;
        countIgnore = svgArea.querySelectorAll('.ignore').length;
        countFocus  = countFocus - countExc - countIgnore;
    }
    // svg 및 리스트 항목 변경 확인
    function groupListUpdate(){
        svgGroups = svgArea.querySelectorAll('svg > g');
    }
    groupListUpdate(); // 2023-04-27 수정 : 기능 적용 시 svgGroups 를 한번 적용 - 영역이 아예 없을 경우 svgGroups 변수에 아무것도 담기지 않아 조건문 오류발생
    
    // 도형 삭제 기능
    function deleteObj() {
        if(nowGroup == null) return;
        nowGroup.parentNode.removeChild(nowGroup);
        delete defaultArr[nowGroupNum];
        typeCountUpdate();

        groupListUpdate();
    }
    // 문구에서 숫자만 추출(문구 내 연결된 숫자 1개만 추출가능)
    function getNum(tx){
        let val = Number(tx.replace(/[^0-9]/g, ''));
        return val;
    }

    // defaultArr 내 설정 변경 시 실행
    function nameChange(tgObj){
        Object.defineProperty(tgObj, 'changeName', {
            set: function(val) {
                this.name = val;
                let txG = nowGroup.querySelector('.nameTx rect'),
                    txT = nowGroup.querySelector('.nameTx text');
                txT.textContent = this.name;
                txG.setAttribute('width', txT.getBBox().width + 10);
            }
        });
    }
    // defaultArr 내 영역 종류 변경 시 실행
    function areaChange(tgObj){
        Object.defineProperty(tgObj, 'changeArea', {
            set: function(val) {
                this.areaType = val;
                nowGroup.classList.remove('focus');
                nowGroup.classList.remove('except');
                nowGroup.classList.remove('ignore');
                nowGroup.classList.add(this.areaType);
            }
        });
    }

    // 이름 위치 설정
    function namePosSet(tg, x, y){
        let newText = tg.querySelector('.nameTx'),
            txBox   = newText.getBoundingClientRect(),
            txX 	= x > (svgBox.width - txBox.width) ? x - txBox.width : x,
            txY 	= y > (svgBox.height - txBox.height) ? y - txBox.height : y;
        newText.setAttribute('transform', 'translate('+txX+','+txY+')');
    }


    /* ===== 화살표 관련 ================================================================================== */
    let methodArrow = {
        // 화살표 방향 반전
        arrowDirSet : function(tgObj, dir){
            let rotateObj = tgObj.querySelector('g.arrow-angle'),
                nowDir    = rotateObj.getAttribute('data-dir'),
                rotateVal;
            if(nowDir == dir) return;
            rotateVal = getNum(rotateObj.getAttribute('transform')) + 180;
            rotateObj.setAttribute('data-dir', dir);
            rotateObj.setAttribute('transform', 'rotate('+rotateVal+')');
        },
        //화살표 위치 및 각도 설정
        setArrow : function(obj, x, y, a){
            let rotateObj = obj.querySelector('g');
            obj.setAttribute('transform', 'translate('+x+','+y+')');
            if(direction == 1) a = a + 180;
            rotateObj.setAttribute('transform', 'rotate('+a+')');
            rotateObj.setAttribute('data-dir', direction);
        },
        // 각도 구하기 함수
        getAngle : function(x1, y1, x2, y2) {
            let rad = Math.atan2(y2 - y1, x2 - x1);
            return Math.round(Number((rad*180)/Math.PI));
        }, 
        // 화살표 위치 및 각도를 위한 배열값 추출
        arrowPosSet : function(arr, obj, dir){
            let startX, startY, endX, endY, aPosX, aPosY,
                len = arr.length;
                dir == null ? direction = 0 : direction = dir;
            if(len % 2 == 0){
                startX = arr[len / 2 - 1][0],
                startY = arr[len / 2 - 1][1],
                endX = arr[len / 2][0],
                endY = arr[len / 2][1];
                aPosX = ((endX - startX)/2) + startX;
                aPosY = ((endY - startY)/2) + startY;
            } else {
                let len2 = Math.floor(len / 2);
                startX = arr[len2 - 1][0],
                startY = arr[len2 - 1][1],
                endX = arr[len2 + 1][0],
                endY = arr[len2 + 1][1],
                aPosX = arr[len2][0],
                aPosY = arr[len2][1];
            }
            let aAngle = this.getAngle(startX, startY, endX, endY) + 180;
            this.setArrow(obj, aPosX, aPosY, aAngle);
        },
        // 화살표 추가
        addArrow : function(tg, array, dir){
            
            let newG1 = document.createElementNS("http://www.w3.org/2000/svg", 'g'),
                newG2 = document.createElementNS("http://www.w3.org/2000/svg", 'g'),
                newPl = document.createElementNS("http://www.w3.org/2000/svg", 'polygon'),
                newL = document.createElementNS("http://www.w3.org/2000/svg", 'line');

            tg.appendChild(newG1);

            newG1.classList.add('arrow');
            newG2.classList.add('arrow-angle');
            newG1.appendChild(newG2);

            newPl.setAttribute('points', '0,10 5,0 10,10');
            newPl.setAttribute('transform', 'translate(-5 -30)');
            newPl.setAttribute('fill', 'none');
            newPl.setAttribute('stroke', '#ff0000');
            newG2.appendChild(newPl);

            newL.setAttribute('x1','20');
            newL.setAttribute('y1','0');
            newL.setAttribute('x2','20');
            newL.setAttribute('y2','50');
            newL.setAttribute('transform','translate(-20 -25)');
            newL.setAttribute('stroke','#ff0000');
            newG2.appendChild(newL);

            let tgArrow = tg.querySelector('.arrow');
            this.arrowPosSet(array, tgArrow, dir);
            //this.arrowDirSet(tgArrow, dir);
        },
        arrowUpdate : function(tg){
            let tgObj       = tg.tagName == 'g' ? tg : tg.parentNode,
                tgArrow     = tgObj.querySelector('.arrow'),
                chkDir      = defaultArr[tgObj.getAttribute('data-num')],
                dir         = chkDir ? defaultArr[tgObj.getAttribute('data-num')].direction : 0;
            
            this.arrowPosSet(pointArr, tgArrow, dir);
            //this.arrowDirSet(tgArrow, dir);
        }
    }

    /* ===== 도형 그리기 관련 ================================================================================== */
    // svg 에 name 요소 추가
    function nameTextAdd(tgObj, name, x, y){
        if(tgObj.querySelector('.nameTx')) return;
        let newG = document.createElementNS("http://www.w3.org/2000/svg", 'g'),
            newR = document.createElementNS("http://www.w3.org/2000/svg", 'rect'),
            newT = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        newG.classList.add('nameTx');
        newR.setAttribute('x', '0');
        newR.setAttribute('y', '0');
        newR.setAttribute('height', '20');
        newR.setAttribute('y', '0');
        newT.setAttribute('x', '4');
        newT.setAttribute('y', '15');
        newT.textContent = name;
        newG.appendChild(newR);
        newG.appendChild(newT);
        tgObj.appendChild(newG);
        newR.setAttribute('width', newT.getBBox().width + 10);
        namePosSet(tgObj, x, y);
    }

    // 도형 선택 시 nowGroup 에 sel 클래스 추가 및 위치이동
    function setObjectClass(){
        if(svgGroups != undefined){
            svgGroups.forEach(function(obj){
                obj.classList.remove('sel');
            });
        }
        nowGroup.classList.add('sel');
        svg.appendChild(nowGroup);
    }

    // 도형 선택 기능 부여
    function objectClick(obj){
        obj.addEventListener('click', function(){
            if(drawState != 'ready' || modifyState == true) return;
            nowGroupNum = obj.getAttribute('data-num');
            nowGroup = obj;
            setObjectClass();

            // 선택 시 콜백함수 실행(현재 선택된 num 전달)
            if(typeof option.objSelChk === 'function'){
                option.objSelChk(nowGroupNum);
            }
        });
    }
    
    // svg 영역 클릭 시 기존 선택 도형 선택 해제
    function selectClear(e){
        if(e.target != svg) return;
        if(svgGroups != undefined){ // 2021-11-29 : 최초 화면 영역 없을 경우 에러 제거
            svgGroups.forEach(function(svg){
                svg.classList.remove('sel');
            });
            nowGroupNum = null;
            nowGroup = null;
        }
        // 선택 시 콜백함수 실행(현재 선택된 num 전달)
        if(typeof option.objSelChk === 'function'){
            option.objSelChk(nowGroupNum);
        }
    }

    // 도형 그리기 완료 시 defaultArr 에 값 넣기
    function valuePush(objType){ 
        let dumObj = new Object();
        dumObj.name = drawName;
        dumObj.objType = drawObjType;
        dumObj.areaType = drawAreaType;
        dumObj.points = arrayTrans(pointArr, 'toOrigin');
        if(objType == 'line') dumObj.direction = direction;

        defaultArr[drawNum] = dumObj;
        nameChange(defaultArr[drawNum]);
        areaChange(defaultArr[drawNum]);
    }

    // svg 내 신규 그룹 생성
    function cerateGroup(){
        let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        nowGroup = newElement;
        nowGroup.classList.add(drawAreaType);
        nowGroup.classList.add('drawing');
        svg.appendChild(nowGroup);
    }
    
    // 점 그리기 함수
    function drawCircleDot(pX, pY){
        let newDot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        newDot.setAttribute('r', 5);
        newDot.setAttribute('cx',pX);
        newDot.setAttribute('cy',pY);
        nowGroup.appendChild(newDot);
    }
    // 점 전체 리셋 함수 (기존 점 모두 삭제 + pointArr 기준 재 생성)
    function circleReDraw(){
        let cirs    = nowGroup.querySelectorAll('circle');
        cirs.forEach(function(cir){ // 2022-10-26 수정
            nowGroup.removeChild(cir);
        });
        for(let i=0; i<pointArr.length; i++){
            drawCircleDot(pointArr[i][0], pointArr[i][1]);
        }
        circles     = nowGroup.querySelectorAll('circle');
    }

    // 라인 그리기 함수	
    function drawPolyStroke(obj){
        let pathVal = '';
        pathVal += pointArr[0][0] +','+ pointArr[0][1];
        for(let i=1; i<pointArr.length; i++){
            pathVal += ' ' + pointArr[i][0] +','+ pointArr[i][1];
        }
        obj.setAttribute('points', pathVal);
        obj.setAttribute('fill-rule', 'nonzero');
    }

    // 도형변환 함수 (polygon <-> polyline)
    // polyline 을 polygon 으로 변경 시 : changePolyType('polygon');
    function changePolyType(tgType){
        let nowType = tgType == 'polygon' ? 'polyline' : 'polygon';
        nowGroup.removeChild(nowGroup.querySelector(nowType));
        let newPoly = document.createElementNS("http://www.w3.org/2000/svg", tgType);
        nowGroup.insertBefore(newPoly, nowGroup.firstChild);
        drawPolyStroke(nowGroup.querySelector(tgType));
    }

    // esc 키 관련 함수
    function keyCheck(e){ 
        if (e.keyCode == 27) {
            drawAreaEnd();
        }
    }

    // 그리기 영역 초기화 함수
    function drawReset(){
        clickNum = 0;
        svg.removeEventListener('click',drawAreaStart);
        svg.addEventListener('click', selectClear);
        document.removeEventListener('keydown', keyCheck); // 2023-04-14 추가 : 그리기 상태 아닐경우 esc 키 기능 제거
        pointArr = [];
        nowGroup = null;
        drawState = 'ready';
    }

    // 도형 그린 후 적용 취소
    function drawCancel(){
        //if(clickNum > 0) svg.removeChild(nowGroup);
        if(nowGroup) svg.removeChild(nowGroup); // 2025-06-24
        drawReset(); // 그리기 리셋
    }

    // Undo 함수
    function lastDotUndo(){
        if(clickNum > 0) {
            pointArr.pop();
            clickNum--;
            circles = nowGroup.querySelectorAll('circle');
            nowGroup.removeChild(circles[circles.length - 1]);
            if(pointArr.length > 0) drawPolyStroke(nowGroup.querySelector('polygon, polyline'));
            if(typeof option.checkUndo === 'function') option.checkUndo(clickNum);
        }
    }

    // Redo 기능
    function lastDotRedo(){
        if(pointArr.length == redoArr.length) return;
        pointArr.push(redoArr[clickNum]);
        drawCircleDot(pointArr[clickNum][0], pointArr[clickNum][1]);
        drawPolyStroke(nowGroup.querySelector('polygon, polyline'));
        clickNum++;
        if(typeof option.checkRedo === 'function') option.checkRedo(clickNum, redoArr.length);
    }

    function drawReverse(){
        pointArr = pointArr.reverse();
        drawPolyStroke(nowGroup.querySelector('polygon, polyline'));
        methodArrow.arrowUpdate(nowGroup.querySelector('polygon, polyline'));
        circles.forEach(function(cir, idx){ // 2022-10-26 수정
            cir.setAttribute('cx', pointArr[idx][0]);
            cir.setAttribute('cy', pointArr[idx][1]);
        });
        namePosSet(nowGroup, pointArr[0][0], pointArr[0][1])
    }

    // 그리기 시작
    function drawAreaStart(e){
        let posX = e.layerX,
            posY = e.layerY;
        
        let maxNum = drawObjType == 'line' ? maxLineNum : maxPolyNum;

        if(clickNum < 1) {
            cerateGroup();
            
            let newPoly = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
            nowGroup.appendChild(newPoly);
        }
        if(e.target == nowGroup.querySelector('circle')) { // 최초 circle 클릭 시 그리기 종료
            drawAreaEnd();
            return;
        }
        pointArr[clickNum] = new Array();
        pointArr[clickNum][0] = posX;
        pointArr[clickNum][1] = posY;

        if(pointArr.length < redoArr.length) {
            redoArr = arrayCopy(pointArr);
        } else {
            redoArr[clickNum] = new Array();
            redoArr[clickNum][0] = posX;
            redoArr[clickNum][1] = posY;
        }

        clickNum++;
        if(clickNum < maxNum + 1) {
            drawPolyStroke(nowGroup.querySelector('polyline'));
            drawCircleDot(posX, posY);
            // s : 2025-05-12 선교차
            if(checkPolygonLineIntersectionAtIndex(pointArr, pointArr.length - 1, true)) {
                alert('선이 교차되는 영역은 그릴 수 없습니다.');
                lastDotUndo();
            }
            // e : 2025-05-12 선교차
            if(clickNum == maxNum) drawAreaEnd();
        }

        // 클릭 시 콜백(clicknum 전달)
        if(typeof option.activeClick === 'function') option.activeClick(clickNum);
    }

    // 그리기 종료 함수
    function drawAreaEnd(){
        if(drawObjType == 'line') {
            if(clickNum < 2) { // 라인 포인트 갯수가 2개 이하일 때 리셋
                alert('영역 그리기가 완료되지 않았습니다. \n 최소 2개 이상 점을 찍어 영역을 그려주세요.');
                return false;
            } else methodArrow.addArrow(nowGroup, pointArr, 0);
        } else {
            if(clickNum < 3) { // 폴리곤 포인트 갯수가 3개 이하일 때 리셋
                alert('영역 그리기가 완료되지 않았습니다. \n 최소 3개 이상 점을 찍어 영역을 그려주세요.');
                return false;
            } else changePolyType('polygon');
        }

        if(modifyState == false) {
            nowGroup.setAttribute('data-num', drawNum); // 현재 그리기 요소에 num 추가
            nameTextAdd(nowGroup, drawName, pointArr[0][0], pointArr[0][1]); // 이름 text 추가
            if(typeof option.activeEnd === 'function') option.activeEnd();
        } else {            
            if(typeof option.activeModEnd === 'function') option.activeModEnd();
        }
        
        svg.removeEventListener('click',drawAreaStart);
        document.removeEventListener('keydown', keyCheck);
        modifySet();
        
        drawState = 'end';
    }
    
    // 도형 그린 후 적용 확인
    function drawConfirm(addname){
        objectClick(nowGroup); // 현재 그리기 요소에 클릭 기능 추가
        valuePush(drawObjType); // 최종 결과함수(defaultArr)에 해당 도형관련 값 추가
        
        if(addname) defaultArr[drawNum].changeName = addname;

        typeCountUpdate();       // 타입별 카운트 변수 업데이트
        groupListUpdate(); // svg 내 요소 리스트 업데이트
        drawNum++;

        nowGroup.classList.remove('drawing');
        modifyUnSet();
        drawReset(); // 그리기 리셋
    }

    /* ===== 도형 수정 ================================================================================== */
    let gap_t, gap_l, gap_r, gap_b,
        last_cir, // 마지막 수정한 cir (선분교차 관련)
        last_cir_idx, // 마지막 수정한 cir index (선분교차 관런)
        last_cir_pos = new Array(), // 마지막 수정한 cir 의 기존 pos 값 (선분교차 관련)
        tempModArr = new Array();

    // 이동 제한거리 계산 - x, y 좌표중 최소,최대값 산출 > 이동 가능 범위 계산
    function calcModLimitGap(arr){
        let arrFirst    = arr.map(function(el){ return el[0]}), // 각 포인트 X값 배열
            arrSec      = arr.map(function(el){ return el[1]}); // 각 포인트 Y값 배열
        gap_t = Math.min.apply('null', arrSec) - 1;
        gap_b = svgBox.height - Math.max.apply('null', arrSec);
        gap_l = Math.min.apply('null', arrFirst) - 1;
        gap_r = svgBox.width - Math.max.apply('null', arrFirst);
    }

    // 각 모서리 circle - mousemove 함수 / 2022-11-24 수정 : IE - svg 영역 외로 이동 시 제한 추가
    function circleMove(e, cir, tgPoly, idx){
        let tgX, tgY;

        if(e.layerX > svgBox.width) tgX = svgBox.width;
        else if(e.layerX < 0) tgX = 0;
        else tgX = e.layerX;

        if(e.layerY > svgBox.height) tgY = svgBox.height;
        else if(e.layerY < 0) tgY = 0;
        else tgY = e.layerY;

        circleMove_draw(cir, tgPoly, idx, tgX, tgY);
    }

    // 이동된 모서리 circle 관련 다시 그리기 함수
    function circleMove_draw(cir, tgPoly, idx, tgX, tgY){
        cir.setAttribute('cx', tgX);
        cir.setAttribute('cy', tgY);
        pointArr[idx][0] = tgX;
        pointArr[idx][1] = tgY;
        drawPolyStroke(tgPoly);
        if(tgPoly.tagName == 'polyline') methodArrow.arrowUpdate(tgPoly);
        if(idx == 0) {
            namePosSet(nowGroup, tgX, tgY);
        }
    }

    // 영역 자체 이동 함수
    function svgMove(e, tgPoly, cir, mx, my, temp){
        let gapX = e.layerX - mx,
            gapY = e.layerY - my;

        let tX, tY;
        if(gapX > gap_r) tX = gap_r;
        else if(gapX < -gap_l) tX = -gap_l;
        else tX = gapX;
        if(gapY > gap_b) tY = gap_b;
        else if(gapY < -gap_t) tY = -gap_t;
        else tY = gapY;

        for(let i=0; i<pointArr.length; i++){
            pointArr[i][0] = temp[i][0] + tX;
            pointArr[i][1] = temp[i][1] + tY;
        }
        cir.forEach(function(item, idx){
            item.setAttribute('cx', pointArr[idx][0]);
            item.setAttribute('cy', pointArr[idx][1]);
        });
        namePosSet(nowGroup, pointArr[0][0], pointArr[0][1]);
        drawPolyStroke(tgPoly);
        if(tgPoly.tagName == 'polyline') methodArrow.arrowUpdate(tgPoly); // 2022-10-26 추가
    }

    // svg 에 설정된 이벤트 전체 제거 // 2025-05-12 선교차 체크 추가
    function svgEventRemove(e){
        svg.removeSvgListeners();
        if(e.target.tagName == 'polygon' || !last_cir_idx) return;
        if(checkPolygonLineIntersectionAtIndex(pointArr, last_cir_idx)) {
            alert('선이 교차되도록 수정할 수 없습니다.');
            circleMove_draw(last_cir, nowGroup.querySelector('polygon, polyline'), last_cir_idx, last_cir_pos[0], last_cir_pos[1]);
        }
    }

    // nowGroup 수정모드 적용
    function modifySet(){
        circles = nowGroup.querySelectorAll('circle');
        let tgPoly = nowGroup.querySelector('polygon, polyline');
        circles.forEach(function(cir, idx){
            cir.onSvgEvent('mousedown', function(){
                // s : 선분교차
                last_cir = cir;
                last_cir_idx = idx;
                last_cir_pos = [pointArr[idx][0], pointArr[idx][1]];
                // e : 선분교차
                svg.onSvgEvent('mousemove', function(e){ circleMove(e, cir, tgPoly, idx) });
                document.addEventListener('mouseup', svgEventRemove);
            });
        });
        tgPoly.onSvgEvent('mousedown', function(e){
            let poly    = this,
                mX      = e.layerX,
                mY      = e.layerY;
            tempArr = arrayCopy(pointArr);
            calcModLimitGap(tempArr);
            svg.onSvgEvent('mousemove', function(e){ svgMove(e, poly, circles, mX, mY, tempArr) });
            document.addEventListener('mouseup', svgEventRemove);
        });        
        svg.removeEventListener('click', selectClear);
    }
    
    // 수정모드 해제
    function modifyUnSet(){
        let circles = nowGroup.querySelectorAll('circle'),
            poly    = nowGroup.querySelector('polygon, polyline');
            
        circles.forEach(function(cir){
            cir.removeSvgListeners();
        });
        poly.removeSvgListeners();
    }

    // 수정 취소 관련 - 도형 기존대로 리셋(다시 그리기 리셋 포함)
    function returnModifyCnt(){
        let tgPoly = nowGroup.querySelector('polygon, polyline'),
            nameBox = nowGroup.querySelector('.nameTx');

        nameBox.setAttribute('transform', 'translate('+pointArr[0][0]+','+pointArr[0][1]+')');
        circleReDraw();
        drawPolyStroke(tgPoly);
        if(drawObjType == 'line') methodArrow.arrowUpdate(tgPoly);
        else {
            if(nowGroup.querySelector('polyline')) {
                changePolyType('polygon');
            }
        }
        svg.removeEventListener('click',drawAreaStart);
        drawState = 'ready';
    }

    // 수정 취소 관련 - 도형 리셋(move 내역만)
    function returnModifyMove(){
        let tgPoly = nowGroup.querySelector('polygon, polyline'),
            nameBox = nowGroup.querySelector('.nameTx');

        nameBox.setAttribute('transform', 'translate('+pointArr[0][0]+','+pointArr[0][1]+')');
        circles.forEach(function(cir, idx){
            cir.setAttribute('cx',pointArr[idx][0]);
            cir.setAttribute('cy',pointArr[idx][1]);
        });
        drawPolyStroke(tgPoly);
        if(drawObjType == 'line') methodArrow.arrowUpdate(tgPoly);
    }

    //=== 기존 데이터 그리기 ================================================================================== //
    function dataDraw(){
        let dataDrawPoly = function(arr, type, name, dir){ // polygon or polyline 생성
            let newPoly;
            type == 'line' ? newPoly = document.createElementNS("http://www.w3.org/2000/svg", 'polyline') : newPoly = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');
            nowGroup.appendChild(newPoly);
            
            let pathVal = '';
            pathVal += arr[0][0] +','+ arr[0][1];
            drawCircleDot(arr[0][0], arr[0][1]);
            for(let i=1; i<arr.length; i++){
                pathVal += ' ' + arr[i][0] +','+ arr[i][1];
                drawCircleDot(arr[i][0], arr[i][1]);
            }
            newPoly.setAttribute('points', pathVal);
            
            nameTextAdd(nowGroup, name, arr[0][0], arr[0][1]); // 이름 text 추가

            if(type == 'line') {
               methodArrow.addArrow(nowGroup, arr, dir);
            }

        }, objData = function(obj){ // svg 에 그룹 생성
            let type = obj.objType,
                name = obj.name;

            let newElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
            nowGroup = newElement;
            nowGroup.classList.add(obj.areaType);
            svg.appendChild(nowGroup);
            nowGroup.setAttribute('data-num', drawNum);
            typeCountUpdate();
            
            groupListUpdate();
            drawNum++;

            pointArr = arrayTrans(obj.points);

            type == 'line' ? dataDrawPoly(pointArr, type, name, obj.direction) : dataDrawPoly(pointArr, type, name);
            nowGroup = null;
        }
        
        let keysLen = Object.keys(defaultArr).length;
        for(let d=0; d<keysLen; d++){
            objData(defaultArr[d]);
            nameChange(defaultArr[d]);
            areaChange(defaultArr[d]);
        }

        // 탐지 제외 관련 설정(탐지제외 설정화면일 경우만 탐지제외 영역 선택 가능)
        svgGroups.forEach(function(obj){
            if(ignoreMode == true) objectClick(obj);
            else {
                if(!obj.classList.contains('ignore')) objectClick(obj);
            }
        });
    }
    if(Object.keys(defaultArr).length > 0) dataDraw();


    //=== 외부 호출 함수에서 호출할 내부함수 ================================================================================== //
    // 새로 그리기
    function drawStartFunc(area, obj, name){
        drawReset();
        drawAreaType = area;
        drawObjType  = obj;
        drawName = name;
        if(obj == 'line') direction = 0;

        svg.addEventListener('click',drawAreaStart);
        svg.removeEventListener('click', selectClear);
        document.addEventListener('keydown', keyCheck);

        drawState = 'ing';
        if(typeof option.activeStart === 'function') option.activeStart();
    }

    // 기존 도형 다시 그리기
    function reDrawStartFunc(){
        if(drawState == 'ing') return;
        if(drawObjType == 'poly') changePolyType('polyline');
        
        svg.addEventListener('click',drawAreaStart);
        svg.removeEventListener('click', selectClear);
        document.addEventListener('keydown', keyCheck);

        modifyUnSet();
        clickNum = nowGroup.querySelectorAll('circle').length;
        drawState = 'ing';
        redoArr = arrayCopy(pointArr);
        if(typeof option.activeStart === 'function') option.activeStart();
    }    

    //=== 외부 호출용 함수 ================================================================================== //

    // 도형추가 --------------------
    // 새로 그리기 실행
    roi.drawStart = function(area, obj, name){
        if(drawState == 'ing' || drawState == 'end'){ // 2022-11-24 수정 : 도형 완성 후에도 리셋 가능
            if(clickNum == 0) return; // 2022-11-24 추가 : 리셋 후 클릭횟수 없을 경우 동작 X
            nlayerConfirm(function(){
                drawCancel();
                drawStartFunc(area, obj, name);
            }, '', '그리고 있는 영역이 있습니다.<br>삭제 후 다시 그리시겠습니까?');
        } else {
            drawStartFunc(area, obj, name);
            if(svgGroups.length < 1 || svg.querySelector('.sel') == null) return; // 2022-10-17 조건 추가
            svgGroups.forEach(function(svg){
                svg.classList.remove('sel');
            });
        }
    }
    // 새로 그리기 컨펌
    roi.addConfirm = function(addname){
        if(nowGroup == null) return;
        drawConfirm(addname);
    }
    // 새로 그리기 취소
    roi.addCancel = function(){
        drawCancel();
    }
    roi.drawEnd = function(){
        drawAreaEnd();
    }

    // 도형 수정 -------------------
    // 수정 시작
    roi.modifyOn = function(num){
        nowGroupNum = num;
        nowGroup = svg.querySelector('[data-num="'+nowGroupNum+'"]');
        nowGroup.firstChild.tagName == 'polygon' ? drawObjType = 'poly' : drawObjType = 'line';
        pointArr = arrayTrans(defaultArr[nowGroupNum].points);
        tempModArr = arrayCopy(pointArr);
        setObjectClass();
        modifySet();
        
        nowGroup.classList.add('modify');
        modifyState = true;
    }    
    // 수정 컨펌
    roi.modifyConfirm = function(){
        defaultArr[nowGroupNum].points = arrayTrans(pointArr, 'toOrigin');
        
        nowGroup.classList.remove('modify');
        modifyState = false;
        
        modifyUnSet();
        drawReset();
    }
    // 수정 취소
    roi.modifyCancel = function(){
        pointArr = [];
        pointArr = arrayCopy(tempModArr);
        returnModifyCnt();
        
        nowGroup.classList.remove('modify');
        modifyState = false;

        tempModArr = [];

        modifyUnSet();
        drawReset();
    }

    // 수정 - 도형 다시그리기 (그리기모드 활성)
    roi.modReDraw = function(){
        reDrawStartFunc();
    }

    // 수정 - 수정한 도형 원래대로 (수정모드 유지)
    roi.modMoveReturn = function(){
        pointArr = [];
        pointArr = arrayCopy(tempModArr);
        returnModifyMove();
    }

    // 기타 도형 제어 ------------------
    // 이름 변경 함수
    roi.modifyName = function(name){
        if(nowGroupNum == null) {
            alert('영역을 선택해주세요.');
            return;
        }
        defaultArr[nowGroupNum].changeName = name;
    }
    // 영역 타입 변경 함수
    roi.modifyArea = function(area){
        if(nowGroupNum == null) {
            alert('영역을 선택해주세요.');
            return;
        }
        defaultArr[nowGroupNum].changeArea = area;
    }
    // 도형 선택
    roi.objectSelect = function(num){
        if(modifyState == true) return;
        nowGroupNum = num;
        nowGroup = svg.querySelector('[data-num="'+nowGroupNum+'"]');
        setObjectClass();
    }
    // 도형선택 해제
    roi.objectSelClear = function(){
        if(svgGroups == undefined) return; // 영역 없을 경우 미실행 수정
        nowGroupNum = null;
        nowGroup = null;
        svgGroups.forEach(function(obj){
            obj.classList.remove('sel');
        });
    }
    // 도형 삭제
    roi.objectDelete = function(num){
        nowGroupNum = num;
        nowGroup = svg.querySelector('[data-num="'+nowGroupNum+'"]');
        deleteObj();
        modifyState = false; // 2024-04-05 추가 (수정상태에서 삭제할 경우 - 리스트가 리로드 안될 경우에만 필요함 - 개발에선 무관)
    }

    // 마지막 클릭 취소 호출
    roi.clickUndo = function(){
        lastDotUndo();
    }
    roi.clickRedo = function(){
        lastDotRedo();
    }

    // 화살표 반전 - 도형 배열 자체 반전을 통한 화살표 반전
    roi.drawReverse = function(){
        drawReverse();
    }
    
    // 기타 -------------------
    // 영역 타입 갯수 재 확인
    roi.updateTypeNum = function(){
        typeCountUpdate();
    }
    // 영역 타입 관련 갯수제한 체크 확인
    roi.getTypeNum = function(type){
        let returnVal;
        switch (type) {
            case 'focus' : 
                returnVal = countFocus;
                break;
            case 'except' : 
                returnVal = countExc;
                break;
            case 'ignore' :
                returnVal = countIgnore;
                break;
        }
        return returnVal;
    }
    // 그리기 상태 확인
    roi.getDrawState = function(){
        return drawState;
    }
    // drawNum (마지막 or 신규 도형 번호) 호출
    roi.getAllCount = function(){
        return drawNum;
    }
    // 데이터 Object 호출
    roi.getData = function(){
        return defaultArr;
    }
    // clickNum 호출
    roi.getClickNum = function(){
        return clickNum;
    }

    // 데이터 변경 후 다시 그리기
    roi.reDraw = function(data){
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        if(data != undefined) {
            defaultArr = JSON.parse(JSON.stringify(data));
        }
        drawNum = 0;
        countFocus = 0;
        countExc = 0;
        countIgnore = 0;
        svgBox = svg.getBoundingClientRect();
        if(Object.keys(defaultArr).length > 0) dataDraw();
    }

    // === 초기 실행 ================================================================================== //

    svg.addEventListener('click', selectClear);
}
