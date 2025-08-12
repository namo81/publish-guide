/*
    2022-03-16 : v1.1.0 추가
    common.js 필요
*/

/* option 항목

area        : 그려질 영역 최상위 태그
direction   : vertical(세로막대) = 기본값 / horison(가로막대)
labels      : 데이터 구분 문구
 
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
legend      : legend 
    show        : 보이기 여부 (boolean)
    position    : 위치 (null : 상단 / 'bottom' : 하단)
datalabel   : bar 내부에 값 표시 관련
    show        : 보이기 여부 (boolean)
    percent     : 실제 입력값대신 % 비율로 표출할지 여부 (boolean)
tooltip     : 마우스 오버 시 표기되는 정보 창
    show        : 보이기 여부 (boolean)
    share       : 세트별 묶음보기 여부(boolean)
    tx_group    : 제목 하단에 '그룹' 표시 여부 (boolean) - 그룹이 있는 데이터만 적용
    area        : 세트별 묶음보기 - 묶음범위 (null : 기본, 세트전체, 'group' : 세트 내 group 단위 묶음)
    unit        : 값 뒤에 붙일 단위 (건/ 명 등)
    percent     : 입력된 값 기준 % 로 표시할지 여부 (boolean - 기본은 false) - true 일 경우 기본값 뒤에 (00%) 형식으로 표시
tick        : 데이터 기준선 표시 간격 설정
stack       : 중첩 막대 설정여부
    enabled : 적용여부 (boolean)
    intersection : 교집합 설정여부 (기본 false) - 각 값을 따로 표현할지, 가장 큰값 기준으로 나머지 값을 그 위에 표현할지 여부

*/

function nChartHtml(option){
    const nChart = this;
    nChart.wrap 		    = typeof option.area === 'string' ? document.querySelector(option.area) : option.area;

    let labels          = option.labels,
        stack           = option.stack,
        direction       = option.direction ? option.direction : 'vertical',
        dataset         = option.dataset,

        chartSize       = option.chart,
        titleOpt        = option.title,
        legendOpt       = option.legend,
        tick            = option.tick,

        datalabelOpt    = option.datalabel,

        tooltipOpt      = option.tooltip;

    let dataLen         = labels.length,
        setLen          = dataset.length;

    /** tooltip 관련 변수 초기 설정 */
    if(tooltipOpt == undefined) {
        tooltipOpt = new Object();
        tooltipOpt.show = true;
        tooltipOpt.share = false;
        tooltipOpt.tx_group = false;
        tooltipOpt.unit = '';
        tooltipOpt.percent = false;
    } else {
        tooltipOpt.show = tooltipOpt.show != undefined ? tooltipOpt.show : true;
        tooltipOpt.area = tooltipOpt.area ? tooltipOpt.area : null;
        tooltipOpt.unit = tooltipOpt.unit ? tooltipOpt.unit : '';
    }

    /** legend 관련 변수 초기 설정 */
    if(legendOpt == undefined) {
        legendOpt = new Object();
        legendOpt.show = true;
        legendOpt.position = false;
    } else {
        legendOpt.show = legendOpt.show != undefined ? legendOpt.show : true;
    }

    /** datalabel 관련 변수 초기 설정 */
    if(datalabelOpt == undefined) {
        datalabelOpt = new Object();
        datalabelOpt.show = false;
        datalabelOpt.percent = false;
    }
    
    if(stack == undefined) {
        stack = new Object();
        stack.enabled = false;
        stack.intersection = false;
    }

    // 내부용 변수
    let chart, chart_inner, bars_wid, legend, 
        tooltip, tooltipTit, tooltipGroup, tooltipVal, tooltip_left,
        lis, lgdBtns,
        wrapWidth, wrapHeight,

        tags = option.tags || null,

        group = false,
        group_arr = [], group_color_arr = [],

        temp_dataset = structuredClone(dataset); // dataset 초기데이터 저장용 (특정 dataset - show/hide 용)

    for(let key in dataset){
	    if(dataset[key].group !== undefined) { group = true; break }
	}
    
    // 기본 구조 생성 ------------
    nChart.wrap.style.position = 'relative';
    chart = createDom('div', 'chart');
    chart_inner = createDom('div', 'chart-inner');
    chart.appendChild(chart_inner);
    nChart.wrap.appendChild(chart);

    // 기본구조 - 클래스 설정
    if(direction == 'horison') nChart.wrap.classList.add('hor');
    if(stack.intersection == true) chart_inner.classList.add('intersection');

    /** 차트 크기 초기 설정 */
    function wrapSizeSet(){
        if(!chartSize) {
            wrapWidth   = 100 + '%';
            wrapHeight  = (nChart.wrap.offsetWidth * 0.6) + 'px';
        } else {
            wrapWidth   = chartSize.width ? chartSize.width : 100 + '%';
            wrapHeight  = chartSize.height ? chartSize.height : (nChart.wrap.offsetWidth * 0.6) + 'px';
        }
        nChart.wrap.style.width = wrapWidth;
        direction == 'vertical' ? nChart.wrap.style.height = wrapHeight : nChart.wrap.style.height = 'auto';
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
        if(titleShow == true) nChart.wrap.insertAdjacentHTML('afterbegin', '<div class="chart-title">'+titleTx+'</div>');
    }

    /** legend 설정 */
    function drawLegend(){
        let lgdHtml = '<div class="legend"><ul class="legend-list">';
        if(!group) {
            for(let n = 0; n<setLen; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+dataset[n].color+'"></i>'+dataset[n].name+'</button></li>'; }
        } else {
            for(let n = 0; n<group_arr.length; n++){ lgdHtml += '<li data-setnum="'+n+'"><button type="button" class="name"><i class="bullet" style="background-color:'+group_color_arr[n]+'"></i>'+group_arr[n]+'</button></li>'; }
        }
        lgdHtml += '</ul></div>';
        legendOpt.position == 'bottom' ? nChart.wrap.insertAdjacentHTML('beforeend', lgdHtml) : nChart.wrap.insertAdjacentHTML('afterbegin', lgdHtml);
        legend  = nChart.wrap.querySelector('.legend');
    }
    
    // tooltip 설정
    function set_tooltip(){
        let ttTag = '<div class="tooltip">';
            ttTag += '<p class="tt-title"></p>';
            ttTag += tooltipOpt.tx_group == true ? '<p class="tt-group"></p>' : '';
            ttTag += tooltipOpt.share ? '<div class="tt-value"><ul></ul></div>' : '<p class="tt-value"></p>';
            ttTag += '</div>';

        chart.insertAdjacentHTML('beforeend', ttTag);
        tooltip     = chart.querySelector('.tooltip');
        tooltipTit  = tooltip.querySelector('.tt-title');
        tooltipVal  = tooltip.querySelector('.tt-value');
        if(tooltipOpt.tx_group == true) tooltipGroup  = tooltip.querySelector('.tt-group');
    }

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
            if(tooltipOpt.percent == true) calcSetMax();
        } else {
            maxVal = Math.max.apply(null, dataset[0].data);
            minVal = Math.min.apply(null, dataset[0].data);
        }
    }

    // 데이터 set 별 총합 계산 및 배열 반환
    function calcSetMax(){
        stackArr = new Array();
        for(let d=0; d<dataLen; d++){
            let secArr = new Array();
            for(let s=0; s<setLen; s++){
                secArr.push(dataset[s].data[d]);
            }
            stackArr.push(secArr.reduce(function add(acc, curVal){ return acc + curVal}, 0));
        }
    }

    function calcMaxStackType(){
        group ? calcMaxStack_group() : calcMaxStack();
    }

    /** 최대값/최소값 산출 - stack 형 */
    function calcMaxStack(){
        calcSetMax();
        stackMax = Math.max.apply(null, stackArr);
        nChart.wrap.classList.add('stack');
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
            if(set == '') return;
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
        nChart.wrap.classList.add('stack');
        nChart.wrap.classList.add('group');
    }
    
    let guideMax, tickGap, tickArr;

    /** 배경 라인 설정 */
    function calcTick(){
        let setMax      = stack.enabled && setLen > 1 ? stackMax : maxVal;
        if(stack.intersection == true) setMax = maxVal;
        let zeroCount   = Number(String(setMax).length);
            unit        = Math.pow(10, zeroCount - 1),
            tickGap;
        
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
    // tick 기본값 계산
    function tick_convert(max, unit){
        let result,
            int = Math.floor(max / 15);
        if(int < unit / 2) result = unit / 2
        else if ( int < unit && int > unit / 2 ) result = unit;
        else result = Math.ceil(int / unit) * unit;
        return result;
    }

    /**
     * 차트영역 그리기
     */
    function drawChart(){
        let chartHtml = '<ul class="bar-list">';
        for(let n = 0; n<dataLen; n++){ chartHtml += '<li data-num="'+n+'"></li>'; }
        chartHtml += '</ul>';

        chart_inner.insertAdjacentHTML('beforeend', chartHtml);

        lis     = chart.querySelectorAll('li');
        lis.forEach(function(li, idx){
            let name = createDom('p', 'name'),
                dataIdx = li.getAttribute('data-num');
            if(typeof labels[idx] === 'string') name.textContent = labels[idx];
            else {
                labels[idx].forEach((tx)=>{
                    let span = createDom('span');
                    span.textContent = tx;
                    name.appendChild(span);
                });
            }

            let bars, group_bars = [];
            
            if(idx + 1 == dataLen) li.classList.add('last');
            if(group) {
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
                if(dataset[s] != ''){
                    let item,
                        item_fill,
                        item_tx,
                        val     = dataset[s].data[idx],
                        per     = (val / guideMax) * 100,
                        color   = '#aaa', 
                        max_wid = datalabelOpt.percent ? 22 : 40,
                        group_idx;
                    if(setLen > 1) color = dataset[s].color;
                    else color = dataset[s].color;
                    item = createDom('p', 'bar');
                    item_fill = createDom('span', 'fill');
                    item_tx = createDom('i');
                    item.dataset.val = val;
                    item.dataset.setnum = s;
                    item_fill.style.backgroundColor = color;
                    item_tx.textContent = datalabelOpt.percent ? Math.round(val / stackArr[dataIdx] * 100) + '%' : comma(val);
                    item_fill.appendChild(item_tx);
                    item.appendChild(item_fill);
                    direction == 'vertical' ? item.style.height = per + '%' : item.style.width = per + '%';
                    if(datalabelOpt.show == true) item_tx.classList.add('show');
                    if(group) {
                        group_idx = group_arr.indexOf(dataset[s].group);
                        group_bars[group_idx].appendChild(item);
                    } else bars.appendChild(item);
                    
                    if(dataset[s].accent_idx == idx) li.classList.add('accent');
                    if(item.offsetWidth < max_wid ) item_tx.classList.remove('show');
                }
            }
            if(tags != null && !group) {
                let tag = createDom('p', 'tag');
                tag.textContent = tags[idx];
                bars.appendChild(tag);
                bars.classList.add('tag');
            }

            li.appendChild(name);
            if(tooltipOpt.show == true) {
                tooltipOpt.share ? barOverSet_share(li) : barOverSet(li);
            }
        });
        
        bars_wid = lis[0].offsetWidth * lis.length;
        if(bars_wid > (chart_inner.offsetWidth + 5) && direction == 'vertical') chart_inner.classList.add('wid-over');
    }

    /** bar 영역 마우스 오버 시 툴팁 기능 - bar  */
    function barOverSet(tg){
        let bars    = tg.querySelectorAll('.bar'),
            tg_num  = tg.getAttribute('data-num'),
            tit     = tg.querySelector('.name').textContent,
            chart_left_pad = 50;

        Array.prototype.forEach.call(bars, function(bar, idx){
            bar.addEventListener('mouseover', function(e){
                e.stopPropagation();
                while (tooltipVal.firstChild) tooltipVal.removeChild(tooltipVal.firstChild);

                let val     = dataset[0].data[tg_num],
                    setNum  = bar.getAttribute('data-setnum'),
                    cnt_tx;
                tooltipTit.textContent = tit;
                cnt_tx = '<span class="marker" style="background-color:'+dataset[setNum].color+'"></span><span class="label">'+dataset[setNum].name+'</span><span class="val">'+comma(val) + tooltipOpt.unit+'</span>';
                tooltipVal.insertAdjacentHTML('beforeend', cnt_tx);
                if(tooltipOpt.more != undefined) add_tooltip_more(tg_num);

                tooltip.classList.add('show');

                let parent_left = group ? tg.offsetLeft + bar.parentNode.offsetLeft : bar.offsetLeft,
                    pos_top, pos_left;

                if(direction == 'vertical') {
                    pos_top = bar.offsetTop - tooltip.offsetHeight;
                    pos_left = parent_left + (bar.offsetWidth / 2) + chart_left_pad - chart_inner.scrollLeft;
                    if(pos_left + (tooltip.offsetWidth / 2) > chart.offsetWidth) pos_left = chart.offsetWidth - (tooltip.offsetWidth / 2);
                } else {
                    pos_top = tg.offsetTop;
                    pos_left = bar.offsetWidth + chart_left_pad;
                    if(pos_left + tooltip.offsetWidth > chart.offsetWidth) pos_left = chart.offsetWidth - tooltip.offsetWidth;
                }

                if(setLen > 1 && direction == 'horison') pos_top = tg.offsetTop + bar.offsetTop;

                tooltip.style.left = pos_left + 'px';
                tooltip.style.top = pos_top >= 10 ? pos_top + 'px' : 10  + 'px';
            });
            bar.addEventListener('mouseleave', function(e){
                tooltip.classList.remove('show');
            });
        });
    }

    /** bar 영역 마우스 오버 시 툴팁 기능 - set */
    function barOverSet_share(tg){
        tooltip.classList.add('share');
        tooltipOpt.area == 'group' ? barOverSet_share_group(tg) : barOverSet_share_set(tg);
    }

    // 툴팁 - 세트기준
    function barOverSet_share_set(tg){
        let li      = tg,
            tit     = tg.querySelector('.name').textContent,
            tooltip_ul = tooltipVal.querySelector('ul'),
            dataIdx = li.getAttribute('data-num'),
            chart_left_pad = 50;

        li.addEventListener('mouseover', function(e){
            e.stopPropagation();
            while (tooltip_ul.firstChild) tooltip_ul.removeChild(tooltip_ul.firstChild);

            let fills = li.querySelectorAll('.bar .fill'),
                bar_wid = 0,
                bar_hei = 0;

            tooltipTit.textContent = tit;
            fills.forEach((fill, idx)=>{
                let li = createDom('li'),
                    setNum = fill.parentNode.getAttribute('data-setnum'),
                    val = dataset[setNum].data[dataIdx],
                    cnt_tx = '<span class="marker" style="background-color:'+dataset[setNum].color+'"></span><span class="label">'+dataset[setNum].name+'</span><span class="val">'+comma(val) + tooltipOpt.unit+'</span>';
                li.insertAdjacentHTML('beforeend', cnt_tx);
                if(tooltipOpt.percent == true) {
                    let val_tx = li.querySelector('.val'),
                        per = '(' + Math.round((val / stackArr[dataIdx]) * 1000) / 10 + '%)';
                    val_tx.insertAdjacentHTML('beforeend', per);
                }
                tooltip_ul.appendChild(li);
                if(idx == 0) {
                    bar_wid = (fill.offsetWidth + fill.parentNode.offsetLeft);
                    bar_hei = fill.parentNode.offsetTop;
                } else {
                    bar_wid = (fill.offsetWidth + fill.parentNode.offsetLeft) > bar_wid ? (fill.offsetWidth + fill.parentNode.offsetLeft) : bar_wid;
                    bar_hei = fill.parentNode.offsetTop < bar_hei ? fill.parentNode.offsetTop : bar_hei;
                }
            });

            if(tooltipOpt.more != undefined) add_tooltip_more(dataIdx);

            let pos_top, pos_left;
            if(direction == 'vertical') {
                pos_top = bar_hei - tooltip.offsetHeight;
                pos_left = li.offsetLeft + (li.offsetWidth/2) - chart_inner.scrollLeft + chart_left_pad;
                if(pos_left + (tooltip.offsetWidth / 2) > chart.offsetWidth) pos_left = chart.offsetWidth - (tooltip.offsetWidth / 2);
            } else {
                pos_top = li.offsetTop;
                pos_left = bar_wid;
                if(pos_left + tooltip.offsetWidth > chart.offsetWidth) pos_left = chart.offsetWidth - tooltip.offsetWidth;
            }

            tooltip.style.left = pos_left + 'px';
            tooltip.style.top = pos_top >= 10 ? pos_top + 'px' : 10 + 'px';

            tooltip.classList.add('show');
            if(bars_wid > chart_inner.offsetWidth) {
                tooltip_left = chart_inner.scrollLeft;
                chart_inner.addEventListener('scroll', tooltip_scroll);
            }
        }, false);
        li.addEventListener('mouseleave', function(e){
            tooltip.classList.remove('show');
            chart_inner.removeEventListener('scroll', tooltip_scroll);
        });
    }
    
    // 툹팁 - 그룹기준
    function barOverSet_share_group(tg){
        let area = tg,
            tit = tg.querySelector('.name').textContent,
            divs = area.querySelectorAll('.bars'),
            tooltip_ul = tooltipVal.querySelector('ul'),
            dataIdx = area.getAttribute('data-num'),
            chart_left_pad = 50;

        divs.forEach((div, idx)=>{
            div.addEventListener('mouseover', function(e){
                e.stopPropagation();
                while (tooltip_ul.firstChild) tooltip_ul.removeChild(tooltip_ul.firstChild);

                let bars = div.querySelectorAll('.bar .fill'),
                    target_bar = stack.intersection ? div.querySelector('.bar:first-child') : div.querySelector('.bar:last-child');
                tooltipTit.textContent = tit; //group_arr[idx];
                if(tooltipOpt.tx_group == true) tooltipGroup.textContent = group_arr[idx];
                bars.forEach((bar)=>{
                    let li = createDom('li'),
                        setNum = bar.parentNode.getAttribute('data-setnum'),
                        val = dataset[setNum].data[dataIdx],
                        cnt_tx = '<span class="marker" style="background-color:'+dataset[setNum].color+'"></span><span class="label">'+dataset[setNum].name+'</span><span class="val">'+comma(val) + tooltipOpt.unit+'</span>';
                    li.insertAdjacentHTML('beforeend', cnt_tx);
                    if(tooltipOpt.percent == true) {
                        let val_tx = li.querySelector('.val'),
                            per = '(' + Math.round((val / stackArr[dataIdx]) * 1000) / 10 + '%)';
                        val_tx.insertAdjacentHTML('beforeend', per);
                    }
                    tooltip_ul.appendChild(li);
                });
                if(tooltipOpt.more != undefined) add_tooltip_more(dataIdx, idx);

                let pos_top, pos_left;
                if(direction == 'vertical') {
                    pos_top = target_bar.offsetTop - tooltip.offsetHeight;
                    pos_left = chart_left_pad + div.parentNode.offsetLeft + (div.offsetLeft + (div.offsetWidth / 2)) - chart_inner.scrollLeft;
                    if(pos_left + (tooltip.offsetWidth / 2) > chart.offsetWidth) pos_left = chart.offsetWidth - (tooltip.offsetWidth / 2);
                } else {
                    pos_top = div.parentNode.offsetTop + div.offsetTop;
                    pos_left = target_bar.offsetLeft + target_bar.offsetWidth;
                    if(pos_left + tooltip.offsetWidth > chart.offsetWidth) pos_left = chart.offsetWidth - tooltip.offsetWidth;
                }

                tooltip.style.left = pos_left + 'px';
                tooltip.style.top = pos_top >= 10 ? pos_top + 'px' : 10 + 'px';
                tooltip.classList.add('show');
                if(bars_wid > chart_inner.offsetWidth) {
                    tooltip.style.marginLeft = '0px';
                    tooltip_left = chart_inner.scrollLeft;
                    chart_inner.addEventListener('scroll', tooltip_scroll);
                }
            });
            div.addEventListener('mouseleave', function(e){
                tooltip.classList.remove('show');
                chart_inner.removeEventListener('scroll', tooltip_scroll);
            });
        });
    }

    function add_tooltip_more(idx, group_idx){
        if(tooltipVal.querySelector('.more-info')) tooltipVal.removeChild(tooltipVal.querySelector('.more-info'));
        let p = createDom('p', 'more-info'),
            data_val = tooltipOpt.area == 'group' ? tooltipOpt.more.data[group_idx][idx] : tooltipOpt.more.data[0][idx];
        p.insertAdjacentHTML('beforeend', '<span class="label">'+ tooltipOpt.more.tit +'</span><span class="val">'+ data_val +'</span>');
        tooltipVal.appendChild(p);
    }
    
    // chart 좌우 스크롤 시 툴팁 위치 조정
    function tooltip_scroll(e){
        let scl = e.target.scrollLeft - tooltip_left;
        tooltip.style.marginLeft = -scl + 'px';
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
    
    /** 특정 set - group 보이기 
     * num : 그룹의 index
    */
    function setShow_group(num){
        lis.forEach((li)=>{
            let bar_items = li.querySelectorAll('.bars');
            bar_items.forEach((bar)=>{
                let items = bar.querySelectorAll('.bar');
                items[num].classList.remove('hide-set');
            });
        });
    }
    
    /** 특정 set - group 감추기 
     * num : 그룹의 index
    */
    function setHide_group(num){
        lis.forEach((li)=>{
            let bar_items = li.querySelectorAll('.bars');
            bar_items.forEach((bar)=>{
                let items = bar.querySelectorAll('.bar');
                items[num].classList.add('hide-set');
            });
        });
    }

    /** 특정 dataset 보이기 (dataset 변경 및 다시 그리기형식) */
    function datasetShow(num){
        dataset[num] = structuredClone(temp_dataset[num]);
        chart_update();
    }
    /** 특정 dataset 감추기 (dataset 변경 및 다시 그리기형식) */
    function datasetHide(num){
        dataset[num] = '';
        chart_update();
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

    /** label / dataset 리로드 */
    function option_update(){
        labels          = option.labels;
        dataset         = option.dataset;
        dataLen         = labels.length;
        setLen          = dataset.length;
    }

    /** 가이드라인 그리기 */
    function guideLineSet(){
        let listTag = '<ul class="guide-line">';
        for(let t=0; t<tickArr.length; t++){
            let tick_tx;
            if(tickArr[t] >= 1000 && tickArr[t] < 10000) tick_tx = comma(tickArr[t] / 1000) + '천';
            else if(tickArr[t] >= 10000) tick_tx = comma(tickArr[t] / 10000) + '만';
            else tick_tx = tickArr[t];

            if(direction == 'vertical') listTag += '<li style="bottom:'+ (tickArr[t]/guideMax) * 100 +'%"><p class="guide-tx">'+ tick_tx +'</p></li>';
            else listTag += '<li style="left:'+ (tickArr[t]/guideMax) * 100 +'%"><p class="guide-tx">'+ tick_tx +'</p></li>';
        }
        listTag += '</ul>';
        chart.insertAdjacentHTML('afterbegin', listTag);
    }

    function chart_init(){
        option_update();
        wrapSizeSet();
        titleSet();

        calcMaxMin();
        if(stack.enabled && setLen > 1) calcMaxStackType();

        calcTick();
        set_tooltip();
        drawChart();
        guideLineSet();
        if(legendOpt.show != true) return;
        drawLegend();
        if(setLen > 1 && !group) lgdBtnSet();
    }
    chart_init();

    function chart_update(){
        nChart.wrap.removeChild(chart);

        calcMaxMin();
        if(stack.enabled && setLen > 1) calcMaxStackType();
        
        calcTick();
        drawChart();
        guideLineSet();
    }

    /** 다시 그리기 (모든 옵션) */
    this.reDraw = function(){
        while (nChart.wrap.firstChild) nChart.wrap.removeChild(nChart.wrap.firstChild);
        chart_init();
    }
    
    /** dataset.data 만 변경 시 */
    this.data_update = function(){
        chart_update();
    }

    /** 특정 dataset 감추기 (stack + group 형태에서만 사용) */
    this.dataset_hide = function(idx){
        setHide_group(idx);
    }
    /** 특정 dataset 보이기 (stack + group 형태에서만 사용) */
    this.dataset_show = function(idx){
        setShow_group(idx);
    }
}