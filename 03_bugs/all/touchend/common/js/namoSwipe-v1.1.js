/* -- date : 2015-03-10 - */
/* -- snamo(Seo nam ho) for m.s.p -- */
/* -- 모바일 플리킹배너 -- */

/* 2016-03-10 수정 - 기능 통합 */
/* 2016-08-01 수정 - 상하 감지 기능 제거 - 좌우 드래그 중 상하로 크게 움직일 경우 direc 가 상하 값이 넘어가면서 모션 정지 현상 발생. */

	$.fn.swipeSlide = function(option){

		//if(!option) { option = {}; }
		var set = $.extend({
			wrap : this,
			loop : true,
			bannerWrap : null,
			bannerSlide : ' > ul',
			bannerList : '> ul > li',
			nextprevBtn : false,
			btnNext : null,
			btnPrev : null,
			gap : '20',
			autoTime : 0,
			hSet : false,
			bHeight : null,
			wsize : 1,
			active : null
		}, option);

		// obj 변수설정
		var $wrap = $(set.wrap),
			$bwrap = $wrap.find(set.bannerWrap),
			$slider = $bwrap.find(set.bannerSlide),
			$list = $bwrap.find(set.bannerList),
			$total = $list.size(),
			$total2;
			

		// 변수값 설정
		var nowNum = 1,
			startX = 0,
			startY = 0,
			endX = 0,
			endY = 0,
			numX = 0,
			numY = 0,
			gap = set.gap,
			w ;

		// 슬라이드 발생여부 및 움직임용 변수 설정
		var touchMov = false,
			direction, 
			direcCount = 0;

		if(set.wsize == 1){
			if($total > 1){ // 배너가 2개 이상일 경우
				var dummy1 = $list.eq($total-1).clone();
				var dummy2 = $list.eq(0).clone();
				$slider.prepend(dummy1);
				$slider.append(dummy2);
				$list = $bwrap.find(set.bannerList),
				$total2 = $list.size();;  // list 업데이트 - dummy 포함.					
				banSet();
			}
		} else {
			if($total > 1){
				var dummy1 = $list.eq($total-1).clone(),
				dummy2 = $list.eq($total-2).clone(),
				dummy3 = $list.eq(0).clone(),
				dummy4 = $list.eq(1).clone();
				$slider.prepend(dummy1).prepend(dummy2);
				$slider.append(dummy3).append(dummy4);
				$list = $bwrap.find(set.bannerList),
				$total2 = $list.size();
				banSet();
				nowNum = 2;
			}
		}

		// ul width 값 설정 - 모바일 웹의 경우 화면 resize 일 경우 포함 / 비율에 맞게 높이 설정 2015-10-12		
		function banSet(){
			var wW = $(window).innerWidth() * set.wsize,
				bW = wW * ($total2);
			if(set.wsize == 1) {
				$slider.css({
					'width':''+bW+'px',
					'transform':'translate3d('+(-wW)+'px,0,0)'
				});
			} else {
				$slider.css({
					'width':''+bW+'px',
					'transform':'translate3d('+(-(wW*2))+'px,0,0)'
				});
			}
			$list.css('width',''+wW+'px');
			w = wW;

			if(set.hSet == true){
				var banH = set.bHeight;
				$wrap.css('height',''+banH+'px');
			}
		}
		
		$(window).resize(function(){  // 배너를 움직이고 나서 상하 스크롤 시 초기화되는 버그 발견. resize 부분 지우면 괜찮음. 아직 미해결.
			banSet();
		});		
		
		$bwrap.bind('touchstart',function(e){
			if(set.autoTime != 0) clearInterval(banAuto);
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			startX = touch.pageX;
			startY = touch.pageY;
			direcCount = 0;
			$slider.css('transition-duration','0s');
			slidePos();
		});

		$bwrap.bind('touchmove',function(e){
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			endX = touch.pageX;
			endY = touch.pageY;

			if(direcCount < 1 ) touchDirec(touch);

			if(direcChk == 'horive'){			
				touchMov = true;
				e.preventDefault();
				movX = -((startX - endX) + (w * nowNum));
				$slider.css('transform','translate3d('+movX+'px,0,0)');
			} else if (direcChk == 'verti'){
				null;
			}
			
		});

		function touchDirec(touch){
			numX = startX - endX;
			numY = startY - endY;
			if(Math.abs(numX) > Math.abs(numY)) direcChk = 'horive';
			else direcChk = 'verti'; 
			direcCount ++;
		}

		$bwrap.bind('touchend',function(e){
			if(touchMov == true){
				direcSet();
				$slider.css('transition','.3s ease-out');
				if(Math.abs(numX) > gap){
					if(direction == 'left' ){
						if( set.loop == true){
							nowNum ++; slideMov(); slideEnd();
						} else {
							if(nowNum == $total){
								slideMov();
							} else {
								nowNum ++; slideMov(); slideEnd();
							}
						}
					} else if (direction == 'right'){
						if( set.loop == true ){
							nowNum --; slideMov(); slideEnd();
						} else {
							if(nowNum == 1){
								slideMov();
							} else {
								nowNum --; slideMov(); slideEnd();
							}
						}
					} else {
						null;
					}
				} else slideMov(); 
				touchMov = false;
			} else null; 

			if(set.autoTime != 0) banAuto = setInterval(roll, set.autoTime);

		});

		function slideMov(){
			$slider.css('transform','translate3d('+(-(w*nowNum))+'px,0,0)');
		}

		// touch 방향 감지  2016-08-01 수정
		function direcSet(){
			numX = startX - endX;
			numY = startY - endY;
			//if(Math.abs(numX) > Math.abs(numY)){
				if(numX > 0) direction = 'left';
				else direction = 'right';
			/*} else {
				if(numY > 0) direction = 'up';
				else direction = 'down';
			}*/
		}

		// 좌우 끝에서 움직일 경우 - touch용
		function slidePos(){
			if(set.wsize == 1){
				if(nowNum == 0) nowNum = $total;
				else if (nowNum == $total + 1) nowNum = 1;
			} else {
				if(nowNum == 1) nowNum = $total +1;
				else if (nowNum == $total + 2) nowNum = 2;	
			}
			$slider.css({
				'transition-duration':'0s',
				'transform':'translate3d('+(-(w*nowNum))+'px,0,0)'
			});
		}
		
		// --- 버튼 설정 ----------------------------------------------------------
		if(set.nextprevBtn == true){
			var $next = $wrap.find(set.btnNext),
				$prev = $wrap.find(set.btnPrev);

			$next.click(function(){npBtn('next')});
			$prev.click(function(){npBtn('prev')});

			function npBtn(e){
				$next.unbind();
				$prev.unbind();
				$slider.queue(pos1).delay(100).queue(pos2);  // 플리킹으로 nowNum 이 5가 됐을 경우 초기화 하지 못하는 버그. 초기화 후 실행.
				function pos1(){
					slidePos();
					$slider.dequeue();
				}
				function pos2(){
					$slider.css('transition','.3s ease-out');
					if(e == 'next') {
						if(set.loop == true) {
							nowNum ++;
						} else {
							if(nowNum < $total) nowNum++;
						}
					} else if (e == 'prev') {
						if(set.loop == true) {
							nowNum --;
						} else {
							if(nowNum > 1) nowNum--; 
						}
					}
					//console.log(nowNum);
					slideMov();
					$slider.dequeue();
				}
				slideEnd();
				slidePosBtn();
			}
		}

		function slidePosBtn(){ // 애니메이션 종료시 이벤트 - 버튼용 - 버튼 bind 기능 때문에 자동롤링에서 같이 사용하지 못함.
			if(set.loop == true){
				$slider.bind('webkitTransitionEnd', function(){
					transEnd($(this));
					$next.click(function(){npBtn('next')});
					$prev.click(function(){npBtn('prev')});
				});
			} else {
				$next.click(function(){npBtn('next')});
				$prev.click(function(){npBtn('prev')});
			}
		}

		// ---- 자동롤링 설정  ---------------------------------------------------------- 
		if(set.autoTime == 0 ) null;
		else banAuto = setInterval(roll, set.autoTime);

		function roll(){
			console.log(nowNum);
			$slider.queue(pos1).delay(100).queue(pos2);  // 플리킹으로 nowNum 이 5가 됐을 경우 자동롤링에서 초기화 하지 못하는 버그. 초기화 후 롤링 실행.
			function pos1(){
				slidePos();
				$slider.dequeue();
			}
			function pos2(){
				$slider.css('transition','.3s ease-out');
				nowNum ++;
				slideMov();
				$slider.dequeue();
			}
			slideEnd();
			slidePosRol();
		}

		function slidePosRol(){
			$slider.bind('webkitTransitionEnd', function(){
				transEnd($(this));
			});
		}

		function transEnd(e){ // 애니메이션 종료시 이벤트 - 자동롤링용
			slidePos();
			e.unbind('webkitTransitionEnd');
		}
		
		// 콜백함수 설정 - active
		function slideEnd(){ 
			$slider.bind('webkitTransitionEnd',function(){
				var pageNum = nowNum; // nowNum 이 이동조건에 따라 다르므로 재설정 필요.
				if(set.wsize == 1){
					if(nowNum > $total) pageNum = 1;
					else if (nowNum == 0) pageNum = $total;
				} else {
					if(nowNum > $total+1) pageNum = 2;
					else if (nowNum == 0) pageNum = $total + 1;
				}

				if ( typeof set.active === 'function' ) { // 실행시 콜백함수 설정
					set.active( banPos = pageNum );
				}
				$(this).unbind('webkitTransitionEnd');
			});
		}
	

	}