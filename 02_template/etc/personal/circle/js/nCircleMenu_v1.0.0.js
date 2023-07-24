/*
    nCircleMenu
    2023-02-27 : v.1.0.0 제작

    // 사분면 번호
       2   |   1
       ---------
       3   |   4

    option
    wrap            : 전체를 감싸는 영역
    menus           : wrap 에 포함된 메뉴를 감싸는 영역
    radius          : 각 메뉴와 중앙 기준점 간의 반지름
    firstDeg        : 초기 각도
    activeEnd       : mouseup 이후 호출할 콜백함수 - 현재 메뉴 번호를 반환함 (0 ~ 메뉴 갯수 -1)

    ** common.js 파일 필수
    ** common.js 파일 미사용 시 onEvent / removeListeners / offset 함수 필요
 */

function nCircleMenu(option){
    var wrap        = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        half        = wrap.offsetWidth / 2, // wrap  전체 너비의 절반 - pos 보정값
        menus       = option.menus ? wrap.querySelector(option.menus) : wrap.querySelector('.menus'),
        radius      = option.radius ? option.radius : 150,
        firstDeg    = option.firstDeg ? option.firstDeg : 90,
        activeEnd   = option.activeEnd;

    var cnts        = menus.querySelectorAll('li'),
        degGap;   // 요소별 간격 각도 (1번 - 2번 요소사이각)

    var startDeg, // 클릭 시 각도
        prevPos,  // 회전 중 직전의 사분면 번호
        nowPos;   // 회전 중 현재의 사분면 번호

    var nowNum = 0,         // 현재 배너 번호
        nowVal = firstDeg,  // 현재 및 마우스 up 이후 최종 각도
        prevVal = firstDeg; // 클릭 후 저장되는 클릭 전 최종 각도

    var countR = 0; // 클릭 후 이동값이 360 이상일 경우 회전 횟수용 변수

    function setCntPos(gap){
        degGap  = 360 / cnts.length,
        btnW    = Number(cnts[0].offsetWidth / 2),
        btnH    = Number(cnts[0].offsetHeight / 2);
        
        for(var i=0; i<cnts.length; i++){
            var degArr = calcArcPos(degGap * i, gap);
            cnts[i].style.left = degArr[0] - btnW + 'px';
            cnts[i].style.top = degArr[1] - btnH + 'px';
            cnts[i].setAttribute('data-num', i);
            cnts[i].setAttribute('data-deg', degGap * i);
        }
    }
    setCntPos(radius);

    function calcArcPos(val, gap){
        var radian      = ((val / 180) * Math.PI) - 3.14159265359,
            resultArr   = new Array();
            resultArr[0] = Math.round(half + (gap * Math.cos(radian)));
            resultArr[1] = Math.round(half + (gap * Math.sin(radian)));
        return resultArr;
    }

    function setCntDeg(){
        wrap.style.transform = 'rotate('+ nowVal +'deg)';
        cnts.forEach(function(cnt){
            cnt.style.transform = 'rotate('+ -nowVal +'deg)';
        });
    }
    setCntDeg();

    function setDurationOn(){
        wrap.style.transitionDuration = '.5s';
        cnts.forEach(function(cnt){
            cnt.style.transitionDuration = '.5s';
        });
    }
    function setDurationOff(){
        wrap.style.transitionDuration = '0s';
        cnts.forEach(function(cnt){
            cnt.style.transitionDuration = '0s';
        });
    }

    wrap.addEventListener('mousedown', function(e){
        var xpos = e.target != wrap ? e.target.getBoundingClientRect().left + e.offsetX - wrap.offsetLeft : e.layerX,
            ypos = e.target != wrap ? e.target.getBoundingClientRect().top + e.offsetY - wrap.offsetTop : e.layerY;

        startDeg = getAngle(half, half, xpos, ypos);
        nowPos   = null; // 2, 3 사분면만 클릭하면서 여러번 재이동할 경우 오류 방지
        prevPos  = null; // 2, 3 사분면만 클릭하면서 여러번 재이동할 경우 오류 방지
        countR   = 0; // 매 클릭 시마다 회전횟수 초기화

        setDurationOff();
        
        wrap.onEvent('mousemove', function(e){
            var posx    = e.target != wrap ? e.target.getBoundingClientRect().left + e.offsetX - wrap.offsetLeft : e.layerX;
                posy    = e.target != wrap ? e.target.getBoundingClientRect().top + e.offsetY - wrap.offsetTop : e.layerY;
            var nowDeg  = getAngle(half, half, posx, posy);

            if(nowPos != checkPos(nowDeg) || nowPos == null) {
                prevPos = nowPos;
                nowPos  = checkPos(nowDeg);

                if(prevPos == 3 && nowPos == 2) countR++; // 회전 시 3사분면 > 2사분면 이동 시 회전횟수 1 증가
                if(prevPos == 2 && nowPos == 3) countR--; // 회전 시 2사분면 > 3사분면 이동 시 회전횟수 1 감소
            }
            var gap     = (nowDeg + (countR * 360)) - startDeg; // 클릭 후 총 이동각도 계산 = (현재 각도 + (360 회전수 * 360)) - 시작각도)

            nowVal = prevVal + gap; // 현재 각도 계산식 = 이전 최종각도 + 클릭 후 이동각도
            setCntDeg();
        });
    });

    wrap.addEventListener('mouseup', function(e){
        wrap.removeListeners('mousemove');
        var posDeg = (nowVal - firstDeg) % 360, // 최종각도를 360으로 나눈 나머지 - 0 ~ 360 사이의 현재 각도
            remain = posDeg % degGap; // posDeg 를 요소사이각으로 나눈 나머지 - 어느 요소에 가까운지 확인용
        
        nowNum = Math.floor((posDeg + (degGap/2)) / degGap); // posDeg 기준으로 현재 배너 number - 아래쪽에 후처리 필요.

        var targetVal;
        
        if(nowVal < firstDeg) { // 최종각도가 초기 각도보다 작을 경우 - posDeg 나 remain 이 음수
           if(remain < 0 && remain >= (degGap/2) * -1) targetVal = nowVal - remain;
           else if(remain < (degGap/2) * -1 && remain >= degGap * -1) targetVal = nowVal - (degGap + remain);
        } else { // 최동 각도가 초기각도보다 클 경우 - posDeg 나 remain 이 양수
            nowNum = cnts.length - nowNum;
            if(remain > 0 && remain <= degGap/2) targetVal = nowVal - remain;
            else if(remain > degGap/2 && remain <= degGap) targetVal = nowVal + (degGap - remain);
        }
        
        nowVal = targetVal == undefined ? nowVal : targetVal;
        prevVal = nowVal;
       
        setDurationOn();
        setCntDeg();
        if(typeof activeEnd === 'function') option.activeEnd(calcNowNum(nowNum));
    });

    function calcNowNum(num){
        var chkNum = num;
        chkNum < 0 ? chkNum = chkNum * -1 : chkNum;
        if(chkNum >= cnts.length) chkNum = 0;
        return chkNum;
    }

    function checkPos(deg){
        var pos;
        if(deg < 180 && deg >= 90) pos = 1;
        else if(deg < 90 && deg >= 0) pos = 2;
        else if(deg < 361 && deg >= 270) pos = 3;
        else pos = 4;
        return pos;
    }

    function getAngle(x1, y1, x2, y2) {
        var rad = Math.atan2(y2 - y1, x2 - x1);
        return ((rad*180)/Math.PI) + 180;
    }
}