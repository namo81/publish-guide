// nDial
// 2024-05-31 copyright - namo (seo nam ho) for m.s.p

function addSvg(type){
    var svgObj = document.createElementNS("http://www.w3.org/2000/svg", type);
    return svgObj;
}

function nDial(option){
    const wrap      = typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        cir_center  = option.cir_width / 2,
        action_btn  = typeof option.action_tg === 'string' ? wrap.querySelector(option.action_tg) : option.action_tg, // 터치 요소
        rotate_wrap = action_btn.parentNode; // 터치요소를 감싸는 영역 (실제로 이 영역이 회전)
        
    let inp = wrap.querySelector('input'),
        svg = wrap.querySelector('svg'),
        val_tx = wrap.querySelector('.value-tx'),
        path_guide = addSvg('path'),
        path_gage = addSvg('path');
    
    let min_val = Number(inp.getAttribute('data-min')),
        max_val = Number(inp.getAttribute('data-max')),
        now_val = Number(inp.getAttribute('value'));
    
    let start_point = calcArcPos(-135);
    let rotate_rect = rotate_wrap.getBoundingClientRect(),
        rotate_x = (rotate_rect.width / 2) + rotate_rect.left,
        rotate_y = (rotate_rect.height / 2) + rotate_rect.top;

    path_guide.setAttribute('stroke-linecap', 'round');
    path_guide.setAttribute('fill', 'transparent');
    path_guide.classList.add('path_guide');
    path_gage.setAttribute('stroke-linecap', 'round');
    path_gage.setAttribute('fill', 'transparent');
    path_gage.classList.add('path_gage');
    svg.appendChild(path_guide);
    svg.appendChild(path_gage);

    /** 각도(val)에 따른 x/y 좌표 반환 */
    function calcArcPos(val){
        var radian      = ((val / 180) * Math.PI) - 1.5707963267948966,
            resultArr   = new Array();
            resultArr[0] = cir_center + (cir_center * Math.cos(radian));
            resultArr[1] = cir_center + (cir_center * Math.sin(radian));
        return resultArr;
    }

    /** 라인 그리기 함수 */
    function drawPath(rad, tg){
        var pos = calcArcPos(rad),
            cirSize = rad < 45 || rad > 225 ? 0 : 1;

        lineD = 'M '+ start_point[0] +' '+ start_point[1] +' A '+cir_center+' '+cir_center+', 0, '+cirSize+', 1, '+pos[0]+' '+pos[1];
        tg.setAttribute('d', lineD);
        val_tx.textContent = convertToValue(rad);
        inp.value = convertToValue(rad);
    }
    drawPath(135, path_guide);
    drawPath(convertToRad(now_val), path_gage);
    rotate_wrap.style.transform = 'rotate('+ convertToRad(now_val) +'deg)';

    let touch_chk = false;
    action_btn.addEventListener('touchstart', function(e){
        touch_chk = true;
    });

    action_btn.addEventListener('touchmove', function(e){
        if(touch_chk == false) return;
        e.preventDefault();
        let touch = e.touches[0] || e.changedTouches[0],
            posX = touch.pageX,
            posY = touch.pageY,
            angle = getAngle(rotate_x, rotate_y, posX, posY),
            quarter = checkPos(angle);

        if(quarter == 3 && angle < 315) angle = 315;
        if(quarter == 4 && angle > 225) angle = 225;
        rotate_wrap.style.transform = 'rotate('+ (angle - 90) +'deg)';
        drawPath(angle - 90, path_gage);
    });

    action_btn.addEventListener('touchend', function(e){
        touch_chk = false;
    });

    /** 현재 위치에 따른 사분면 번호 추출 */
    function checkPos(deg){
        var pos;
        if(deg < 180 && deg >= 90) pos = 1;
        else if(deg < 90 && deg >= 0) pos = 2;
        else if(deg < 361 && deg >= 270) pos = 3;
        else pos = 4;
        return pos;
    }

    /** 각도 추출 */
    function getAngle(x1, y1, x2, y2) {
        var rad = Math.atan2(y2 - y1, x2 - x1);
        return ((rad*180)/Math.PI) + 180;
    }

    /** 각도 > Value 변환 */
    function convertToValue(rad){
        let result_tx,
            val_step = (max_val - min_val) / 270;
        if(rad > 224) rad = rad - 225;
        else rad = rad + 135;
        result_tx = Math.floor(val_step * rad) + min_val;
        return result_tx;
    }

    /** Value > 각도 변환 */
    function convertToRad(value){
        let result_val,
            val_rad = (270 / (max_val - min_val)) * (value - min_val);
        if(val_rad < 46) result_val = val_rad + 225;
        else result_val = val_rad - 135;
        return result_val;
    }
}