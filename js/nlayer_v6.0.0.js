// layer pop system
// 2025-07-07 - v.6.0.0 : 레이어 기능 단순화

// !! common.js 필수

/** option 항목
 * layer : 레이어 팝업 id (string) - 필수값
 * title : 레이어의 타이틀 (string)
 * clsLayer : 레이어 팝업 공통 클래스
 * clsCloseBtn : 레이어 팝업 닫기 버튼 클래스
 * clsShow : 레이어 팝업 show 상태 클래스
 * 
 * activeShow : 레이어 show 가 완료되면 콜백 실행
 */

// 현재 show 상태인 레이어 배열
let layer_arr = [];

/** 오픈된 레이어 전체 닫기 */
function layerHideAll() {
	for(let i = layer_arr.length - 1; i >= 0; i--){
		layer_arr[i].hide();
	}
}

/** 레이어 팝업 */
function nlayer(option){
	const layer = this;

	let clsLayer	= option.layer_cls || '.layer', 		// 레이어 팝업 공통 클래스
		clsCloseBtn	= option.btn_close || 'close-layer',	// 레이어 팝업 닫기버튼 클래스
		clsShow		= option.show_cls || 'show';			// 레이어 show 용 상태 클래스

		layer.dom  = typeof option.layer === 'string' ? document.querySelector(option.layer) : option.layer; // 대상 레이어 (필수값)
		layer.title = option.title ? option.title : layer.dom.querySelector('.layer-title').textContent;

	layer.dom.setAttribute('role', 'dialog');
	layer.dom.setAttribute('aria-labelledby', layer.title);

	let body = document.querySelector('body'),
		bodyStyle = body.style;

	let tabEle;     // 제어할 tab 키 요소 배열

	/** 모 페이지 설정 함수 - tab 키 요소 제어 및 화면 overflow 설정 */
	function pageSet(){
		tabEle = document.querySelectorAll('a, button, input, select, textarea');
		tabEle.forEach(function(ele){
			if(ele.closest(clsLayer) == layer.dom) {
				ele.removeAttribute('inert');
				return;
			}
			if(ele == document.activeElement) ele.blur();
			ele.setAttribute('inert', true);
			
		});		
		bodyStyle.overflow = 'hidden';
		body.classList.add('hold');
	}

	/** 모 페이지 설정 해제 - tab 키 요소 제어 및 화면 overflow 설정 해제 */
	function pageUnset() {
		if(layer_arr.length > 0) {
			tabEle.forEach(function(ele){
				if(ele.closest(clsLayer) == layer_arr[layer_arr.length - 1].dom) ele.removeAttribute('inert');
			});
			return;
		} 
		tabEle.forEach(function(ele){ ele.removeAttribute('inert'); });
		bodyStyle.overflow = '';
		body.classList.remove('hold');
	}

	/** 레이어 닫기 (단순 닫기) */
	function layerHide() {
		arr_del(layer_arr, layer);
		layer.dom.classList.remove(clsShow);
		layer.dom.removeAttribute('aria-modal');
		pageUnset();
	}

	/** 레이어 보기 */
	function layerShow(){
		setTimeout(function(){ // alert / confirm 일 경우 show 클래스 관련 transition 적용을 위한 delay
			layer_arr.push(layer);
			layer.dom.classList.add(clsShow);
			layer.dom.setAttribute('aria-modal', true);

			let focus_item = layer.dom.querySelector('a, button, input, select, textarea');
			
			pageSet();
			focus_item.focus(); // focus 로 인해 화면 밖 > 안으로 이동하는 모션 무시될 가능성 있음. 확인 필요 - 필요 시 transitionend 이벤트 추가 후 적용
			if(typeof option.activeShow === 'function') option.activeShow();
		}, 10)
	}

	/** 레이어 닫기 버튼 설정 */
	function closeBtnSet(){
		let btnCloses 	= layer.dom.querySelectorAll('.' + clsCloseBtn);
		btnCloses.forEach(function(btn){
			btn.addEventListener('click', layerHide);
		});
	}
	closeBtnSet();

	/** 외부호출함수 - 레이어 보이기 */
	layer.show = function(btn){
		layerShow();
	}
	
	/** 외부호출함수 - 레이어 닫기 */
	layer.hide = function(btn){
		layerHide();
	}

	/** 외부호출함수 - 레이어 상태 확인 (boolean 리턴) */
	layer.state = function(){
		return layer.dom.classList.contains('show') ? true : false;
	}
}

/** 알럿 기능 
* nlayerAlert(option);
* ment : 문구 (필수)
* title : 타이틀
* btnTx : 버튼 텍스트 - 없을 경우 '확인'
* active : 확인 클릭 시 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정
*/
function nlayerAlert(option) {
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

/** 컨펌 기능 
* nlayerConfirm(option);
* ment : 문구 (필수)
* title : 타이틀
* btnTxConfirm : 컨펌 버튼 텍스트 - 없을 경우 '확인'
* btnTxCancel : 취소 버튼 텍스트 - 없을 경우 '취소'
* activeConfirm : 컨펌버튼 클릭 시 실행함수
* activeCancel : 취소버튼 클릭 시 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정
*/
function nlayerConfirm(option) {
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
		close_confirm()
	});
	btn_close.addEventListener('click', ()=>{
		if(typeof activeCancel == 'function') activeCancel();
		close_confirm()
	});
}

/** Toast 기능 
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