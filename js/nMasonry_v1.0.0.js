/*
    2024-02-29 v1.0.0 : 최초 작업

    - 대표 용어 -
    wrap : 영역 전체
    item : 배치될 item 
    column : 가로 열

    - option 관련 추가안내
    width_fixed 의 상태에 따라 적용필수 / 설정가능 옵션
    true : (필수) item_width 의 px 값
    false : (가능) std_column_count / min_item_width / max_item_width
 */

function nMasonry(option){
    // 외부 설정 option
    let wrap                = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        width_fixed         = option.width_fixed ? option.width_fixed : false, // item 너비 고정형 여부
        item_width          = option.item_width ? option.item_width : 33, // item 1개의 너비값
        std_column_count    = option.std_column_count ? option.std_column_count : 3, // 기본 가로열 갯수
        min_item_width      = option.min_item_width,   // 반응형일 경우 - item 최소 너비 (width_fixed == false 일 경우만 사용 가능)
        max_item_width      = option.max_item_width;   // 반응형일 경우 - item 최대 너비 (width_fixed == false 일 경우만 사용 가능)

    // 내부 변수
    let wrap_width          = wrap.offsetWidth, // 영역 너비
        wrap_height,
        items               = wrap.querySelectorAll('.item'),
        width_unit          = width_fixed == true ? 'px' : '%',
        column_count,
        set_count           = 0, // 현재까지 위치 잡은 갯수 (향후 item 추가 시 기존 item 위치 재설정 필요없을 경우 사용)
        resizeTimer;
    
    let obj_column = {
        arr_height : []
    }
    
    /** column 갯수 설정 */
    function columnCalcCount(){
        if(width_fixed == true) column_count = Math.floor(wrap_width / item_width);
        else {
            let std_width = wrap_width / std_column_count;
            if(std_width < min_item_width) {
                column_count = Math.floor(wrap_width / min_item_width);
            } else if(std_width > max_item_width) {
                column_count = Math.floor(wrap_width / max_item_width);
            } else column_count = std_column_count;
            item_width = 100 / column_count;
        }
    }
    columnCalcCount();

    /** column 높이배열 설정 */
    function setArrColumn(){
        obj_column.arr_height = [];
        for(var i=0; i<column_count; i++){
            obj_column.arr_height[i] = 0;
        }
    }
    setArrColumn();

    /** 아이템 배치 및 설정 */
    function itemPosSet(){
        items.forEach(function(item, idx){
            if(set_count != 0 && idx <= set_count) return;
            let info        = getPosNum(),
                pre_height  = info[0],
                col_num     = info[1],
                set_width   = width_fixed == true ? item_width : 100, // 반응형일 경우 translateX 값은 100 * col_num 
                css_left    = set_width * col_num + width_unit,
                css_top     = pre_height + 'px',
                item_height;
            item.style.width = item_width + width_unit;
            item.style.transform = 'translate3d(' + css_left +','+ css_top + ', 0)';
            item_height = item.clientHeight;
            obj_column.arr_height[col_num] = pre_height + item_height;
            set_count = idx;
        });
        wrap_height = getWrapHeight();
        wrap.style.height = wrap_height + 'px';
        if(!wrap.classList.contains('set-on')) wrap.classList.add('set-on');
    }
    itemPosSet();

    /** column 중 최소높이 / 최소높이 column 구하기 : return [최소높이, 최소높이 column] */
    function getPosNum(){
        let col_num, pre_height;
        pre_height  = Math.min.apply(null, obj_column.arr_height);
        col_num     = obj_column.arr_height.indexOf(pre_height);
        return [pre_height, col_num];
    }
    getPosNum();

    /** wrap 높이 추출 */
    function getWrapHeight(){
        let wrap_height;
        wrap_height  = Math.max.apply(null, obj_column.arr_height);
        return wrap_height;
    }

    /** 화면 resize */
    window.addEventListener('resize', function(){
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function(){
            wrap_width = wrap.offsetWidth;
            columnCalcCount();
            set_count = 0;
            setArrColumn();
            itemPosSet();
        }, 100);
    });

    /** 추가 아이템 정렬 */
    this.item_update = function(){
        items = wrap.querySelectorAll('.item');
        itemPosSet();
    };
}