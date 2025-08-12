// calendar
// 서남호(namo) - for m.s.p
// 2025-08-07 - ver3.0.0 - 달력 통합본 제작 start

/*
 * wrap (string or dom)	 	- 달력 input 의 parentNode
 * type (string)		 	- 달력 종류 - day : 일간달력(기본) / week : 주간달력 / month : 월간달력 / range : 기간달력 / range_month : 기간 달력(월간형)
 * dual (boolean)			- 달력 2개 표시 여부 - false : 달력 1개 (기본) / true : 달력 2개로 표시 - 기간 달력만 가능
 * show_type (string) 		- null : 버튼 클릭 시 달력 표시(기본) / 'input' : input 에 focus 시 달력 표시
 * year_range (string)		- 달력 표시 연도 범위 설정 - '2000:2050'
 * 
 * lang (string)			- kr : 한글(기본) / en : 영어
 * cal_title (string)		- 달력 타이틀 텍스트
 * split_tx (string) 		- 연/월/일 사이 구분용 문자 (기본 '-')
 * 
 * controls (string)		- all : 이전-다음 버튼, 연,월 select(기본) / btn : 이전-다음 버튼만. 연,월은 단순 표기 / shift : 이전-다음 버튼 + 연,월은 클릭 시 월간달력으로 변경(일간,주간 달력만 가능) / none : 모두 제거. 연,월만 표시
 * 
 * tx_close (string) 		- '닫기' 버튼 텍스트
 * tx_confirm (string)  	- '확인' 버튼 텍스트 - 'null' : 확인 버튼 제거 (날짜 선택 시 즉시 달력 닫고 입력) / 기타 문구 : 날짜 선택 후 '확인' 클릭 시 달력 닫고 입력 / 기본 : '확인'
 * 
 * limit (string)			- 달력 선택 제한 - null : 제한 없음(기본) / 'after' : 오늘(이번달) 이후만 선택 가능 / 'before' : 오늘(이번달) 이전만 선택 가능
 * gap_today (string) 		- 오늘(지금)의 gap 설정 (limit after 인데, 내일부터 선택 가능하게 / limit before 인데 3일전까지만 선택가능하게 등) - 0D / 0M / 0Y 형식의 string
 * gap_limit (string) 		- 달력 선택 가능일 설정 (limit after 인데, 오늘부터 1년후까지 선택 / limit before 인데 1년전부터 오늘까지 선택 등) - 0D / 0M / 0Y 형식의 string
 * gap_range (string) 		- 기간 선택 시 시작일-종료일 최대값 설정 - 0D / 0M / 0Y 형식의 string
 * 
 * position (string) 		- 달력 위치 - null : input 아래(기본) / 'modal' : 위치 설정 없음(별도 css 로 제어)
 * pos_top (number) 		- 달력 위치 - input 아래일 경우 top 조정값 (기본 0)
 * pos_left (number) 		- 달력 위치 - input 아래일 경우 left 조정값 (기본 0)
 * pos_right (number) 		- 달력 위치 - input 아래일 경우 right 조정값 (기본 0)
 * 
 * in_target (string or dom) - 달력 dom 요소가 위치할 영역 - null : body 마지막(기본) / 'string or dom' 해당 요소
 * in_page (boolean) 		 - false : 달력을 레이어처럼 띄울지(기본) / true : 화면 내 고정할지 여부
*/

/**
 * 내부전용 변수 Object (dom 요소 없이 순수 데이터용 값만 설정. 단, 사용빈도가 많지 않을 경우)
 * in_data 
 *   - week_tx : 달력 일~월 표기용 텍스트 배열 (영문/한글 구분)
 * 
 *   - month_shift : 일간-월간 달력 전환 상태
 * 
 *   - check_range : 기간 달력 여부
 *   - check_month : 월간 달력 여부
 * 
 *   - limit_today : 달력 선택제한 - 오늘의 gap 설정일
 *   - limit_gap : 달력 선택제한 - 달력 선택가능일
 *   - limit_range : 달력 선택제한 - 기간 선택 시 최대값
 * 
 * 	 - this_date : 현재 달력의 1일 (date 값 - 연/월 추출용)
 *   - min_year : 달력 그리기 최소 연도
 *   - max_year : 달력 그리기 최대 연도
 */

/**
 * common.js 에서 호출하는 함수
 *   - createDom (Dom 요소 생성 함수)
 * 	 - setZero (10 이하 숫자 앞에 0 추가)
 *   - convertToYMD (date 값을 YYYY.MM.DD 변환)
 *   - convertToYM (date 값을 YYYY.MM 변환)
 *   - convertToDate (YYYY.MM.DD 를 date 값으로 변환)
 *   - outSideClick (달력 영역 외 클릭 시 달력 닫기)
 */

class N_calendar{ 
	constructor(option){
		this.wrap = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap;
		this.num; // 현재 달력의 구분 번호 (한 화면에 달력 여러개 선언 시)
		this.input = this.wrap.querySelector('input');
		this.in_data = {}; // 기타 내부 공유용 데이터 변수 object
		this.option = this._optionSet(option); // 외부 설정 option

		this.date_start; // 선택일 (주간, 기간일 경우 시작일) - 사용빈도 많음으로 별도 변수 선언
		this.date_end;   // 주간, 기간일 경우 종료일 - 사용빈도 많음으로 별도 변수 선언

		this.cal; // 달력 dom 전체
		this.cal_cnt; // cal_top + cal_area 부모요소
		this.cal_cnt_right; // cal_top + cal_area 부모요소 - 달력 dual 일 경우 우측 달력 영역
		this.cal_btns; // 달력 하단 버튼 영역

		this.input_end; // 주간/기간일 경우 종료일 입력 input dom - 없을 경우 input 1개 모드로 설정됨

		this.sel_year;
		this.sel_month;
		this.btn_shift; // 일간-월간 전환 버튼

		this.btn_dates; // 생성된 달력 내 날짜/월 버튼 전체
		this.btn_confirm; // '확인' 버튼

		this._init_cal();
	}

	/**
	 * 딜략 option 확인 및 설정 함수
	 */
	_optionSet(option){
		const default_opt = {
			type : 'day',
			dual : false,
			show_type : null,
			year_range : '2000:2050',
			lang : 'kr',
			split_tx : '-',
			controls : 'all',
			tx_close : '닫기',
			tx_confirm : '확인',
			position : null,
			limit : null,
			in_target : null,
			in_page : false
		}

		let merged_opt = Object.assign({}, default_opt, option);

		this.in_data.week_tx = merged_opt.lang == 'kr' ? ['일','월','화','수','목','금','토'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		this.in_data.mon_tx = merged_opt.lang == 'kr' ? ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		this.in_data.check_range = merged_opt.type == 'range' || merged_opt.type == 'range_month' ? true : false; // 기간 달력인지 여부 boolean
		this.in_data.check_month = merged_opt.type == 'month' || merged_opt.type == 'range_month' ? true : false; // 월간 달력인지 여부 boolean

		this.in_data.min_year = Number(merged_opt.year_range.split(':')[0]);
		this.in_data.max_year = Number(merged_opt.year_range.split(':')[1]);

		return merged_opt;
	}

	/**
	 * 달력 선언 시 초기화 함수
	 */
	_init_cal(){
		this._inp_value_check();
		this._create_cal_wrap();
		this._wrap_set();
	}

	/**
	 * input 영역 설정
	 */
	_wrap_set(){
		let on_item;
		if(this.option.show_type == null) {
			on_item = createDom('button', 'btn-cal');
			on_item.textContent = '달력 보기';
			this.wrap.appendChild(on_item);
		} else {
			on_item = this.input;
			on_item.addEventListener('keyup', (e) => {
				if(e.key == 'Tab' && !e.shiftKey) this._cal_show();
			});
		}
		on_item.addEventListener('click', this._cal_show.bind(this));
	}

	/**
	 * input 현재 값 상태 확인
	 * @returns 값이 있을 경우 해당 input 의 값을 date_start / date_end 에 할당
	 */
	_inp_value_check(){
		this.input_end = this.wrap.querySelector('.end');
		if(this.input.value.length <= 0) {
			this.in_data.this_date = new Date();
			return;
		}
		if(!this.in_data.check_range && this.option.type != 'week') {
			let inp_tx = this.input.value.split(this.option.split_tx);
			this.date_start = new Date(inp_tx[0], inp_tx[1] - 1, inp_tx[2] || 1);
			this.in_data.this_date = new Date(inp_tx[0], inp_tx[1] - 1, 1);
			return;
		}
		let inp_start, inp_end;
		if(this.input_end) {
			inp_start = this.input.value.split(this.option.split_tx);
			inp_end   = this.input_end.value.split(this.option.split_tx);
		} else {
			let date_tx = this.input.value.split(' ~ ');
			inp_start = date_tx[0].split(this.option.split_tx);
			inp_end   = date_tx[1].split(this.option.split_tx);
		}
		this.date_start = new Date(inp_start[0], inp_start[1] - 1, inp_start[2] || 1);
		this.date_end = new Date(inp_end[0], inp_end[1] - 1, inp_end[2] || 1);
		this.in_data.this_date = new Date(this.date_end);
		this.in_data.this_date.setDate(1);
	}

	/**
	 * 달력 (this.cal) 영역 생성
	 */
	_create_cal_wrap(){
		this.cal = createDom('div', 'n_cal');
		this.cal.setAttribute('tabindex', -1);
		this.cal.setAttribute('role', 'dialog');
		this.cal.classList.add(this.option.type);
		if(this.option.dual) this.cal.classList.add('dual');

		let wrap_tx = '<div class="cal-cnt"><div class="cal-top"></div><div class="cal-area"></div></div>',
			tg;
		if(this.in_target == undefined) tg = document.querySelector('body');
		else tg = typeof this.in_target === 'string' ? document.querySelector(this.in_target) : this.in_target;
		
		this.cal.insertAdjacentHTML('beforeend', wrap_tx);
		tg.appendChild(this.cal);

		this.cal_cnt = this.cal.querySelector('.cal-cnt');
		this._create_top(this.cal_cnt);

		if(this.option.dual == true) {
			let right_tx = '<div class="cal-cnt right"><div class="cal-top"></div><div class="cal-area"></div></div>';
			this.cal.insertAdjacentHTML('beforeend', right_tx);
			this.cal_cnt_right = this.cal.querySelector('.cal-cnt.right');
			this._create_top(this.cal_cnt_right);
		}

		this.cal_btns = createDom('div', 'cal-btns');
		this.cal.appendChild(this.cal_btns);

		// 달력 id 설정
		let cals = document.querySelectorAll('.n_cal');
		this.num = cals.length;
		this.cal.setAttribute('id', 'n_cal_' + this.num);

		// '확인' 버튼 추가
		if(this.option.tx_confirm) {
			this.btn_confirm = createDom('button', 'btn-cal-confirm');
			this.btn_confirm.textContent = this.option.tx_confirm;
			this.cal_btns.appendChild(this.btn_confirm);
			this.btn_confirm.disabled = true;
			this.btn_confirm.addEventListener('click', this._inp_date_input.bind(this));
		}

		// '닫기' 버튼 추가
		let btn_close = createDom('button', 'btn-cal-close');
		this.cal_btns.appendChild(btn_close);
		btn_close.textContent = this.option.tx_close;
		btn_close.addEventListener('click', this._cal_close.bind(this));

		if(this.option.controls == null) return;
		this._create_pn_btn();
	}

	/** cal-top 영역 생성 */
	_create_top(target){
		let area = target.querySelector('.cal-top');
		while (area.firstChild) area.removeChild(area.firstChild);

		if(this.option.dual == true || this.option.controls == null || this.option.controls == 'btn') {
			let cnt_tx;
			if(this.in_data.check_month) cnt_tx = '<span class="now-tx year" title="연도"></span>';
			else cnt_tx = '<span class="now-tx year" title="연도"></span>'+ this.option.split_tx +'<span class="now-tx month" title="월"></span>';
			area.insertAdjacentHTML('beforeend', cnt_tx);
			return;
		}
		if(!this.in_data.check_month && this.option.controls == 'shift') {
			this.btn_shift = createDom('button', 'btn-shift');
			area.appendChild(this.btn_shift);
			return;
		} 
		if(this.option.controls == 'all') {
			this.sel_year = createDom('select', 'sel-year');
			this.sel_year.setAttribute('name', 'cal-select-year');
			this.sel_year.setAttribute('title', '연도');
			for(let i=this.in_data.min_year; i<this.in_data.max_year + 1; i++){
				this.sel_year.insertAdjacentHTML('beforeend', '<option value="'+i+'">'+i+'년</option>');
			}
			area.appendChild(this.sel_year);
			this.sel_year.addEventListener('change', ()=>{
				this.in_data.this_date.setFullYear(this.sel_year.value);
				this._set_sel_month();
				this._draw_cal();
			});

			if(this.in_data.check_month) return;
			this.sel_month = createDom('select', 'sel-month');
			this.sel_month.setAttribute('name', 'cal-select-month');
			this.sel_month.setAttribute('title', '월');
			for(let i=1; i<13; i++){
				this.sel_month.insertAdjacentHTML('beforeend', '<option value="'+setZero(i)+'">'+setZero(i)+'월</option>');
			}
			area.appendChild(this.sel_month);
			this.sel_month.addEventListener('change', ()=>{
				this.in_data.this_date.setMonth(this.sel_month.value - 1);
				this._draw_cal();
			});
		}
	}

	/** 연 select 변경 시 월 select 설정(제한 관련) */
	_set_sel_month(){

	}
	
	/** cal-top 영역 값 설정 */
	_cal_top_set(year, month, target){
		let area = target.parentNode.querySelector('.cal-top');
		if(this.option.dual == true || this.option.controls == null || this.option.controls == 'btn') {
			let tx_year = area.querySelector('.now-tx.year'),
				tx_month = area.querySelector('.now-tx.month');
			tx_year.textContent = year;
			if(month) tx_month.textContent = setZero(month + 1);
			return;
		}
		if(this.option.controls == 'shift') {
			this.btn_shift.textContent = year + this.option.split_tx + setZero(month + 1);
			return;
		} 
		if(this.option.controls == 'all') {
			if(month) this.sel_month.selectedIndex = month;
			let opts = this.sel_year.querySelectorAll('option');
			opts.forEach((opt, index)=>{
				if(opt.value == year) this.sel_year.selectedIndex = index;
			});
		}
	}

	/**
	 *  이전/다음 버튼 생성 및 삽입
	 */
	_create_pn_btn(){
		let btn_prev = createDom('button', 'cal-btn'),
			btn_next = createDom('button', 'cal-btn');
		btn_prev.classList.add('prev');
		btn_next.classList.add('next');
		btn_prev.textContent = '이전';
		btn_next.textContent = '다음';

		this.cal_cnt.querySelector('.cal-top').after(btn_next);
		this.cal_cnt.querySelector('.cal-top').after(btn_prev);

		btn_prev.addEventListener('click', this._draw_prev.bind(this));
		btn_next.addEventListener('click', this._draw_next.bind(this));
	}

	/** 이전월/연도 그리기 */
	_draw_prev(){
		if(this.in_data.check_month) this.in_data.this_date.setFullYear(this.in_data.this_date.getFullYear() - 1);
		else this.in_data.this_date.setMonth(this.in_data.this_date.getMonth() - 1);
		this._draw_cal();
	}
	
	/** 다음월/연도 그리기 */
	_draw_next(){
		if(this.in_data.check_month) this.in_data.this_date.setFullYear(this.in_data.this_date.getFullYear() + 1);
		else this.in_data.this_date.setMonth(this.in_data.this_date.getMonth() + 1);
		this._draw_cal();
	}

	/**
	 * 달력 보이기 함수
	 */
	_cal_show(){
		this._inp_value_check();
		this.cal.classList.add('show');
		this._draw_cal();
		this._cal_set_position();
		this.cal.focus();
		outSideClick('.n_cal', this.cal, 'show');
	}

	/**
	 * 달력 위치 설정 함수
	 */
	_cal_set_position(){
		let rect = this.wrap.getBoundingClientRect(),
			scroll_top = document.documentElement.scrollTop,
			scroll_left = document.documentElement.scrollLeft;
		this.cal.style.top = rect.top + rect.height + scroll_top + 'px';
		this.cal.style.left = rect.left + scroll_left + 'px';
	}

	/**
	 * 달력 닫기 함수
	 */
	_cal_close(){
		this.cal.classList.remove('show');
		this.input.focus();
		this.date_start = null;
		this.date_end = null;
	}

	/** 달력 생성 함수 (조건에 따라 _create_cal 실행) */
	_draw_cal(){
		let year = this.in_data.this_date.getFullYear(),
			month = this.in_data.this_date.getMonth(),
			cnt_area = this.option.dual == true ? this.cal_cnt_right.querySelector('.cal-area') : this.cal_cnt.querySelector('.cal-area');
		if(this.option.dual != true) {
			if(this.in_data.check_month) this._create_cal_mon(year, cnt_area);
			else this._create_cal(year, month, cnt_area);
			return;
		}

		let right_date = new Date(this.in_data.this_date);
		right_date.setMonth(right_date.getMonth() - 1);
		if(this.in_data.check_month) {
			this._create_cal_mon(year - 1, this.cal_cnt.querySelector('.cal-area'));
			this._create_cal_mon(year, cnt_area);
		} else {
			this._create_cal(right_date.getFullYear(), right_date.getMonth(), this.cal_cnt.querySelector('.cal-area'));
			this._create_cal(year, month, cnt_area);
		}
	}
	
	/**
	 * 일간 달력 그리기 함수
	 * @param {string} year 연도
	 * @param {string} month 월
	 * @param {dom} target 달력 그릴 영역
	 */
	_create_cal(year, month, target){
		let firstYoil = new Date(year, month, 1).getDay(), // 해당 월 1일의 요일값
			nalsu = new Date(year, month + 1, 0).getDate(), // 해당월의 일수
			mon_tx = month + 1;

		this._cal_top_set(year, month, target);

		let str = "<table>";
		str += "<caption>" + year + "년" + mon_tx + "월 달력</caption><thead><tr>";
		for(let i = 0; i < this.in_data.week_tx.length; i++){
			str += "<th scope='col'>" + this.in_data.week_tx[i] + "</th>";
		}
		str += "</tr></thead><tbody>";
				
		// 날 수 채우기
		let no = 1,
			currentCell = 0,
			ju = Math.ceil((nalsu + firstYoil) / 7);
		//alert("이번달은 " + ju + " 주 동안 계속됩니다");
		for(let r=0; r < ju; r++){
			str += "<tr style='text-align:center'>";
			for(let col=0; col < 7; col++){
				if(currentCell < firstYoil || no > nalsu){
					str += "<td>&nbsp;</td>";
					currentCell++;
				} else {
					str += "<td><button type='button' data-date='"+ year + this.option.split_tx + setZero(mon_tx) + this.option.split_tx + setZero(no) +"' title='"+ year + this.option.split_tx + mon_tx + this.option.split_tx + no +" "+ this.in_data.week_tx[col] +"요일'>" + no + "</button></td>";
					no++;
				}
				
			}
			str += "</tr>";
		}
		while (target.firstChild) target.removeChild(target.firstChild);
		target.insertAdjacentHTML('beforeend', str);

		this.btn_dates = this.cal.querySelectorAll('td button');
		if(this.option.dual) { // dual 일 경우 좌측 버튼에 대한 기능선언이 2번 되는 것 방지.
			if(target.parentNode == this.cal_cnt_right) this.in_data.check_range ? this._btn_dates_set_range() : this._btn_dates_set();
		} else this.in_data.check_range ? this._btn_dates_set_range() : this._btn_dates_set();

		if(!this.date_start) return;
		if(this.in_data.check_range || this.option.type == 'week') this._btn_active_range();
		else this._btn_active('select');
	}

	/**
	 * 월간 달력 그리기 함수
	 * @param {number} year 연도
	 * @param {dom} target 달력 그릴 영역
	 */
	_create_cal_mon(year, target) {
		this._cal_top_set(year, null, target);

		let str = "<ul class='cal-month-list' title='"+year+"연도 월 선택'>";
		for(let r=1; r < 13; r++){
			str += "<li><button type='button' data-date='"+ year + this.option.split_tx + r + this.option.split_tx +"1' title='"+ year +"년 "+ r +"월'>" + this.in_data.mon_tx[r - 1] + "</button></li>";
		}
		str += "</ul>";
		while (target.firstChild) target.removeChild(target.firstChild);
		target.insertAdjacentHTML('beforeend', str);
		
		this.btn_dates = this.cal.querySelectorAll('li button');
		if(this.option.dual) { // dual 일 경우 좌측 버튼에 대한 기능선언이 2번 되는 것 방지.
			if(target.parentNode == this.cal_cnt_right) this.in_data.check_range ? this._btn_dates_set_range() : this._btn_dates_set();
		} else this.in_data.check_range ? this._btn_dates_set_range() : this._btn_dates_set();

		if(!this.date_start) return;
		if(this.in_data.check_range || this.option.type == 'week') this._btn_active_range();
		else this._btn_active('select');
	}

	/** 설정된 일자를 input 에 입력 / 달력 닫기 */
	_inp_date_input(){
		const convert_func = this.in_data.check_month ? convertToYM : convertToYMD;
		let tx_start = convert_func(this.date_start, this.option.split_tx);

		if(!this.in_data.check_range && this.option.type != 'week'){
			this.input.value = tx_start;
			this._cal_close();
			return;
		}
		let tx_end = convert_func(this.date_end, this.option.split_tx);
		if(this.input_end) {
			this.input.value = tx_start;
			this.input_end.value = tx_end;
		} else this.input.value = tx_start + ' ~ ' + tx_end;
		this._cal_close();
	}

	/** 버튼 선택 표시 - 단일형 */
	_btn_active(cls){
		let start = this.date_start.getTime();
		this.btn_dates.forEach((btn_date)=>{ 
			let time = convertToDate(btn_date.dataset.date, this.option.split_tx).getTime();
			time == start ? btn_date.parentNode.classList.add(cls) : btn_date.parentNode.className = '';
		});
	}

	/** 버튼 선택 표시 - 기간형 */
	_btn_active_range(){
		let start = this.date_start.getTime(),
			end = this.date_end.getTime();
		this.btn_dates.forEach((btn)=>{ 
			let time = convertToDate(btn.dataset.date, this.option.split_tx).getTime();
			if(time == start) btn.parentNode.classList.add('start');
			else if(time == end) btn.parentNode.classList.add('end');
			else if(time > start && time < end) btn.parentNode.classList.add('in-range');
			else btn.parentNode.className = '';
		});		
	}

	/** 주간달력 - 선택된 날짜 기준 월/일 날짜 계산 */
	_calc_week_date(date){
		let start = new Date(date),
			end = new Date(date),
			day = date.getDay();
		if(day == 0) end = new Date(end.setDate(end.getDate() + 6));
		else if(day == 6) start = new Date(start.setDate(start.getDate() - 6));
		else {
			start.setDate(start.getDate() - day);
			end.setDate(end.getDate() + (6 - day));
		}
		this.date_start = start;
		this.date_end = end;
		this._btn_active_range();
	}

	/**
	 * 달력 날짜 버튼 클릭 시 실행 (단일)
	 */
	_btn_dates_set(){
		this.btn_dates.forEach((btn)=>{
			btn.addEventListener('click', ()=>{
				let date_val = convertToDate(btn.dataset.date, this.option.split_tx);

				if(this.option.type == 'week') this._calc_week_date(date_val);
				else {
					this.date_start = date_val;
					this._btn_active('select');
				}
				this.option.tx_confirm == null ? this._inp_date_input() : this.btn_confirm.disabled = false;
			});
		});
	}

	/**
	 * 달력 날짜 버튼 클릭 시 실행 (기간)
	 */
	_btn_dates_set_range(){
		this.btn_dates.forEach((btn)=>{
			btn.addEventListener('click', this._btn_range_set_click.bind(this));
			btn.addEventListener('mouseover', this._btn_range_set_hover.bind(this));
		});
	}

	/** 기간 달력일 경우 - 날짜 버튼 클릭 기능 (2회 클릭) */
	_btn_range_set_click(e){
		let btn = e.target,
			date_btn = convertToDate(btn.dataset.date, this.option.split_tx);
		if(this.date_start && this.date_end || !this.date_start && !this.date_end) {
			this.date_end = null;

			this.date_start = date_btn;
			this._btn_active('start');
			return;
		}
		if(this.date_start && !this.date_end){
			if(date_btn.getTime() < this.date_start.getTime()) {
				this.date_end = this.date_start;
				this.date_start = date_btn;
			} else  this.date_end = date_btn;
			this._btn_active_range();
			this.option.tx_confirm == null ? this._inp_date_input() : this.btn_confirm.disabled = false;
		}
	}

	/** 기간 달력일 경우 - 시작일 클릭 후 마우스 오버에 따른 중간 날짜 범위 표시 */
	_btn_range_set_hover(e){
		//console.log(e, e.target)
	}
}