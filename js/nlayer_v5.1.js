// layer pop system
// 2018-08-30 copyright - namo (seo nam ho) for m.s.p
// 2021-10-19 - v.4.0 : IE11 이상만 지원 // style : display:flex 방식으로 CSS 변경됨.
// 2024-05-02 - v.5.0 : 모바일 접근성 지원 및 접근성 개선을 위한 전체 변경.
// 2025-03-04 - v.5.1 : 레이어 배열 및 2중 레이어 관련 구조 수정
// 2026-03-27 - v.5.1 : AI 를 통한 코드 정리 및 최적화

// !! common.js 필수

/** HTML 이스케이핑 함수 - XSS 방지 */
function escapeHtml(text) {
	if (typeof text !== 'string') return text;
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, m => map[m]);
}

/** option 항목
 * clsLayer : 레이어 팝업 공통 클래스
 * clsCloseBtn : 레이어 팝업 닫기 버튼 클래스
 * clsShow : 레이어 팝업 show 상태 클래스
 * clsConfirm : 레이어 팝업 confirm 버튼 클래스
 * 
 * layer : 레이어 팝업 id (string)
 * btn : 레이어 팝업 제어 버튼 (string or Dom요소 배열) - dom요소 단독일 경우는 X
 * 
 * activeOn() : 팝업 초기 설정 후 콜백 (레이어만 선택 가능)
 * activeShowBefore() : 팝업 띄우기 전 콜백함수 (레이어, active버튼 변수 선택 가능) - 버튼 클릭 후 레이어 show 바로 직전 실행
 * activeShow() : 팝업 띄운 후 콜백 함수 (레이어, active버튼 변수 선택 가능)
 * activeClose() : 팝업 닫기 후 콜백 함수 (clsCloseBtn 을 통한 닫기) - (레이어, active버튼 변수 선택 가능)  ** 다중레이어 전체닫기는 제외
 * activeConfirm() : confirm 클래스를 가진 버튼 클릭 시 콜백 - (레이어, active버튼 변수 선택 가능)
 *    > 해당함수에서 false 가 리턴될 경우 닫히지 않음.
 */

/** 내부변수
 * layer.dom : 레이어 dom 요소
 * layer.title : 레이어 내 title 텍스트값 (aria-labelledby 설정 용)
 * layer.btn_open : 레이어 호출 가능 버튼 전체
 * layer.btn_active : 레이어를 호출한 버튼 (ben_open 중 직접 호출한 버튼)
 */

// visualViewport 변동 시 설정함수 : 확인필요
function visualViewport_chk(e){
	let view = e.target.height;
	let tg_sc = document.documentElement.scrollHeight - view;
	document.documentElement.scrollTo({ left:0, top:tg_sc });
}

/** 레이어 팝업 */
function nlayer(option){
	// 변수 및 초기설정
	const layer = this;

	let clsLayer	= option.layer_cls || 'layer', 		// 레이어 팝업 공통 클래스
		clsCloseBtn	= option.btn_close || 'close-layer',	// 레이어 팝업 닫기버튼 클래스
		clsShow		= option.show_cls || 'show',			// 레이어 show 용 상태 클래스
		clsConfirm  = option.confirm_cls || 'confirm',  // 레이어 confirm 버튼 클래스
		tx_role     = option.role || 'dialog';

	let body = document.querySelector('body'),
		win_sc, // window scrollY값
		tabEle, // 레이어 외 제어할 tab 키 요소 배열
		first_focus; // 화면 내 첫번째 focus 될 요소;

	layer.dom  = typeof option.layer === 'string' ? document.querySelector(option.layer) : option.layer; // 대상 레이어 (필수값)
	layer.dom.setAttribute('role', tx_role);
	layer.dom.setAttribute('aria-labelledby', layer.title);
	layer.title = option.title ? option.title : layer.dom.querySelector('.layer-title').textContent;

	/** 버튼 기능 설정 */
	if(option.btn) layer.btn_open = typeof option.btn === 'string' ? document.querySelectorAll(option.btn) : option.btn;
	if(layer.btn_open) {
		if(layer.btn_open.length) {
			layer.btn_open.forEach(function(btn){
				btn_set(btn)
			});
		} else btn_set(layer.btn_open);
	}

	if(layer.dom.querySelector('.layer-title')) first_focus = layer.dom.querySelector('.layer-title');
	else if(layer.dom.querySelector('a, button, input, select, textarea')) first_focus = layer.dom.querySelector('a, button, input, select, textarea');
	else first_focus = layer.dom.querySelector('.layer-cnt');

	/** 모 페이지 설정 함수 - tab 키 요소 제어 및 화면 overflow 설정 */
	function pageSet(){
		tabEle = document.querySelectorAll('a, button, input, select, textarea');
		tabEle.forEach(function(ele){
			if(ele.closest('.' + clsLayer) == layer.dom) {
				ele.removeAttribute('inert');
				return;
			}
			if(ele == document.activeElement) ele.blur();
			ele.setAttribute('inert', true);
			
		})
		checkMobile() == 'ios' ? body.classList.add('hold') : body.style.overflow = 'hidden';
	}

	/** 모 페이지 설정 해제 - tab 키 요소 제어 및 화면 overflow 설정 해제 */
	function pageUnset() {
		if(count_on_layer() > 0) {
			tabEle.forEach(function(ele){
				if(!ele.closest('.' + clsLayer)) return;
				ele.removeAttribute('inert');
			});
			return;
		}
		tabEle.forEach(function(ele){ ele.removeAttribute('inert'); });
		body.classList.contains('hold') ? body.classList.remove('hold') : body.style.overflow = '';
	}
	
	/** 현재 화면 내 활성화 레이어 갯수 확인 */
	function count_on_layer(){
		let layers = document.querySelectorAll('.' + clsLayer + '.' + clsShow);
		return layers.length;
	}

	/** 레이어 닫기 (단순 닫기) */
	async function layerHide() {
		layer.dom.classList.remove(clsShow);
		layer.dom.removeAttribute('aria-modal');
		//if(window.visualViewport) window.visualViewport.removeEventListener('resize', visualViewport_chk);
		pageUnset();

		if(layer.btn_active == null) return;
		layer.btn_active.setAttribute('aria-expanded', false);

		await waitRender(); // 모바일 talkback 상태일 경우 - pageUnset 와 focus 동시실행 관련 에러 해결
		layer.btn_active.focus();
		layer.btn_active = null;
		if(checkMobile() == 'ios') window.scrollTo(0, win_sc);
	}

	/** 레이어 닫기 (close) */
	function layerHideClose(){
		layerHide();
		if(typeof option.activeClose === 'function') option.activeClose(layer.dom);
	}

	/** 레이어 닫기 (confirm) */
	function layerHideConfirm(){
		if(typeof option.activeConfirm === 'function') {
			if(option.activeConfirm(layer.dom) != false) layerHide();
		} else layerHide();
	}

	/** 레이어 보기 */
	async function layerShow(){
		win_sc = window.scrollY;
		if(typeof option.activeShowBefore === 'function') option.activeShowBefore(layer.dom);
		await waitRender();
		layer.dom.classList.add(clsShow);
		layer.dom.setAttribute('aria-modal', true);
		first_focus.focus();
		
		pageSet();
		//if(window.visualViewport) window.visualViewport.addEventListener('resize', visualViewport_chk); // viewport 체크 기능 적용
		if(layer.btn_active != null) layer.btn_active.setAttribute('aria-expanded', true);
		if(typeof option.activeShow === 'function') option.activeShow(layer.dom);
	}

	/** 레이어 닫기 버튼 설정 */
	function closeBtnSet(onceChk){
		let btnCloses 	= layer.dom.querySelectorAll('.' + clsCloseBtn);
		btnCloses.forEach(function(cbtn){
			// onceChk=false일 때 기존 리스너 제거하여 메모리 누수 방지
			if(!onceChk) cbtn.removeEventListener('click', layerHideClose);
			cbtn.addEventListener('click', layerHideClose, { once: onceChk });
		});

		let btnConfirm = layer.dom.querySelectorAll('.' + clsConfirm);
		if(btnConfirm.length < 1) return;
		btnConfirm.forEach(function(btn){
			// onceChk=false일 때 기존 리스너 제거하여 메모리 누수 방지
			if(!onceChk) btn.removeEventListener('click', layerHideConfirm);
			btn.addEventListener('click', layerHideConfirm, { once: onceChk });
		});
	}

	/** 오픈 버튼 기능 적용 */
	function btn_set(btn){
		btn.setAttribute('aria-controls', layer.dom.getAttribute('id'));
		btn.setAttribute('aria-haspopup', 'dialog');

		btn.addEventListener('click', function(){
			layer.btn_active = btn;
			layerShow();
			closeBtnSet(false);
		});
	}

	if(typeof option.activeOn === 'function') option.activeOn(layer.dom);

	/** 외부호출함수 - 레이어 보이기 */
	layer.show = function(){
		layerShow();
		closeBtnSet(true);
	}
	
	/** 외부호출함수 - 레이어 닫기 */
	layer.hide = function(){
		layerHide();
	}
}

/** 알럿 기능 
* nlayerAlert(option);
* ment : 문구 (필수)
* title : 타이틀
* focus_item : 팝업 닫기 후 focus 될 요소 지정
* btnTx : 버튼 텍스트 - 없을 경우 '확인'
* active : 확인 클릭 시 실행함수
*/
function nlayerAlert(option) {
	const nAlert = this;

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
		layerCnt += '<button type="button" class="btn medium main close-layer">'+btn_tx+'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	nAlert.dom = document.querySelector('#nAlert');

	let temp_alert = new nlayer({
		layer : '#nAlert',
		title : 'Alert',
		role : 'alertdialog',
		activeClose : function(){
			if(typeof active == 'function') active();
			alert_hide();
		}
	});
	temp_alert.show();
	
	function alert_hide(){
		nAlert.dom.parentNode.removeChild(nAlert.dom);
		temp_alert = null; // temp_alert 객제 제거용 (가비지)
		if(focus_item) focus_item.focus();
	}
}

/** 컨펌 기능 
* nlayerConfirm(option);
* ment : 문구 (필수)
* title : 타이틀
* focus_item : 팝업 닫기 후 focus 될 요소 지정
* btnTxConfirm : 컨펌 버튼 텍스트 - 없을 경우 '확인'
* btnTxCancel : 취소 버튼 텍스트 - 없을 경우 '취소'
* activeConfirm : 컨펌버튼 클릭 시 실행함수
* activeCancel : 취소버튼 클릭 시 실행함수
*/
function nlayerConfirm(option) {
	const nConfirm = this;
	let body = document.querySelector('body'),
		ment = option.ment,
		title = option.title,
		btn_confirm_tx = option.btnTxConfirm == undefined ? '확인' : option.btnTxConfirm,
		btn_cancel_tx = option.btnTxCancel == undefined ? '취소' : option.btnTxCancel,
		activeConfirm = option.activeConfirm,
		activeCancel = option.activeCancel,
		focus_item;

	if (ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br />'); //줄바꿈 삽입
	if(option.focus_item != undefined) focus_item = typeof option.focus_item === 'string' ? document.querySelector(option.focus_item) : option.focus_item;

	let layerCnt = '<div class="layer confirm" id="nConfirm" role="alertdialog">';
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
	nConfirm.dom	= document.querySelector('#nConfirm');

	let temp_confirm = new nlayer({
		layer : '#nConfirm',
		title : 'Confirm',
		role : 'alertdialog',
		activeClose : function(){
			temp_confirm.hide();
			if(typeof activeCancel == 'function') activeCancel();
			confirm_hide();
		}, activeConfirm : function(){
			if(typeof activeConfirm == 'function') {
				if(activeConfirm() != false) {
					temp_confirm.hide();
					confirm_hide();
				}
			} else {
				temp_confirm.hide();
				confirm_hide();
			}
		}
	});
	temp_confirm.show();

	function confirm_hide(){
		nConfirm.dom.parentNode.removeChild(nConfirm.dom);
		temp_confirm = null; // temp_alert 객제 제거용 (가비지)
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