/*
    2022-12-22 : v1.0.0 추가
    common.js 필요
*/

/* option 항목

area        : 그려질 영역 최상위 태그
direction   : vertical(세로막대) = 기본값 / horison(가로막대)
labels      : 데이터 구분 문구
dataset     : 차트 데이터
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

function nChartSvg(option){
    var wrap 		    = typeof option.area === 'string' ? document.querySelector(option.area) : option.area,
        wrapPadding     = getStyleArr(getStyle(wrap, 'padding')),
        wrapMargin      = getStyleArr(getStyle(wrap, 'margin')),
        wrapBox         = wrap.getBoundingClientRect(),
        chartWrap,
        svgWrap, svgGraph;

    var labels          = option.labels,
        stack           = option.stack ? option.stack : false,
        direction       = option.direction ? option.direction : 'vertical',
        dataset         = option.dataset,
        barOpt          = option.bar,
        chartSize       = option.chart,
        titleOpt        = option.title,
        legendOpt       = option.legend ? option.legend : true,
        tick            = option.tick;

    var dataLen         = labels.length,
        setLen          = dataset.length;

    var chart, legend, toolitp, tooltipTit, tooltipVal;
    var sets, lgdBtns;
    var barWidth, barGap;

    if(!barOpt) {
        barWidth = 30;
        barGap = 0;
    } else {
        barWidth = !barOpt.width ? 30 : barOpt.width;
        barGap   = !barOpt.gap ? 0 : barOpt.gap;
    }

    wrap.style.position = 'relative';
    if(direction == 'horison') wrap.classList.add('hor');


    // 크기 관련 변수
    var wrapWidth, wrapHeight;

    // 차트 크기 초기 설정
    function wrapSizeSet(){
        if(!chartSize) {
            wrapWidth   = 100 + '%';
        } else {
            wrapWidth   = chartSize.width ? chartSize.width + 'px' : 100 + '%';
            wrapHeight  = chartSize.height ? chartSize.height + 'px' : (wrap.offsetWidth * 0.4) + 'px';
        }
        wrap.style.width = wrapWidth;
        direction == 'vertical' ? wrap.style.height = wrapHeight : wrap.style.height = 'auto';
    }

    // 타이틀 관련 초기 설정 ------
    var titleShow, titleTx;
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
    function drawLegend(){
        if(legendOpt == true) {
            var lgdHtml = '<div class="legend"><ul class="legend-list">';
                for(var n = 0; n<setLen; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+dataset[n].color+'"></i>'+dataset[n].name+'</button></li>'; }
                lgdHtml += '</ul></div>';
            wrap.insertAdjacentHTML('beforeend', lgdHtml);
        }
        legend          = wrap.querySelector('.legend');
        legendWidth     = legend.offsetWidth;
        legendHeight    = legend.offsetHeight;
    }
    drawLegend();
    
    // 타이틀 / legend 설정 후 사이즈 조정
    wrapSizeSet();

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
        svgWrap.style.width = 100 + '%';
        svgWrap.style.height = svgHeight + 'px';
        svgGraph.style.transform = 'translate(20px, 20px)'
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

    // 데이터 값 관련 ------
    var maxArr, minArr, maxVal, minVal, stackArr, stackMax;
    function calcMaxMin(){
        if(setLen > 1) {
            maxArr = new Array();
            minArr = new Array();
            for(var s=0; s<setLen; s++){
                maxArr.push(Math.max.apply(null, dataset[s].data));
                minArr.push(Math.min.apply(null, dataset[s].data));
            }
            maxVal = Math.max.apply(null, maxArr);
            minVal = Math.min.apply(null, minArr);
        } else {
            maxVal = Math.max.apply(null, dataset[0].data);
            minVal = Math.min.apply(null, dataset[0].data);
        }
    }

    function calcMaxStack(){
        stackArr = new Array();
        for(var d=0; d<dataLen; d++){
            var secArr = new Array();
            for(var s=0; s<setLen; s++){
                secArr.push(dataset[s].data[d]);
            }
            stackArr.push(secArr.reduce(function add(acc, curVal){ return acc + curVal}, 0));
        }
        stackMax = Math.max.apply(null, stackArr);
        wrap.classList.add('stack');
    }
    calcMaxMin();
    if(stack == true && setLen > 1) calcMaxStack();
    

    // 배경 라인 설정 ------
    var guideMax, tickGap, tickArr, guideTxGap;
    guideTxGap = 30;
    
    function calcTick(){
        var setMax      = stack == true && setLen > 1 ? stackMax : maxVal;
            zeroCount   = Number(String(setMax).length);
            tickGap     = setMax < 100 ? Math.pow(10, zeroCount - 1) : Math.pow(10, zeroCount - 1) / 5;

        if(tick) tickGap = tick;
        guideMax = setMax < 10 ? (Math.ceil(setMax/tickGap) * tickGap) + 1 : Math.ceil(setMax/tickGap) * tickGap;
        if(guideMax == setMax) guideMax += tickGap;

        tickArr = new Array();
        for(var t=0; t<(guideMax / tickGap) + 1; t++){
            tickArr.push(t * tickGap);
        }
    }
    calcTick();

    // 차트 부분 그리기 ------
    var svgChart    = addSvg('g'),
        svgSets     = new Array();

    var setWidth    = (graphWidth - guideTxGap) / dataLen;

    svgChart.classList.add('chart');
    svgGraph.appendChild(svgChart);

    for(var n = 0; n<dataLen; n++){
        var set     = addSvg('g'),
            setTx   = addSvg('g'),
            labelTx = addSvg('text'),
            setBar  = addSvg('g');
        set.classList.add('chart-set');
        setTx.classList.add('set-name'),
        setBar.classList.add('set-bar');
        
        labelTx.textContent = labels[n];
        labelTx.setAttribute('text-anchor', 'middle');
        // labelTx.setAttribute('alignment-baseline', 'middle');
        setTx.setAttribute('width', '100%');

        setTx.appendChild(labelTx);
        set.appendChild(setTx);
        set.appendChild(setBar);
        svgChart.appendChild(set);
        svgSets.push(set);

        set.style.transform = 'translate('+((setWidth * n) + guideTxGap)+'px, 0px)';
        labelTx.setAttribute('x', setWidth / 2);
        labelTx.setAttribute('y', graphHeight + 20);
    }

    sets    = svgChart.querySelectorAll('.chart-set');

    Array.prototype.forEach.call(sets, function(set, idx){
        for(var s=0; s<setLen; s++){
            var barWrap     = addSvg('g'),
                item        = addSvg('rect'),
                tx          = addSvg('text'),
                val         = dataset[s].data[idx],
                valHeight   = Math.round(graphHeight * (val/guideMax)),
                valTop      = graphHeight - valHeight,
                //line    = 'M 0 '+ graphHeight +' V '+ valH +' H '+ barWidth +' V '+ graphHeight +' Z',
                color       = dataset[s].color ? dataset[s].color : '#aaa';
           // item.setAttribute('d', line);
            item.setAttribute('x', 0);
            item.setAttribute('y', valTop);
            item.setAttribute('width', barWidth);
            item.setAttribute('height', valHeight);
            item.setAttribute('fill', color);
            item.classList.add('fill');
            tx.textContent = val;
            tx.classList.add('barVal');
            tx.setAttribute('x', (barWidth / 2));
            tx.setAttribute('y', valTop);
            
            barWrap.appendChild(item);
            barWrap.appendChild(tx);

            barWrap.setAttribute('data-val', val);
            barWrap.setAttribute('data-valTop', valTop);
            barWrap.setAttribute('data-setnum', s);
            set.querySelector('.set-bar').appendChild(barWrap);
            barWrap.classList.add('bar');

            var aniTxH = '<animate attributeName="height" values="0;'+valHeight+'" dur="1s" repeatCount="1" calcMode="spline" keyTimes="0; 1" keySplines="0.6 0 0.4 1;"/>',
                aniTxT = '<animate attributeName="y" values="'+ graphHeight +';'+valTop+'" dur="1s" repeatCount="1" calcMode="spline" keyTimes="0; 1" keySplines="0.6 0 0.4 1;"/>';
            item.insertAdjacentHTML('beforeend', aniTxH);
            item.insertAdjacentHTML('beforeend', aniTxT);
            animeEnd(item);
        }
        barPosSet(set);
        barOverSet(set);
    });

    // bar animate 끝난 후 삭제
    function animeEnd(item){
        var animes = item.querySelectorAll('animate');
        Array.prototype.forEach.call(animes, function(ani){
            ani.addEventListener('endEvent', function(){
                item.removeChild(ani);
            });
        });
    }

    // bar set 위치 설정
    function barPosSet(setArea){
        var barset  = setArea.querySelector('.set-bar'),
            bars    = setArea.querySelectorAll('.bar:not(.hide-set)');

        Array.prototype.forEach.call(bars, function(bar, idx){
            var box     = bar.getBBox(),
                boxLeft = (box.width + barGap) * idx;
            bar.style.transform = 'translate('+ boxLeft +'px, 0)';
        });
        
        var barleft = Math.round((setWidth / 2) - (barset.getBBox().width / 2));
        barset.style.transform = 'translate('+barleft+'px, 0)';
    }

    // bar set 위치설정 - 여러개 동시 적용
    function barPosSetAll(){
        Array.prototype.forEach.call(sets, function(set){
            barPosSet(set);
        });
    }

    // bar hover 시 tooltip 관련 설정
    function barOverSet(tg){
        var bars    = tg.querySelectorAll('.bar'),
            tit     = tg.querySelector('.set-name text').textContent;
        Array.prototype.forEach.call(bars, function(bar){
            var box = bar.getBoundingClientRect();
            bar.addEventListener('mouseover', function(e){
                e.stopPropagation();
                var val     = this.getAttribute('data-val'),
                    valTop  = Number(this.getAttribute('data-valTop')),
                    setNum  = this.getAttribute('data-setnum');
                tooltipTit.textContent = tit;
                if(setLen > 1) tooltipVal.textContent = dataset[setNum].name + ':' + val;
                else tooltipVal.textContent = val;
                toolitp.style.opacity = 1;
                toolitp.style.zIndex = 100;
                toolitp.style.left = (box.left - wrapBox.left) + 'px';
                toolitp.style.top = ((valTop + wrapPadding.top) - toolitp.offsetHeight) + 'px';
            });
            bar.addEventListener('mouseleave', function(e){
                toolitp.style.opacity = 0;
                toolitp.style.zIndex = -1;
            });
        });
    }

    // 특정 set 보이기
    function setShow(num){
        Array.prototype.forEach.call(sets, function(set){
            var tgBar = set.querySelector('[data-setnum="'+num+'"]');
            tgBar.classList.remove('hide-set');
        });
        barPosSetAll();
    }
    // 특정 set 감추기
    function setHide(num){
        Array.prototype.forEach.call(sets, function(set){
            var tgBar = set.querySelector('[data-setnum="'+num+'"]');
            tgBar.classList.add('hide-set');
        });
        barPosSetAll();
    }

    // legend 버튼 클릭 기능
    function lgdBtnSet(){
        lgdBtns = legend.querySelectorAll('button');
        Array.prototype.forEach.call(lgdBtns, function(btn, idx){
            btn.addEventListener('click', function(){
                if(this.classList.contains('del')){
                    this.classList.remove('del');
                    setShow(idx);
                } else {
                    this.classList.add('del');
                    setHide(idx);
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
    guideLineSet();
    wrap.classList.add('on');
}