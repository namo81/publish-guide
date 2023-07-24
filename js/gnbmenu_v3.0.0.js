/* -- date : 2023-07-17 -- */
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
        dep1Btns	= gnbWrap.querySelectorAll('.depth1 > li > a');
    
    gnbWrap.classList.contains('all') ? gnbCommonActive() : gnbSectionActive(); // all 클래스 유무에 따라 기능 선택

    // 영역에 'all' 클래스 있을 경우(gnb 영역 active 시 2depth 전체 모두 보는 형태)
    function gnbCommonActive(){
        var dep2Last    = dep1Lis[dep1Lis.length - 1].querySelector('ul > li:last-child').querySelector('a'); // 전체 메뉴(1/2depth 전체) 중 마지막 버튼

        // -- 마우스 ---
        function dep2Active(e){
            if(e.type == 'mouseenter') gnbWrap.classList.add('open');
            if(e.type == 'mouseleave') gnbWrap.classList.remove('open');
        }
        gnbWrap.addEventListener('mouseenter', dep2Active);
        gnbWrap.addEventListener('mouseleave', dep2Active);
        
        // -- 키보드 ---
        function dep2Inactive(e){
            var btn = e.target,
                key = e.keyCode || e.which;
            if(btn == dep1Btns[0] && key == 9 && e.shiftKey || btn == dep2Last && key == 9 && !e.shiftKey) { gnbWrap.classList.remove('open') }
        }
        dep1Btns.forEach((dep1Btn) => {
            dep1Btn.addEventListener('focus', function(){ gnbWrap.classList.add('open'); });
            dep1Btn.addEventListener('keydown', dep2Inactive);
        });
        dep2Last.addEventListener('keydown', dep2Inactive);
    }

    // 각 depth1 메뉴별로 하위 메뉴 따로 볼 경우
    function gnbSectionActive(){
        var dep1Lis		= gnbWrap.querySelectorAll('.depth1 > li');

        // 2dep 마지막 li 에 last 클래스 추가
        dep1Lis.forEach((dep1Li) => {
            var dep2Li		= dep1Li.querySelectorAll('.depth2 > li'),
                dep2Len		= dep2Li.length;
            if(dep2Len > 0)	dep2Li[dep2Len - 1].classList.add('last');
        });

        // dep1 설정
        // -- 마우스 ---
        function dep1Active(e){
            var area	= e.target,
                tg 		= area.tagName == 'LI' ? area : area.parentNode;

            if(e.type == 'mouseenter') tg.classList.add('open');
            if(e.type == 'mouseleave') tg.classList.remove('open');
        }
        dep1Lis.forEach((dep1Li) => {
            dep1Li.addEventListener('mouseenter', dep1Active);
            dep1Li.addEventListener('mouseleave', dep1Active);
        });

        // -- 키보드 ---
        function dep1ActiveKey(e){
            var btn		= e.target,
                dep1 	= btn.parentNode,
                key		= e.keyCode || e.which;		
            if(!btn.nextElementSibling) return;

            if(e.type == 'focus') dep1.classList.add('open');
            if(key == 9 && e.shiftKey) dep1.classList.remove('open');
        }
        
        dep1Btns.forEach((dep1Btn) => {
            dep1Btn.addEventListener('focus', dep1ActiveKey);
            dep1Btn.addEventListener('keydown', dep1ActiveKey);
        });

        // dep2 설정
        var dep2Lasts = gnbWrap.querySelectorAll('li.last > a');
        dep2Lasts.forEach(function(dep2Last){
            dep2Last.addEventListener('keydown', function(e){
                var key = e.keyCode || e.which;
                if(key == 9 && !e.shiftKey) this.closest('.depth2').parentNode.classList.remove('open');
            });
        });
    }
}
