"use strict";

function nRoiSvg(option){
    var wrap 			= typeof option.target == 'string' ? document.querySelector(option.target) : option.target,
        svgArea 		= option.svgArea ? option.svgArea : wrap.querySelector('.board'),
        svg				= svgArea.querySelector('svg'),
        svgBox 			= svg.getBoundingClientRect(),
        nowDrawG,		// 현재 그리는 중 svg g
        drawState 		= false,
        drawName,
        drawObjType, 	// 그리기 요소 타입 구분(poly/line)
        drawAreaType,	// 그리기 영역 타입 구분 (주시/제외/객체)
        drawNum = 0,	// 화면 내 그려진 요소 넘버링 변수 (화면 로드 후 계속 증가함)
        selectObj,      // 수정/삭제를 위해 선택된 obj
        selectNum,		// 수정/삭제를 위해 선택된 obj의 data-num
    
        // 그리기 관련 변수
        clickNum 		= 0,
        maxPolyNum 		= option.maxPolyNum ? option.maxPolyNum : 12,
        maxLineNum 		= option.maxLineNum ? option.maxLineNum : 6,
        direction,		// 라인일 경우 - 화살표 방향관련 변수

        // 배열 / 유사배열 변수
        svgObjs,		// 화면에 그려진 svg g 요소 관련 유사배열
        defaultArr 		= option.defaultArr ? option.defaultArr : new Object(), // 초기 입력 / 최종 출력 데이터용 object
        pointArr 		= new Array(), // 그리기용 임시 배열 (도형 좌표용)
        
        // 타입별 카운트용 변수
        countLimit = 5,  // 영역별 최대 갯수
        countFocus = 0,  // 화면 내 침탐 영역 갯수
        countExc   = 0,  // 화면 내 무시 영역 갯수
        countObj   = 0;  // 화면 내 객체무시 영역 갯수

    /* ===== 공통함수 ========================================================== */
    var commonFunc = {
        // 각 타입별 카운트 추가/삭제 함수
        typeCountPlus : function(type){
            switch (type) {
                case 'focus' : 
                    countFocus++; 
                    break;
                case 'except' : 
                    countExc++; 
                    break;
                case 'obj' :
                    countObj++; 
                    break;
            }
        }, typeCountMinus : function(type){
            switch (type) {
                case 'focus' : 
                    countFocus--; 
                    break;
                case 'except' : 
                    countExc--; 
                    break;
                case 'obj' :
                    countObj--; 
                    break;
            }
        },
        // svg 및 리스트 항목 변경 확인
        listUpdate : function(){
            svgObjs = svgArea.querySelectorAll('svg > g');
        },
        // 도형 삭제 기능
        deleteObj : function() {
            if(selectNum == null) return;
            selectObj.parentNode.removeChild(selectObj);
            commonFunc.typeCountMinus(defaultArr[selectNum].area);
            delete defaultArr[selectNum];

            commonFunc.listUpdate();
            console.log(defaultArr);
        },
        // 문구에서 숫자만 추출(문구 내 연결된 숫자 1개만 추출가능)
        getNum : function(tx){
            var val = Number(tx.replace(/[^0-9]/g, ''));
            return val;
        }
    }

    // defaultArr 내 설정 변경 시 실행
    function nameChange(tgObj){
        Object.defineProperty(tgObj, 'changeName', {
            set: function(val) {
                this.name = val;
                selectObj.querySelector('text').textContent = this.name;
            }
        });
    }
    // defaultArr 내 영역 종류 변경 시 실행
    function areaChange(tgObj){
        Object.defineProperty(tgObj, 'changeArea', {
            set: function(val) {
                this.area = val;
                selectObj.classList.remove('focus', 'except', 'obj');
                selectObj.classList.add(this.area);
            }
        });
    }

    // 화살표 ----------------------------------------------------
    var methodArrow = {
        // 화살표 방향 반전
        arrowDirSet : function(tgObj, dir){
            var rotateObj = tgObj.querySelector('g'),
                nowDir    = rotateObj.getAttribute('data-dir'),
                rotateVal = nowDir = dir ? commonFunc.getNum(rotateObj.style.transform) : commonFunc.getNum(rotateObj.style.transform) + 180;
            rotateObj.style.transform = 'rotate('+rotateVal+'deg)';
        },
        //화살표 위치 및 각도 설정
        setArrow : function(obj, x, y, a){
            var rotateObj = obj.querySelector('g');
            obj.setAttribute('transform', 'translate('+x+','+y+')');
            rotateObj.style.transform = 'rotate('+a+'deg)';
            rotateObj.setAttribute('data-dir', direction);
            obj.style.display = 'block';
        },
        // 각도 구하기 함수
        getAngle : function(x1, y1, x2, y2) {
            var rad = Math.atan2(y2 - y1, x2 - x1);
            return Math.round(Number((rad*180)/Math.PI));
        }, 
        // 화살표 위치 및 각도를 위한 배열값 추출
        arrowPosSet : function(arr, obj, dir){
            var startX, startY, endX, endY, aPosX, aPosY,
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
                var len2 = Math.floor(len / 2);
                startX = arr[len2 - 1][0],
                startY = arr[len2 - 1][1],
                endX = arr[len2 + 1][0],
                endY = arr[len2 + 1][1],
                aPosX = arr[len2][0],
                aPosY = arr[len2][1];
            }
            var aAngle = this.getAngle(startX, startY, endX, endY) + 180;
            this.setArrow(obj, aPosX, aPosY, aAngle);
        },
        // 화살표 추가
        addArrow : function(tg, array, dir){
            var dirTx = dir == null ? 0 : dir;
            tg.insertAdjacentHTML('beforeend', '<g class="arrow"><g class="arrow-angle"><polyline points="0,20 20,0 40,20" transform="translate(-20 -40)" fill="none" stroke="#ff0000"></polyline><line x1="20" y1="0" x2="20" y2="80" transform="translate(-20 -40)" stroke="#ff0000"></line></g></g>');
            // <text x="-10" y="55">('+dirTx+')</text>
            var tgArrow = tg.querySelector('.arrow');
            this.arrowPosSet(array, tgArrow, dir);
            this.arrowDirSet(tgArrow, dir);
        },
        arrowUpdate : function(tg){
            var tgObj       = tg.tagName == 'g' ? tg : tg.parentNode,
                tgArrow     = tgObj.querySelector('.arrow'),
                dir         = defaultArr[tgObj.getAttribute('data-num')].direction;
            
            this.arrowPosSet(pointArr, tgArrow, dir);
            this.arrowDirSet(tgArrow, dir);
        }
    }


    // 꼭지점 이동 관련
    /*var modifyPoly;
    var dotMove = function(e, obj, tgPoly, idx){
        var tgX = e.pageX,
            tgY = e.pageY;
        obj.setAttribute('cx', tgX);
        obj.setAttribute('cy', tgY);
        tgPoly.points[idx].x = tgX;
        tgPoly.points[idx].y = tgY;
    }, dotUp = function(){
        svg.removeSvgListeners();
        pointArr = [];
        for(var p=0; p<modifyPoly.points.length; p++){
            pointArr[p] = new Array();
            pointArr[p][0] = modifyPoly.points[p].x;
            pointArr[p][1] = modifyPoly.points[p].y;
        }
        defaultArr[selectNum].points = pointArr;
        if(modifyPoly.tagName == 'polyline') methodArrow.arrowUpdate(modifyPoly);
        document.removeEventListener('mouseup', dotUp);
        var nameTx = selectObj.querySelector('.nameTx');
        nameTx.setAttribute('transform', 'translate('+pointArr[0][0]+','+pointArr[0][1]+')');
    },
    dotOn = function(obj){
        var dots 		= obj.querySelectorAll('circle');
        modifyPoly 		= obj.querySelector('polygon') ? obj.querySelector('polygon') : obj.querySelector('polyline');
        
        Array.prototype.forEach.call(dots, function(dot, idx){
            var downChk = false;

            dot.onSvgEvent('mousedown', function(e){
                downChk = true;
                svg.onSvgEvent('mousemove', function(e){dotMove(e, dot, modifyPoly, idx)});
                document.addEventListener('mouseup', dotUp);
            });
        });

    }, 
    dotOff = function(){
        var cirs = svg.querySelectorAll('circle');
        Array.prototype.forEach.call(cirs, function(cir){
            cir.removeSvgListeners();
        });
    }*/


    // svg 에 name 요소 추가
    var nameTextAdd = function(tgObj, name, x, y){
        tgObj.insertAdjacentHTML('beforeend', '<g class="nameTx"><rect x="0" y="0"></rect><text x="4" y="14">'+name+'</text></g>');
        var newText = tgObj.querySelector('.nameTx'),
            txX 	= x > (svgBox.width - 100) ? x - 100 : x,
            txY 	= y > (svgBox.height - 20) ? y - 20 : y;
        newText.setAttribute('transform', 'translate('+txX+','+txY+')');
    }

    // 도형 선택 시 클래스 제어
    var setObjectClass = function(){
        Array.prototype.forEach.call(svgObjs, function(obj){
            obj.classList.remove('sel');
            //dotOff();
        });
        selectObj.classList.add('sel');
        svg.appendChild(selectObj);
        //dotOn(selectObj);
    }, 
    // 도형 선택 기능 부여
    objectClick = function(obj){
        obj.addEventListener('click', function(){
            if(drawState == true) return;
            selectNum = obj.getAttribute('data-num');
            selectObj = svg.querySelector('[data-num="'+selectNum+'"]');
            setObjectClass();

            // 선택 시 콜백함수 실행(현재 선택된 num 전달)
            if(typeof option.objSelChk === 'function'){
                option.objSelChk(selectNum);
            }
        });
    }
    // 도형 그리기 완료 시 defaultArr 에 값 넣기
    var valuePush = function(objType){ 
        var dumObj = new Object();
        dumObj.name = 'new Object' + drawNum;
        dumObj.type = drawObjType;
        dumObj.area = drawAreaType;
        dumObj.points = pointArr;
        if(objType == 'line') dumObj.direction = direction;

        defaultArr[drawNum] = dumObj;
    }

    // svg 내 신규 그룹 생성
    var drawGroup = function(){
        var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        nowDrawG = newElement;
        nowDrawG.classList.add(drawAreaType);
        svg.appendChild(nowDrawG);
    },
    // 그리기 취소 함수
    drawReset = function (){
        clickNum = 0;
        svg.removeEventListener('click',drawPolyStart);
        svg.removeEventListener('click',drawLineStart);
        pointArr = [];
        drawState = false;
    },
    // 그리기 종료 함수
    drawEnd = function (){
        if(drawObjType == 'line') {
            if(clickNum < 2) { // 라인 포인트 갯수가 2개 이하일 때 리셋
                drawReset();
                svg.removeChild(nowDrawG);
                return;
            } else {
                methodArrow.addArrow(nowDrawG, pointArr);
            }
        } else {
            if(clickNum < 3) { // 폴리곤 포인트 갯수가 3개 이하일 때 리셋
                drawReset();
                svg.removeChild(nowDrawG);
                return;
            }
        }
        nowDrawG.setAttribute('data-num', drawNum); // 현재 그리기 요소에 num 추가
        nameTextAdd(nowDrawG, drawName, pointArr[0][0], pointArr[0][1]); // 이름 text 추가  
        drawReset(); // 그리기 리셋
    },
    // 도형 그린 후 적용 확인
    drawConfirm = function(){
        objectClick(nowDrawG); // 현재 그리기 요소에 클릭 기능 추가
        valuePush(drawObjType); // 최종 결과함수(defaultArr)에 해당 도형관련 값 추가
        commonFunc.typeCountPlus(drawAreaType); // 타입별 카운트 변수 ++

        commonFunc.listUpdate(); // svg 내 요소 리스트 업데이트
        drawNum++;

        nowDrawG = null;
        //console.log(defaultArr);
    },
    // 도형 그린 후 적용 취소
    drawCancel = function(){
        drawReset();
        svg.removeChild(nowDrawG);
        nowDrawG = null;
    },
    // 점 그리기 함수
    drawPolyDot = function(pX, pY){
        var newDot = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        newDot.setAttribute('r', 3);
        newDot.setAttribute('cx',pX);
        newDot.setAttribute('cy',pY);
        nowDrawG.appendChild(newDot);
    },
    // 라인 그리기 함수	
    drawPolyStroke = function(obj){
        var pathVal = '';
        pathVal += pointArr[0][0] +','+ pointArr[0][1];
        for(var i=1; i<pointArr.length; i++){
            pathVal += ' ' + pointArr[i][0] +','+ pointArr[i][1];
        }
        obj.setAttribute('points', pathVal);
    },
    // esc 키 관련 함수
    keyCheck = function(e){ 
        if (e.keyCode == 27) {
            clickNum != 0 ? drawEnd() : drawReset();
        }
    }

    // 그리기 관련 실행 ----------------------------------------------------

    // 기존 데이터 그리기
    function dataDraw(){
        var dataDrawPoly = function(arr, type, name, dir){ // polygon or polyline 생성
            var newPoly;
            type == 'line' ? newPoly = document.createElementNS("http://www.w3.org/2000/svg", 'polyline') : newPoly = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');
            nowDrawG.appendChild(newPoly);
            
            var pathVal = '';
            pathVal += arr[0][0] +','+ arr[0][1];
            drawPolyDot(arr[0][0], arr[0][1]);
            for(var i=1; i<arr.length; i++){
                pathVal += ' ' + arr[i][0] +','+ arr[i][1];
                drawPolyDot(arr[i][0], arr[i][1]);
            }
            newPoly.setAttribute('points', pathVal);
            
            nameTextAdd(nowDrawG, name, arr[0][0], arr[0][1]); // 이름 text 추가

            if(type == 'line') {
                methodArrow.addArrow(nowDrawG, arr, dir);
            }

        }, objData = function(obj){ // svg 에 그룹 생성
            var type = obj.type,
                name = obj.name;

            var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'g');
            nowDrawG = newElement;
            nowDrawG.classList.add(obj.area);
            svg.appendChild(nowDrawG);
            nowDrawG.setAttribute('data-num', drawNum);
            commonFunc.typeCountPlus(obj.area);
            
            commonFunc.listUpdate();
            drawNum++;

            type == 'line' ? dataDrawPoly(obj.points, type, name, obj.direction) : dataDrawPoly(obj.points, type, name);
            nowDrawG = null;
        }
        
        var keysLen = Object.keys(defaultArr).length;
        for(var d=0; d<keysLen; d++){
            objData(defaultArr[d]);
            nameChange(defaultArr[d]);
            areaChange(defaultArr[d]);
        }

        Array.prototype.forEach.call(svgObjs, function(obj){
            objectClick(obj);
        });

    }
    if(Object.keys(defaultArr).length > 0) dataDraw();


    // poly 기능 실행
    function drawPolyStart(e){ 
        var posX = e.layerX,
            posY = e.layerY;

        if(clickNum < 1) {
            drawGroup();

            var newPoly = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');
            nowDrawG.appendChild(newPoly);
        }
        pointArr[clickNum] = new Array();
        pointArr[clickNum][0] = posX;
        pointArr[clickNum][1] = posY;
        clickNum++;
        if(clickNum < maxPolyNum + 1) {
            drawPolyStroke(nowDrawG.querySelector('polygon'));
            drawPolyDot(posX, posY);
            document.addEventListener('keydown', keyCheck);
            if(clickNum == maxPolyNum) drawEnd();
        }
    }
    
    // line 기능 실행
    function drawLineStart(e){ 
        var posX = e.layerX,
            posY = e.layerY;
        
        if(clickNum < 1) {
            drawGroup();
            
            var newPoly = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
            nowDrawG.appendChild(newPoly);
        }
        pointArr[clickNum] = new Array();
        pointArr[clickNum][0] = posX;
        pointArr[clickNum][1] = posY;
        clickNum++;
        if(clickNum < maxLineNum + 1) {
            drawPolyStroke(nowDrawG.querySelector('polyline'));
            drawPolyDot(posX, posY);
            document.addEventListener('keydown', keyCheck);
            if(clickNum == maxLineNum) drawEnd();
        }
    }
        
    svg.addEventListener('click', function(e){
        if(e.target == svg) {
            Array.prototype.forEach.call(svgObjs, function(svg){
                svg.classList.remove('sel');
                //dotOff();
            });
            selectNum = null;
            selectObj = null;

            // 선택 시 콜백함수 실행(현재 선택된 num 전달)
            if(typeof option.objSelChk === 'function'){
                option.objSelChk(selectNum);
            }
        }
    });

    //=== 외부 호출용 함수 ============================================//
    // 이름 변경 함수
    this.modifyName = function(name){
        if(selectNum == null) {
            alert('영역을 선택해주세요.');
            return;
        }
        defaultArr[selectNum].changeName = name;
    }
    // 영역 타입 변경 함수
    this.modifyArea = function(areaType){
        if(selectNum == null) {
            alert('영역을 선택해주세요.');
            return;
        }
        defaultArr[selectNum].changeArea = areaType;
    }

    // 영역 타입 관련 갯수제한 체크 확인
    this.getTypeNum = function(type){
        var returnVal;
        switch (type) {
            case 'focus' : 
                returnVal = countFocus;
                break;
            case 'except' : 
                returnVal = countExc;
                break;
            case 'obj' :
                returnVal = countObj;
                break;
        }
        return returnVal;
    }

    // 도형 선택
    this.objectSelect = function(num){
        selectNum = num;
        selectObj = svg.querySelector('[data-num="'+selectNum+'"]');
        setObjectClass();
    }

    // 도형선택 해제
    this.objectSelClear = function(){
        selectNum = null;
        selectObj = null;
        Array.prototype.forEach.call(svgObjs, function(obj){
            obj.classList.remove('sel');
        });
    }

    // 도형 삭제
    this.objectDelete = function(){
        commonFunc.deleteObj();
    }
    
    // 화살표 방향 반대
    this.setLineDir = function(dir){
        defaultArr[selectNum].directiondir = dir;
        methodArrow.arrowDirSet(selectObj.querySelector('.arrow'), dir);
    }

    // 그리기 실행
    this.drawStart = function(areaType, objType, name){
        if(nowDrawG != null) {
            if(confirm('현재 그려진 도형이 있습니다. 삭제 후 다시 그리시겠습니까?')){
                drawCancel();
            } else {
                return;
            }
        }
        drawReset();
        drawAreaType = areaType;
        drawObjType  = objType;
        drawName = !name ? 'new Object' + drawNum : name;

        switch (drawAreaType) {
            case 'focus' : 
                if(countFocus >= countLimit){
                    alert('갯수 초과!');
                    return;
                }
                break;
            case 'except' : 
                if(countExc >= countLimit){
                    alert('갯수 초과!');
                    return;
                }
                break;
            case 'obj' :
                if(countObj >= countLimit){
                    alert('갯수 초과!');
                    return;
                }
                break;
        }
        drawObjType == 'line' ? svg.addEventListener('click',drawLineStart) : svg.addEventListener('click',drawPolyStart);
        drawState = true;
    }

    this.addConfirm = function(){
        if(nowDrawG == null) return;
        drawConfirm();
    }

    this.addCancel = function(){
        if(nowDrawG == null) return;
        drawCancel();
    }
    
    // 추가 시 그려진 도형 유무
    this.getDrawState = function(){
        return nowDrawG ? true : false;
    }
    // drawNum 호출
    this.getAllCount = function(){
        return drawNum;
    }

    // 데이터 Object 호출
    this.getData = function(){
        return defaultArr;
    }
}
