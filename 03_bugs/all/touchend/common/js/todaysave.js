$(document).ready(function(){

	/* 상단 텍스트 롤링 배너 */
	var bantotal = $('.ban-wrap ul li').size();
	$('.page-num > span').empty().text(''+bantotal+'');

	$('.evt-tx-ban').swipeSlide({
		bannerWrap : '.ban-wrap',
		nextprevBtn : false,
		posBtn : false,
		wsize:0.9,
		active : function(e){
			$('.page-num > i').empty().text(e-1);
		}
	});

	/* 말풍선 */
	$('.btn-info').click(function(){
		$(this).next('.balloon-info').toggleClass('view').focus();
	});
	$('.btn-info-close').click(function(){
		$(this).parent().parent().removeClass('view');
		$('.btn-info').focus();
	});


	/* 2016-11-08 수정 */
	/* top 버튼 show,hide */
	$(window).scroll(function(){
		var wt = $(this).scrollTop();
		if(wt > 200) $('.top-area').addClass('on');
		else $('.top-area').removeClass('on');
		clearTimeout(scrollTimer);
		topSet();
	});

	// 안드로이드 4.4 버전 때문에 touchend 를 쓰지 못하고, scroll 에 setTimeout 를 설정.
	function topSet(){
		scrollTimer = setTimeout(function(){			
			$('.top-area .top').removeClass('off');
		},600)
	}

	// 처음에 한번 실행해줘야 함 - 실행문 없으면 첫 scroll 시 clearTimeout 가 오류발생.
	topSet();


	/* 스크롤에 따른 top / 현재위치 설정 */
	// 안드로이드 4.4 버전때문에 scroll 을 쓰는데, scroll 시작 event 감지가 유독 느리게 반응하여, touchstart/move 로 시작 감지만 하도록 설정.
	//var vert;

	$('.evt-wrap').bind('touchstart',function(e){
		var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		startX = touch.pageX;
		startY = touch.pageY;
		direcCount = 0;
	});

	$('.evt-wrap').bind('touchmove',function(e){
		var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		endX = touch.pageX;
		endY = touch.pageY;

		if(direcCount < 1 ) touchDirec(touch);

		if(direcChk == 'horive'){
			null;
		} else if (direcChk == 'verti'){
			$('.top-area .top').addClass('off');
			//clearTimeout(vert);
		}
	});

	
	function touchDirec(touch){
		numX = startX - endX;
		numY = startY - endY;
		if(Math.abs(numX) > Math.abs(numY)) direcChk = 'horive';
		else direcChk = 'verti'; 
		direcCount ++;
	}

	/*
		안드로이드 4.4 버전에서 touchmove 에 e.preventDefault 를 주지 않을 경우 touchend 가 실행되지 않는 버그로 인해 삭제.
	$('.evt-wrap').bind('touchend',function(e){
		vert = setTimeout(function(){ 
			$('.top-area .top').removeClass('off');
		}, 600);
	});*/

	/* 2016-11-08 수정 // */
	



});