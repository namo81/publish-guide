/*
    2022-03-16 : v1.0.0 추가
    common.js 필요
*/

/* option 항목

area        : 그려질 영역 최상위 태그
direction   : vertical(세로막대) = 기본값 / horison(가로막대)
labels      : 데이터 구분 문구
 
  // 일반 막대
data        : 차트 데이터
colors      : 차트 컬러
  // 그룹 막대
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

function nChartHtml(option){
    var wrap 		    = typeof option.area === 'string' ? document.querySelector(option.area) : option.area;
    var labels          = option.labels,
        stack           = option.stack ? option.stack : false,
        direction       = option.direction ? option.direction : 'vertical',
        dataset         = option.dataset,

        chartSize       = option.chart,
        titleOpt        = option.title,
        legendOpt       = option.legend ? option.legend : true,
        tick            = option.tick;

    var dataLen         = labels.length,
        setLen          = dataset.length;

    var chart, legend, toolitp, tooltipTit, tooltipVal;
    var lis, lgdBtns;

    wrap.style.position = 'relative';
    if(direction == 'horison') wrap.classList.add('hor');

    var wrapWidth, wrapHeight;
    /** 차트 크기 초기 설정 */
    function wrapSizeSet(){
        if(!chartSize) {
            wrapWidth   = 100 + '%';
            wrapHeight  = (wrap.offsetWidth * 0.4) + 'px';
        } else {
            wrapWidth   = chartSize.width ? chartSize.width : 100 + '%';
            wrapHeight  = chartSize.height ? chartSize.height : (wrap.offsetWidth * 0.4) + 'px';
        }
        wrap.style.width = wrapWidth;
        direction == 'vertical' ? wrap.style.height = wrapHeight : wrap.style.height = 'auto';
    }

    /** 타이틀 관련 초기 설정 */
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
    }

    /** legend 설정 */
    function drawLegend(){
        if(legendOpt == true) {
            var lgdHtml = '<div class="legend"><ul class="legend-list">';
                if(setLen > 1) {
                    for(var n = 0; n<setLen; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+dataset[n].color+'"></i>'+dataset[n].name+'</button></li>'; }
                } else {
                    for(var n = 0; n<dataLen; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+dataset[0].color[n]+'"></i>'+labels[n]+'</button></li>'; }
                }
                lgdHtml += '</ul></div>';
            wrap.insertAdjacentHTML('beforeend', lgdHtml);
        }
        legend  = wrap.querySelector('.legend');
    }
    
    // tooltip 설정
    var ttTag = '<div class="tooltip">';
        ttTag += '<p class="tt-title"></p>';
        ttTag += '<p class="tt-value"></p>';
        ttTag += '</div>';

    wrap.insertAdjacentHTML('beforeend', ttTag);
    toolitp     = wrap.querySelector('.tooltip'),
    tooltipTit  = toolitp.querySelector('.tt-title'),
    tooltipVal  = toolitp.querySelector('.tt-value');

    /** 데이터 값 관련 */
    var maxArr, minArr, maxVal, minVal, stackArr, stackMax;

    /** 최대값/최소값 산출 */
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

    /** 최대값/최소값 산출 - stack 형 */
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
    
    var guideMax, tickGap, tickArr;
    /** 배경 라인 설정 */
    function calcTick(){
        var setMax      = stack == true && setLen > 1 ? stackMax : maxVal;
            zeroCount   = Number(String(setMax).length);
            tickGap     = Math.pow(10, zeroCount - 1) / 5;
        
        if(setMax < 100 || setMax > 50000) tickGap = Math.pow(10, zeroCount - 1);
        
        if(tick) tickGap = tick;
        guideMax = setMax < 10 ? (Math.ceil(setMax/tickGap) * tickGap) + 1 : Math.ceil(setMax/tickGap) * tickGap;
        if(guideMax == setMax) guideMax += tickGap;

        tickArr = new Array();
        for(var t=0; t<(guideMax / tickGap) + 1; t++){
            tickArr.push(t * tickGap);
        }
    }

    /** 차트 부분 그리기 */
    function drawChart(){
        var chartHtml = '<div class="chart"><ul class="bar-list">';
            for(var n = 0; n<dataLen; n++){ chartHtml += '<li data-num="'+n+'"><div class="bars"></div><p class="name">'+labels[n]+'</p></li>'; }
            chartHtml += '</ul></div>';

        wrap.insertAdjacentHTML('beforeend', chartHtml);

        chart   = wrap.querySelector('.chart'),
        lis     = chart.querySelectorAll('li');

        Array.prototype.forEach.call(lis, function(li, idx){
            var item = '';
            for(var s=0; s<setLen; s++){
                var val     = dataset[s].data[idx],
                    per     = (val / guideMax) * 100,
                    color   = '#aaa';
                if(setLen > 1) color = dataset[s].color;
                else color = dataset[0].color[idx];
                if(direction == 'vertical') item += '<p class="bar" data-val="'+val+'" data-setnum="'+s+'" style="height:'+per+'%"><span class="fill" style="background-color:'+color+'"><i>'+ comma(val) +'</i></span></p>';
                else item += '<p class="bar" data-val="'+val+'" data-setnum="'+s+'" style="width:'+per+'%"><span class="fill" style="background-color:'+color+'"><i>'+ comma(val) +'</i></span></p>';
            }
            li.querySelector('.bars').insertAdjacentHTML('beforeend', item);
            if(direction == 'horison') li.style.height = li.offsetHeight + 'px';
            barOverSet(li);
        });
    }

    /** bar 영역 마우스 오버 시 툴팁 기능 */
    function barOverSet(tg){
        var bars    = tg.querySelectorAll('.bar .fill'),
            tit     = tg.querySelector('.name').innerText;
        Array.prototype.forEach.call(bars, function(bar){
            bar.addEventListener('mouseover', function(e){
                e.stopPropagation();
                var val     = this.querySelector('i').innerText,
                    setNum  = this.parentNode.getAttribute('data-setnum');
                tooltipTit.innerText = tit;
                if(setLen > 1) tooltipVal.innerText = dataset[setNum].name + ':' + val;
                else tooltipVal.innerText = val;
                toolitp.style.opacity = 1;
                toolitp.style.zIndex = 100;
                toolitp.style.left = direction == 'vertical' ? this.parentNode.offsetLeft + this.offsetLeft + 'px' : this.parentNode.offsetLeft + chart.offsetLeft + (this.offsetWidth/2) + 'px';
                toolitp.style.top = ((this.parentNode.offsetTop + chart.offsetTop) - toolitp.offsetHeight) + 'px';
            });
            bar.addEventListener('mouseleave', function(e){
                toolitp.style.opacity = 0;
                toolitp.style.zIndex = -1;
            });
        });
    }

    /** 특정 set 보이기 */
    function setShow(num){
        Array.prototype.forEach.call(lis, function(li){
            var tgBar = li.querySelector('[data-setnum="'+num+'"]');
            tgBar.classList.remove('hide-set');
        });
    }
    /** 특정 set 감추기 */
    function setHide(num){
        Array.prototype.forEach.call(lis, function(li){
            var tgBar = li.querySelector('[data-setnum="'+num+'"]');
            tgBar.classList.add('hide-set');
        });
    }

    /** legend 버튼 클릭 기능 */
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

    /** 가이드라인 그리기 */
    function guideLineSet(){
        var listTag = '<ul class="guide-line">';
        for(var t=0; t<tickArr.length; t++){
            if(direction == 'vertical') listTag += '<li style="bottom:'+ (tickArr[t]/guideMax) * 100 +'%"><p class="guide-tx">'+ comma(tickArr[t]) +'</p></li>';
            else listTag += '<li style="left:'+ (tickArr[t]/guideMax) * 100 +'%"><p class="guide-tx">'+ comma(tickArr[t]) +'</p></li>';
        }
        listTag += '</ul>';
        chart.insertAdjacentHTML('afterbegin', listTag);
    }

    function chart_init(){
        wrapSizeSet();
        titleSet();
        drawLegend();

        calcMaxMin();
        if(stack == true && setLen > 1) calcMaxStack();
        
        calcTick();
        drawChart();
        if(setLen > 1) lgdBtnSet();
        guideLineSet();
    }
    chart_init();

    /** 다시 그리기 (모든 옵션) */
    this.reDraw = function(){
        while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
        chart_init();
    }
    
    /** dataset.data 만 변경 시 */
    this.data_update = function(){
        wrap.removeChild(chart);

        calcMaxMin();
        if(stack == true && setLen > 1) calcMaxStack();
        
        calcTick();
        drawChart();
        guideLineSet();
    }
}