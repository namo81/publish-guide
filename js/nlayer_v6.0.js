// layer pop system
// 2025-07-07 - v.6.0.0 : 레이어 기능 단순화 (자체 제작 백업용 버전)
// 2026-10-21 - v.6.0 : 오류 수정 (AI 수정본) - js class 미지원 브라우저용
//   - nlayerAlert : 'alert.dom' 오타로 알럿 생성 시 오류 발생하던 문제 수정
//   - 알럿/컨펌 : 전역 변수(window.dom) 누수 및 고정 id 중복 수정, 콜백은 팝업이 닫힌 후 실행
//   - aria-labelledby 에 타이틀 문구가 들어가던 오류 수정 → .layer-title id 연결 (없으면 aria-label)
//   - 이미 role 이 있으면 덮어쓰지 않음 (alertdialog 가 dialog 로 바뀌던 문제)
//   - .layer-title / 포커스 요소가 없을 때 오류 수정, layer 요소가 없을 때 console.warn
//   - 열리지 않은 레이어 hide() 시 오류 / 중복 show 시 layer_arr 중복 등록 수정
//   - state() 가 clsShow 옵션 대신 'show' 고정값을 확인하던 문제 수정
//   - 다중 레이어에서 하나만 닫아도 visualViewport 이벤트가 해제되던 문제 수정
//   - body overflow 복원 시 기존 inline 값 유지
//   - ESC 키로 최상위 레이어 닫기, 닫기 버튼에 'all' 클래스 시 전체 닫기 (가이드 설명 기능 반영)
//   - 닫기 후 포커스 복귀 : show(요소) 인자 > focus_item 옵션 > 열기 전 포커스 요소
//   - nToast : CSS animation 이 없을 경우 토스트가 제거되지 않던 문제 수정
//   - common.js 의존 제거

// 의존 파일 없음

/** option 항목
 * layer : 레이어 팝업 선택자 or 요소 - 필수값
 * title : 레이어의 타이틀 (string) - 레이어 내 '.layer-title' 요소가 없을 경우 필수
 * clsLayer : 레이어 팝업 공통 클래스 - 기본 'layer'
 * clsCloseBtn : 레이어 팝업 닫기 버튼 클래스 - 기본 'close-layer' / 닫기 버튼에 'all' 클래스 추가 시 전체 닫기
 * clsShow : 레이어 팝업 show 상태 클래스 - 기본 'show'
 * focus_item : 레이어 닫기 후 focus 될 요소 - 없을 경우 열기 전 포커스 요소
 * escClose : ESC 키로 닫기 - 기본 true
 *
 * activeShow : 레이어 show 가 완료되면 콜백 실행
 * activeClose : 레이어 hide 가 완료되면 콜백 실행
 *
 * 메서드 : show(focus_item) / hide() / state()
 */

// 현재 show 상태인 레이어 배열
let layer_arr = [];
let layer_uid = 0;			// 자동 생성 id 용
let layer_bodyOverflow = '';	// 레이어 오픈 전 body inline overflow 값

/** 오픈된 레이어 전체 닫기 */
function layerHideAll() {
	for(let i = layer_arr.length - 1; i >= 0; i--){
		layer_arr[i].hide();
	}
}

function visualViewport_chk(e){
	let view = e.target.height;
	let tg_sc = document.documentElement.scrollHeight - view;
	document.documentElement.scrollTo({ left:0, top:tg_sc });
}

/** 레이어 팝업 */
function nlayer(option){
	const layer = this;
	option = option || {};

	let clsLayer	= option.clsLayer || 'layer', 			// 레이어 팝업 공통 클래스
		clsCloseBtn	= option.clsCloseBtn || 'close-layer',	// 레이어 팝업 닫기버튼 클래스
		clsShow		= option.clsShow || 'show',				// 레이어 show 용 상태 클래스
		escClose	= option.escClose !== false,								// ESC 닫기 여부
		focus_item  = undefined, 												// 레이어 닫기 후 focus 될 요소
		return_focus = null;													// 이번 show 에서 닫기 후 포커스 될 요소

	layer.dom = typeof option.layer === 'string' ? document.querySelector(option.layer) : option.layer; // 대상 레이어 (필수값)
	if(!layer.dom) {
		console.warn('nlayer : layer 요소를 찾을 수 없습니다. (' + option.layer + ')');
		return;
	}

	let titleEle = layer.dom.querySelector('.layer-title');
	layer.title = option.title ? option.title : (titleEle ? titleEle.textContent : '');
	if(option.focus_item) {
		focus_item  = typeof option.focus_item === 'string' ? document.querySelector(option.focus_item) : option.focus_item;
	}

	if(!layer.dom.hasAttribute('role')) layer.dom.setAttribute('role', 'dialog');
	if(option.title) layer.dom.setAttribute('aria-label', option.title);
	else if(titleEle) {
		if(!titleEle.id) titleEle.id = layer.dom.id ? layer.dom.id + '-title' : 'nlayer-title-' + (++layer_uid);
		layer.dom.setAttribute('aria-labelledby', titleEle.id);
	} else console.warn('nlayer : 레이어 타이틀이 없습니다. (.layer-title 요소 또는 title 옵션 필요)');

	let body = document.querySelector('body'),
		bodyStyle = body.style;

	let tabEle = [];     // 제어할 tab 키 요소 배열

	/** 모 페이지 설정 함수 - tab 키 요소 제어 및 화면 overflow 설정 */
	function pageSet(){
		tabEle = document.querySelectorAll('a, button, input, select, textarea, iframe, [tabindex]');
		tabEle.forEach(function(ele){
			if(ele.closest('.' + clsLayer) == layer.dom) {
				ele.removeAttribute('inert');
				return;
			}
			if(ele == document.activeElement) ele.blur();
			ele.setAttribute('inert', '');

		});
		if(layer_arr.length === 1) layer_bodyOverflow = bodyStyle.overflow; // 첫 레이어 오픈 시 기존 값 저장
		bodyStyle.overflow = 'hidden';
		body.classList.add('hold');
	}

	/** 모 페이지 설정 해제 - tab 키 요소 제어 및 화면 overflow 설정 해제 */
	function pageUnset() {
		if(layer_arr.length > 0) {
			tabEle.forEach(function(ele){
				if(ele.closest('.' + clsLayer + '.' + clsShow)) ele.removeAttribute('inert');
			});
			return;
		}
		tabEle.forEach(function(ele){ ele.removeAttribute('inert'); });
		bodyStyle.overflow = layer_bodyOverflow;
		body.classList.remove('hold');
	}

	/** 레이어 닫기 (단순 닫기) */
	function layerHide() {
		if(!layer.state()) return;

		let idx = layer_arr.indexOf(layer);
		if(idx > -1) layer_arr.splice(idx, 1);
		layer.dom.classList.remove(clsShow);
		layer.dom.removeAttribute('aria-modal');
		if(window.visualViewport && layer_arr.length === 0) window.visualViewport.removeEventListener('resize', visualViewport_chk);
		pageUnset();

		let tg = return_focus;
		return_focus = null;
		if(tg && tg.isConnected && typeof tg.focus === 'function') tg.focus();
		if(typeof option.activeClose === 'function') option.activeClose();
	}

	/** 레이어 보기 */
	function layerShow(tg_focus){
		if(layer.state()) return;

		if(typeof tg_focus === 'string') tg_focus = document.querySelector(tg_focus);
		return_focus = tg_focus || focus_item || document.activeElement;

		void layer.dom.offsetWidth;
		layer_arr.push(layer);
		layer.dom.classList.add(clsShow);
		layer.dom.setAttribute('aria-modal', 'true');

		let focus_tg = layer.dom.querySelector('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])');

		pageSet();
		if(window.visualViewport) window.visualViewport.addEventListener('resize', visualViewport_chk); // viewport 체크 기능 적용
		// focus 로 인해 화면 밖 > 안으로 이동하는 모션 무시될 가능성 있음. 확인 필요 - 필요 시 transitionend 이벤트 추가 후 적용
		if(focus_tg) {
			focus_tg.focus();
		} else {
			if(!layer.dom.hasAttribute('tabindex')) layer.dom.setAttribute('tabindex', '-1');
			layer.dom.focus();
		}
		if(typeof option.activeShow === 'function') option.activeShow();
	}

	/** 레이어 닫기 버튼 설정 - 'all' 클래스 있을 경우 전체 닫기 */
	function closeBtnSet(){
		let btnCloses 	= layer.dom.querySelectorAll('.' + clsCloseBtn);
		btnCloses.forEach(function(btn){
			btn.addEventListener('click', btn.classList.contains('all') ? layerHideAll : layerHide);
		});
	}
	closeBtnSet();

	/** ESC 키 닫기 - 최상위 레이어만 */
	layer.dom.addEventListener('keydown', function(e){
		if(!escClose || e.key !== 'Escape' || layer_arr[layer_arr.length - 1] !== layer) return;
		e.stopPropagation();
		layerHide();
	});

	/** 외부호출함수 - 레이어 보이기 (tg_focus : 닫기 후 focus 될 요소 - 선택) */
	layer.show = function(tg_focus){
		layerShow(tg_focus);
	}

	/** 외부호출함수 - 레이어 닫기 */
	layer.hide = function(){
		layerHide();
	}

	/** 외부호출함수 - 레이어 상태 확인 (boolean 리턴) */
	layer.state = function(){
		return layer.dom.classList.contains(clsShow);
	}
}

/** 알럿 기능
* nAlert(option);
* ment : 문구 (필수)
* title : 타이틀
* btnTx : 버튼 텍스트 - 없을 경우 '확인'
* active : 팝업이 닫힌 후 실행함수 (확인 버튼 / ESC)
* focus_item : 팝업 닫기 후 focus 될 요소 지정 - 없을 경우 호출 전 포커스 요소
*/
function nAlert(option) {
	option = option || {};
	let body = document.querySelector('body'),
		ment = String(option.ment == null ? '' : option.ment),
		title = option.title,
		btn_tx = option.btnTx == null ? '확인' : option.btnTx,
		active = option.active,
		id = 'nAlert-' + (++layer_uid);

	ment = ment.replace(/\n/g,'<br>'); //줄바꿈 삽입

	let layerCnt = '<div class="layer alert" id="' + id + '" role="alertdialog">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top layer-title">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += ment;
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium main close-alert">'+btn_tx+'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	let dom = document.getElementById(id);

	let btn_close = dom.querySelector('.close-alert');
	let temp_alert = new nlayer({
		layer : dom,
		title : title ? undefined : '알림',
		focus_item : option.focus_item,
		escClose : false
	});
	temp_alert.show();

	function close_alert(){
		temp_alert.hide();
		dom.parentNode.removeChild(dom);
		temp_alert = null;
		if(typeof active == 'function') active();
	}

	btn_close.addEventListener('click', close_alert);
	dom.addEventListener('keydown', function(e){
		if(e.key === 'Escape') close_alert();
	});
}

/** 컨펌 기능
* nConfirm(option);
* ment : 문구 (필수)
* title : 타이틀
* btnTxConfirm : 컨펌 버튼 텍스트 - 없을 경우 '확인'
* btnTxCancel : 취소 버튼 텍스트 - 없을 경우 '취소'
* activeConfirm : 컨펌버튼으로 닫힌 후 실행함수
* activeCancel : 취소버튼 / ESC 로 닫힌 후 실행함수
* focus_item : 팝업 닫기 후 focus 될 요소 지정 - 없을 경우 호출 전 포커스 요소
*/
function nConfirm(option) {
	option = option || {};
	let body = document.querySelector('body'),
		ment = String(option.ment == null ? '' : option.ment),
		title = option.title,
		btn_confirm_tx = option.btnTxConfirm == undefined ? '확인' : option.btnTxConfirm,
		btn_cancel_tx = option.btnTxCancel == undefined ? '취소' : option.btnTxCancel,
		activeConfirm = option.activeConfirm,
		activeCancel = option.activeCancel,
		id = 'nConfirm-' + (++layer_uid);

	ment = ment.replace(/\n/g,'<br />'); //줄바꿈 삽입

	let layerCnt = '<div class="layer confirm" id="' + id + '" role="alertdialog">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top layer-title">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += ment;
		layerCnt += '<div class="btns">';
		layerCnt += '<button type="button" class="btn medium confirm-cancel">'+ btn_cancel_tx +'</button>';
		layerCnt += '<button type="button" class="btn medium main confirm-ok">'+ btn_confirm_tx +'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	let dom = document.getElementById(id);

	let btn_close = dom.querySelector('.confirm-cancel'),
		btn_confirm = dom.querySelector('.confirm-ok');

	let temp_confirm = new nlayer({
		layer : dom,
		title : title ? undefined : '확인 요청',
		focus_item : option.focus_item,
		escClose : false
	});
	temp_confirm.show();

	function close_confirm(callback){
		temp_confirm.hide();
		dom.parentNode.removeChild(dom);
		temp_confirm = null;
		if(typeof callback == 'function') callback();
	}

	btn_confirm.addEventListener('click', ()=>{
		close_confirm(activeConfirm);
	});
	btn_close.addEventListener('click', ()=>{
		close_confirm(activeCancel);
	});
	dom.addEventListener('keydown', function(e){
		if(e.key === 'Escape') close_confirm(activeCancel);
	});
}

/** Toast 기능
* nToast('내용', '추가 클래스')
* 표시 시간은 CSS animation 기준 - animation 이 없을 경우 3초 후 제거
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
	let toast		= body.lastElementChild,
		toastCnt	= toast.querySelector('.toast-cnt'),
		removeToast = function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); };

	toast.classList.add('show');
	if(getComputedStyle(toastCnt).animationName === 'none') setTimeout(removeToast, 3000);
	else toastCnt.addEventListener('animationend', removeToast, { once : true });
}
