
var font_m = document.querySelector('#mobile');


var mobileKeyWords = new Array('iPhone', 'iPod', 'BlackBerry', 'Android', 'Windows CE', 'LG', 'MOT', 'SAMSUNG', 'SonyEricsson','Windows Phone');
for (var word in mobileKeyWords){
	if (navigator.userAgent.match(mobileKeyWords[word]) != null){
		font_m.style.display = 'block';
	}
}

	var fSize_px		= 12,
		ls_px			= 0,
		inp 			= document.querySelector('.inputBox'),
		viewTxs			= document.querySelectorAll('.viewTxt p');

	var btn_view 		= document.querySelector('#inBtn'),
		btn_del  		= document.querySelector('#delBtn'),
		btn_big			= document.querySelector('.big'),
		btn_small		= document.querySelector('.small'),
		btn_base		= document.querySelector('.baseSize'),
		btn_lsm			= document.querySelector('.ls_minus'),
		btn_lsp			= document.querySelector('.ls_plus'),
		inp_color		= document.querySelector('.colorInp'),
		btn_colorSet 	= document.querySelector('.colorSet'),
		sel_fontw		= document.querySelector('#font-w');

	var view_fsize 		= document.querySelector('.f_size'),
		view_ls			= document.querySelector('.f_ls'),
		view_fw			= document.querySelector('.f_weight'),
		color_box 		= document.querySelector('.colorBox'),
		color_code 		= document.querySelector('.colorNum');

	btn_view.addEventListener('click', function(){
		Array.prototype.forEach.call(viewTxs, function(area){
			area.innerText = inp.value;
		});		
	});

	btn_del.addEventListener('click', function(){
		Array.prototype.forEach.call(viewTxs, function(area){
			area.innerText = '';
		});	
		inp.value = '';
	});

	var fontSet = function(){
		Array.prototype.forEach.call(viewTxs, function(area){
			area.style.fontSize = fSize_px + 'px';
		});
		view_fsize.innerText = fSize_px;
	}, fontLsSet = function(){
		Array.prototype.forEach.call(viewTxs, function(area){
			area.style.letterSpacing = ls_px + 'px';
		});
		view_ls.innerText = ls_px;
	};

	btn_big.addEventListener('click', function(){
		fSize_px++;
		fontSet();
	});

	btn_small.addEventListener('click', function(){
		fSize_px--;
		fontSet();
	});

	btn_base.addEventListener('click', function(){
		fSize_px = 12;
		fontSet();
	});

	btn_lsm.addEventListener('click', function(){
		ls_px--;
		fontLsSet();
	});

	btn_lsp.addEventListener('click', function(){
		ls_px++;
		fontLsSet();
	});

	btn_colorSet.addEventListener('click', function(){
		var code = inp_color.value;
		Array.prototype.forEach.call(viewTxs, function(area){
			area.style.color = code;
		});
		color_box.style.backgroundColor = code;
		color_code.innerText = code;
	});

	sel_fontw.addEventListener('change', function(){
		var weight = this.value;
		Array.prototype.forEach.call(viewTxs, function(area){
			area.style.fontWeight = weight;
		});
		view_fw.innerText = weight;
	});
