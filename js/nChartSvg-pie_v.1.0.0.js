/*
    2022-12-22 : v1.0.0 추가
    common.js 필요
*/

/* option 항목

area        : 그려질 영역 최상위 태그
direction   : vertical(세로막대) = 기본값 / horison(가로막대)
labels      : 데이터 구분 문구
data     : 차트 데이터
    name        : 데이터명
    data        : 실제 데이터 배열
    color       : 색상값
chart       : area 내 차트 영역
    width       : 너비 설정(미 설정 시 100%)
    height      : 높이 설정(미 설정 시 너비 대비 40%)
title       : title 관련
    text        : title 텍스트
    show        : title 보이기 여부 (boolean)
legend      : legend 보이기 여부 (boolean)
tooltip     : tooptip 보이기 여부(boolean)
tick        : 데이터 기준선 표시 간격 설정

*/

/* svg 관련 공통 함수 */
function addSvg(type){
    var svgObj = document.createElementNS("http://www.w3.org/2000/svg", type);
    return svgObj;
}

// IE 대응 : svg 요소 classlist 관련 적용
!function(){
	function copyProperty(prop, from, to){
		var desc = Object.getOwnPropertyDescriptor(from, prop);
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

function nChartSvgPie(option){
    var wrap 		    = typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        wrapPadding     = getStyleArr(getStyle(wrap, 'padding')),
        wrapMargin      = getStyleArr(getStyle(wrap, 'margin')),
        wrapBox         = wrap.getBoundingClientRect(),
        chartWrap,
        svgWrap, svgGraph;

    var labels          = option.labels,
        direction       = option.direction ? option.direction : 'vertical',
        data            = option.data,
        color           = option.color,
        graphOpt        = option.graph,
        titleOpt        = option.title,
        drawAnimate     = option.animate,
        legendOpt       = option.legend ? option.legend : true;

    var dataArr         = new Array(),
        dataLen         = labels.length;

    var legend, toolitp, tooltipTit, tooltipVal;
    var sets, lgdBtns;
    var cirWidth, pieGap, barWidth;
    
    cirWidth = graphOpt.width;
    graphOpt.gap ? pieGap = graphOpt.gap : pieGap = 20;
    graphOpt.barWidth ? barWidth = graphOpt.barWidth : barWidth = 10;

    wrap.style.position = 'relative';
    if(direction == 'horison') wrap.classList.add('hor');

    function dataSet(){
        Array.prototype.forEach.call(data, function(val, idx){
            dataArr[idx] = val;
        });
    }
    dataSet();

    // 타이틀 관련 초기 설정 ------
    var titleShow, titleTx, titleWidth, titleHeight;
    function titleSet(){
        if(!titleOpt) {
            titleShow = true;
            titleTx = 'Chart Title';
        } else {
            titleShow = titleOpt.show ? titleOpt.show : true;
            titleTx = titleOpt.text ? titleOpt.text : 'Chart Title';
        }
        if(titleShow == true) wrap.insertAdjacentHTML('afterbegin', '<div class="chart-title">'+titleTx+'</div>');
        titleWidth = wrap.querySelector('.chart-title').offsetWidth;
        titleHeight = wrap.querySelector('.chart-title').offsetHeight;
    }
    titleSet();

    // legend 설정 ------
    var legendWidth, legendHeight;
    function drawLegend(){
        if(legendOpt == true) {
            var lgdHtml = '<div class="legend"><ul class="legend-list">';
                for(var n = 0; n<dataLen; n++){ lgdHtml += '<li data-num="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+color[n]+'"></i>'+labels[n]+'</button></li>'; }
                lgdHtml += '</ul></div>';
            wrap.insertAdjacentHTML('beforeend', lgdHtml);
        }
        legend          = wrap.querySelector('.legend');
        legendWidth     = legend.offsetWidth;
        legendHeight    = legend.offsetHeight;
    }
    drawLegend();

    // svg 추가 ------
    chartWrap = document.createElement("div");
    chartWrap.classList.add('chart-wrap');
    wrap.appendChild(chartWrap);

    var svgWidth    = wrap.offsetWidth - wrapPadding.left - wrapPadding.right,
        svgHeight   = Math.floor(svgWidth * 0.4),
        graphWidth  = svgWidth - 40,
        graphHeight = svgHeight - 60;

    function addSvgWrap(){
        svgWrap = addSvg('svg');
        svgWrap.setAttribute('version', '1.1');
        svgWrap.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        chartWrap.appendChild(svgWrap);
        
        svgGraph = addSvg('g');
        svgGraph.classList.add('svg-wrap');
        svgWrap.appendChild(svgGraph);
        
        setSvgWrapSize();
    }
    // svg 사이즈 설정
    function setSvgWrapSize(){
        svgWrap.style.width = (cirWidth + pieGap) + 'px';
        svgWrap.style.height = (cirWidth + pieGap) + 'px';
        svgGraph.style.transform = 'translate(10px, 10px)';
    }
    addSvgWrap();

    // tooltip 설정 ------
    var ttTag = '<div class="tooltip">';
        ttTag += '<p class="tt-title"></p>';
        ttTag += '<p class="tt-value"></p>';
        ttTag += '</div>';

    chartWrap.insertAdjacentHTML('beforeend', ttTag);
    toolitp     = chartWrap.querySelector('.tooltip'),
    tooltipTit  = toolitp.querySelector('.tt-title'),
    tooltipVal  = toolitp.querySelector('.tt-value');

    // 데이터 값 / pie 관련 위치값 ------
    var valueTotal, maxVal, minVal,
        pieCenter, 
        radArr = new Array(), // 각 그래프 값별 합산으로 점점 커지는 배열 - 각 값의 각도
        txRadArr = new Array(); // 각 그래프 텍스트 위치를 위한 배열
        
    function calcMaxMin(){
        radArr = [];
        txRadArr = [];
        if(dataLen > 1) {
            valueTotal = dataArr.reduce(function(sum, current){ 
                radArr.push(sum + current);
                return sum + current;
            });
            maxVal = Math.max.apply(null, dataArr);
            minVal = Math.min.apply(null, dataArr);
        } else {
            valueTotal = dataArr[0];
        }
        pieCenter = cirWidth / 2;
        radArr.unshift(dataArr[0]);

        Array.prototype.forEach.call(radArr, function(val, idx){
            var rad = (val/valueTotal) * 360;
            radArr[idx] = rad;
            txRadArr[idx] = idx == 0 ? rad / 2 : radArr[idx - 1] + (((dataArr[idx]/valueTotal) * 360) / 2);
        });
    }
    calcMaxMin();

   
    // 배경 라인 설정 ------
    var guideMax, tickArr, guideTxGap;
    guideTxGap = 30;

    // 차트 부분 그리기 ------
    var svgChart    = addSvg('g');

    svgChart.classList.add('chart');
    svgGraph.appendChild(svgChart);

    function calcArcPos(val, cirR){
        var radian      = ((val / 180) * Math.PI) - 1.5707963267948966,
            resultArr   = new Array();
            resultArr[0] = Math.round(pieCenter + (cirR * Math.cos(radian)));
            resultArr[1] = Math.round(pieCenter + (cirR * Math.sin(radian)));
        return resultArr;
    }

    function drawGraph(){
        for(var n = 0; n<dataLen; n++){
            if(dataArr[n] > 0) {
                var set     = addSvg('g'),
                    setTx   = addSvg('g'),
                    labelTx = addSvg('text'),
                    setPath = addSvg('path'),
                    lineD;
                set.classList.add('chart-set');
                setPath.classList.add('set-path');
                setTx.classList.add('set-name');

                var startX = n == 0 ? pieCenter : calcArcPos(radArr[n-1], pieCenter)[0],
                    startY = n == 0 ? 0 : calcArcPos(radArr[n-1], pieCenter)[1],
                    arcPos = calcArcPos(radArr[n], pieCenter),
                    inEndX = n == 0 ? pieCenter : calcArcPos(radArr[n-1], (pieCenter - barWidth))[0],
                    inEndY = n == 0 ? barWidth : calcArcPos(radArr[n-1], (pieCenter - barWidth))[1],
                    inArcPos = calcArcPos(radArr[n], (pieCenter - barWidth));

                var cirSize = 0;
                if(n == 0) {
                    radArr[0] > 180 ? cirSize = 1 : cirSize = 0;
                    if(radArr[0] < 15) labelTx.style.display = 'none';
                } else {
                    (radArr[n] - radArr[n-1]) > 180 ? cirSize = 1 : cirSize = 0;
                    if((radArr[n] - radArr[n-1]) < 15) labelTx.style.display = 'none';
                }

                lineD = 'M '+startX+' '+startY+' A '+pieCenter+' '+pieCenter+', 0, '+cirSize+', 1, '+arcPos[0]+' '+arcPos[1]+' L '+inArcPos[0]+' '+inArcPos[1]+' A '+(pieCenter - barWidth)+' '+ (pieCenter - barWidth) +', 0, '+cirSize+', 0, '+inEndX+' '+inEndY+' Z';

                setPath.setAttribute('d', lineD);
                setPath.setAttribute('fill', color[n]);
                setPath.setAttribute('data-val', dataArr[n]);

                var txPos = calcArcPos(txRadArr[n], pieCenter - (barWidth / 2));

                labelTx.textContent = labels[n];
                labelTx.setAttribute('text-anchor', 'middle');
                labelTx.setAttribute('alignment-baseline', 'middle');
                labelTx.setAttribute('x', txPos[0]);
                labelTx.setAttribute('y', txPos[1]);
                setTx.setAttribute('width', '100%');

                set.appendChild(setPath);
                setTx.appendChild(labelTx);
                set.appendChild(setTx);
                svgChart.appendChild(set);

                barOverSet(set);
            }
        }
    }
    drawGraph();

    function reDrawGraph(){
        var sets = svgChart.querySelectorAll('.chart-set');
        Array.prototype.forEach.call(sets, function(set, idx){
            var setPath = set.querySelector('.set-path'),
                setTx   = set.querySelector('.set-name'),
                labelTx = setTx.querySelector('text');
            if(dataArr[idx] > 0) {
                var startX = idx == 0 ? pieCenter : calcArcPos(radArr[idx-1], pieCenter)[0],
                    startY = idx == 0 ? 0 : calcArcPos(radArr[idx-1], pieCenter)[1],
                    arcPos = calcArcPos(radArr[idx], pieCenter),
                    inEndX = idx == 0 ? pieCenter : calcArcPos(radArr[idx-1], (pieCenter - barWidth))[0],
                    inEndY = idx == 0 ? barWidth : calcArcPos(radArr[idx-1], (pieCenter - barWidth))[1],
                    inArcPos = calcArcPos(radArr[idx], (pieCenter - barWidth));

                var cirSize = 0;
                if(idx == 0) {
                    radArr[0] > 180 ? cirSize = 1 : cirSize = 0;
                    radArr[0] < 15 ? labelTx.style.display = 'none' : labelTx.style.display = '';
                } else {
                    (radArr[idx] - radArr[idx-1]) > 180 ? cirSize = 1 : cirSize = 0;
                    (radArr[idx] - radArr[idx-1]) < 15 ? labelTx.style.display = 'none' : labelTx.style.display = '';
                }

                lineD = 'M '+startX+' '+startY+' A '+pieCenter+' '+pieCenter+', 0, '+cirSize+', 1, '+arcPos[0]+' '+arcPos[1]+' L '+inArcPos[0]+' '+inArcPos[1]+' A '+(pieCenter - barWidth)+' '+ (pieCenter - barWidth) +', 0, '+cirSize+', 0, '+inEndX+' '+inEndY+' Z';

                setPath.setAttribute('d', lineD);

                var txPos = calcArcPos(txRadArr[idx], pieCenter - (barWidth / 2));
                labelTx.setAttribute('x', txPos[0]);
                labelTx.setAttribute('y', txPos[1]);

                set.style.display = '';
                setTx.style.display = '';
                
            } else {
                lineD = '';
                setPath.setAttribute('d', lineD);
                set.style.display = 'none';
            }
        });
    }

    // bar hover 시 tooltip 관련 설정
    function barOverSet(tg){
        var path    = tg.querySelector('.set-path'),
            val     = path.getAttribute('data-val'),
            tit     = tg.querySelector('.set-name text').textContent;
        tg.addEventListener('mouseover', function(e){
            tooltipTit.textContent = tit;
            toolitp.style.opacity = 1;
            toolitp.style.zIndex = 100;
            tooltipVal.textContent = val;
        });
        tg.addEventListener('mousemove', function(e){
            var layerX = e.layerX,
                layerY = e.layerY;
            toolitp.style.left = (layerX + 10) + 'px';
            toolitp.style.top = (layerY + 10) + 'px';
        });
        tg.addEventListener('mouseleave', function(e){
            toolitp.style.opacity = 0;
            toolitp.style.zIndex = -1;
        });
    }

    function dataReSet(num, type){
        type == true ? dataArr[num] = data[num] : dataArr[num] = 0;
        //while (svgChart.firstChild) svgChart.removeChild(svgChart.firstChild);
        calcMaxMin();
        reDrawGraph();
    }

    // legend 버튼 클릭 기능
    function lgdBtnSet(){
        lgdBtns = legend.querySelectorAll('button');
        Array.prototype.forEach.call(lgdBtns, function(btn, idx){
            btn.addEventListener('click', function(){
                if(this.classList.contains('del')){
                    this.classList.remove('del');
                    dataReSet(idx, true);
                } else {
                    this.classList.add('del');
                    dataReSet(idx, false);
                }
            });
        });
    }
    lgdBtnSet();

    // 기준선 생성
    function guideLineSet(){
        var lineBox = addSvg('g');

        lineBox.classList.add('guide-line');
        svgGraph.insertBefore(lineBox, svgGraph.firstChild);

        for(var t=0; t<tickArr.length; t++){
            if(direction == 'vertical') {
                var lineG   = addSvg('g'),
                    line    = addSvg('line'),
                    tx      = addSvg('text');
                var ypos    = Math.round(graphHeight * (tickArr[t]/guideMax));
                line.setAttribute('x1', guideTxGap);
                line.setAttribute('y1', graphHeight - ypos);
                line.setAttribute('x2', graphWidth);
                line.setAttribute('y2', graphHeight - ypos);
                tx.textContent = tickArr[t];
                tx.setAttribute('y', (graphHeight - ypos) + 3);
                lineG.appendChild(tx);
                lineG.appendChild(line);
                lineBox.appendChild(lineG);
            } else null/*listTag += '<li style="left:'+ Math.floor((tickArr[t]/guideMax) * 100) +'%"><p class="guide-tx">'+ tickArr[t] +'</p></li>'*/;
        }
        
    }
   // guideLineSet();
    wrap.classList.add('on');

    var maskCir     = addSvg('mask'),
        motionCir   = addSvg('path'),
        regMax      = 359.5;

    maskCir.setAttribute('id', 'cir-mask');
    motionCir.classList.add('motion-cir');
    motionCir.setAttribute('fill', '#fff');
    motionCir.setAttribute('style', 'transform-origin:50% 50%; transform:translate(1px, 1px) scale(1.1);');
    maskCir.appendChild(motionCir);


    // animation 관련 test
    function animateMotion(duration){
        var dur			= duration ? duration : 500;
       
        animateMotionTo();
    
        function animateMotionTo() {
            var startTime = new Date().getTime();
            var endTime = new Date().getTime() + dur;
    
            var motionTo = function() {
                var now = new Date().getTime(),
                    passed = now - startTime,
                    ease = easeInOutCubic(passed / dur);
                if (now <= endTime) {
                    drawMotionCir(regMax * ease);
                    requestAnimationFrame(motionTo);
                } else {
                    svgWrap.removeChild(maskCir);
                    svgGraph.setAttribute('mask', '');
                }
            };
            requestAnimationFrame(motionTo);
        };
    }

    function drawMotionCir(rad){
        var pos = calcArcPos(rad, pieCenter),
            cirSize = rad < 180 ? 0 : 1;

        lineD = 'M 150 0 A '+pieCenter+' '+pieCenter+', 0, '+cirSize+', 1, '+pos[0]+' '+pos[1]+' L 150 150 Z';
        motionCir.setAttribute('d', lineD);
    }

    if(drawAnimate) {
        svgWrap.appendChild(maskCir);
        svgGraph.setAttribute('mask', 'url(#cir-mask)');
        animateMotion(1000);
    }
}