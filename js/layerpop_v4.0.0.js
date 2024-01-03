// layer pop system
// 2018-08-30 copyright - namo (seo nam ho) for m.s.p
// 2021-10-19 - v.4.0.0 : IE11 이상만 지원 // style : display:flex 방식으로 CSS 변경됨.

// !! common.js 필수

var clsLayer		= '.layer', 		// 레이어 팝업 공통 클래스
	clsOn			= 'now-open', 		// 레이어 팝업 오픈 시킨 버튼에 지정될 임시 클래스
	clslayerCnt		= '.layer-cnt', 	// 레이어 팝업 내 컨텐츠 영역 클래스
	clsCloseBtn		= '.close-layer',	// 레이어 팝업 닫기버튼 클래스
	clsShow			= 'showOn';			// 레이어 show 용 상태 클래스

var nlayer = {
	// 모 페이지 설정 함수 - tab 키 요소 제어 및 화면 높이 설정
	pageSet : function() {
		var tabEle		= document.querySelectorAll('a, button, input'),
			bodyStyle	= document.querySelector('body').style;

		tabEle.forEach(function(ele){
			if(!ele.closest(clsLayer)) ele.setAttribute('tabindex','-1');
		});
		
		bodyStyle.overflow = 'hidden';
	},

	// 모 페이지 설정 해제
	pageUnset : function(){
		var tabEle		= document.querySelectorAll('a, button, input'),
			bodyStyle	= document.querySelector('body').style;
		
		tabEle.forEach(function(ele){
			if(!ele.closest(clsLayer)) ele.removeAttribute('tabindex');
		});

		bodyStyle.overflow = '';	
	},

	// 레이어 닫기
	layerHide : function(tg){
		var tg_layer	= typeof tg === 'string' ? document.getElementById(tg) : tg,
			on_layer 	= document.querySelectorAll(clsLayer + '.' + clsShow);

		tg_layer.classList.remove(clsShow);
		if(on_layer.length < 2) nlayer.pageUnset();

		if(tg_layer.showBtn == null) return;
		tg_layer.showBtn.classList.remove(clsOn);
		tg_layer.showBtn.focus();
	},

	// 오픈된 레이어 전체 닫기
	layerHideAll : function(){
		var tg_layers 	= document.querySelectorAll(clsLayer),
			openBtns = document.querySelectorAll('.' + clsOn);

		tg_layers.forEach(function(tg){ nlayer.layerHide(tg); });
		openBtns.forEach(function(obtn){ obtn.classList.remove(clsOn); });
	},	

	// 레이어 보기
	layerShow : function(tg, opBtn){
		var tg_layer 	= typeof tg === 'string' ? document.getElementById(tg) : tg;
		
		opBtn ? tg_layer.showBtn = opBtn : tg_layer.showBtn = null;
		tg_layer.classList.add(clsShow);

		nlayer.pageSet();
		tg_layer.focus();
	},

	// 레이어 닫기 버튼 설정
	closeBtnSet : function(tg, onceChk){
		var tg_layer 	= typeof tg === 'string' ? document.getElementById(tg) : tg,
			btnCloses 	= tg_layer.querySelectorAll(clsCloseBtn);

		btnCloses.forEach(function(cbtn){
			if(cbtn.classList.contains('all')) {
				cbtn.addEventListener('click', nlayer.layerHideAll, { once: onceChk });
				return;
			}
			cbtn.addEventListener('click', function(){
				nlayer.layerHide(tg_layer);
			}, { once: onceChk });
		});
	},

	// 버튼의 data-target 와 동일한 레이어 호출 ( click 이벤트를 별도로 선언할 경우 사용 )
	showClick : function(btnCls){
		var btn = typeof btnCls === 'string' ? document.querySelector(btnCls) : btnCls,
			tg 	= document.getElementById(btn.getAttribute('data-target'));

		nlayer.layerShow(tg, btn);
		btn.classList.add(clsOn);
		nlayer.closeBtnSet(tg, false);
	},

	// 동일 클래스 버튼에 전체 기능 부여
	showBtn : function(btnCls){
		var btns = document.querySelectorAll(btnCls);
		btns.forEach(function(btn){
			btn.addEventListener('click', function(){
				nlayer.showClick(this);
			});
		});
	},

	// 함수 실행으로 레이어 팝업 열기 (버튼 연결 없이 단순 script 로 호출할 경우)
	showFunc : function(tg_id){
		nlayer.layerShow(tg_id);
		nlayer.closeBtnSet(tg_id, true);
	}
}


/* 알럿 기능 =========================================================================================================
nlayerAlert('내용', '타이틀', 확인 후 실행할 함수, '버튼 텍스트');
- 내용은 필수
*/
function nlayerAlert(ment, title, active, btn) {
	var body = document.querySelector('body');

	if (ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br>'); //줄바꿈 삽입

	var btnTx = btn == null ? '확인' : btn;
	var layerCnt = '<div class="layer alert" id="nAlert">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += '<p class="ment">'+ment+'</p>';
		layerCnt += '<div class="btn-group">';
		layerCnt += '<button type="button" class="btn medium close-layer">'+btnTx+'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	var alert = document.querySelector('#nAlert'),
		close = alert.querySelector('#nAlert .close-layer');

	nlayer.showFunc('nAlert');	

	close.addEventListener('click', function(){
		alert.parentNode.removeChild(alert);
		if(typeof active === 'function') {
			active();
		}
	});
}

/* 컨펌 기능 =========================================================================================================
nlayerAlert('내용', '타이틀', '확인 시 실행할 함수, '취소버튼 텍스트', '확인버튼 텍스트');
- 내용은 필수
*/
function nlayerConfirm(ment, title, active, btn1, btn2) {
	var body = document.querySelector('body');

	var btnCancel = btn1 == null ? '취소' : btn1,
		btnOk = btn2 == null ? '확인' : btn2;

	if (ment.split("\n").length>1) ment = ment.replace(/\n/gi,'<br>'); //줄바꿈 삽입

	var layerCnt = '<div class="layer confirm" id="nConfirm">';
		layerCnt += '<div class="inbox">';
		layerCnt += '<div class="layer-cnt">';
		if(title != undefined && title.length > 0) layerCnt += '<div class="layer-top">'+ title +'</div>';
		layerCnt += '<div class="layer-mid">';
		layerCnt += '<p class="ment">'+ment+'</p>';
		layerCnt += '<div class="btn-group">';
		layerCnt += '<button type="button" class="btn medium close-layer">'+ btnCancel +'</button>';
		layerCnt += '<button type="button" class="btn medium red close-layer btn-ok">'+ btnOk +'</button>';
		layerCnt += '</div></div></div></div></div>';

	body.insertAdjacentHTML('beforeend', layerCnt);
	var confirm	= document.querySelector('#nConfirm'),
		cancel	= confirm.querySelector('#nConfirm .close-layer'),
		ok		= confirm.querySelector('#nConfirm .btn-ok');

	nlayer.showFunc('nConfirm');

	cancel.addEventListener('click', function(){
		confirm.parentNode.removeChild(confirm);
	});
	ok.addEventListener('click', function(){
		confirm.parentNode.removeChild(confirm);
		if(typeof active === 'function') {
			active();
		}
	});
}


/* Toast 기능 =========================================================================================================
nToast('내용', '추가 클래스')
*/
function nToast(ment, addCls) {
	var body = document.querySelector('body');
	var toastCnt = '';
		addCls ? toastCnt = '<div class="toast '+addCls+'">' : toastCnt = '<div class="toast">';
		toastCnt += '<div class="toast-cnt">';
		toastCnt += '<p class="ment">'+ment+'</p>';
		toastCnt += '</div></div>';

	body.insertAdjacentHTML('beforeend', toastCnt);
	var toast		= document.querySelector('.toast'),
		toastCnt	= toast.querySelector('.toast-cnt');

	toast.classList.add('show');
	toastCnt.addEventListener('animationend', function(){
		toast.parentNode.removeChild(toast);
	}, { once : true });
}