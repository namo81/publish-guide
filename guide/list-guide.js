
function getIndex( elm ){ 
    let c = elm.parentNode.children, i = 0;
    for(; i < c.length; i++ )
        if( c[i] == elm ) return i;
}

function elemsAddClass(elem, cls){
	Array.prototype.forEach.call(elem, function(ele){
		ele.classList.add(cls);
	});
}
function elemsRemoveClass(elem, cls){
	Array.prototype.forEach.call(elem, function(ele){
		ele.classList.remove(cls);
	});
}

let tblTotal = 0;

function guide_tblSet(tbl){
	let trs 		= tbl.querySelectorAll('tbody tr'),
		previewChk 	= document.querySelector('#view-chk'),
		mobileChk   = document.querySelector('#view-mobile');

	let frameWrap	= document.querySelector('.iframe'),
		frame, frameClose;
	if(frameWrap){
		frame		= frameWrap.querySelector('iframe'),
		frameClose  = frameWrap.querySelector('.btn-frame-close');
	}

	let td_no 		= tbl.querySelectorAll('.no'),
		td_dep1 	= tbl.querySelectorAll('.depth1');

	// 페이지 수 넘버링 추가
	Array.prototype.forEach.call(td_no, function(td){
		let num = getIndex(td.parentNode);
		td.innerText = num + 1;
		tblTotal++;
		td.parentNode.idx = num;
	});

	//depth1 에 텍스트 있을 경우 구분선 생성 및 토글버튼 추가
	let tglBtnTx = '<button type="button" class="btn-tr-tgl" title="ctrl 누른 채 클릭 시 전체 제어">Toggle</button>',
		ctrl = false;
	Array.prototype.forEach.call(td_dep1, function(td){
		if(td.innerText.length > 0){
			td.parentNode.classList.add('div');
			if(trs.length > 30) td.insertAdjacentHTML('beforeend', tglBtnTx);
		} else td.style.borderTop = 'none';
	});

	// 섹션별 토글기능
	let divArr = new Array(),
		trDivs = document.querySelectorAll('tr.div'),
		tglBtns = document.querySelectorAll('.btn-tr-tgl');

	Array.prototype.forEach.call(trDivs, function(div){
		divArr.push(div);
	});

	window.addEventListener('keydown', function(e){
		e.ctrlKey ? ctrl = true : ctrl = false;
	});
	window.addEventListener('keyup', function(e){
		ctrl = false;
	});

	if(trs.length > 30){
		Array.prototype.forEach.call(tglBtns, function(btn){
			btn.addEventListener('click', function(){
				let parTr 		= btn.parentNode.parentNode,
					parTrIdx 	= parTr.idx,
					parArrIdx 	= divArr.indexOf(parTr);
				if(ctrl){
					if(btn.classList.contains('open')) {
						Array.prototype.forEach.call(trs, function(tr){
							if(!tr.classList.contains('div')) tr.classList.remove('hide');
						});
						elemsRemoveClass(tglBtns, 'open');
					} else {
						Array.prototype.forEach.call(trs, function(tr){
							if(!tr.classList.contains('div')) tr.classList.add('hide');
						});
						elemsAddClass(tglBtns, 'open');
					}
				} else {
					Array.prototype.forEach.call(trs, function(tr){
						if(parArrIdx < divArr.length - 1) {
							if(tr.idx > parTrIdx && tr.idx < divArr[parArrIdx + 1].idx) {
								tr.classList.contains('hide') ? tr.classList.remove('hide') : tr.classList.add('hide');
							}
						} else {
							if(tr.idx > parTrIdx && tr.idx) {
								tr.classList.contains('hide') ? tr.classList.remove('hide') : tr.classList.add('hide');
							}
						}
					});
					btn.classList.contains('open') ? btn.classList.remove('open') : btn.classList.add('open');
				}
			});
			
			// 미사용 화면 리스트 닫기
			if(btn.parentNode.parentNode.classList.contains('notuse')) {
				btn.dispatchEvent(clickEvt);
			}
		});
	}


	// 링크값 유무 + 종료일 유무에 따른 표기 / 미리보기 기능 설정
	Array.prototype.forEach.call(trs, function(tr){
		let btn 		= tr.querySelector('.link > a'),
			td_state 	= tr.querySelector('.state'),
			td_end 		= tr.querySelector('.end-date');

		if(!btn) return;
	
		if(td_state) {
			if(btn.getAttribute('href').length > 0) td_state.classList.add('ing');
			else {
				btn.classList.add('ready');
				btn.addEventListener('click', function(e){ e.preventDefault(); });
			}
				
			if(td_end.innerText.length > 0){
				if(td_state.classList.contains('ing')) {
					td_state.classList.remove('ing');
					td_state.classList.add('end');
				}
			}
		}

		if(frameWrap) {
			btn.addEventListener('mouseover', function(){
				if(previewChk.checked == false) return;
				let url = btn.getAttribute('href');
				frame.setAttribute('src', url);
				if(frameWrap) frameWrap.classList.add('show');
			});
		}		
	});

	if(frameWrap) {
		frameClose.addEventListener('click', function(){
			frame.setAttribute('src', '');
			frameWrap.classList.remove('show');
			if(window.outerWidth > 701) previewChk.checked = false;
		});
		if(mobileChk) {
			mobileChk.addEventListener('click', function(){
				mobileChk.checked == true ? frameWrap.classList.add('mobile') : frameWrap.classList.remove('mobile');
			});
			mobileChk.checked == true ? frameWrap.classList.add('mobile') : frameWrap.classList.remove('mobile');
		}
	}


	// 전체 페이지 수 및 완료 페이지 표기
	let pageTotal   = document.querySelector('.total-page'),
		pageEnd 	= document.querySelector('.end-page'),
		pagePer 	= document.querySelector('.per'),
		endCount  	= document.querySelectorAll('td.end').length + document.querySelectorAll('td.include').length,
		endPer 		= (endCount / (tblTotal)) * 100;

		if(pageTotal) {
			pageTotal.innerText = tblTotal;
			pageEnd.innerText = endCount;
			pagePer.innerText = endPer.toFixed(1);
		}

	
	// text 검색
	let findBtn 	= document.querySelector('.btn-find-tx');
	if(findBtn){
		let findInp 	= document.querySelector('#find-tx'),
			hiddenInp 	= document.querySelector('.temp');
		
		findBtn.addEventListener('click', function(){
			let srchTx = findInp.value;
			
			Array.prototype.forEach.call(trs, function(tr){
				let btn  = tr.querySelector('.link a');
				if(!btn) return;
				let link = btn.getAttribute('href');
				btn.classList.remove('classUse');

				let xhr = new XMLHttpRequest();
				xhr.onload = function(){
					if (xhr.status === 200) {
						hiddenInp.value = xhr.responseText;
						let valTx = hiddenInp.value;
						valTx.match(srchTx) ? btn.classList.add('classUse') : null;
						hiddenInp.value = '';
					}
				}
				xhr.open("GET", link, true);
				xhr.send(null);
			});
		});
	}
}

// 현재 페이지 활성화
function guide_menuSet(num){
	let menus = document.querySelector('.menu').querySelectorAll('a');

	Array.prototype.forEach.call(menus, function(menu, idx){
		idx == num ? menu.classList.add('view') :  menu.classList.remove('view');
	});
}

window.onload = function(){
	let body 		= document.querySelector('body'),
		tbls 		= document.querySelectorAll('.list table');

	if(tbls) {
		tbls.forEach(function(tbl){
			if(!tbl.classList.contains('info')) {
				guide_tblSet(tbl);
			}
		})
	}
	
	
	// 조직도 관련
	let fldTree = document.querySelector('.folder-tree');
	if(fldTree) {
		let btnTrees = fldTree.querySelectorAll('button');
		Array.prototype.forEach.call(btnTrees, function(btn){
			if(btn.classList.contains('btn-tree')){
				btn.addEventListener('click', function(){
					btn.parentNode.classList.contains('on') ? btn.parentNode.classList.remove('on') : btn.parentNode.classList.add('on');
				});
			} else {
				if(!btn.nextSibling) btn.classList.add('tree-last');
			}
		});
	}

	// top 버튼 추가
	let topBtn = document.createElement('a');
	body.appendChild(topBtn);
	topBtn.classList.add('btn-guide-top');
	topBtn.setAttribute('href', '#work-list');
};