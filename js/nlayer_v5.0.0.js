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
 * tg_layer : 레이어 팝업 id (string)
 * btn_open : 레이어 팝업 제어 버튼 (string or Dom요소 배열) - dom요소 단독일 경우는 X
 * 
 * activeOn(tg_layer) : 팝업 초기 설정 후 콜백 (레이어 변수 전달)
 * activeShowBefore(tg_layer, btn) : 팝업 띄우기 전 콜백함수 (레이어, active버튼 변수 전달) - 버튼 클릭 후 레이어 show 바로 직전 실행
 * activeShow(tg_layer, btn) : 팝업 띄운 후 콜백 함수 (레이어, active버튼 변수 전달)
 * activeClose(tg_layer, btn) : 팝업 닫기 후 콜백 함수 (clsCloseBtn 을 통한 닫기) - (레이어, active버튼 변수 전달)  ** 다중레이어 전체닫기는 제외
 * activeConfirm(tg_layer, btn) : 팝업 확인 및 닫기 후 콜백함수 (clsConfirm 을 통한 닫기) - (레이어, active버튼 변수 전달)
 */

/** 레이어 팝업 */
function nlayer(option){
	let clsLayer	= option.layer_cls ? option.layer_cls : 'layer', 		// 레이어 팝업 공통 클래스
		clsCloseBtn	= option.btn_close ? option.btn_close : 'close-layer',	// 레이어 팝업 닫기버튼 클래스
		clsShow		= option.show_cls ? option.show_cls : 'show',			// 레이어 show 용 상태 클래스
		clsConfirm  = option.confirm_cls ? option.confirm_cls : 'confirm',  // 레이어 confirm 버튼 클래스
		tg_layer  	= typeof option.tg_layer === 'string' ? document.querySelector(option.tg_layer) : option.tg_layer, 	// 대상 레이어 (필수값)	
		btn_open, // 레이어 오픈 버튼 (해당 레이어를 제어할 수 있는 모든 버튼)
		btn_active  = null;   // 레이어 호출 버튼 (btn_open 중에서 실제로 팝업을 호출한 버튼)

	let bodyStyle = document.querySelector('body').style,
		tg_focus_dom; // 레이어 내 포커스될 요소

	if(option.btn_open) btn_open = typeof option.btn_open === 'string' ? document.querySelectorAll(option.btn_open) : option.btn_open;

	if(tg_layer.querySelector('.layer-top')) tg_focus_dom = tg_layer.querySelector('.layer-top');
	else tg_focus_dom = tg_layer.querySelector('.layer-mid');

	tg_focus_dom.setAttribute('tabindex', '0');

	/** 모 페이지 설정 함수 - tab 키 요소 제어 및 화면 overflow 설정 */
	function pageSet(){
		let tabEle		= document.querySelectorAll('a, button, input, select, textarea');
		tabEle.forEach(function(ele){
			if(ele.closest('.' + clsLayer)) return;
			ele.setAttribute('tabindex','-1');
			ele.setAttribute('aria-hidden', true);
		});		
		bodyStyle.overflow = 'hidden';
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
	}

	/** 레이어 닫기 (단순 닫기) */
	function layerHide() {
		let on_layers 	= document.querySelectorAll('.' + clsLayer + '.' + clsShow);

		tg_layer.classList.remove(clsShow);
		tg_layer.removeAttribute('role');
		if(on_layers.length < 2) pageUnset();

		if(btn_active == null) return;
		btn_active.setAttribute('aria-expended', false);
		setTimeout(function(){ // 모바일 talkback 상태일 경우 - pageUnset 와 focus 동시실행 관련 에러 해결
			btn_active.focus();
			btn_active = null;
		}, 30)
	}

	/** 레이어 닫기 (close) */
	function layerHideClose(){
		layerHide();
		if(typeof option.activeClose === 'function') option.activeClose(tg_layer, btn_active);
	}
	/** 레이어 닫기 (confirm) */
	function layerHideConfirm(){
		layerHide();
		if(typeof option.activeConfirm === 'function') option.activeConfirm(tg_layer, btn_active);
	}

	/** 오픈된 레이어 전체 닫기 */
	function layerHideAll() {
		let on_layers 	= document.querySelectorAll('.' + clsLayer + '.' + clsShow);
		on_layers.forEach(function(tg){
			tg_layer = tg;
			layerHide();
		});
	}

	/** 레이어 보기 */
	function layerShow(){
		if(typeof option.activeShowBefore === 'function') option.activeShowBefore(tg_layer, btn_active);
		setTimeout(function(){ // alert / confirm 일 경우 show 클래스 관련 transition 적용을 위한 delay
			tg_layer.classList.add(clsShow);
			tg_layer.setAttribute('role', 'dialog');
			
			pageSet();
			// tg_focus_dom.focus(); --> focus 로 인해 화면 밖 > 안으로 이동하는 모션 무시됨
			if(btn_active != null) btn_active.setAttribute('aria-expended', true);
			if(typeof option.activeShow === 'function') option.activeShow(tg_layer, btn_active);
			
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
	if(btn_open) {
		if(btn_open.length) {
			btn_open.forEach(function(btn){
				btn.setAttribute('aria-controls', tg_layer.getAttribute('id'));
				btn.setAttribute('aria-haspopup', 'dialog');
				btn.setAttribute('aria-expended', false);

				btn.addEventListener('click', function(){
					btn_active = btn;
					layerShow();
					closeBtnSet(false);
				});
			});
		} else btn_active = btn_open;
	}

	if(typeof option.activeOn === 'function') option.activeOn(tg_layer);

	/** 외부호출함수 - 레이어 보이기 */
	this.layer_show = function(){
		layerShow();
		closeBtnSet(true);
	}
	
	/** 외부호출함수 - 레이어 닫기 */
	this.layer_hide = function(){
		layerHide();
	}
}


/** 알럿 기능 
* nlayerAlert('호출버튼', '내용', '타이틀', 확인 후 실행할 함수, '버튼 텍스트');
* 호출버튼 / 내용은 필수
*/
function nlayerAlert(openBtn, ment, title, active, btn) {
	let body = document.querySelector('body');

	if (ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br>'); //줄바꿈 삽입

	let btnTx = btn == null ? '확인' : btn;
	let layerCnt = '<div class="layer alert" id="nAlert">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += '<p class="ment">'+ment+'</p>';
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium close-layer">'+btnTx+'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	let alert = document.querySelector('#nAlert');

	let temp_alert = new nlayer({
		tg_layer : '#nAlert',
		btn_open : openBtn,
		activeClose : function(){
			alert.parentNode.removeChild(alert);
			if(active) active();
		}
	});
	temp_alert.layer_show();
}

/** 컨펌 기능 
* nlayerConfirm('호출버튼', '내용', '타이틀', 확인 시 실행할 함수, 취소 시 실행할 함수, '확인버튼 텍스트', '취소버튼 텍스트');
* 호출버튼 / 내용은 필수
*/
function nlayerConfirm(openBtn, ment, title, activeConfirm, activeCancel, btn1, btn2) {
	let body = document.querySelector('body');

	let btnOk = btn1 == null ? '확인' : btn1,
		btnCancel = btn2 == null ? '취소' : btn2;

	if (ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br />'); //줄바꿈 삽입

	let layerCnt = '<div class="layer confirm" id="nConfirm">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += '<p class="ment">'+ment+'</p>';
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium close-layer">'+ btnCancel +'</button>';
		layerCnt += '<button type="button" class="btn medium main confirm">'+ btnOk +'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	let confirm	= document.querySelector('#nConfirm');

	let temp_confirm = new nlayer({
		tg_layer : '#nConfirm',
		btn_open : openBtn,
		activeClose : function(){
			confirm.parentNode.removeChild(confirm);
			if(activeCancel) activeCancel();
		}, activeConfirm : function(){
			confirm.parentNode.removeChild(confirm);
			if(activeConfirm) activeConfirm();
		}
	});
	temp_confirm.layer_show();
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