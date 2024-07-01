/* -- date : 2024-06-05 -- */
/* -- snamo(Seo nam ho) for m.s.p -- */

function pinchZoom(option){
	const wrap = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
		  area = wrap.querySelector(option.zoom_area);

	// 변수값 설정
	let wrapDia,  // wrap 대각선 길이
		wrapW = wrap.offsetWidth,  // wrap 가로너비
		wrapH = wrap.offsetHeight,  // wrap 높이
		nowExpand,  // 확대 값
		lastExpand = 1,  // 최종 확대 값
		touch1X,  // 단일 터치시 x 초기좌표
		touch1Y,  // 단일 터치시 y 초기좌표
		firstDia,  // pinch 터치 - 처음 터치 영역의 대각선 길이
		imgW,  // 현재 이미지의 너비
		imgH,  // 현재 이미지의 높이
		gapX, // imgW - wrapW | 드래그 가능범위 - 가로
		gapY, // imgH - wrapH | 드래그 가능범위 - 세로
		moveX = 0,
		moveY = 0,
		positionX = 0,
		positionY = 0;

	let pinch = 1;

		baseP = Math.pow(wrapW, 2) + Math.pow(wrapH, 2);
		wrapDia = Math.round(Math.sqrt(baseP));

	wrap.addEventListener('touchstart',function(e){
		if(e.touches.length == 2 ) {
			let touch1 = e.touches[0] || e.changedTouches[0],
				touch2 = e.touches[1] || e.changedTouches[1];

			firstDia = mathP(touch1.pageX, touch2.pageX, touch1.pageY, touch2.pageY);
			pinch = 2;
		} else if (e.touches.length == 1) {
			let touch1 = e.touches[0] || e.changedTouches[0];
			touch1X = touch1.pageX;
			touch1Y = touch1.pageY;
			pinch = 1;
		}
	});

	wrap.addEventListener('touchmove',function(e){
		let touch1 = e.touches[0] || e.changedTouches[0],
			touch2 = e.touches[1] || e.changedTouches[1];
		if(pinch == 2){
			let lastDia = mathP(touch1.pageX, touch2.pageX, touch1.pageY, touch2.pageY),
				gap = lastDia - firstDia;
			nowExpand = ((gap / wrapDia) * 3) + lastExpand;

			if(nowExpand > 1){
				gapCalc(nowExpand); // 이동 한계 재 계산

				if(positionX > 0) moveX = (Math.min(positionX, gapX));
				else moveX =  (Math.max(positionX, -gapX));
				if(positionY > 0) moveY = (Math.min(positionY, gapY));
				else moveY = (Math.max(positionY, -gapY));

				area.style.transform = 'scale('+nowExpand+','+nowExpand+') translate3d('+moveX+'px,'+moveY+'px,0)';
			} else if (nowExpand <= 1) {
				nowExpand = 1;
				area.style.transform = 'scale(1,1) translate3d(0,0,0)';
				positionX = 0,
				positionY = 0;
			}
			
			
		} else if (pinch == 1) {
			let tgX = Math.floor((touch1.pageX - touch1X)*0.5) + positionX,
				tgY = Math.floor((touch1.pageY - touch1Y)*0.5) + positionY;

			if(lastExpand > 1){
				if(tgX > 0) moveX = (Math.min(tgX, gapX));
				else moveX =  (Math.max(tgX, -gapX));
				if(tgY > 0) moveY = (Math.min(tgY, gapY));
				else moveY = (Math.max(tgY, -gapY));

				consoleTst(moveX, moveY);
				area.style.transform = 'scale('+nowExpand+','+nowExpand+') translate3d('+moveX+'px,'+moveY+'px,0)';
			}
		}
		e.preventDefault();
	});

	wrap.addEventListener('touchend',function(e){
		if(pinch == 2){
			lastExpand = nowExpand;
			gapCalc(lastExpand);
			consoleTst(gapX, gapY);
		} else {
			positionX = moveX,
			positionY = moveY;
			
		}
	});

	// 테스트용 함수
	let cons_tx = document.querySelector('.console');
	function consoleTst(testValX, testValY){
		cons_tx.textContent = testValX+' | '+testValY;
	}

	// 대각선 거리 함수
	function mathP(x1,x2,y1,y2){
		let valX = Math.abs(x1 - x2),
			valY = Math.abs(y1 - y2);

		let gapP = Math.pow(valX, 2) + Math.pow(valY, 2);
		return Math.round(Math.sqrt(gapP));
	}

	// 이동 한계 계산
	function gapCalc(e){
		imgW = Math.floor(wrapW * e),
		imgH = Math.floor(wrapH * e),
		gapX = ((imgW - wrapW) / 2) / e,   //  e 는 확대배율/ e 를 나누는 이유 - 이미지가 scale 로 커지면 1px 당 움직이는 범위도 같이 커짐. 때문에 이동거리를 다시 e 로 나누어줘야함.
		gapY = ((imgH - wrapH) / 2) / e;
	}
}