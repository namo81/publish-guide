/* -- date : 2020-03-19 -- */
/* -- snamo(Seo nam ho) for m.s.p -- */
/* -- GNB / LNB 설정 -- */


// GNB 관련 --------------------------------
function nGnb(selector){
	var nGnbEle = document.querySelectorAll(selector);
	if (nGnbEle.length == 1) nGnbSet(nGnbEle[0]);
	else null;
}

function nGnbSet(Ele){
	var gnbWrap		= Ele,
		dep1Li		= gnbWrap.querySelectorAll('.depth1 > li'),
		dep1		= gnbWrap.querySelectorAll('.depth1 > li > a'),
		dep2		= gnbWrap.querySelectorAll('.depth2 > li > a');

	// 2dep 마지막 li 에 last 클래스 추가
	for(i=0; i<dep1Li.length; i++){
		var dep2Li		= dep1Li[i].querySelectorAll('.depth2 > li'),
			dep2Len		= dep2Li.length;
		if(dep2Len > 0)	dep2Li[dep2Len - 1].classList.add('last');
	}

	var dep1Focus = function(event){
		var btn = event.target,
			dep2	= btn.nextSibling,
			key = event.keyCode || event.which;
		
		if(dep2 != null) {
			if(event.type == 'focus') btn.parentElement.classList.add('show');
			if(event.type == 'mouseleave') btn.parentElement.classList.remove('show');
			if(key == 9 && event.shiftKey) btn.parentElement.classList.remove('show');
		} else {
			if(key == 9 && !event.shiftKey) btn.parentElement.classList.remove('show');
		}
	}, dep2Focus = function(event){
		var btn2 	= event.target,
			parent 	= btn2.parentNode,
			gParent = parent.parentNode.parentNode,
			key		= event.keyCode || event.whick;
		if(key == 9 && !event.shiftKey){
			if(parent.classList.contains('last')) gParent.classList.remove('show');
		}
	}

	for(i=0; i<dep1.length; i++){
		dep1[i].addEventListener('focus',dep1Focus);
		dep1[i].addEventListener('mouseleave',dep1Focus);
		dep1[i].addEventListener('keydown',dep1Focus);
	}

	for(i=0; i<dep2.length; i++){
		dep2[i].addEventListener('keydown',dep2Focus);
	}
}
