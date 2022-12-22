/*
    2022-03-16 : v1.0.0 추가
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

    // 차트 크기 초기 설정
    var wrapWidth, wrapHeight;
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
    wrapSizeSet();

    // 타이틀 관련 초기 설정
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
    titleSet();

    // legend 설정
    function drawLegend(){
        if(legendOpt == true) {
            var lgdHtml = '<div class="legend"><ul class="legend-list">';
                for(var n = 0; n<setLen; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+dataset[n].color+'"></i>'+dataset[n].name+'</button></li>'; }
                lgdHtml += '</ul></div>';
            wrap.insertAdjacentHTML('beforeend', lgdHtml);
        }
        legend  = wrap.querySelector('.legend');
    }
    drawLegend();
    
    // tooltip 설정
    var ttTag = '<div class="tooltip">';
        ttTag += '<p class="tt-title"></p>';
        ttTag += '<p class="tt-value"></p>';
        ttTag += '</div>';

    wrap.insertAdjacentHTML('beforeend', ttTag);
    toolitp     = wrap.querySelector('.tooltip'),
    tooltipTit  = toolitp.querySelector('.tt-title'),
    tooltipVal  = toolitp.querySelector('.tt-value');

    // 데이터 값 관련
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
    

    // 배경 라인 설정
    var guideMax, tickGap, tickArr;
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

    // 차트 부분 그리기
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
                per     = Math.floor((val / guideMax) * 100),
                color   = dataset[s].color ? dataset[s].color : '#aaa';
            if(direction == 'vertical') item += '<p class="bar" data-val="'+val+'" data-setnum="'+s+'" style="height:'+per+'%"><span class="fill" style="background-color:'+color+'"><i>'+val+'</i></span></p>';
            else item += '<p class="bar" data-val="'+val+'" data-setnum="'+s+'" style="width:'+per+'%"><span class="fill" style="background-color:'+color+'"><i>'+val+'</i></span></p>';
        }
        li.querySelector('.bars').insertAdjacentHTML('beforeend', item);
        if(direction == 'horison') li.style.height = li.offsetHeight + 'px';
        barOverSet(li);
    });

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
                toolitp.style.left = direction == 'vertical' ? this.parentNode.offsetLeft + this.offsetLeft + 'px' : this.parentNode.offsetLeft + this.offsetWidth + 'px';
                toolitp.style.top = ((this.parentNode.offsetTop + chart.offsetTop) - toolitp.offsetHeight) + 'px';
            });
            bar.addEventListener('mouseleave', function(e){
                toolitp.style.opacity = 0;
                toolitp.style.zIndex = -1;
            });
        });
    }

    // 특정 set 보이기
    function setShow(num){
        Array.prototype.forEach.call(lis, function(li){
            var tgBar = li.querySelector('[data-setnum="'+num+'"]');
            tgBar.classList.remove('hide-set');
        });
    }
    // 특정 set 감추기
    function setHide(num){
        Array.prototype.forEach.call(lis, function(li){
            var tgBar = li.querySelector('[data-setnum="'+num+'"]');
            tgBar.classList.add('hide-set');
        });
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

    function guideLineSet(){
        var listTag = '<ul class="guide-line">';
        for(var t=0; t<tickArr.length; t++){
            if(direction == 'vertical') listTag += '<li style="bottom:'+ Math.floor((tickArr[t]/guideMax) * 100) +'%"><p class="guide-tx">'+ tickArr[t] +'</p></li>';
            else listTag += '<li style="left:'+ Math.floor((tickArr[t]/guideMax) * 100) +'%"><p class="guide-tx">'+ tickArr[t] +'</p></li>';
        }
        listTag += '</ul>';
        chart.insertAdjacentHTML('afterbegin', listTag);
    }
    guideLineSet();
}