// calendar
// 2025-08-07 - ver3.0.0 - 달력 통합본 제작 start
// 2026-10-28 - ver3.1.0 - 오류 수정 및 접근성 보완 (AI)
//   [오류]
//   - limit 설정 시 gap_limit 이 없으면 최소/최대 연도로 이동할 때 오류(limit_start / limit_end null) 수정
//   - limit 'before' + gap_range 사용 시 시작일 클릭 오류 수정
//   - controls null('none') 사용 시 오류 수정 - 'none' 과 null 동일하게 처리 (이전/다음 버튼 없음)
//   - 확인 버튼이 없는 상태(tx_confirm null / in_page)에서 shift 사용 시 오류 수정
//   - 날짜 선택 후 닫기 → 다시 열어 바로 '확인' 클릭 시 오류 수정 (열기/닫기 시 확인 버튼 초기화)
//   - input 값 형식이 잘못된 경우(직접 입력 등) 오류 / 빈 달력 표시 수정 → 오늘 기준으로 표시
//   - wrap / input 요소가 없을 때 console.warn 후 중단 (ready 상태값)
//   - 외부 클릭 감지 리스너가 열 때마다 누적되어 activeClose 가 여러 번 실행되던 문제 수정 (common.js outSideClick 미사용)
//   - 월 버튼(월간 달력 / shift 월 선택) 선택 제한을 월 단위로 비교 (이번달이 선택 불가로 처리되던 문제)
//   - 기간 선택 중 닫았다가 다시 열 때 이전 선택범위로 날짜가 제한되던 문제 수정
//   - 주간 선택 시 선택 제한 범위를 넘는 날짜가 입력되던 문제 수정
//   - shift + 기간/주간 달력에서 월 선택이 날짜 선택으로 처리되던 문제 수정
//   - 연도 select 변경 시 선택 제한 범위 밖의 월로 이동하던 문제 수정 (제한 범위 안으로 보정)
//   - dual 일 경우 좌측 달력에 선택 제한 이전 월이 표시되던 문제 수정
//   - 월 select 의 hidden 처리가 최소/최대 연도가 같을 때 한쪽만 적용되던 문제 수정
//   - 기간 표시 시 종료일에 in-range 클래스가 남던 문제 수정
//   - 월 단위 gap 계산 시 말일 넘침(1월 31일 + 1M = 3월 3일) 수정
//   - btn_disabled_set 이 선택 제한된 날짜를 다시 활성화하던 문제 수정
//   - 종료일 input 선택자 '.end' → 'input.end'
//   - 달력 id 중복 방지
//   - 날짜 입력 후 input / change 이벤트 발생 (form 검증, vue 등 연동)
//   - in_target 이 position 지정 요소일 경우 위치 오차 수정, 화면 하단 공간 부족 시 위로 표시, 창 크기 변경 시 위치 재설정
//   [접근성]
//   - ESC 닫기, 달력 내부 Tab 포커스 순환 (aria-modal 과 실제 동작 일치)
//   - 방향키로 날짜 / 월 이동 (일간 : ←→ 1일, ↑↓ 1주 / 월간 : ←→ 1개월, ↑↓ 4개월)
//   - cal_title 옵션 구현 (달력 이름) - 없을 경우 '날짜 선택' 으로 aria-label 설정
//   - 선택된 날짜 aria-pressed, 오늘 날짜 aria-current="date"
//   - 기간 선택 미리보기를 키보드 포커스에도 적용
//   - show_type 'input' : Tab 으로 input 진입 시 자동으로 열리던 동작 제거 → 클릭 / ↓ 키로 열기
//   - 닫기 후 호출 요소(버튼 / input)로 포커스 복귀 (외부 클릭으로 닫을 때는 포커스 이동 안 함)
//   [기타]
//   - destroy() / state() 메서드 추가, lang 'en' 일 경우 caption / title 영문 표기

// !! common.js 필수 (createDom / setZero / convertToYMD / convertToYM / convertToDate)

/*
 * wrap (string or dom)	 	- 달력 input 의 parentNode
 * type (string)		 	- 달력 종류 - day : 일간달력(기본) / week : 주간달력 / month : 월간달력
 * range (boolean)			- 기간 선택 여부 (기본 false)
 * dual (boolean)			- 달력 2개 표시 여부 - false : 달력 1개 (기본) / true : 달력 2개로 표시 - 기간 달력만 가능
 * show_type (string) 		- null : 버튼 클릭 시 달력 표시(기본) / 'input' : input 클릭 또는 ↓ 키 입력 시 달력 표시
 * year_range (string)		- 달력 표시 연도 범위 설정 - '2000:2050'
 *
 * lang (string)			- kr : 한글(기본) / en : 영어
 * cal_title (string)		- 달력 타이틀 텍스트 (달력 상단 표시 + 달력 이름) / 없을 경우 화면 표시 없이 '날짜 선택' 으로 이름 설정
 * split_tx (string) 		- 연/월/일 사이 구분용 문자 (기본 '-')
 *
 * controls (string)		- all : 이전-다음 버튼, 연,월 select(기본) / btn : 이전-다음 버튼만. 연,월은 단순 표기 / shift : 이전-다음 버튼 + 연,월은 클릭 시 월간달력으로 변경(일간,주간 달력만 가능) / 'none' (또는 null) : 모두 제거. 연,월만 표시
 *
 * tx_close (string) 		- '닫기' 버튼 텍스트
 * tx_confirm (string)  	- '확인' 버튼 텍스트 - null : 확인 버튼 제거 (날짜 선택 시 즉시 달력 닫고 입력) / 기타 문구 : 날짜 선택 후 '확인' 클릭 시 달력 닫고 입력 / 기본 : '확인'
 *
 * limit (string)			- 달력 선택 제한 - null : 제한 없음(기본) / 'after' : 오늘(이번달) 이후 선택 불가 / 'before' : 오늘(이번달) 이전 선택 불가
 * gap_today (string) 		- '오늘' 기준점 이동 (limit after 인데 어제까지만 선택 : '1D' / limit before 인데 내일부터 선택 : '1D') - 0D / 0W / 0M / 0Y 형식의 string
 * gap_limit (string) 		- 달력 선택 가능 범위 (limit after 인데 1년전부터 오늘까지 선택 / limit before 인데 오늘부터 1년후까지 선택 : '1Y') - 0D / 0W / 0M / 0Y 형식의 string
 * gap_range (string) 		- 기간 선택 시 시작일-종료일 최대값 설정 - 0D / 0W / 0M / 0Y 형식의 string
 *
 * position (string) 		- 달력 위치 - null : input 아래(기본, 하단 공간 부족 시 위) / 'modal' : 위치 설정 없음(별도 css 로 제어)
 * pos_top (number) 		- 달력 위치 - input 아래일 경우 top 조정값 (기본 0)
 * pos_left (number) 		- 달력 위치 - input 아래일 경우 left 조정값 (기본 0)
 *
 * in_target (string or dom) - 달력 dom 요소가 위치할 영역 - null : body 마지막(기본) / 'string or dom' 해당 요소
 * in_page (boolean) 		 - false : 달력을 레이어처럼 띄울지(기본) / true : 화면 내 고정할지 여부
 *
 * 메서드 : cal_show() / cal_close() / draw_prev() / draw_next() / state() / destroy()
 *          setActiveShow(fn) / setActiveDraw(fn) / setActiveClose(fn) / btn_disabled_set(fn)
*/

/**
 * 내부전용 변수 Object (dom 요소 제외 순수 데이터용 값만 설정. 단, 사용빈도가 많지 않을 경우)
 * in_data
 *   - today : 오늘
 *   - week_tx : 달력 일~월 표기용 텍스트 배열 (영문/한글 구분)
 *
 *   - month_shift : 일간-월간 달력 전환 상태
 *
 *   - check_month : 월간 달력 여부
 *
 *   - range_ing : 기간달력에서 시작일만 선택상태인 경우 (boolean)
 *
 *   - limit_start : 달력 선택제한 - 제한의 시작일 (항상 date 값 - 제한이 없으면 year_range 최소 연도 1월 1일)
 *   - limit_end : 달력 선택제한 - 제한의 종료일 (항상 date 값 - 제한이 없으면 year_range 최대 연도 12월 31일)
 *   - limit_range : 달력 선택제한 - 기간 선택 시 시작일-종료일 gap 최대값 (date)
 *
 * 	 - this_date : 현재 달력의 1일 (date 값 - 연/월 추출용) - 항상 날짜는 1일로 설정 (이번달 - 다음달 간의 마지막 날 차이로 인한 오류 방지 : 1월 30일에 month + 1 할 경우 2월은 30일이 없으므로 바로 3월 30일로 넘어감.)
 *   - min_year : 달력 그리기 최소 연도
 *   - max_year : 달력 그리기 최대 연도
 *
 * doms - dom 관련 변수 Object
 *   - on_item : 달력 호출 dom (input 혹은 button) - 접근성 속성 설정용
 * 	 - cal : 달력 영역 전체
 *   - cal_cnt : cal_top + cal_area 부모요소
 *   - cal_cnt_right : cal_top + cal_area 부모요소 - 달력 dual 일 경우 우측 달력 영역
 *   - cal_btns : 달력 하단 버튼 영역
 *
 *   - btn_prev : 이전달(연도) 버튼
 *   - btn_next : 다음달(연도) 버튼
 *   - btn_shift : 일간-월간 전환 버튼
 *   - btn_confirm : '확인' 버튼
 *
 *   - input_end : 주간/기간일 경우 종료일 입력 input dom - 없을 경우 input 1개 모드로 설정됨
 *   - sel_year : 연도 선택 select
 *   - sel_month : 월 선택 select
 */

class n_calendar{
	constructor(option = {}){
		this.ready = false;
		this.wrap = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap;
		this.input = this.wrap ? this.wrap.querySelector('input') : null;
		if(!this.input) {
			console.warn('n_calendar : wrap 또는 wrap 내 input 요소를 찾을 수 없습니다. (' + option.wrap + ')');
			return;
		}
		this.num; // 현재 달력의 구분 번호 (한 화면에 달력 여러개 선언 시)

		this.in_data = {}; // 기타 내부 공유용 데이터 변수 object
		this.doms = {}; // dom 관련 변수
		this.option = this._optionSet(option); // 외부 설정 option

		this.date_start; // 선택일 (주간, 기간일 경우 시작일) - 사용빈도 많음으로 별도 변수 선언
		this.date_end;   // 주간, 기간일 경우 종료일 - 사용빈도 많음으로 별도 변수 선언
		this.btn_dates; // 생성된 달력 내 날짜/월 버튼 전체 - 사용빈도 많음으로 별도 변수 선언

		this._init_cal();
		this.ready = true;
	}

	#activeShow = null; // 달력 보이기 시 콜백함수
	#activeDraw = null; // 달력 그리기 시 콜백함수
	#activeClose = null; // 달력 닫기 시 콜백함수

	/** 외부 클릭 시 닫기 (달력 열림 동안에만 등록) - 포커스는 클릭한 곳 유지 */
	#onOutside = (e) => {
		if(this.doms.cal.contains(e.target)) return;
		if(this.doms.on_item && this.doms.on_item.contains(e.target)) return; // 호출 요소 클릭은 해당 요소에서 처리
		this.cal_close(false);
	};
	/** 창 크기 변경 시 위치 재설정 */
	#onResize = () => {
		if(this.state() && this.option.position != 'modal') this._cal_set_position();
	};
	/** 달력 내 키보드 - ESC 닫기 / Tab 순환 / 방향키 이동 */
	#onKeydown = (e) => {
		if(!this.option.in_page) {
			if(e.key === 'Escape') {
				e.stopPropagation();
				this.cal_close();
				return;
			}
			if(e.key === 'Tab') {
				this._focus_trap(e);
				return;
			}
		}
		this._key_move(e);
	};

	/** 달력 option 확인 및 설정 함수 */
	_optionSet(option){
		const default_opt = {
			type : 'day',
			range : false,
			dual : false,
			show_type : null,
			year_range : '2000:2050',
			lang : 'kr',
			cal_title : '',
			split_tx : '-',
			controls : 'all',
			tx_close : '닫기',
			tx_confirm : '확인',
			position : null,
			pos_top : 0,
			pos_left : 0,
			limit : null,
			in_target : undefined,
			in_page : false
		}

		let today = new Date(),
			merged_opt = Object.assign({}, default_opt, option);

		if(merged_opt.controls === 'none') merged_opt.controls = null; // 문서 표기('none')와 코드(null) 통일

		this.in_data.today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0,0,0,0);

		this.in_data.week_tx = merged_opt.lang == 'kr' ? ['일','월','화','수','목','금','토'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		this.in_data.mon_tx = merged_opt.lang == 'kr' ? ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		this.in_data.check_month = merged_opt.type == 'month' ? true : false; // 월간 달력인지 여부 boolean

		this.in_data.min_year = Number(merged_opt.year_range.split(':')[0]);
		this.in_data.max_year = Number(merged_opt.year_range.split(':')[1]);

		this.in_data.limit_range = null;

		if(merged_opt.in_page) merged_opt.tx_confirm = null;

		if(typeof merged_opt.activeShow === 'function') this.#activeShow = merged_opt.activeShow;
		if(typeof merged_opt.activeDraw === 'function') this.#activeDraw = merged_opt.activeDraw;
		if(typeof merged_opt.activeClose === 'function') this.#activeClose = merged_opt.activeClose;

		return merged_opt;
	}

	/** 달력 선언 시 초기화 함수 */
	_init_cal(){
		this._limit_date_set();
		this._inp_value_check();
		this._create_cal_dom();

		this.option.in_page ? this._draw_cal() : this._wrap_set();
	}

	/** input 영역 설정 (달력보기 및 key 관련) */
	_wrap_set(){
		if(this.option.show_type == null) {
			this.doms.on_item = createDom('button', 'btn-cal');
			this.doms.on_item.textContent = '달력 보기';
			this.wrap.appendChild(this.doms.on_item);
		} else {
			this.doms.on_item = this.input;
			// Tab 진입 시 자동 열기 제거 (폼 이동 흐름 방해) → ↓ 키로 열기
			this.doms.on_item.addEventListener('keydown', (e) => {
				if(e.key == 'ArrowDown' && !this.state()) {
					e.preventDefault();
					this.cal_show();
				}
			});
		}
		this.doms.on_item.addEventListener('click', () => {
			// 버튼 : 열림 상태에서 다시 클릭 시 닫기 / input : 열기만
			if(this.state() && this.option.show_type == null) this.cal_close();
			else this.cal_show();
		});
		if(this.option.in_page) return;
		this.doms.on_item.setAttribute('aria-haspopup', 'dialog');
		this.doms.on_item.setAttribute('aria-expanded', false);
		this.doms.on_item.setAttribute('aria-controls', 'n_cal_' + this.num);
	}

	/**
	 * 'YYYY-MM-DD' (또는 'YYYY-MM') 문자열을 date 로 변환 - 형식이 잘못되었으면 null
	 * @param {string} tx 날짜 문자열
	 */
	_parse_date(tx){
		if(!tx) return null;
		const arr = tx.trim().split(this.option.split_tx).map((v)=> Number(v)),
			y = arr[0], m = arr[1], d = arr.length > 2 ? arr[2] : 1;
		if(!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
		const date = new Date(y, m - 1, d);
		if(date.getFullYear() != y || date.getMonth() != m - 1 || date.getDate() != d) return null; // 2월 30일 등 존재하지 않는 날짜
		return date;
	}

	/**
	 * input 현재 값 상태 확인
	 * @returns 값이 있을 경우 해당 input 의 값을 date_start / date_end 에 할당 (형식이 잘못된 경우 값이 없는 것으로 처리)
	 */
	_inp_value_check(){
		this.doms.input_end = this.wrap.querySelector('input.end');
		this.date_start = undefined;
		this.date_end = undefined;

		let start = null, end = null;
		if(!this.option.range && this.option.type != 'week') {
			start = this._parse_date(this.input.value);
		} else if(this.doms.input_end) {
			start = this._parse_date(this.input.value);
			end = this._parse_date(this.doms.input_end.value);
		} else {
			const date_tx = this.input.value.split(' ~ ');
			if(date_tx.length == 2) {
				start = this._parse_date(date_tx[0]);
				end = this._parse_date(date_tx[1]);
			}
		}

		const single = !this.option.range && this.option.type != 'week';
		if(!start || (!single && !end)) { // 값이 없거나 형식 오류 - 오늘 기준
			this.in_data.this_date = new Date(this.in_data.today);
			this.in_data.this_date.setDate(1); // 오늘 날짜가 다음달 날짜 최고값보다 높을 경우 월이 +2가 되는 현상 방지
			return;
		}
		this.date_start = start;
		if(single) {
			this.in_data.this_date = new Date(start.getFullYear(), start.getMonth(), 1);
			return;
		}
		if(end.getTime() < start.getTime()) { this.date_start = end; end = start; } // 시작/종료 순서 보정
		this.date_end = end;
		this.in_data.this_date = new Date(end.getFullYear(), end.getMonth(), 1);
	}

	/** year_range 에 따른 기본 최소/최대일 + limit 설정에 따른 gap 날짜 계산 실행 (limit_start / limit_end 는 항상 date) */
	_limit_date_set(){
		const year_min = Number(this.option.year_range.split(':')[0]),
			year_max = Number(this.option.year_range.split(':')[1]),
			base_start = new Date(year_min, 0, 1),
			base_end = new Date(year_max, 11, 31);

		this.in_data.limit_start = base_start;
		this.in_data.limit_end = base_end;

		if(this.option.limit == 'after') {
			if(this.option.gap_limit) this.in_data.limit_start = this._calc_gap_date(this.in_data.today, this.option.gap_limit);
			this.in_data.limit_end = this.option.gap_today ? this._calc_gap_date(this.in_data.today, this.option.gap_today) : new Date(this.in_data.today);
		} else if(this.option.limit == 'before') {
			this.in_data.limit_start = this.option.gap_today ? this._calc_gap_date(this.in_data.today, this.option.gap_today) : new Date(this.in_data.today);
			if(this.option.gap_limit) this.in_data.limit_end = this._calc_gap_date(this.in_data.today, this.option.gap_limit);
		}
		this.in_data.min_year = this.in_data.limit_start.getFullYear();
		this.in_data.max_year = this.in_data.limit_end.getFullYear();
	}

	/**
	 * gap 날짜 계산 함수
	 * @param {date} date 기준일 (data 값)
	 * @param {string} gap gap string 값 (0D / 0W / 0M / 0Y)
	 * @returns date 기준으로 gap 만큼 계산된 날짜
	 */
	_calc_gap_date(date, gap){
		let base_date = new Date(date),
			unit = gap.slice(-1, gap.length),
			num = Number(gap.substring(0, gap.length -1));
		if(this.option.limit == 'after') num = num * -1; // after 일 경우 gap 계산 방향 전환
		if(unit == 'D') base_date.setDate(base_date.getDate() + num);
		if(unit == 'W') base_date.setDate(base_date.getDate() + (num * 7));
		if(unit == 'M' || unit == 'Y') {
			// 월/연 이동 시 말일 넘침 방지 (1월 31일 + 1M → 2월 말일)
			const day = base_date.getDate();
			base_date.setDate(1);
			if(unit == 'M') base_date.setMonth(base_date.getMonth() + num);
			else base_date.setFullYear(base_date.getFullYear() + num);
			const last = new Date(base_date.getFullYear(), base_date.getMonth() + 1, 0).getDate();
			base_date.setDate(Math.min(day, last));
		}
		return base_date;
	}

	/** 달력 (this.doms.cal) 영역 생성 */
	_create_cal_dom(){
		this.doms.cal = createDom('div', 'n_cal');
		this.doms.cal.setAttribute('tabindex', -1);
		this.doms.cal.classList.add(this.option.type);
		this.doms.cal_inbox = createDom('div', 'cal-inbox');
		if(this.option.range) this.doms.cal.classList.add('range');
		if(this.option.dual) this.doms.cal.classList.add('dual');
		if(this.option.in_page == false){
			this.doms.cal.setAttribute('role', 'dialog');
			this.doms.cal.setAttribute('aria-modal', false);
		}

		// 달력 id 설정 (중복 방지)
		let num = document.querySelectorAll('.n_cal').length + 1;
		while(document.getElementById('n_cal_' + num)) num++;
		this.num = num;
		this.doms.cal.setAttribute('id', 'n_cal_' + this.num);

		// 달력 이름 (cal_title 있으면 상단 표시 + aria-labelledby / 없으면 aria-label)
		if(this.option.cal_title) {
			const title = createDom('p', 'cal-title');
			title.id = 'n_cal_' + this.num + '_title';
			title.textContent = this.option.cal_title;
			this.doms.cal_inbox.appendChild(title);
			this.doms.cal.setAttribute('aria-labelledby', title.id);
		} else {
			this.doms.cal.setAttribute('aria-label', this.option.lang == 'kr' ? '날짜 선택' : 'Select date');
		}

		let wrap_tx = '<div class="cal-cnt"><div class="cal-top"></div><div class="cal-area"></div></div>',
			tg;
		if(this.option.in_target == undefined) tg = document.querySelector('body');
		else tg = typeof this.option.in_target === 'string' ? document.querySelector(this.option.in_target) : this.option.in_target;
		if(!tg) tg = document.querySelector('body');

		this.doms.cal_inbox.insertAdjacentHTML('beforeend', wrap_tx);
		if(this.option.in_page) this.doms.cal.classList.add('in-page');
		this.doms.cal.appendChild(this.doms.cal_inbox);
		tg.appendChild(this.doms.cal);

		this.doms.cal_cnt = this.doms.cal.querySelector('.cal-cnt');
		this._create_top(this.doms.cal_cnt);

		if(this.option.dual == true) {
			let right_tx = '<div class="cal-cnt right"><div class="cal-top"></div><div class="cal-area"></div></div>';
			this.doms.cal_inbox.insertAdjacentHTML('beforeend', right_tx);
			this.doms.cal_cnt_right = this.doms.cal.querySelector('.cal-cnt.right');
			this._create_top(this.doms.cal_cnt_right);
		}

		this.doms.cal_btns = createDom('div', 'cal-btns');
		this.doms.cal_inbox.appendChild(this.doms.cal_btns);

		// '확인' 버튼 추가
		if(this.option.tx_confirm) {
			this.doms.btn_confirm = createDom('button', 'btn-cal-confirm');
			this.doms.btn_confirm.textContent = this.option.tx_confirm;
			this.doms.cal_btns.appendChild(this.doms.btn_confirm);
			this.doms.btn_confirm.disabled = true;
			this.doms.btn_confirm.addEventListener('click', this._inp_insert_select_date.bind(this));
		}

		// '닫기' 버튼 추가
		if(!this.option.in_page) {
			let btn_close = createDom('button', 'btn-cal-close');
			this.doms.cal_btns.appendChild(btn_close);
			btn_close.textContent = this.option.tx_close;
			btn_close.addEventListener('click', () => this.cal_close());
		}

		this.doms.cal.addEventListener('keydown', this.#onKeydown);

		if(this.option.controls == null) return;
		this._create_pn_btn();
	}

	/** '확인' 버튼 활성/비활성 (확인 버튼이 없는 경우 무시) */
	_confirm_disabled(bln){
		if(this.doms.btn_confirm) this.doms.btn_confirm.disabled = bln;
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
			this.doms.btn_shift = createDom('button', 'btn-shift');
			area.appendChild(this.doms.btn_shift);
			this.doms.btn_shift.addEventListener('click',  this._btn_shift_func.bind(this));
			return;
		}
		if(this.option.controls == 'all' || this.option.controls == 'shift') { // 월간 달력 + shift 는 연도 select 로 표시
			this.doms.sel_year = createDom('select', 'sel-year');
			this.doms.sel_year.setAttribute('name', 'cal-select-year');
			this.doms.sel_year.setAttribute('title', '연도');
			for(let i=this.in_data.min_year; i<this.in_data.max_year + 1; i++){
				this.doms.sel_year.insertAdjacentHTML('beforeend', '<option value="'+i+'">'+i+'년</option>');
			}
			area.appendChild(this.doms.sel_year);
			this.doms.sel_year.addEventListener('change', ()=>{
				this.in_data.this_date.setFullYear(this.doms.sel_year.value);
				this._draw_cal();
			});

			if(this.in_data.check_month) return;
			this.doms.sel_month = createDom('select', 'sel-month');
			this.doms.sel_month.setAttribute('name', 'cal-select-month');
			this.doms.sel_month.setAttribute('title', '월');
			for(let i=1; i<13; i++){
				this.doms.sel_month.insertAdjacentHTML('beforeend', '<option value="'+setZero(i)+'">'+setZero(i)+'월</option>');
			}
			area.appendChild(this.doms.sel_month);
			this.doms.sel_month.addEventListener('change', ()=>{
				this.in_data.this_date.setMonth(this.doms.sel_month.value - 1);
				this._draw_cal();
			});
		}
	}

	/**
	 * 월 select 내 option hidden 설정 (최소 / 최대 월 동시 적용)
	 * @param {dom} sel 대상 select
	 * @param {number} min 최소 월 (1~12 / 없으면 null)
	 * @param {number} max 최대 월 (1~12 / 없으면 null)
	 */
	_sel_opt_hidden(sel, min, max){
		let opts = sel.querySelectorAll('option');
		opts.forEach((opt)=>{
			const val = Number(opt.value);
			opt.hidden = (min != null && val < min) || (max != null && val > max);
		});
	}

	/** cal-top 영역 값 설정 */
	_cal_top_set(year, month, target){
		let area = target.parentNode.querySelector('.cal-top');
		if(this.option.dual == true || this.option.controls == null || this.option.controls == 'btn') {
			let tx_year = area.querySelector('.now-tx.year'),
				tx_month = area.querySelector('.now-tx.month');
			tx_year.textContent = year;
			if(month != null && tx_month) tx_month.textContent = setZero(month + 1);
			return;
		}
		if(this.doms.btn_shift) {
			if(this.in_data.month_shift) {
				this.doms.btn_shift.textContent = year;
				this.doms.btn_shift.classList.add('disabled');
				this.doms.btn_shift.disabled = true;
			} else {
				this.doms.btn_shift.textContent = year + this.option.split_tx + setZero(month + 1);
				this.doms.btn_shift.classList.remove('disabled');
				this.doms.btn_shift.disabled = false;
			}
			return;
		}
		if(this.doms.sel_year) {
			if(month != null && this.doms.sel_month) this.doms.sel_month.selectedIndex = month;
			let opts = this.doms.sel_year.querySelectorAll('option');
			opts.forEach((opt, index)=>{
				if(opt.value == year) this.doms.sel_year.selectedIndex = index;
			});
		}
	}

	/** 이전/다음 버튼 생성 및 삽입 */
	_create_pn_btn(){
		let btn_prev = createDom('button', 'cal-btn'),
			btn_next = createDom('button', 'cal-btn');
		btn_prev.classList.add('prev');
		btn_next.classList.add('next');
		btn_prev.textContent = '이전';
		btn_next.textContent = '다음';

		this.doms.cal_cnt.querySelector('.cal-top').after(btn_next);
		this.doms.cal_cnt.querySelector('.cal-top').after(btn_prev);

		this.doms.btn_prev = btn_prev;
		this.doms.btn_next = btn_next;

		btn_prev.addEventListener('click', this.draw_prev.bind(this));
		btn_next.addEventListener('click', this.draw_next.bind(this));
	}

	/** 월 단위 비교 여부 (월간 달력 또는 shift 월 선택 상태) */
	_is_month_mode(){
		return this.in_data.check_month || this.in_data.month_shift;
	}

	/** 이전월/연도 그리기 */
	draw_prev(){
		if(this._is_month_mode()) this.in_data.this_date.setFullYear(this.in_data.this_date.getFullYear() - 1);
		else this.in_data.this_date.setMonth(this.in_data.this_date.getMonth() - 1);
		this._draw_cal();
	}

	/** 다음월/연도 그리기 */
	draw_next(){
		if(this._is_month_mode()) this.in_data.this_date.setFullYear(this.in_data.this_date.getFullYear() + 1);
		else this.in_data.this_date.setMonth(this.in_data.this_date.getMonth() + 1);
		this._draw_cal();
	}

	/** 달력 show 상태 반환 */
	state(){
		return !!this.doms.cal && this.doms.cal.classList.contains('show');
	}

	/** 달력 보이기 함수 */
	cal_show(){
		if(!this.ready || this.option.in_page || this.state()) return;

		this._inp_value_check();
		this.in_data.range_ing = false;
		this.in_data.limit_range = null;
		this.in_data.month_shift = false;
		this._confirm_disabled(true);

		this.doms.cal.classList.add('show');
		this._draw_cal();
		if(this.option.position != 'modal') this._cal_set_position();
		this.doms.cal.focus();

		document.addEventListener('pointerdown', this.#onOutside);
		window.addEventListener('resize', this.#onResize);
		this.doms.cal.setAttribute('aria-modal', true);
		this.doms.on_item.setAttribute('aria-expanded', true);
		if(this.#activeShow) this.#activeShow();
	}

	/** 달력 위치 설정 함수 - in_target 기준 좌표 / 화면 하단 공간 부족 시 위로 */
	_cal_set_position(){
		const cal = this.doms.cal,
			rect = this.wrap.getBoundingClientRect(),
			cal_h = cal.offsetHeight,
			fixed = getComputedStyle(cal).position == 'fixed',
			parent = cal.offsetParent;

		let top = rect.bottom + this.option.pos_top,
			left = rect.left + this.option.pos_left;

		// 하단 공간 부족 + 상단 공간이 충분하면 input 위로
		if(rect.bottom + cal_h > window.innerHeight && rect.top - cal_h >= 0) top = rect.top - cal_h - this.option.pos_top;

		if(!fixed) {
			if(parent && parent !== document.body && parent !== document.documentElement) { // position 지정된 in_target 기준
				const p_rect = parent.getBoundingClientRect();
				top = top - p_rect.top + parent.scrollTop - parent.clientTop;
				left = left - p_rect.left + parent.scrollLeft - parent.clientLeft;
			} else { // 문서 기준
				top += window.scrollY;
				left += window.scrollX;
			}
		}
		cal.style.top = top + 'px';
		cal.style.left = left + 'px';
	}

	/**
	 * 달력 닫기 함수
	 * @param {boolean} restore_focus 호출 요소로 포커스 복귀 여부 (기본 true / 외부 클릭으로 닫을 때 false)
	 */
	cal_close(restore_focus){
		if(this.option.in_page || !this.state()) return;
		this.in_data.month_shift = false;
		this.in_data.range_ing = false;
		this.in_data.limit_range = null;
		this.doms.cal.classList.remove('show');
		this.date_start = undefined;
		this.date_end = undefined;
		this._confirm_disabled(true);

		document.removeEventListener('pointerdown', this.#onOutside);
		window.removeEventListener('resize', this.#onResize);
		this.doms.cal.setAttribute('aria-modal', false);
		this.doms.on_item.setAttribute('aria-expanded', false);
		if(restore_focus !== false) this.doms.on_item.focus();
		if(this.#activeClose) this.#activeClose();
	}

	/** 표시 기준월(this_date)을 선택 제한 범위 안으로 보정 (dual 일 경우 좌측 달력 기준) */
	_clamp_this_date(){
		const d = this.in_data.this_date,
			ls = this.in_data.limit_start,
			le = this.in_data.limit_end,
			offset = this.option.dual ? 1 : 0;
		if(this._is_month_mode()) {
			const min_y = ls.getFullYear() + offset, max_y = le.getFullYear();
			if(d.getFullYear() < min_y) d.setFullYear(min_y);
			if(d.getFullYear() > max_y) d.setFullYear(max_y);
			return;
		}
		const key = d.getFullYear() * 12 + d.getMonth(),
			min_key = ls.getFullYear() * 12 + ls.getMonth() + offset,
			max_key = le.getFullYear() * 12 + le.getMonth();
		if(key < min_key) this.in_data.this_date = new Date(Math.floor(min_key / 12), min_key % 12, 1);
		if(key > max_key) this.in_data.this_date = new Date(Math.floor(max_key / 12), max_key % 12, 1);
	}

	/** 달력 생성 함수 (조건에 따라 _create_cal 실행) */
	_draw_cal(){
		this._clamp_this_date();
		let year = this.in_data.this_date.getFullYear(),
			month = this.in_data.this_date.getMonth(),
			cnt_area = this.option.dual == true ? this.doms.cal_cnt_right.querySelector('.cal-area') : this.doms.cal_cnt.querySelector('.cal-area');
		if(this.option.dual != true) {
			if(this._is_month_mode()) this._create_cal_mon(year, cnt_area);
			else this._create_cal(year, month, cnt_area);
			if(this.#activeDraw) this.#activeDraw();
			return;
		}

		let left_date = new Date(this.in_data.this_date);
		left_date.setDate(1); // 31일 대응 : 31일에 getMonth() - 1 을 하면, 이전달이 아닌 해당월의 1일로 세팅되므로 기준일을 1일로 설정 후 월 변경.
		left_date.setMonth(left_date.getMonth() - 1);
		if(this.in_data.check_month) {
			this._create_cal_mon(year - 1, this.doms.cal_cnt.querySelector('.cal-area'));
			this._create_cal_mon(year, cnt_area);
		} else {
			this._create_cal(left_date.getFullYear(), left_date.getMonth(), this.doms.cal_cnt.querySelector('.cal-area'));
			this._create_cal(year, month, cnt_area);
		}
		if(this.#activeDraw) this.#activeDraw();
	}

	/** 날짜 버튼 생성 후 공통 처리 (기능 연결 / 제한 / 선택 표시) */
	_after_create(target){
		const attach = () => {
			if(this.in_data.month_shift) this._btn_dates_set(); // shift 월 선택은 기간/주간 달력도 월 이동으로 처리
			else this.option.range ? this._btn_dates_set_range() : this._btn_dates_set();
		};
		if(this.option.dual) { // dual 일 경우 좌측 버튼에 대한 기능선언이 2번 되는 것 방지.
			if(target.parentNode == this.doms.cal_cnt_right) attach();
		} else attach();

		this._ctrl_limit_set(this.in_data.limit_start, this.in_data.limit_end);
		if(this.in_data.range_ing && this.in_data.limit_range && this.date_start) this._ctrl_limit_set(this.date_start, this.in_data.limit_range);

		// 오늘 날짜 표시 (aria-current)
		const today_key = this._date_key(this.in_data.today);
		this.btn_dates.forEach((btn)=>{
			if(this._date_key(this._btn_date(btn)) === today_key) btn.setAttribute('aria-current', 'date');
		});

		if(!this.date_start || this.in_data.month_shift) { this._aria_pressed_set(); return; }
		if(this.option.range || this.option.type == 'week' || this.in_data.range_ing) this._btn_active_set_range();
		else this._btn_active_set('select');
	}

	/**
	 * 일간 달력 그리기 함수
	 * @param {string} year 연도
	 * @param {string} month 월
	 * @param {dom} target 달력 그릴 영역
	 */
	_create_cal(year, month, target){
		let firstYoil = new Date(year, month, 1).getDay(), // 해당 월 1일의 요일값
			nalsu = new Date(year, month + 1, 0).getDate(), // 해당월의 일수 (지정된 달의 이전달의 마지막 날)
			mon_tx = month + 1,
			kr = this.option.lang == 'kr';

		this._cal_top_set(year, month, target);

		let str = "<table>";
		str += "<caption>" + (kr ? year + "년 " + mon_tx + "월 달력" : this.in_data.mon_tx[month] + " " + year) + "</caption><thead><tr>";
		for(let i = 0; i < this.in_data.week_tx.length; i++){
			str += "<th scope='col'>" + this.in_data.week_tx[i] + "</th>";
		}
		str += "</tr></thead><tbody>";

		// 날 수 채우기
		let no = 1,
			currentCell = 0,
			ju = Math.ceil((nalsu + firstYoil) / 7);
		for(let r=0; r < ju; r++){
			str += "<tr style='text-align:center'>";
			for(let col=0; col < 7; col++){
				if(currentCell < firstYoil || no > nalsu){
					str += "<td>&nbsp;</td>";
					currentCell++;
				} else {
					const title = kr ? year + this.option.split_tx + mon_tx + this.option.split_tx + no + " " + this.in_data.week_tx[col] + "요일" : this.in_data.week_tx[col] + ", " + this.in_data.mon_tx[month] + " " + no + ", " + year;
					str += "<td><button type='button' data-date='"+ year + this.option.split_tx + setZero(mon_tx) + this.option.split_tx + setZero(no) +"' title='"+ title +"'>" + no + "</button></td>";
					no++;
				}
			}
			str += "</tr>";
		}
		while (target.firstChild) target.removeChild(target.firstChild);
		target.insertAdjacentHTML('beforeend', str);

		this.btn_dates = this.doms.cal.querySelectorAll('td button');
		this._after_create(target);
	}

	/**
	 * 월간 달력 그리기 함수
	 * @param {number} year 연도
	 * @param {dom} target 달력 그릴 영역
	 */
	_create_cal_mon(year, target) {
		this._cal_top_set(year, null, target);

		const kr = this.option.lang == 'kr';
		let str = "<ul class='cal-month-list' title='" + (kr ? year + "년 월 선택" : "Select month " + year) + "'>";
		for(let r=1; r < 13; r++){
			str += "<li><button type='button' data-date='"+ year + this.option.split_tx + r + this.option.split_tx +"1' title='"+ (kr ? year + "년 " + r + "월" : this.in_data.mon_tx[r - 1] + " " + year) +"'>" + this.in_data.mon_tx[r - 1] + "</button></li>";
		}
		str += "</ul>";
		while (target.firstChild) target.removeChild(target.firstChild);
		target.insertAdjacentHTML('beforeend', str);

		this.btn_dates = this.doms.cal.querySelectorAll('li button');
		this._after_create(target);
	}

	/** 날짜 버튼의 date 값 */
	_btn_date(btn){
		return convertToDate(btn.dataset.date, this.option.split_tx);
	}

	/** 비교용 값 - 월 버튼일 경우 월 단위, 그 외 일 단위 */
	_date_key(date){
		if(!date) return null;
		return this._is_month_mode() ? date.getFullYear() * 12 + date.getMonth() : new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	}

	/** 설정된 일자를 input 에 입력 / 달력 닫기 */
	_inp_insert_select_date(){
		if(!this.date_start) return;
		const single = !this.option.range && this.option.type != 'week';
		if(!single && !this.date_end) return;

		const convert_func = this.in_data.check_month ? convertToYM : convertToYMD;
		let tx_start = convert_func(this.date_start, this.option.split_tx),
			changed = [this.input];

		if(single){
			this.input.value = tx_start;
		} else {
			let tx_end = convert_func(this.date_end, this.option.split_tx);
			if(this.doms.input_end) {
				this.input.value = tx_start;
				this.doms.input_end.value = tx_end;
				changed.push(this.doms.input_end);
			} else this.input.value = tx_start + ' ~ ' + tx_end;
		}

		// 값 변경 이벤트 (form 검증 / vue v-model 등 연동)
		changed.forEach((inp)=>{
			inp.dispatchEvent(new Event('input', { bubbles: true }));
			inp.dispatchEvent(new Event('change', { bubbles: true }));
		});

		if(this.option.in_page) return; // 고정형 : 선택 상태 유지
		this.cal_close();
	}

	/** 선택 상태 aria-pressed 설정 (select / start / end) */
	_aria_pressed_set(){
		this.btn_dates.forEach((btn)=>{
			const td = btn.parentNode;
			btn.setAttribute('aria-pressed', td.classList.contains('select') || td.classList.contains('start') || td.classList.contains('end'));
		});
	}

	/** 버튼 선택 표시 - 단일형 */
	_btn_active_set(cls){
		let start = this._date_key(this.date_start);
		this.btn_dates.forEach((btn_date)=>{
			btn_date.parentNode.className = '';
			if(this._date_key(this._btn_date(btn_date)) === start) btn_date.parentNode.classList.add(cls);
		});
		this._aria_pressed_set();
	}

	/** 버튼 선택 표시 - 기간형 */
	_btn_active_set_range(){
		if(!this.date_start) return;
		let start = this._date_key(this.date_start),
			end = this.date_end ? this._date_key(this.date_end) : null;
		this.btn_dates.forEach((btn)=>{
			const td = btn.parentNode,
				time = this._date_key(this._btn_date(btn));
			td.classList.remove('select', 'start', 'end', 'in-range'); // 이전 상태(hover 의 in-range 등) 초기화 후 설정
			if(time === start) td.classList.add('start');
			if(end != null && time === end) td.classList.add('end');
			if(end != null && time > start && time < end) td.classList.add('in-range');
		});
		this._aria_pressed_set();
	}

	/** 일간 -> 월간 변환 버튼 기능 */
	_btn_shift_func(){
		this.in_data.month_shift = true;
		if(!this.option.range && this.option.type != 'week') this._confirm_disabled(true); // 기간/주간은 선택 상태 유지
		this._draw_cal();
		// 월 선택 화면의 현재(선택) 월로 포커스 이동
		const cur = Array.from(this.btn_dates).find((btn)=> !btn.disabled && this._date_key(this._btn_date(btn)) === this._date_key(this.in_data.this_date));
		if(cur) cur.focus();
	}

	/** 주간달력 - 선택된 날짜 기준 월/일 날짜 계산 (선택 제한 범위 안으로 보정) */
	_calc_week_date(date){
		let start = new Date(date),
			end = new Date(date),
			day = date.getDay();
		start.setDate(start.getDate() - day);
		end.setDate(end.getDate() + (6 - day));
		if(start.getTime() < this.in_data.limit_start.getTime()) start = new Date(this.in_data.limit_start);
		if(end.getTime() > this.in_data.limit_end.getTime()) end = new Date(this.in_data.limit_end);
		this.date_start = start;
		this.date_end = end;
		this._btn_active_set_range();
	}

	/** 달력 날짜 버튼 클릭 시 적용 (단일 / shift 월 선택) */
	_btn_dates_set(){
		this.btn_dates.forEach((btn)=>{
			btn.addEventListener('click', ()=>{
				let date_val = this._btn_date(btn);

				if(this.in_data.month_shift) { // shift 월 선택 : 날짜 계산 전에 처리
					this._btn_dates_set_shift(date_val);
					return;
				}
				if(this.option.type == 'week') this._calc_week_date(date_val);
				else {
					this.date_start = date_val;
					this._btn_active_set('select');
				}
				this.option.tx_confirm == null ? this._inp_insert_select_date() : this._confirm_disabled(false);
			});
		});
	}

	/** shift 월달력 상태일 때 월 클릭 시 실행함수 */
	_btn_dates_set_shift(date){
		this.in_data.month_shift = false;
		this.in_data.this_date = new Date(date);
		this.in_data.this_date.setDate(1);
		if(!this.option.range && this.option.type != 'week') { // 단일 선택만 초기화 (기간/주간은 선택 상태 유지)
			this.date_start = null;
			this._confirm_disabled(true);
		}
		this._draw_cal();
		if(this.doms.btn_shift) this.doms.btn_shift.focus();
	}

	/** 달력 날짜 버튼 클릭 시 적용 (기간) */
	_btn_dates_set_range(){
		this.btn_dates.forEach((btn)=>{
			btn.addEventListener('click', this._btn_range_set_click.bind(this));
			btn.addEventListener('mouseover', this._btn_range_set_hover.bind(this));
			btn.addEventListener('focus', this._btn_range_set_hover.bind(this)); // 키보드 포커스에도 범위 미리보기
		});
	}

	/** 기간 달력일 경우 - 날짜 버튼 클릭 기능 (2회 클릭) */
	_btn_range_set_click(e){
		let btn = e.currentTarget,
			date_btn = this._btn_date(btn);
		if(this.date_start && this.date_end || !this.date_start && !this.date_end) {
			this.date_end = null;
			this.in_data.range_ing = true;

			this.date_start = date_btn;
			this._btn_active_set('start');
			this._confirm_disabled(true);
			if(this.option.gap_range) this._sel_range_gap_set();
			return;
		}
		if(this.date_start && !this.date_end){
			if(date_btn.getTime() < this.date_start.getTime()) {
				this.date_end = this.date_start;
				this.date_start = date_btn;
			} else this.date_end = date_btn;
			this._btn_active_set_range();
			if(this.option.gap_range) this._sel_range_gap_unset();
			this.in_data.range_ing = false;
			this.option.tx_confirm == null ? this._inp_insert_select_date() : this._confirm_disabled(false);
		}
	}

	/** 기간 달력일 경우 - 시작일 클릭 후 마우스 오버(포커스)에 따른 중간 날짜 범위 표시 */
	_btn_range_set_hover(e){
		if(!this.date_start || this.date_end) return; // 시작일만 선택된 경우만 실행
		let this_date = this._date_key(this._btn_date(e.currentTarget)),
			start_date = this._date_key(this.date_start);
		this.btn_dates.forEach((btn)=>{
			let date_btn = this._date_key(this._btn_date(btn));
			btn.parentNode.classList.toggle('in-range', date_btn > start_date && date_btn <= this_date);
		});
	}

	/**
	 * 날짜가 선택 제한 범위 밖인지 여부
	 * @param {date} date 확인할 날짜
	 * @param {date} start 제한시작일
	 * @param {date} end 제한종료일
	 */
	_is_limited(date, start, end){
		const key = this._date_key(date),
			start_key = this._date_key(start),
			end_key = this._date_key(end);
		return (start_key != null && key < start_key) || (end_key != null && key > end_key);
	}

	/**
	 * 달력 내 버튼 활성/비활성 상태 설정 + 연/월 select 및 이전/다음 버튼 제어
	 * @param {date} start 제한시작일
	 * @param {date} end 제한종료일
	 */
	_ctrl_limit_set(start, end){
		this.btn_dates.forEach((btn)=>{
			btn.disabled = this._is_limited(this._btn_date(btn), start, end);
		});

		this._is_month_mode() ? this._ctrl_limit_mon() : this._ctrl_limit_day();
	}

	/** 일간 달력 연/월 select 설정 + 이전/다음 버튼 제한 */
	_ctrl_limit_day(){
		const d = this.in_data.this_date,
			ls = this.in_data.limit_start,
			le = this.in_data.limit_end,
			this_year = d.getFullYear(),
			key = this_year * 12 + d.getMonth(),
			min_key = ls.getFullYear() * 12 + ls.getMonth() + (this.option.dual ? 1 : 0),
			max_key = le.getFullYear() * 12 + le.getMonth();

		if(this.doms.sel_month && !this.option.dual) {
			this._sel_opt_hidden(
				this.doms.sel_month,
				this_year == ls.getFullYear() ? ls.getMonth() + 1 : null,
				this_year == le.getFullYear() ? le.getMonth() + 1 : null
			);
		}
		if(!this.doms.btn_prev) return; // controls 'none'
		this.doms.btn_prev.disabled = key <= min_key;
		this.doms.btn_next.disabled = key >= max_key;
	}

	/** 월간 달력 이전/다음 버튼 제한 설정 */
	_ctrl_limit_mon(){
		if(!this.doms.btn_prev) return; // controls 'none'
		let this_year = this.in_data.this_date.getFullYear();
		this.doms.btn_prev.disabled = this_year <= this.in_data.min_year + (this.option.dual && this.in_data.check_month ? 1 : 0);
		this.doms.btn_next.disabled = this_year >= this.in_data.max_year;
	}

	/** 기간선택 - 시작일-종료일 선택가능 범위 설정 */
	_sel_range_gap_set(){
		if(this.option.limit == 'after') this.in_data.limit_range = this._calc_gap_date(this.date_start, '-' + this.option.gap_range);
		else this.in_data.limit_range = this._calc_gap_date(this.date_start, this.option.gap_range);

		if(this.in_data.limit_range.getTime() > this.in_data.limit_end.getTime()) this.in_data.limit_range = new Date(this.in_data.limit_end);
		this._ctrl_limit_set(this.date_start, this.in_data.limit_range);
	}
	/** 기간선택 - 시작일-종료일 선택가능 범위 해제 */
	_sel_range_gap_unset(){
		this._ctrl_limit_set(this.in_data.limit_start, this.in_data.limit_end);
		this.in_data.limit_range = null;
	}

	/** 달력 내부 Tab 포커스 순환 */
	_focus_trap(e){
		const items = Array.from(this.doms.cal.querySelectorAll('button, select, input, [tabindex]:not([tabindex="-1"])'))
			.filter((el)=> !el.disabled && el.getClientRects().length > 0);
		if(items.length == 0) { e.preventDefault(); return; }
		const first = items[0],
			last = items[items.length - 1],
			active = document.activeElement;
		if(e.shiftKey && (active === first || active === this.doms.cal)) {
			e.preventDefault();
			last.focus();
		} else if(!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}

	/** 방향키로 날짜 / 월 버튼 이동 (현재 표시된 달력 범위 안에서 이동 / disabled 는 건너뜀) */
	_key_move(e){
		const month = this._is_month_mode(),
			steps = { ArrowLeft : -1, ArrowRight : 1, ArrowUp : month ? -4 : -7, ArrowDown : month ? 4 : 7 },
			step = steps[e.key];
		if(!step || !this.btn_dates) return;
		const btns = Array.from(this.btn_dates),
			idx = btns.indexOf(document.activeElement);
		if(idx < 0) return;
		e.preventDefault();
		for(let i = idx + step; i >= 0 && i < btns.length; i += step) {
			if(!btns[i].disabled) { btns[i].focus(); return; }
		}
	}

	/** 콜백 설정(show) - option 변수에 넣지 않고, 이후 설정용 */
	setActiveShow(func){
		typeof func === 'function' ? this.#activeShow = func : console.warn('변수값은 함수(function)이어야 합니다.')
	}
	/** 콜백 설정(draw) - option 변수에 넣지 않고, 이후 설정용 */
	setActiveDraw(func){
		typeof func === 'function' ? this.#activeDraw = func : console.warn('변수값은 함수(function)이어야 합니다.')
	}
	/** 콜백 설정(close) - option 변수에 넣지 않고, 이후 설정용 */
	setActiveClose(func){
		typeof func === 'function' ? this.#activeClose = func : console.warn('변수값은 함수(function)이어야 합니다.')
	}

	/** 외부호출 - 달력 내 날짜 버튼 활성/비활성 제어 (변수에 있는 함수의 리턴값(boolean)에 따른 설정)
	 * func : 외부함수 - 인자로 각 버튼의 '날짜(javascript date)'를 전달하며, 해당 날짜로 func 내에서 비교 후 boolean 값을 리턴하도록 설계하여야 함.
	 * 선택 제한(limit / gap_range)으로 비활성된 날짜는 func 결과와 관계없이 비활성 유지
	*/
	btn_disabled_set(func){
		const range_on = this.in_data.range_ing && this.in_data.limit_range && this.date_start;
		this.btn_dates.forEach((btn)=>{
			let date_btn = this._btn_date(btn),
				limited = this._is_limited(date_btn, this.in_data.limit_start, this.in_data.limit_end) || (range_on && this._is_limited(date_btn, this.date_start, this.in_data.limit_range));
			btn.disabled = limited || !func(date_btn);
		});
	}

	/** 달력 기능 제거 */
	destroy(){
		if(!this.ready) return;
		this.cal_close(false);
		this.doms.cal.removeEventListener('keydown', this.#onKeydown);
		this.doms.cal.remove();
		if(this.doms.on_item && this.doms.on_item !== this.input) this.doms.on_item.remove();
		this.ready = false;
	}
}
