function nRoi(option){
    /* ===== 변수 ========================================================== */
        // 공통변수
    var wrap 			= typeof option.target == 'string' ? document.querySelector(option.target) : option.target,
        svgArea 		= option.svgArea ? option.svgArea : wrap.querySelector('.board'),
        svg				= svgArea.querySelector('svg'),
        svgBox 			= svg.getBoundingClientRect(),
        nowDrawG,		// 현재 그리는 중 svg g
        drawState 		= false,
        drawObjType, 	// 그리기 요소 타입 구분(poly/line)
        drawAreaType,	// 그리기 영역 타입 구분 (주시/제외/객체)
        drawNum = 0,	// 화면 내 그려진 요소 넘버링 변수 (화면 로드 후 계속 증가함)
        selectNum,		// 수정/삭제를 위해 선택된 obj 및 리스트의 data-num
    
        // 그리기 관련 변수
        clickNum 		= 0,
        maxPolyNum 		= option.maxPolyNum ? option.maxPolyNum : 12,
        maxLineNum 		= option.maxLineNum ? option.maxLineNum : 6,
        direction,		// 라인일 경우 - 화살표 방향관련 변수

        // 배열 / 유사배열 변수
        svgObjs,		// 화면에 그려진 svg g 요소 관련 유사배열
        defaultArr 		= option.defaultArr ? option.defaultArr : new Object(),   // 초기 입력 / 최종 출력 데이터용 object
        pointArr 		= new Array(), // 그리기용 임시 배열 (도형 좌표용)

        // 리스트 관련 변수
        listWrap 		= option.listWrap ? document.querySelector(option.listWrap) : document.querySelector('.obj-list'),
        listItems,		// 리스트 내 li 관련 유사배열
        nowList,		// 현재 선택 / 추가된 li

        btnAdd          = option.btnAdd ? document.querySelector(optoin.btnAdd) : document.querySelector('.btn.add'),
        addWrap         = option.addWrap ? document.querySelector(option.addWrap) : document.querySelector('.set-obj.add'),
        addNameInp      = option.addNameInp ? addWrap.querySelector(option.addNameInp) : addWrap.querySelector('input#obj-name'),
        addConfirm      = option.addConfirm ? addWrap.querySelector(option.addConfirm) : addWrap.querySelector('.btn.confirm'),
        addCancel      = option.addCancel ? addWrap.querySelector(option.addCancel) : addWrap.querySelector('.btn.cancel'),
        btnDraw			= option.btnDraw ? addWrap.querySelectorAll(option.btnDraw) : addWrap.querySelectorAll('.btn.draw'),
        btnReset		= option.btnReset ? addWrap.querySelector(option.btnReset) : addWrap.querySelector('.btn.reset'),

        modifyWrap  	= option.modifyWrap ? document.querySelector(option.modifyWrap) : document.querySelector('.set-obj.modify'),
        modifyNameInp 	= option.modifyNameInp ? modifyWrap.querySelector(option.modifyNameInp) : modifyWrap.querySelector('input#inp_name'),
        modifyBtn 		= option.modifyBtn ? modifyWrap.querySelector(option.modifyBtn) : modifyWrap.querySelector('.btn.confirm'),
        modifyCancel 	= option.modifyBtn ? modifyWrap.querySelector(option.modifyBtn) : modifyWrap.querySelector('.btn.cancel'),

        // 타입별 카운트용 변수
        countLimit = 5,  // 영역별 최대 갯수
        countFocus = 0,  // 화면 내 침탐 영역 갯수
        countExc   = 0,  // 화면 내 무시 영역 갯수
        countObj   = 0;  // 화면 내 객체무시 영역 갯수

        
    /* ===== 공통함수 ========================================================== */
    var commonFunc = {
        // 각 타입별 카운트 추가/삭제 함수
        typeCountPlus(type){
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
        }, typeCountMinus(type){
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
        // 도형 / 리스트 삭제 기능
        deleteObj(e) {
            e.stopPropagation();
            if(selectNum == null) return;
            var tg 		= svg.querySelector('[data-num="'+ selectNum +'"]'),
                tgList  = listWrap.querySelector('[data-num="'+ selectNum +'"]');
            tg.parentNode.removeChild(tg);
            tgList.parentNode.removeChild(tgList);
            commonFunc.typeCountMinus(defaultArr[selectNum].area);
            delete defaultArr[selectNum];

            commonFunc.listUpdate();
            console.log(defaultArr);
        },
        // 이름 변경 시 리스트/obj 내 텍스트 변경
        listNameSet(){
            var tg 		= svg.querySelector('[data-num="'+ selectNum +'"]').querySelector('text'),
                tgList  = listWrap.querySelector('[data-num="'+ selectNum +'"]').querySelector('.obj-name');
            tg.textContent = defaultArr[selectNum].name;
            tgList.innerText = defaultArr[selectNum].name;					
        },
        // svg 및 리스트 항목 변경 확인
        listUpdate(){
            svgObjs = svgArea.querySelectorAll('svg > g');
            listItems = listWrap.querySelectorAll('li');
        },
        // 문구에서 숫자만 추출(문구 내 연결된 숫자 1개만 추출가능)
        getNum(tx){
            var val = Number(tx.replace(/[^0-9]/g, ''));
            return val;
        }
    }
    
    /* ===== 추가 및 그리기 관련 ========================================================== */
    var objectAdd = function(){
        addConfirm.addEventListener('click', function(){
            addWrap.style.display = 'none';
        });

        addCancel.addEventListener('click', function(){
            addWrap.style.display = 'none';
        });
    }

    btnAdd.addEventListener('click', function(){
        addWrap.style.display = 'block';
        objectAdd();
    });

    /* ===== 리스트 ========================================================== */
    var listHtml = '<p class="obj-name"></p>';
        listHtml += '<p class="obj-area"></p>';
        listHtml += '<p class="obj-type"></p>';
        listHtml += '<button type="button" class="btn modify">수정</button>';
        listHtml += '<button type="button" class="btn del">삭제</button>';

    var methodList = {
        // 리스트 선택 실행
        listSel(inNum){
            Array.prototype.forEach.call(listItems, function(item){
                item.getAttribute('data-num') == inNum ? item.classList.add('sel') : item.classList.remove('sel');
            });
        },
        // 수정모드 활성화
        listModify(inNum){
            modifyWrap.style.display = 'block';
            selectNum = inNum;
            modifyNameInp.value = defaultArr[selectNum].name;
        },
        // 리스트 클릭 기능
        listClick(e){
            var tg;
            e.target.tagName != 'LI' ? tg = e.target.parentNode : tg = e.target;
            selectNum = Number(tg.getAttribute('data-num'));
            objSel(selectNum);
            methodList.listSel(selectNum);
        },
        // 리스트 추가
        listAdd(idx, name, area, type){
            var newLi = document.createElement("li");
            listWrap.appendChild(newLi);
            nowList = newLi;
            nowList.insertAdjacentHTML('beforeend', listHtml);
            nowList.setAttribute('data-num', idx);

            var nameTx      = nowList.querySelector('.obj-name'),
                areaTx      = nowList.querySelector('.obj-area'),
                typeTx      = nowList.querySelector('.obj-type'),
                modifyBtn   = nowList.querySelector('.modify'),
                delBtn      = nowList.querySelector('.del');

            name == null ? nameTx.innerTx = 'new Area' + drawNum : nameTx.innerText = name;
            areaTx.innerText = area;
            typeTx.innerText = type;

            commonFunc.listUpdate();
            nowList.addEventListener('click', this.listClick);

            modifyBtn.addEventListener('click', function(){
                methodList.listModify(idx)
            });
            delBtn.addEventListener('click', commonFunc.deleteObj);
            
            nameChange(defaultArr[drawNum], drawNum);
        },
        // 리스트 수정 시 확인
        listConfirm(){
            defaultArr[selectNum].changeName = modifyNameInp.value;
            modifyWrap.style.display = 'none';
        },
        listCancel(){
            modifyWrap.style.display = 'none';
            modifyNameInp.value = '';
        }
    }
    modifyBtn.addEventListener('click', methodList.listConfirm);
    modifyCancel.addEventListener('click', methodList.listCancel);

    // defaultArr 내 설정 변경 시 실행
    function nameChange(tgObj, idx){
        Object.defineProperty(tgObj, 'changeName', {
            set: function(val) {
                this.name = val;
                commonFunc.listNameSet(idx);
            }
        });
    }
    // defaultArr 내 영역 종류 변경 시 실행
    function areaChange(tgObj, idx){
        Object.defineProperty(tgObj, 'changeArea', {
            set: function(val) {
                this.area = val;
            }
        });
    }

    /* ===== SVG 영역 ========================================================== */

    // 꼭지점 이동 관련
    /*var dotMove = function(e, obj, tgPoly, idx){
        var tgX = e.pageX,
            tgY = e.pageY;
        obj.setAttribute('cx', tgX);
        obj.setAttribute('cy', tgY);
        tgPoly.points[idx].x = tgX;
        tgPoly.points[idx].y = tgY;
        
    }, dotUp = function(obj, tgPoly){
        if(tgPoly.tagName == 'polyline')
        obj.removeEventListener('mousemove', dotMove);
    }
    var dotOn = function(obj){
        var dots 		= obj.querySelectorAll('circle'),
            poly 		= obj.querySelector('polygon') ? obj.querySelector('polygon') : obj.querySelector('polyline');
        
        Array.prototype.forEach.call(dots, function(dot, idx){
            var downChk = false;

             dot.onEvent('mousedown', function(e){
                downChk = true;
                dot.onEvent('mousemove', function(e){dotMove(e, this, poly, idx)});
                dot.onEvent('mouseup', function(){dotUp(this, poly)});
             });
        });

    }, dotOff = function(){
        var cirs = svg.querySelectorAll('circle');
        Array.prototype.forEach.call(cirs, function(cir){
            cir.removeListeners();
        });
    }*/

    
    // 화살표 ----------------------------------------------------
    var methodArrow = {
        // 화살표 방향 반전
        arrowReverse(tgObj){
            var rotateObj = tgObj.querySelector('g'),
                rotateVal = commonFunc.getNum(rotateObj.style.transform) + 180;
            rotateObj.style.transform = 'rotate('+rotateVal+'deg)';    
        },
        //화살표 위치 및 각도 설정
        setArrow(obj, x, y, a){
            var rotateObj = obj.querySelector('g'),
                dirTx 	  = obj.querySelector('text');
            obj.setAttribute('transform', 'translate('+x+','+y+')');
            rotateObj.style.transform = 'rotate('+a+'deg)';
            obj.style.display = 'block';
        },
        // 각도 구하기 함수
        getAngle(x1, y1, x2, y2) {
            var rad = Math.atan2(y2 - y1, x2 - x1);
            return (rad*180)/Math.PI ;
        }, 
        // 화살표 위치 및 각도를 위한 배열값 추출
        arrowPosSet(arr, obj, dir){
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
            aAngle = this.getAngle(startX, startY, endX, endY) + 180;
            this.setArrow(obj, aPosX, aPosY, aAngle);
        },
        // 화살표 추가
        addArrow(tg, array, dir){
            var dirTx = dir == null ? 0 : dir;
            tg.insertAdjacentHTML('beforeend', '<g class="arrow"><g><polyline points="0,20 20,0 40,20" transform="translate(-20 -40)" fill="none" stroke="#ff0000"></polyline><line x1="20" y1="0" x2="20" y2="80" transform="translate(-20 -40)" stroke="#ff0000"></line></g><text x="-10" y="55">('+dirTx+')</text></g>');
            var tgArrow = tg.querySelector('.arrow');
            this.arrowPosSet(array, tgArrow);
            if(dir == 1) this.arrowReverse(tgArrow);
        }
    }

    // svg 에 name 요소 추가
    var nameAdd = function(tgObj, name, x, y){
        tgObj.insertAdjacentHTML('beforeend', '<g class="nameTx"><rect x="0" y="0"></rect><text x="4" y="14">'+name+'</text></g>');
        var newText = tgObj.querySelector('.nameTx'),
            txX 	= x > (svgBox.width - 100) ? x - 100 : x;
            txY 	= y > (svgBox.height - 20) ? y - 20 : y;
        newText.setAttribute('transform', 'translate('+txX+','+txY+')');
    }

    // 도형 선택 시 클래스 제어
    var objSel = function(inNum){
        Array.prototype.forEach.call(svgObjs, function(obj){
            if(obj.getAttribute('data-num') == inNum){
                obj.classList.add('sel');
                svg.appendChild(obj);
            } else obj.classList.remove('sel');
            //dotOff();
        });
        //dotOn(obj);
    }, 
    // 도형 선택 기능 부여
    objClick = function(obj){
        obj.addEventListener('click', function(){
            if(drawState == true) return;
            selectNum = obj.getAttribute('data-num');
            objSel(selectNum);
            methodList.listSel(selectNum); // 리스트에 선택 표기
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
        objClick(nowDrawG); // 현재 그리기 요소에 클릭 기능 추가
        valuePush(drawObjType); // 최종 결과함수(defaultArr)에 해당 도형관련 값 추가
        commonFunc.typeCountPlus(drawAreaType); // 타입별 카운트 변수 ++
        
        var newName = 'new Object' + drawNum;
        nameAdd(nowDrawG, newName, pointArr[0][0], pointArr[0][1]); // 이름 text 추가
        methodList.listAdd(drawNum, defaultArr[drawNum].name, defaultArr[drawNum].area, defaultArr[drawNum].type); // list 추가

        commonFunc.listUpdate(); // svg 내 요소 리스트 업데이트
        drawNum++;
        drawReset(); // 그리기 리셋

        console.log(defaultArr);
    },
    // 그리기 후 '확인' 클릭 시
    drawConfirm = function(){

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

            nameAdd(nowDrawG, name, arr[0][0], arr[0][1]); // 이름 text 추가

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
            methodList.listAdd(drawNum, defaultArr[drawNum].name, defaultArr[drawNum].area, defaultArr[drawNum].type);
            commonFunc.typeCountPlus(obj.area);
            
            commonFunc.listUpdate();
            drawNum++;

            type == 'line' ? dataDrawPoly(obj.points, type, name, obj.direction) : dataDrawPoly(obj.points, type, name);
            nowDrawG = null;
        }
        

        var keys = Object.keys(defaultArr),
        keysLen = Object.keys(defaultArr).length;
        for(var d=0; d<keysLen; d++){
            objData(defaultArr[d]);
        }

        Array.prototype.forEach.call(svgObjs, function(obj){
            objClick(obj);
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
    
    // 그리기 버튼 설정
    Array.prototype.forEach.call(btnDraw, function(btn){
        btn.addEventListener('click', function(){
            drawReset();
            drawAreaType = this.getAttribute('data-type');
            drawObjType  = this.getAttribute('data-draw');

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
            drawObjType == 'line' ? svg.onEvent('click',drawLineStart) : svg.onEvent('click',drawPolyStart);
            drawState = true;
        });
    });
    
    svg.addEventListener('click', function(e){
        if(e.target == svg) {
            Array.prototype.forEach.call(svgObjs, function(svg){
                svg.classList.remove('sel');
                //dotOff();
            });
            Array.prototype.forEach.call(listItems, function(item){
                item.classList.remove('sel');
            });
        }
    });

    btnReset.addEventListener('click', function(){
        if(drawState == false) return;
        svg.removeChild(nowDrawG);        
        drawReset();
    });

    this.getData = function(){
        return defaultArr;
    }
}
