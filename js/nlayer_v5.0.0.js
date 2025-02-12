// layer pop system
// 2018-08-30 copyright - namo (seo nam ho) for m.s.p
// 2021-10-19 - v.4.0.0 : IE11 이상만 지원 // style : display:flex 방식으로 CSS 변경됨.
// 2024-05-02 - v.5.0.0 : 모바일 접근성 지원 및 접근성 개선을 위한 전체 변경.

// !! common.js 필수

/** option 항목
 * clsLayer : 레이어 팝업 공통 클래스
 * clsCloseBtn : 레이어 팝업 닫기 버튼 클래스
 * clsShow : 레이어 팝업 show 상태 클래스
 * clsConfirm : 레이어 팝업 confirm 버튼 클래스
 * 
 * layer : 레이어 팝업 id (string)
 * btn : 레이어 팝업 제어 버튼 (string or Dom요소 배열) - dom요소 단독일 경우는 X
 * 
 * activeOn(tg_layer) : 팝업 초기 설정 후 콜백 (레이어 변수 전달)
 * activeShowBefore(tg_layer, btn) : 팝업 띄우기 전 콜백함수 (레이어, active버튼 변수 전달) - 버튼 클릭 후 레이어 show 바로 직전 실행
 * activeShow(tg_layer, btn) : 팝업 띄운 후 콜백 함수 (레이어, active버튼 변수 전달)
 * activeClose(tg_layer, btn) : 팝업 닫기 후 콜백 함수 (clsCloseBtn 을 통한 닫기) - (레이어, active버튼 변수 전달)  ** 다중레이어 전체닫기는 제외
 * activeConfirm(tg_layer, btn) : 팝업 확인 및 닫기 후 콜백함수 (clsConfirm 을 통한 닫기) - (레이어, active버튼 변수 전달)
 */

// 현재 show 상태인 레이어 배열
let layer_arr = [];

/** 레이어 팝업 */
function nlayer(option){
	let clsLayer	= option.layer_cls ? option.layer_cls : 'layer', 		// 레이어 팝업 공통 클래스
		clsCloseBtn	= option.btn_close ? option.btn_close : 'close-layer',	// 레이어 팝업 닫기버튼 클래스
		clsShow		= option.show_cls ? option.show_cls : 'show',			// 레이어 show 용 상태 클래스
		clsConfirm  = option.confirm_cls ? option.confirm_cls : 'confirm',  // 레이어 confirm 버튼 클래스
		tg_layer  	= typeof option.layer === 'string' ? document.querySelector(option.layer) : option.layer, 	// 대상 레이어 (필수값)
		layer_obj   = this;
		// btn_open, // 레이어 오픈 버튼 (해당 레이어를 제어할 수 있는 모든 버튼)
		// btn_active  = null;   // 레이어 호출 버튼 (btn_open 중에서 실제로 팝업을 호출한 버튼)

	let body = document.querySelector('body'),
		bodyStyle = body.style,
		tg_focus_dom; // 레이어 내 포커스될 요소

	if(option.btn) layer_obj.btn_open = typeof option.btn === 'string' ? document.querySelectorAll(option.btn) : option.btn;

	if(tg_layer.querySelector('.layer-top')) tg_focus_dom = tg_layer.querySelector('.layer-top');
	else tg_focus_dom = tg_layer.querySelector('.layer-mid');

	tg_focus_dom.setAttribute('tabindex', -1);

	/** 모 페이지 설정 함수 - tab 키 요소 제어 및 화면 overflow 설정 */
	function pageSet(){
		let tabEle		= document.querySelectorAll('a, button, input, select, textarea');
		tabEle.forEach(function(ele){
			if(ele.closest('.' + clsLayer)) return;
			if(ele == document.activeElement) ele.blur();
			ele.setAttribute('tabindex','-1');
			ele.setAttribute('aria-hidden', true);
		});		
		bodyStyle.overflow = 'hidden';
		body.classList.add('hold');
	}

	/** 모 페이지 설정 해제 - tab 키 요소 제어 및 화면 overflow 설정 해제 */
	function pageUnset() {
		let tabEle		= document.querySelectorAll('a, button, input, select, textarea');
		tabEle.forEach(function(ele){
			if(ele.closest('.' + clsLayer)) return;
			ele.removeAttribute('tabindex');
			ele.removeAttribute('aria-hidden');
		});
		bodyStyle.overflow = '';
		body.classList.remove('hold');
	}

	/** 레이어 닫기 (단순 닫기) */
	function layerHide() {
		let on_layers 	= document.querySelectorAll('.' + clsLayer + '.' + clsShow);

		arr_del(layer_arr, layer_obj);
		tg_layer.classList.remove(clsShow);
		tg_layer.removeAttribute('role');
		if(on_layers.length < 2) pageUnset();

		if(layer_obj.btn_active == null) return;
		layer_obj.btn_active.setAttribute('aria-expended', false);
		setTimeout(function(){ // 모바일 talkback 상태일 경우 - pageUnset 와 focus 동시실행 관련 에러 해결
			layer_obj.btn_active.focus();
			layer_obj.btn_active = null;
		}, 30)
	}

	/** 레이어 닫기 (close) */
	function layerHideClose(){
		layerHide();
		if(typeof option.activeClose === 'function') option.activeClose(tg_layer, layer_obj.btn_active);
	}
	/** 레이어 닫기 (confirm) */
	function layerHideConfirm(){
		if(typeof option.activeConfirm === 'function') {
			if(option.activeConfirm(tg_layer, layer_obj.btn_active) != false) layerHide();
		} else layerHide();
	}

	/** 오픈된 레이어 전체 닫기
	function layerHideAll() {
		let on_layers 	= document.querySelectorAll('.' + clsLayer + '.' + clsShow);
		on_layers.forEach(function(tg){
			tg_layer = tg;
			layerHide();
		});
	} */
	function layerHideAll() {
		for(let i = layer_arr.length - 1; i >= 0; i--){
			layer_arr[i].hide();
		}
	}

	/** 레이어 보기 */
	function layerShow(){
		if(typeof option.activeShowBefore === 'function') option.activeShowBefore(tg_layer, layer_obj.btn_active);
		setTimeout(function(){ // alert / confirm 일 경우 show 클래스 관련 transition 적용을 위한 delay
			layer_arr.push(layer_obj);
			tg_layer.classList.add(clsShow);
			tg_layer.setAttribute('role', 'dialog');
			
			pageSet();
			// tg_focus_dom.focus(); --> focus 로 인해 화면 밖 > 안으로 이동하는 모션 무시됨
			if(layer_obj.btn_active != null) layer_obj.btn_active.setAttribute('aria-expended', true);
			if(typeof option.activeShow === 'function') option.activeShow(tg_layer, layer_obj.btn_active);
			
		}, 10)
	}

	/** 레이어 닫기 버튼 설정 */
	function closeBtnSet(onceChk){
		let btnCloses 	= tg_layer.querySelectorAll('.' + clsCloseBtn);
		btnCloses.forEach(function(cbtn){
			cbtn.classList.contains('all') ? cbtn.addEventListener('click', layerHideAll, { once: onceChk }) : cbtn.addEventListener('click', layerHideClose, { once: onceChk });
		});

		let btnConfirm = tg_layer.querySelectorAll('.' + clsConfirm);
		if(btnConfirm.length < 1) return;
		btnConfirm.forEach(function(btn){
			btn.addEventListener('click', layerHideConfirm, { once: onceChk });
		});
	}

	/** 버튼 기능 설정 */
	if(layer_obj.btn_open) {
		if(layer_obj.btn_open.length) {
			layer_obj.btn_open.forEach(function(btn){
				btn_set(btn)
			});
		} else btn_set(layer_obj.btn_open);
	}

	/** 오픈 버튼 기능 적용 */
	function btn_set(btn){
		btn.setAttribute('aria-controls', tg_layer.getAttribute('id'));
		btn.setAttribute('aria-haspopup', 'dialog');
		btn.setAttribute('aria-expended', false);

		btn.addEventListener('click', function(){
			layer_obj.btn_active = btn;
			layerShow();
			closeBtnSet(false);
		});
	}

	if(typeof option.activeOn === 'function') option.activeOn(tg_layer);

	/** 외부호출함수 - 레이어 보이기 */
	this.show = function(){
		layerShow();
		closeBtnSet(true);
	}
	
	/** 외부호출함수 - 레이어 닫기 */
	this.hide = function(){
		layerHide();
	}
}

/** 알럿 기능 
* nlayerAlert(option);
* btn : 호출버튼 (필수)
* ment : 문구 (필수)
* title : 타이틀
* btnTx : 버튼 텍스트 - 없을 경우 '확인'
* active : 확인 클릭 시 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정
*/
function nlayerAlert(option) {
	let body = document.querySelector('body');
	let btn_open = option.btn,
		ment = option.ment,
		title = option.title,
		btn_tx = option.btnTx == null ? '확인' : option.btnTx,
		active = option.active,
		focus_item;

	if(ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br>'); //줄바꿈 삽입
	if(option.focus_item != undefined) focus_item = typeof option.focus_item === 'string' ? document.querySelector(option.focus_item) : option.focus_item;

	let layerCnt = '<div class="layer alert" id="nAlert">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += ment;
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium main close-layer">'+btn_tx+'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	let alert = document.querySelector('#nAlert');

	let temp_alert = new nlayer({
		layer : '#nAlert',
		btn : btn_open,
		activeShow : function(tg_layer){
			tg_layer.querySelector('.layer-mid').focus();
		},
		activeClose : function(){
			alert.parentNode.removeChild(alert);
			if(typeof active == 'function') active();
			if(btn_open) {
				btn_open.focus();
				return;
			}
			if(focus_item) focus_item.focus();
		}
	});
	temp_alert.show();
	
	this.hide = function(){
		alert.parentNode.removeChild(alert);
		if(btn_open) {
			btn_open.focus();
			return;
		}
		if(focus_item) focus_item.focus();
	}
}

/** 컨펌 기능 
* nlayerConfirm(option);
* btn : 호출버튼 (필수)
* ment : 문구 (필수)
* title : 타이틀
* btnTxConfirm : 컨펌 버튼 텍스트 - 없을 경우 '확인'
* btnTxCancel : 취소 버튼 텍스트 - 없을 경우 '취소'
* activeConfirm : 컨펌버튼 클릭 시 실행함수
* activeCancel : 취소버튼 클릭 시 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정
*/
function nlayerConfirm(option) {
	let body = document.querySelector('body');
	let btn_open = option.btn,
		ment = option.ment,
		title = option.title,
		btn_confirm_tx = option.btnTxConfirm == undefined ? '확인' : option.btnTxConfirm,
		btn_cancel_tx = option.btnTxCancel == undefined ? '취소' : option.btnTxCancel,
		activeConfirm = option.activeConfirm,
		activeCancel = option.activeCancel,
		focus_item;

	if (ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br />'); //줄바꿈 삽입
	if(option.focus_item != undefined) focus_item = typeof option.focus_item === 'string' ? document.querySelector(option.focus_item) : option.focus_item;

	let layerCnt = '<div class="layer confirm" id="nConfirm">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += ment;
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium close-layer">'+ btn_cancel_tx +'</button>';
		layerCnt += '<button type="button" class="btn medium main confirm">'+ btn_confirm_tx +'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	let confirm	= document.querySelector('#nConfirm');

	let temp_confirm = new nlayer({
		layer : '#nConfirm',
		btn : btn_open,
		activeShow : function(tg_layer){
			tg_layer.querySelector('.layer-mid').focus();
		},
		activeClose : function(){
			confirm.parentNode.removeChild(confirm);
			if(activeCancel) activeCancel();
			if(btn_open) {
				btn_open.focus();
				return;
			}
			if(focus_item) focus_item.focus();
		}, activeConfirm : function(){
			confirm.parentNode.removeChild(confirm);
			if(activeConfirm) activeConfirm();
			if(btn_open) {
				btn_open.focus();
				return;
			}
			if(focus_item) focus_item.focus();
		}
	});
	temp_confirm.show();

	this.hide = function(){
		confirm.parentNode.removeChild(confirm);
		if(btn_open) {
			btn_open.focus();
			return;
		}
		if(focus_item) focus_item.focus();
	}
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