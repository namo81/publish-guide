// layer pop system
// 2025-07-07 - v.6.0.0 : 레이어 기능 단순화
// 2025-10-22 - v.6.0.1 : class 구조로 변경

// !! common.js 필수

/** option 항목
 * layer : 레이어 팝업 id (string) - 필수값
 * title : 레이어의 타이틀 (string)
 * clsLayer : 레이어 팝업 공통 클래스
 * clsClose : 레이어 팝업 닫기 버튼 클래스
 * clsShow : 레이어 팝업 show 상태 클래스
 * focus_item : 닫기 후 포커스 될 요소 (dom or string 선택자)
 * 
 * activeShow : 레이어 show 가 완료되면 콜백 실행
 * activeClose : 레이어 hide 가 완료되면 콜백 실행
 */

/** 
 * data : 내부용 변수 모음 Object
 *  - layer : 레이어 dom 전체
 *  - title : 레이어 타이틀
 *  - focus_item : 닫기 후 focus 될 요소
 *  - body : 화면 내 body 태그
 *  - tabEle : 레이어 외 영역에 있는 focus 요소 배열
 *  - btn_close : 레이어 내 닫기 버튼 전체
 */

class nlayer{
	constructor(option){
		this.data = {};
		this.option = this.#_optionSet(option);

		this.#init_layer();
	}

	#activeShow = null;
	#activeClose = null;

	/** option 병합 함수 */
	#_optionSet(option){
		const default_opt = {
			layer : undefined,
			title : undefined,
			clsLayer : 'layer',
			clsClose : 'close-layer',
			clsShow : 'show',
			focus_item : undefined
		}

		let merged_opt = Object.assign({}, default_opt, option);
		
		if(typeof merged_opt.activeShow === 'function') this.#activeShow = merged_opt.activeShow;
		if(typeof merged_opt.activeClose === 'function') this.#activeClose = merged_opt.activeClose;

		return merged_opt;
	}

	/** 초기화 함수 */
	#init_layer(){
		this.#data_set();
		this.#btn_close_set();
	}

	/** data Object 선언 및 설정 */
	#data_set(){
		this.data.layer = typeof this.option.layer === 'string' ? document.querySelector(this.option.layer) : this.option.layer;
		this.data.title = this.option.title ? this.option.title : this.data.layer.querySelector('.layer-title').textContent;
		if(this.option.focus_item) this.data.focus_item  = typeof this.option.focus_item === 'string' ? document.querySelector(this.option.focus_item) : this.option.focus_item;
		this.data.body = document.querySelector('body');

		this.data.layer.setAttribute('role', 'dialog');
		this.data.layer.setAttribute('aria-labelledby', this.data.title);
	}

	/** 현재 화면 내 show 상태인 레이어 갯수 확인 */
	#_count_on_layer(){
		let layers = document.querySelectorAll('.' + this.option.clsLayer + '.' + this.option.clsShow);
		return layers.length;
	}

	/** 레이어 외 영역의 focus 요소 제어 */
	body_page_set(){
		this.data.tabEle = document.querySelectorAll('a, button, input, select, textarea');
		this.data.tabEle.forEach((ele)=>{
			if(ele.closest('.' + this.option.clsLayer) == this.data.layer) {
				ele.removeAttribute('inert');
				return;
			}
			if(ele == document.activeElement) ele.blur();
			ele.setAttribute('inert', true);
			
		});		
		this.data.body.classList.add('hold');
		this.data.body.style.overflow = 'hidden';
	}

	/** 레이어 외 영역의 focus 요소 제어 비활성화 */
	body_page_unset(){
		if(this.#_count_on_layer() > 0) { // 2중 레이어 상태에서 1개만 닫을 경우 - 남은 레이어 내 요소만 설정
			this.data.tabEle.forEach((ele)=>{
				if(ele.closest('.' + this.option.clsLayer + '.' + this.option.clsShow)) ele.removeAttribute('inert');
			});
			return;
		} 
		this.data.tabEle.forEach((ele)=>{ ele.removeAttribute('inert'); });
		this.data.body.classList.remove('hold');
		this.data.body.style.overflow = '';
	}

	/** 레이어 닫기 */
	hide(){
		this.data.layer.classList.remove(this.option.clsShow);
		this.data.layer.removeAttribute('aria-modal');
		this.body_page_unset();
		if(this.data.focus_item) this.data.focus_item.focus();
		if(typeof this.#activeClose === 'function') this.#activeClose();
	}

	/** 레이어 보이기 */
	show(){
		void this.data.layer.offsetWidth; // alert / confirm 관련 (dom 요소 생성과 클래스 추가 사이에 강제 명령어를 줌으로써 transition 무시 제거)
		this.data.layer.classList.add(this.option.clsShow);
		this.data.layer.setAttribute('aria-modal', true);

		let focus_tg = this.data.layer.querySelector('a, button, input, select, textarea');
		
		this.body_page_set();
		focus_tg.focus(); // focus 로 인해 화면 밖 > 안으로 이동하는 모션 무시될 가능성 있음. 확인 필요 - 필요 시 transitionend 이벤트 추가 후 적용
		if(typeof this.#activeShow === 'function') this.#activeShow();
	}

	/** 닫기 버튼 설정 */
	#btn_close_set(){
		this.data.btn_close = this.data.layer.querySelectorAll('.' + this.option.clsClose);
		this.data.btn_close.forEach((btn)=>{
			btn.addEventListener('click', this.hide.bind(this));
		});
	}

	/** 콜백 설정(show) - option 변수에 넣지 않고, 이후 설정용 */
	setActiveShow(func){
		typeof func === 'function' ? this.#activeShow = func : console.log('변수값은 함수(function)이어야 합니다.')
	}
	/** 콜백 설정(show) - option 변수에 넣지 않고, 이후 설정용 */
	setActiveClose(func){
		typeof func === 'function' ? this.#activeClose = func : console.log('변수값은 함수(function)이어야 합니다.')
	}

	/** 레이어 show/hide 상태 리턴 */
	layer_state(){
		return this.data.layer.classList.contains('show') ? true : false;
	}
}

/** 알럿 기능 (class 로 변경 시 객체 생성없이 사용이 안되므로 변경 X)
* nAlert(option);
* ment : 문구 (필수)
* title : 타이틀
* btnTx : 버튼 텍스트 - 없을 경우 '확인'
* active : 확인 클릭 시 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정
*/
function nAlert(option) {
	const alert = this;
	let body = document.querySelector('body'),
		ment = option.ment,
		title = option.title,
		btn_tx = option.btnTx == null ? '확인' : option.btnTx,
		active = option.active,
		focus_item;

	if(ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br>'); //줄바꿈 삽입
	if(option.focus_item != undefined) focus_item = typeof option.focus_item === 'string' ? document.querySelector(option.focus_item) : option.focus_item;

	let layerCnt = '<div class="layer alert" id="nAlert" role="alertdialog">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += ment;
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium main close-alert">'+btn_tx+'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	alert.dom = document.querySelector('#nAlert');

	let btn_close = alert.dom.querySelector('.close-alert');
	let temp_alert = new nlayer({
		layer : '#nAlert',
		title : '알럿'
	});
	temp_alert.show();

	btn_close.addEventListener('click', ()=>{
		if(typeof active == 'function') active();
		temp_alert.hide();
		alert.dom.parentNode.removeChild(alert.dom);
		temp_alert = null;
		if(focus_item) focus_item.focus();
	});
}

/** 컨펌 기능 (class 로 변경 시 객체 생성없이 사용이 안되므로 변경 X) 
* nConfirm(option);
* ment : 문구 (필수)
* title : 타이틀
* btnTxConfirm : 컨펌 버튼 텍스트 - 없을 경우 '확인'
* btnTxCancel : 취소 버튼 텍스트 - 없을 경우 '취소'
* activeConfirm : 컨펌버튼 클릭 시 실행함수
* activeCancel : 취소버튼 클릭 시 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정
*/
function nConfirm(option) {
	const confirm  = this;
	let body = document.querySelector('body'),
		ment = option.ment,
		title = option.title,
		btn_confirm_tx = option.btnTxConfirm == undefined ? '확인' : option.btnTxConfirm,
		btn_cancel_tx = option.btnTxCancel == undefined ? '취소' : option.btnTxCancel,
		activeConfirm = option.activeConfirm,
		activeCancel = option.activeCancel,
		focus_item;

	if(ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br />'); //줄바꿈 삽입
	if(option.focus_item != undefined) focus_item = typeof option.focus_item === 'string' ? document.querySelector(option.focus_item) : option.focus_item;

	let layerCnt = '<div class="layer confirm" id="nConfirm" role="alertdialog">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += ment;
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium confirm-cancel">'+ btn_cancel_tx +'</button>';
		layerCnt += '<button type="button" class="btn medium main confirm-ok">'+ btn_confirm_tx +'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	confirm.dom	= document.querySelector('#nConfirm');
	
	let btn_close = confirm.dom.querySelector('.confirm-cancel'),
		btn_confirm = confirm.dom.querySelector('.confirm-ok');

	let temp_confirm = new nlayer({
		layer : '#nConfirm',
		title : '컨펌'
	});
	temp_confirm.show();

	function close_confirm(){
		temp_confirm.hide();
		confirm.dom.parentNode.removeChild(confirm.dom);
		temp_confirm = null;
		if(focus_item) focus_item.focus();
	}

	btn_confirm.addEventListener('click', ()=>{
		if(typeof activeConfirm == 'function') activeConfirm();
		close_confirm();
	});
	btn_close.addEventListener('click', ()=>{
		if(typeof activeCancel == 'function') activeCancel();
		close_confirm();
	});
}

/** Toast 기능 (class 로 변경 시 객체 생성없이 사용이 안되므로 변경 X)
* nToast('내용', '추가 클래스')
*/
function nToast(ment, addCls) {
	let body = document.querySelector('body');
	let toastCntTx = '';
		addCls ? toastCntTx = '<div class="toast '+addCls+'" role="alert">' : toastCntTx = '<div class="toast" role="alert">';
		toastCntTx += '<div class="toast-cnt">'+ment+'</div></div>';

	// 혹, 기존 토스트가 있는 상태에서 다시 추가할 경우 기존 토스트 제거 (toast 가 전체화면이 아닐 경우)
	let beforeToast		= document.querySelector('.toast');
	if(beforeToast) beforeToast.parentNode.removeChild(beforeToast);

	body.insertAdjacentHTML('beforeend', toastCntTx);
	let toast		= document.querySelector('.toast'),
		toastCnt	= toast.querySelector('.toast-cnt');

	toast.classList.add('show');
	toastCnt.addEventListener('animationend', function(){
		toast.parentNode.removeChild(toast);
	}, { once : true });
}