/*
    2022-03-16 : v1.1.0 추가
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
tooltip     : 마우스 오버 시 표기되는 정보 창
    show        : 보이기 여부 (boolean)
    share       : 세트별 묶음보기 여부(boolean)
tick        : 데이터 기준선 표시 간격 설정

*/

function nChartHtml(option){
    const wrap 		    = typeof option.area === 'string' ? document.querySelector(option.area) : option.area;
    let labels          = option.labels,
        stack           = option.stack ? option.stack : false,
        direction       = option.direction ? option.direction : 'vertical',
        dataset         = option.dataset,

        chartSize       = option.chart,
        titleOpt        = option.title,
        legendOpt       = option.legend ? option.legend : true,
        tick            = option.tick,

        tooltipOpt      = option.tooltip;

    let dataLen         = labels.length,
        setLen          = dataset.length;

    let chart, legend; 
    let tooltip, tooltipTit, tooltipVal, tooltip_show, tooltip_share;
    let lis, lgdBtns;

    let group_arr = [], group_color_arr = [];

    wrap.style.position = 'relative';
    if(direction == 'horison') wrap.classList.add('hor');

    let wrapWidth, wrapHeight;
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
    let titleShow, titleTx;
    function titleSet(){
        if(!titleOpt) {
            titleShow = true;
            titleTx = 'Chart Title';
        } else {
            titleShow = titleOpt.show != undefined ? titleOpt.show : true;
            titleTx = titleOpt.text ? titleOpt.text : 'Chart Title';
        }
        if(titleShow == true) wrap.insertAdjacentHTML('afterbegin', '<div class="chart-title">'+titleTx+'</div>');
    }

    /** tooltip 관련 초기 설정 */
    if(tooltipOpt == undefined) {
        tooltip_show = true;
        tooltip_share = false;
    } else {
        tooltip_show = tooltipOpt.show != undefined ? tooltipOpt.show : true;
        tooltip_share = tooltipOpt.share ? tooltipOpt.share : false;
    }

    /** legend 설정 */
    function drawLegend(){
        if(legendOpt == true) {
            let lgdHtml = '<div class="legend"><ul class="legend-list">';
            if(!dataset[0].group) {
                for(let n = 0; n<setLen; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+dataset[n].color+'"></i>'+dataset[n].name+'</button></li>'; }
            } else {
                for(let n = 0; n<group_arr.length; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+group_color_arr[n]+'"></i>'+group_arr[n]+'</button></li>'; }
            }
            lgdHtml += '</ul></div>';
            wrap.insertAdjacentHTML('beforeend', lgdHtml);
        }
        legend  = wrap.querySelector('.legend');
    }
    
    // tooltip 설정
    let ttTag = '<div class="tooltip">';
        ttTag += '<p class="tt-title"></p>';
        ttTag += tooltip_share ? '<div class="tt-value"><ul></ul></div>' : '<p class="tt-value"></p>';
        ttTag += '</div>';

    wrap.insertAdjacentHTML('beforeend', ttTag);
    tooltip     = wrap.querySelector('.tooltip'),
    tooltipTit  = tooltip.querySelector('.tt-title'),
    tooltipVal  = tooltip.querySelector('.tt-value');

    /** 데이터 값 관련 */
    let maxArr, minArr, maxVal, minVal, stackArr, stackMax;

    /** 최대값/최소값 산출 */
    function calcMaxMin(){
        if(setLen > 1) {
            maxArr = new Array();
            minArr = new Array();
            for(let s=0; s<setLen; s++){
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

    function calcMaxStackType(){
        dataset[0].group ? calcMaxStack_group() : calcMaxStack();
    }

    /** 최대값/최소값 산출 - stack 형 */
    function calcMaxStack(){
        stackArr = new Array();
        for(let d=0; d<dataLen; d++){
            let secArr = new Array();
            for(let s=0; s<setLen; s++){
                secArr.push(dataset[s].data[d]);
            }
            stackArr.push(secArr.reduce(function add(acc, curVal){ return acc + curVal}, 0));
        }
        stackMax = Math.max.apply(null, stackArr);
        wrap.classList.add('stack');
    }

    /** 최대값/최소값 산출 - stack 형 + group */
    function calc_group_max(obj){
        let max_val_arr = [];
        Object.keys(obj).forEach((key)=>{
            max_val_arr.push(Math.max.apply(null, obj[key].array[0]));
        });
        return Math.max.apply(null, max_val_arr);
    }
    function calcMaxStack_group(){
        let max_arr = new Object();
        dataset.forEach((set, idx)=>{
            if(!max_arr[set.group]) {
                max_arr[set.group] = new Object;
                max_arr[set.group].array = new Array();
                max_arr[set.group].array.push(set.data);
            } else {
                let sum_array = max_arr[set.group].array[0].map((x, y) => x +  set.data[y]);
                max_arr[set.group].array[0] = sum_array;
            }
        });
        stackMax = calc_group_max(max_arr);
        group_arr_set();
        wrap.classList.add('stack');
        wrap.classList.add('group');
    }
    
    let guideMax, tickGap, tickArr;
    /** 배경 라인 설정 */
    function calcTick(){
        let setMax      = stack == true && setLen > 1 ? stackMax : maxVal;
            zeroCount   = Number(String(setMax).length);
            unit        = Math.pow(10, zeroCount - 1),
            tickGap;
            //tickGap     = unit / 5;
        
        //if(setMax < 100 || setMax > 50000) tickGap = Math.pow(10, zeroCount - 1);
        
        tickGap = tick_convert(setMax, unit);
        if(tick) tickGap = tick;
        guideMax = setMax < 10 ? (Math.ceil(setMax/tickGap) * tickGap) + 1 : Math.ceil(setMax/tickGap) * tickGap;
        if(guideMax == setMax) guideMax += tickGap;

        let tick_length = guideMax / tickGap;

        tickArr = new Array();
        for(let t=0; t<tick_length + 1; t++){
            tickArr.push(t * tickGap);
        }
    }
    function tick_convert(max, unit){
        let result,
            int = Math.floor(max / 3);
        if(int < unit / 2) result = unit / 2
        else if ( int < unit && int > unit / 2 ) result = unit;
        else result = Math.ceil(int / unit) * unit;
        return result;
    }


    function drawChart(){
        let chartHtml = '<div class="chart"><div class="chart-inner"><ul class="bar-list">';
        for(let n = 0; n<dataLen; n++){ chartHtml += '<li data-num="'+n+'"></li>'; }
        chartHtml += '</ul></div></div>';

        wrap.insertAdjacentHTML('beforeend', chartHtml);

        chart   = wrap.querySelector('.chart'),
        lis     = chart.querySelectorAll('li');
        
        lis.forEach(function(li, idx){
            let name = createDom('p', 'name');
            name.textContent = labels[idx];

            let bars, group_bars = [];
            
            if(dataset[0].group) {
                group_arr.forEach((group)=>{
                    let bar = createDom('div', 'bars');
                    group_bars.push(bar);
                    li.appendChild(bar);
                });
            } else {
                bars = createDom('div', 'bars');
                li.appendChild(bars);
            }
            
            for(let s=0; s<setLen; s++){
                let item    = '',
                    val     = dataset[s].data[idx],
                    per     = (val / guideMax) * 100,
                    color   = '#aaa', group_idx;
                if(setLen > 1) color = dataset[s].color;
                else color = dataset[s].color;
                if(direction == 'vertical') item += '<p class="bar" data-val="'+val+'" data-setnum="'+s+'" style="height:'+per+'%"><span class="fill" style="background-color:'+color+'"><i>'+ comma(val) +'</i></span></p>';
                else item += '<p class="bar" data-val="'+val+'" data-setnum="'+s+'" style="width:'+per+'%"><span class="fill" style="background-color:'+color+'"><i>'+ comma(val) +'</i></span></p>';
                if(dataset[0].group) {
                    group_idx = group_arr.indexOf(dataset[s].group);
                    group_bars[group_idx].insertAdjacentHTML('beforeend', item)
                } else bars.insertAdjacentHTML('beforeend', item)
            }
            if(direction == 'horison') li.style.height = li.offsetHeight + 'px';
            li.appendChild(name);
            if(tooltip_show == true) {
                tooltip_share ? barOverSet_share(li) : barOverSet(li);
            }
        });
    }

    /** bar 영역 마우스 오버 시 툴팁 기능 - bar  */
    function barOverSet(tg){
        let bars    = tg.querySelectorAll('.bar .fill'),
            tit     = tg.querySelector('.name').innerText,
            chart_left = chart.offsetLeft + 30;
        Array.prototype.forEach.call(bars, function(bar){
            bar.addEventListener('mouseover', function(e){
                e.stopPropagation();
                let val     = this.querySelector('i').innerText,
                    setNum  = this.parentNode.getAttribute('data-setnum');
                    parent_left = chart_left + this.parentNode.offsetLeft;
                tooltipTit.innerText = tit;
                if(setLen > 1) tooltipVal.innerText = dataset[setNum].name + ':' + val;
                else tooltipVal.innerText = val;
                tooltip.style.opacity = 1;
                tooltip.style.zIndex = 100;
                tooltip.style.left = direction == 'vertical' ? parent_left + 'px' : parent_left + chart.offsetLeft + (this.offsetWidth/2) + 'px';
                tooltip.style.top = ((this.parentNode.offsetTop + chart.offsetTop) - tooltip.offsetHeight) + 'px';
            });
            bar.addEventListener('mouseleave', function(e){
                tooltip.style.opacity = 0;
                tooltip.style.zIndex = -1;
            });
        });
    }

    /** bar 영역 마우스 오버 시 툴팁 기능 - set */
    function barOverSet_share(tg){
        let li      = tg,
            tit     = tg.querySelector('.name').textContent,
            tooltip_ul = tooltipVal.querySelector('ul'),
            chart_left = chart.offsetLeft + 30;
        tooltip.classList.add('share');
        li.addEventListener('mouseover', function(e){
            e.stopPropagation();
            while (tooltip_ul.firstChild) tooltip_ul.removeChild(tooltip_ul.firstChild);

            let bars = li.querySelectorAll('.bar .fill'),
                dataIdx = li.getAttribute('data-num');
            tooltipTit.textContent = tit;
            bars.forEach((bar)=>{
                let li = createDom('li'),
                    marker = createDom('span', 'marker'),
                    label = createDom('span', 'label'),
                    val_tx = createDom('span', 'val'),
                    setNum = bar.parentNode.getAttribute('data-setnum');
                marker.style.backgroundColor = dataset[setNum].color;
                label.textContent = dataset[setNum].name;
                val_tx.textContent = dataset[setNum].data[dataIdx];
                li.appendChild(marker);
                li.appendChild(label);
                li.appendChild(val_tx);
                tooltip_ul.appendChild(li);
            });
            tooltip.style.opacity = 1;
            tooltip.style.zIndex = 100;
            tooltip.style.left = direction == 'vertical' ? chart_left + this.offsetLeft + (this.offsetWidth/2) + 'px' : chart.offsetLeft + (this.offsetWidth/2) + 'px';
            tooltip.style.top = direction == 'vertical' ? chart.offsetTop + 'px' : ((this.offsetTop + chart.offsetTop)) + 'px';
        });
        li.addEventListener('mouseleave', function(e){
            tooltip.style.opacity = 0;
            tooltip.style.zIndex = -1;
        });
    }

    /** 특정 set 보이기 */
    function setShow(num){
        Array.prototype.forEach.call(lis, function(li){
            let tgBar = li.querySelector('[data-setnum="'+num+'"]');
            tgBar.classList.remove('hide-set');
        });
    }
    /** 특정 set 감추기 */
    function setHide(num){
        Array.prototype.forEach.call(lis, function(li){
            let tgBar = li.querySelector('[data-setnum="'+num+'"]');
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
    
    /** data 내 group 값 있을 경우 관련 배열 생성 */
    function group_arr_set(){
        dataset.forEach((data)=>{
            if(group_arr.indexOf(data.group) == -1) {
                group_arr.push(data.group);
                group_color_arr.push(data.color);
            }
        });
    }

    /** 가이드라인 그리기 */
    function guideLineSet(){
        let listTag = '<ul class="guide-line">';
        for(let t=0; t<tickArr.length; t++){
            if(direction == 'vertical') listTag += '<li style="bottom:'+ (tickArr[t]/guideMax) * 100 +'%"><p class="guide-tx">'+ comma(tickArr[t]) +'</p></li>';
            else listTag += '<li style="left:'+ (tickArr[t]/guideMax) * 100 +'%"><p class="guide-tx">'+ comma(tickArr[t]) +'</p></li>';
        }
        listTag += '</ul>';
        chart.insertAdjacentHTML('afterbegin', listTag);
    }

    function chart_init(){
        wrapSizeSet();
        titleSet();

        calcMaxMin();
        if(stack == true && setLen > 1) calcMaxStackType();

        drawLegend();        
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
        if(stack == true && setLen > 1) calcMaxStackType();
        
        calcTick();
        drawChart();
        guideLineSet();
    }
}