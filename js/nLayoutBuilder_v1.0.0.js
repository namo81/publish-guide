/**
 * nLayoutBuilder - HTML 요소 기반 레이아웃 빌더 (텍스트 / 사각형 / 원 / 이미지 배치)
 *
 * [버전 이력]
 * 2026-10-13 - v1.0.0 : 1차 완성
 *   - 상태(JSON 배열)를 원본으로 두고 DOM 은 상태에서 렌더링 (data-id 기준 keyed 렌더링)
 *   - 요소 : 텍스트 / 사각형 / 원 / 이미지 - 위치 · 크기 · 회전 (Moveable), 클릭 / 영역 선택 (Selecto)
 *   - 텍스트 직접 입력 (더블클릭 or Enter), 폰트 스타일은 item.style 데이터로 제어
 *   - 이미지 업로드 (File → dataURL 로 저장되어 JSON 에 포함)
 *   - JSON 내보내기 / 불러오기, 이미지 내보내기 (html-to-image)
 *   - 실행취소 / 다시실행, 키보드 조작
 *
 * [의존 파일]
 *  js/vendor/moveable.js (v0.53.0)      - 이동 / 크기 / 회전 / 스냅 (필수)
 *  js/vendor/selecto.js (v1.26.3)       - 클릭 / 드래그 영역 선택 (필수)
 *  js/vendor/html-to-image.js (v1.11.11) - 이미지 내보내기 (exportImage 사용 시 필수)
 *  css/nLayoutBuilder.css               - 기본 스타일 (필수)
 *  common.js 불필요
 * [지원 브라우저] Chrome, Edge, Firefox, Safari 최신 / IE 미지원
 *
 * [옵션]
 *  wrap       : (필수) 빌더가 생성될 영역 - css 선택자 or element (내부에 편집 영역이 생성됨)
 *  width      : 캔버스 너비(px) - 기본 800
 *  height     : 캔버스 높이(px) - 기본 500
 *  background : 캔버스 배경색 - 기본 '#ffffff'
 *  data       : 초기 데이터 - toJSON() 결과 객체 or items 배열 or JSON 문자열
 *  snap       : 스냅(가이드라인) 사용 여부 - 기본 true
 *  bounds     : 요소를 캔버스 밖으로 이동 못하게 제한 - 기본 true
 *  keyboard   : 키보드 조작 사용 여부 - 기본 true
 *  history    : 실행취소 최대 단계 - 기본 50
 *  label      : 편집 영역 aria-label - 기본 '레이아웃 편집 영역'
 *  select     : function(selectedItems, builder) - 선택 변경 / 선택 요소 변경 시 (드래그 중 포함) 콜백
 *  change     : function(items, builder) - 상태 변경 확정 시 (드래그 종료, 입력 완료 등) 콜백
 *
 * [키보드] (편집 영역에 포커스 시)
 *  방향키 1px 이동 (Shift + 방향키 10px) / Delete · Backspace 삭제 / Enter 텍스트 입력 / Esc 선택 해제 (입력 중엔 입력 종료)
 *  Ctrl + Z 실행취소 / Ctrl + Shift + Z · Ctrl + Y 다시실행 / Ctrl + D 복제 / Ctrl + A 전체 선택
 *  Shift + 클릭 : 다중 선택 / 리사이즈 중 Shift : 비율 유지 (이미지는 기본 비율 유지)
 */
(function (window, document) {
	'use strict';

	var VERSION = '1.0.0';
	var TYPES = ['text', 'rect', 'circle', 'image'];

	// 요소별 기본값
	var DEFAULT_ITEM = {
		text : {
			width : 240, height : 50, text : '텍스트를 입력하세요',
			style : { fontFamily : '', fontSize : 24, fontWeight : 'normal', fontStyle : 'normal', textDecoration : 'none', color : '#222222', textAlign : 'left', lineHeight : 1.4, letterSpacing : 0, backgroundColor : 'transparent', opacity : 1 }
		},
		rect : {
			width : 160, height : 100,
			style : { backgroundColor : '#4a90e2', borderColor : '#222222', borderWidth : 0, borderRadius : 0, opacity : 1 }
		},
		circle : {
			width : 120, height : 120,
			style : { backgroundColor : '#f5a623', borderColor : '#222222', borderWidth : 0, opacity : 1 }
		},
		image : {
			width : 200, height : 150, src : '', alt : '',
			style : { objectFit : 'cover', borderColor : '#222222', borderWidth : 0, borderRadius : 0, opacity : 1 }
		}
	};

	// item.style 중 요소에 직접 적용되는 속성 / px 단위 속성
	var STYLE_KEYS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'color', 'textAlign', 'lineHeight', 'letterSpacing', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'opacity'];
	var STYLE_PX = { fontSize : 1, letterSpacing : 1, borderWidth : 1, borderRadius : 1 };

	var CLASS = {
		wrap  : 'nlb_wrap',
		frame : 'nlb_frame',
		stage : 'nlb_stage',
		item  : 'nlb_item',
		edit  : 'nlb_item_edit'
	};

	function extend(target) {
		for (var i = 1; i < arguments.length; i++) {
			var src = arguments[i];
			if (!src) continue;
			for (var k in src) {
				if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
			}
		}
		return target;
	}
	function copy(obj) { return JSON.parse(JSON.stringify(obj)); }
	function num(v, def) {
		v = parseFloat(v);
		return isFinite(v) ? Math.round(v * 100) / 100 : def;
	}
	function getEl(el) { return typeof el === 'string' ? document.querySelector(el) : el; }
	function download(url, fileName) {
		var a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
	function readFile(file, type) {
		return new Promise(function (resolve, reject) {
			var reader = new FileReader();
			reader.onload = function () { resolve(reader.result); };
			reader.onerror = function () { reject(reader.error); };
			if (type === 'text') reader.readAsText(file);
			else reader.readAsDataURL(file);
		});
	}
	function loadImage(src) {
		return new Promise(function (resolve, reject) {
			var img = new Image();
			img.onload = function () { resolve(img); };
			img.onerror = function () { reject(new Error('nLayoutBuilder : 이미지를 불러올 수 없습니다.')); };
			img.src = src;
		});
	}

	function nLayoutBuilder(option) {
		if (!(this instanceof nLayoutBuilder)) return new nLayoutBuilder(option);

		var opt = this.opt = extend({
			wrap       : null,
			width      : 800,
			height     : 500,
			background : '#ffffff',
			data       : null,
			snap       : true,
			bounds     : true,
			keyboard   : true,
			history    : 50,
			label      : '레이아웃 편집 영역',
			select     : null,
			change     : null
		}, option);

		this.wrap = getEl(opt.wrap);
		if (!this.wrap) { console.error('nLayoutBuilder : wrap 요소를 찾을 수 없습니다.'); return; }
		if (!window.Moveable || !window.Selecto) { console.error('nLayoutBuilder : moveable.js / selecto.js 가 필요합니다.'); return; }

		this.stageOpt = { width : num(opt.width, 800), height : num(opt.height, 500), background : opt.background };
		this.items = [];		// 상태 원본
		this.selectedIds = [];
		this.editingId = null;
		this._els = {};			// id → element
		this._seq = 0;
		this._undo = [];
		this._redo = [];

		this._build();
		this._bindMoveable();
		this._bindSelecto();
		this._bindEvents();

		if (opt.data) this.load(opt.data, true);
		else this.render();
		this._last = this._snapshot();
	}

	nLayoutBuilder.version = VERSION;

	nLayoutBuilder.prototype = {
		constructor : nLayoutBuilder,

		/* ---------- 생성 ---------- */
		_build : function () {
			var frame = this.frame = document.createElement('div');
			var stage = this.stage = document.createElement('div');

			frame.className = CLASS.frame;
			frame.tabIndex = 0;
			frame.setAttribute('aria-label', this.opt.label);
			stage.className = CLASS.stage;

			frame.appendChild(stage);
			this.wrap.classList.add(CLASS.wrap);
			this.wrap.appendChild(frame);
		},

		_bindMoveable : function () {
			var self = this;
			var dirs = { top : true, left : true, bottom : true, right : true, center : true, middle : true };

			// control box 는 frame 에 생성 (stage 밖이므로 이미지 내보내기에 포함되지 않음)
			var mv = this.moveable = new Moveable(this.frame, {
				target : [],
				draggable : true,
				resizable : true,
				rotatable : true,
				throttleDrag : 1,
				throttleResize : 1,
				throttleRotate : 1,
				snappable : this.opt.snap,
				snapContainer : this.stage,
				snapThreshold : 5,
				isDisplaySnapDigit : true,
				snapDirections : dirs,
				elementSnapDirections : dirs,
				snapRotationDegrees : [0, 90, 180, 270],
				bounds : this.opt.bounds ? { left : 0, top : 0, right : 0, bottom : 0, position : 'css' } : null,
				origin : false
			});

			function itemOf(el) { return self.getItem(el.getAttribute('data-id')); }
			function paint(el) { self._paint(el, itemOf(el)); }
			function end(e) { if (e.isDrag) self.commit(); }
			function resizeStart(ev) {
				var it = itemOf(ev.target);
				ev.setOrigin(['%', '%']);
				if (ev.dragStart) ev.dragStart.set([it.x, it.y]);
			}
			function resize(ev) {
				var it = itemOf(ev.target);
				it.width = num(ev.width, it.width);
				it.height = num(ev.height, it.height);
				it.x = num(ev.drag.beforeTranslate[0], it.x);
				it.y = num(ev.drag.beforeTranslate[1], it.y);
				paint(ev.target);
			}

			mv.on('dragStart', function (e) {
				var it = itemOf(e.target);
				e.set([it.x, it.y]);
			}).on('drag', function (e) {
				var it = itemOf(e.target);
				it.x = num(e.beforeTranslate[0], it.x);
				it.y = num(e.beforeTranslate[1], it.y);
				paint(e.target);
				self._emitSelect();
			}).on('dragEnd', end);

			mv.on('dragGroupStart', function (e) {
				e.events.forEach(function (ev) {
					var it = itemOf(ev.target);
					ev.set([it.x, it.y]);
				});
			}).on('dragGroup', function (e) {
				e.events.forEach(function (ev) {
					var it = itemOf(ev.target);
					it.x = num(ev.beforeTranslate[0], it.x);
					it.y = num(ev.beforeTranslate[1], it.y);
					paint(ev.target);
				});
				self._emitSelect();
			}).on('dragGroupEnd', end);

			mv.on('resizeStart', resizeStart).on('resize', function (e) {
				resize(e);
				self._emitSelect();
			}).on('resizeEnd', end);

			mv.on('resizeGroupStart', function (e) {
				e.events.forEach(resizeStart);
			}).on('resizeGroup', function (e) {
				e.events.forEach(resize);
				self._emitSelect();
			}).on('resizeGroupEnd', end);

			mv.on('rotateStart', function (e) {
				e.set(itemOf(e.target).rotate);
			}).on('rotate', function (e) {
				var it = itemOf(e.target);
				it.rotate = num(e.rotate, it.rotate);
				paint(e.target);
				self._emitSelect();
			}).on('rotateEnd', end);

			mv.on('rotateGroupStart', function (e) {
				e.events.forEach(function (ev) {
					var it = itemOf(ev.target);
					ev.set(it.rotate);
					if (ev.dragStart) ev.dragStart.set([it.x, it.y]);
				});
			}).on('rotateGroup', function (e) {
				e.events.forEach(function (ev) {
					var it = itemOf(ev.target);
					it.rotate = num(ev.rotate, it.rotate);
					it.x = num(ev.drag.beforeTranslate[0], it.x);
					it.y = num(ev.drag.beforeTranslate[1], it.y);
					paint(ev.target);
				});
				self._emitSelect();
			}).on('rotateGroupEnd', end);

			// 선택된 텍스트 더블클릭 → 입력
			mv.on('click', function (e) {
				if (e.isDouble) self.startEdit(e.target.getAttribute('data-id'));
			});
		},

		_bindSelecto : function () {
			var self = this;
			var mv = this.moveable;

			var sel = this.selecto = new Selecto({
				container : this.frame,
				dragContainer : this.wrap,
				selectableTargets : [],
				selectByClick : true,
				selectFromInside : false,
				toggleContinueSelect : ['shift'],
				hitRate : 0,
				// 텍스트 입력 중인 요소 내부에서는 선택 동작 안 함 (커서 이동 / 텍스트 선택 허용)
				dragCondition : function (e) {
					var edit = self.editingId && self._els[self.editingId];
					return !(edit && edit.contains(e.inputEvent.target));
				}
			});

			sel.on('dragStart', function (e) {
				var t = e.inputEvent.target;
				var targets = self._selectedEls();
				// 이미 선택된 요소 / control box 는 Moveable 이 처리
				if (mv.isMoveableElement(t) || targets.some(function (el) { return el === t || el.contains(t); })) e.stop();
			}).on('selectEnd', function (e) {
				if (self.editingId) self.endEdit(true);
				if (e.isDragStart) {
					// 선택되지 않은 요소를 바로 드래그 하는 경우
					e.inputEvent.preventDefault();
					// 빠른 클릭으로 target 변경 전에 이미 손을 뗀 경우는 드래그 시작 안 함
					mv.waitToChangeTarget().then(function () {
						if (self._pressed) mv.dragStart(e.inputEvent);
					});
				}
				self._setSelection(e.selected.map(function (el) { return el.getAttribute('data-id'); }), true);
				self.frame.focus({ preventScroll : true });
			});
		},

		_bindEvents : function () {
			var self = this;

			this._onKeydown = function (e) { self._keydown(e); };
			this._onPointer = function (e) { self._pressed = e.type === 'pointerdown'; };
			this._onKeyShift = function (e) {
				// 리사이즈 중 Shift : 비율 유지
				if (e.key === 'Shift') self._updateKeepRatio(e.type === 'keydown');
			};
			this._onDblclick = function (e) {
				var el = e.target.closest && e.target.closest('.' + CLASS.item);
				if (el) self.startEdit(el.getAttribute('data-id'));
			};
			this._onFocusout = function (e) {
				if (self.editingId && e.target === self._els[self.editingId]) self.endEdit();
			};
			this._onInput = function (e) {
				// 입력 내용이 박스보다 길면 높이 자동 확장
				var id = self.editingId;
				if (!id || e.target !== self._els[id]) return;
				var it = self.getItem(id);
				if (e.target.scrollHeight > it.height) {
					it.height = e.target.scrollHeight;
					e.target.style.height = it.height + 'px';
				}
			};

			if (this.opt.keyboard) this.frame.addEventListener('keydown', this._onKeydown);
			['pointerdown', 'pointerup', 'pointercancel'].forEach(function (type) {
				window.addEventListener(type, self._onPointer, true);
			});
			window.addEventListener('keydown', this._onKeyShift);
			window.addEventListener('keyup', this._onKeyShift);
			this.stage.addEventListener('dblclick', this._onDblclick);
			this.stage.addEventListener('focusout', this._onFocusout);
			this.stage.addEventListener('input', this._onInput);
		},

		_keydown : function (e) {
			var key = e.key;
			var ctrl = e.ctrlKey || e.metaKey;

			if (this.editingId) {
				if (key === 'Escape') { e.preventDefault(); this.endEdit(); }
				return;
			}
			if (e.target !== this.frame) return;

			if (ctrl && (key === 'z' || key === 'Z')) {
				e.preventDefault();
				if (e.shiftKey) this.redo();
				else this.undo();
				return;
			}
			if (ctrl && (key === 'y' || key === 'Y')) { e.preventDefault(); this.redo(); return; }
			if (ctrl && (key === 'a' || key === 'A')) { e.preventDefault(); this.select(this.items.map(function (it) { return it.id; })); return; }

			if (!this.selectedIds.length) return;

			if (ctrl && (key === 'd' || key === 'D')) { e.preventDefault(); this.duplicate(); return; }

			switch (key) {
				case 'Delete':
				case 'Backspace':
					e.preventDefault();
					this.remove();
					break;
				case 'Escape':
					this.clearSelect();
					break;
				case 'Enter':
					if (this.selectedIds.length === 1) {
						e.preventDefault();
						this.startEdit(this.selectedIds[0]);
					}
					break;
				case 'ArrowUp':
				case 'ArrowDown':
				case 'ArrowLeft':
				case 'ArrowRight':
					e.preventDefault();
					this._nudge(key, e.shiftKey ? 10 : 1);
					break;
			}
		},

		_nudge : function (key, gap) {
			var dx = key === 'ArrowLeft' ? -gap : key === 'ArrowRight' ? gap : 0;
			var dy = key === 'ArrowUp' ? -gap : key === 'ArrowDown' ? gap : 0;
			var st = this.stageOpt;
			var bounds = this.opt.bounds;

			this.getSelected(true).forEach(function (it) {
				it.x += dx;
				it.y += dy;
				if (bounds) {
					it.x = Math.min(Math.max(it.x, 0), Math.max(st.width - it.width, 0));
					it.y = Math.min(Math.max(it.y, 0), Math.max(st.height - it.height, 0));
				}
			});
			this.render();
			this.commit();
		},

		/* ---------- 렌더링 (상태 → DOM) ---------- */
		render : function () {
			var self = this;
			var stage = this.stage;
			var old = this._els;
			var els = {};

			this.items.forEach(function (it, i) {
				var el = old[it.id];
				if (el && el.getAttribute('data-type') !== it.type) {
					stage.removeChild(el);
					el = null;
				}
				if (!el) el = self._create(it);
				els[it.id] = el;
				delete old[it.id];
				self._paint(el, it);
				if (stage.children[i] !== el) stage.insertBefore(el, stage.children[i] || null);
			});
			Object.keys(old).forEach(function (id) {
				if (old[id].parentNode === stage) stage.removeChild(old[id]);
			});

			this._els = els;
			this._applyStage();
			this.selecto.selectableTargets = this.items.map(function (it) { return els[it.id]; });
			this._setSelection(this.selectedIds, false);
		},

		_create : function (it) {
			var el = document.createElement('div');
			el.className = CLASS.item + ' ' + CLASS.item + '_' + it.type;
			el.setAttribute('data-id', it.id);
			el.setAttribute('data-type', it.type);
			if (it.type === 'image') {
				var img = document.createElement('img');
				img.draggable = false;
				el.appendChild(img);
			}
			return el;
		},

		_paint : function (el, it) {
			var s = el.style;
			var st = it.style || {};

			s.width = it.width + 'px';
			s.height = it.height + 'px';
			s.transform = 'translate(' + it.x + 'px, ' + it.y + 'px) rotate(' + it.rotate + 'deg)';

			STYLE_KEYS.forEach(function (k) {
				var v = st[k];
				s[k] = (v === undefined || v === null || v === '') ? '' : (STYLE_PX[k] && typeof v === 'number' ? v + 'px' : v);
			});
			s.borderStyle = parseFloat(st.borderWidth) > 0 ? 'solid' : '';
			if (it.type === 'circle') s.borderRadius = '50%';

			if (it.type === 'text') {
				if (this.editingId !== it.id && el.textContent !== it.text) el.textContent = it.text;
			} else if (it.type === 'image') {
				var img = el.firstChild;
				if (img.getAttribute('src') !== it.src) img.setAttribute('src', it.src);
				img.alt = it.alt || '';
				img.style.objectFit = st.objectFit || 'cover';
			}
		},

		_applyStage : function () {
			var st = this.stageOpt;
			this.frame.style.width = this.stage.style.width = st.width + 'px';
			this.frame.style.height = this.stage.style.height = st.height + 'px';
			this.stage.style.background = st.background || '';
			this.moveable.verticalGuidelines = [0, st.width / 2, st.width];
			this.moveable.horizontalGuidelines = [0, st.height / 2, st.height];
		},

		/* ---------- 선택 ---------- */
		_selectedEls : function () {
			var els = this._els;
			return this.selectedIds.map(function (id) { return els[id]; });
		},

		_setSelection : function (ids, fromSelecto) {
			var self = this;
			var els = this._els;
			this.selectedIds = ids.filter(function (id, i) { return els[id] && ids.indexOf(id) === i; });

			var targets = this._selectedEls();
			var mv = this.moveable;
			var prevTargets = [].concat(mv.target || []);
			var same = prevTargets.length === targets.length && targets.every(function (el, i) { return el === prevTargets[i]; });

			// target 은 마지막에 변경 (target 변경 후 다른 속성을 바꾸면 Selecto → dragStart 직후 드래그 상태가 초기화됨)
			mv.elementGuidelines = this.items.filter(function (it) {
				return self.selectedIds.indexOf(it.id) < 0;
			}).map(function (it) { return els[it.id]; });
			this._updateKeepRatio(false);
			if (same) mv.updateRect();
			else mv.target = targets;
			if (!fromSelecto) this.selecto.setSelectedTargets(targets);

			// 선택이 바뀐 경우에만 select 콜백
			if (fromSelecto || this.selectedIds.join(',') !== this._selKey) this._emitSelect();
		},

		_updateKeepRatio : function (shift) {
			var sel = this.getSelected(true);
			this.moveable.keepRatio = shift || (sel.length === 1 && sel[0].type === 'image');
		},

		_emitSelect : function () {
			this._selKey = this.selectedIds.join(',');
			if (typeof this.opt.select === 'function') this.opt.select(this.getSelected(), this);
		},

		select : function (ids) {
			if (this.editingId) this.endEdit(true);
			this._setSelection([].concat(ids || []), false);
		},

		clearSelect : function () { this.select([]); },

		/* ---------- 텍스트 입력 ---------- */
		startEdit : function (id) {
			var it = this.getItem(id);
			if (!it || it.type !== 'text' || this.editingId === id) return;
			if (this.editingId) this.endEdit(true);

			var el = this._els[id];
			this._setSelection([], false);
			this.editingId = id;
			el.classList.add(CLASS.edit);
			try { el.contentEditable = 'plaintext-only'; } catch (err) { /* 미지원 브라우저 */ }
			if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
			el.focus();

			var range = document.createRange();
			var selection = window.getSelection();
			range.selectNodeContents(el);
			selection.removeAllRanges();
			selection.addRange(range);
		},

		endEdit : function (noSelect) {
			var id = this.editingId;
			if (!id) return;
			var el = this._els[id];
			var it = this.getItem(id);

			this.editingId = null;
			if (it && el) {
				it.text = el.innerText.replace(/\n$/, '');
				el.removeAttribute('contenteditable');
				el.classList.remove(CLASS.edit);
				el.textContent = it.text;
			}
			this.render();
			if (!noSelect) {
				this._setSelection([id], false);
				this.frame.focus({ preventScroll : true });
			}
			this.commit();
		},

		/* ---------- 데이터 ---------- */
		_newId : function () {
			var id;
			do { id = 'nlb' + (++this._seq); } while (this.getItem(id));
			return id;
		},

		_normalize : function (raw, used) {
			if (!raw || TYPES.indexOf(raw.type) < 0) return null;
			var d = DEFAULT_ITEM[raw.type];
			var id = raw.id !== undefined && raw.id !== null ? String(raw.id) : '';
			if (!id || used[id]) id = this._newId();
			used[id] = true;

			var it = {
				id     : id,
				type   : raw.type,
				x      : num(raw.x, 0),
				y      : num(raw.y, 0),
				width  : Math.max(num(raw.width, d.width), 1),
				height : Math.max(num(raw.height, d.height), 1),
				rotate : num(raw.rotate, 0),
				style  : extend({}, d.style, raw.style)
			};
			if (it.type === 'text') it.text = raw.text === undefined || raw.text === null ? d.text : String(raw.text);
			if (it.type === 'image') {
				it.src = raw.src ? String(raw.src) : '';
				it.alt = raw.alt ? String(raw.alt) : '';
			}
			return it;
		},

		_usedIds : function () {
			var used = {};
			this.items.forEach(function (it) { used[it.id] = true; });
			return used;
		},

		getItem : function (id) {
			for (var i = 0; i < this.items.length; i++) {
				if (this.items[i].id === id) return this.items[i];
			}
			return null;
		},

		// raw : true 일 경우 내부 상태 객체 그대로 반환 (내부용)
		getItems : function () { return copy(this.items); },
		getSelected : function (raw) {
			var ids = this.selectedIds;
			var list = this.items.filter(function (it) { return ids.indexOf(it.id) > -1; });
			return raw ? list : copy(list);
		},

		add : function (type, props) {
			var d = DEFAULT_ITEM[type];
			if (!d) { console.error('nLayoutBuilder : 지원하지 않는 type 입니다 - ' + type); return null; }
			props = props || {};
			var w = props.width || d.width;
			var h = props.height || d.height;
			var raw = extend({
				x : (this.stageOpt.width - w) / 2,
				y : (this.stageOpt.height - h) / 2
			}, d, props, { type : type, style : extend({}, d.style, props.style) });
			var it = this._normalize(raw, this._usedIds());

			this.items.push(it);
			this.selectedIds = [it.id];
			this.render();
			this.commit();
			return copy(it);
		},

		// src : File / Blob / 이미지 경로 / dataURL → Promise(item)
		addImage : function (src, props) {
			var self = this;
			var getSrc = (window.Blob && src instanceof Blob) ? readFile(src) : Promise.resolve(src);

			return getSrc.then(function (url) {
				return loadImage(url).then(function (img) {
					// 캔버스의 60% 안에 맞춰 원본 비율로 추가
					var st = self.stageOpt;
					var ratio = Math.min(1, (st.width * 0.6) / img.naturalWidth, (st.height * 0.6) / img.naturalHeight);
					return self.add('image', extend({
						src : url,
						width : Math.round(img.naturalWidth * ratio),
						height : Math.round(img.naturalHeight * ratio)
					}, props));
				});
			});
		},

		// props : { x, y, width, height, rotate, text, src, alt, style : {} } / ids 없으면 선택된 요소
		update : function (props, ids) {
			var targets = ids ? [].concat(ids) : this.selectedIds;
			var self = this;
			props = props || {};

			targets.forEach(function (id) {
				var it = self.getItem(id);
				if (!it) return;
				['x', 'y', 'width', 'height', 'rotate'].forEach(function (k) {
					if (props[k] !== undefined) it[k] = num(props[k], it[k]);
				});
				it.width = Math.max(it.width, 1);
				it.height = Math.max(it.height, 1);
				if (props.text !== undefined && it.type === 'text') it.text = String(props.text);
				if (props.src !== undefined && it.type === 'image') it.src = String(props.src);
				if (props.alt !== undefined && it.type === 'image') it.alt = String(props.alt);
				if (props.style) extend(it.style, props.style);
			});
			this.render();
			this._emitSelect();
			this.commit();
		},

		remove : function (ids) {
			var targets = ids ? [].concat(ids) : this.selectedIds.slice();
			if (this.editingId && targets.indexOf(this.editingId) > -1) this.editingId = null;
			this.items = this.items.filter(function (it) { return targets.indexOf(it.id) < 0; });
			this.render();
			this.commit();
		},

		duplicate : function (ids) {
			var self = this;
			var targets = ids ? [].concat(ids) : this.selectedIds;
			var used = this._usedIds();
			var added = [];

			this.items.slice().forEach(function (it) {
				if (targets.indexOf(it.id) < 0) return;
				var raw = copy(it);
				raw.id = null;
				raw.x += 20;
				raw.y += 20;
				var dup = self._normalize(raw, used);
				self.items.push(dup);
				added.push(dup.id);
			});
			if (!added.length) return;
			this.selectedIds = added;
			this.render();
			this.commit();
		},

		// dir : 'front'(맨 앞) / 'forward'(앞으로) / 'backward'(뒤로) / 'back'(맨 뒤) - 배열 순서 = 쌓임 순서
		order : function (dir, ids) {
			var targets = ids ? [].concat(ids) : this.selectedIds;
			var items = this.items;
			var sel = items.filter(function (it) { return targets.indexOf(it.id) > -1; });
			var rest = items.filter(function (it) { return targets.indexOf(it.id) < 0; });
			var i;
			if (!sel.length) return;

			if (dir === 'front') this.items = rest.concat(sel);
			else if (dir === 'back') this.items = sel.concat(rest);
			else if (dir === 'forward') {
				for (i = items.length - 2; i >= 0; i--) {
					if (sel.indexOf(items[i]) > -1 && sel.indexOf(items[i + 1]) < 0) items.splice(i, 2, items[i + 1], items[i]);
				}
			} else if (dir === 'backward') {
				for (i = 1; i < items.length; i++) {
					if (sel.indexOf(items[i]) > -1 && sel.indexOf(items[i - 1]) < 0) items.splice(i - 1, 2, items[i], items[i - 1]);
				}
			}
			this.render();
			this.commit();
		},

		setStage : function (stage) {
			var st = this.stageOpt;
			stage = stage || {};
			if (stage.width !== undefined) st.width = Math.max(num(stage.width, st.width), 1);
			if (stage.height !== undefined) st.height = Math.max(num(stage.height, st.height), 1);
			if (stage.background !== undefined) st.background = stage.background;
			this.render();
			this.commit();
		},

		getStage : function () { return copy(this.stageOpt); },

		/* ---------- 실행취소 ---------- */
		_snapshot : function () { return JSON.stringify(this.toJSON()); },

		// 상태 변경 확정 (실행취소 단계 저장 + change 콜백)
		commit : function () {
			var now = this._snapshot();
			if (now === this._last) return;
			this._undo.push(this._last);
			if (this._undo.length > this.opt.history) this._undo.shift();
			this._redo = [];
			this._last = now;
			this._emitChange();
		},

		_restore : function (snap) {
			var data = JSON.parse(snap);
			this.editingId = null;
			extend(this.stageOpt, data.stage);
			this.items = data.items;
			this._last = snap;
			this.render();
			this._emitSelect();
			this._emitChange();
		},

		_emitChange : function () {
			if (typeof this.opt.change === 'function') this.opt.change(this.getItems(), this);
		},

		undo : function () {
			if (!this._undo.length) return;
			this._redo.push(this._last);
			this._restore(this._undo.pop());
		},

		redo : function () {
			if (!this._redo.length) return;
			this._undo.push(this._last);
			this._restore(this._redo.pop());
		},

		canUndo : function () { return this._undo.length > 0; },
		canRedo : function () { return this._redo.length > 0; },

		/* ---------- 입출력 ---------- */
		toJSON : function () {
			return { version : VERSION, stage : copy(this.stageOpt), items : copy(this.items) };
		},

		// data : toJSON() 결과 객체 / items 배열 / JSON 문자열
		load : function (data, init) {
			var self = this;
			var d = typeof data === 'string' ? JSON.parse(data) : data;
			var list = Array.isArray(d) ? d : (d && d.items);
			var used = {};
			if (!Array.isArray(list)) throw new Error('nLayoutBuilder : 올바른 데이터 형식이 아닙니다.');

			if (d.stage) {
				this.stageOpt.width = Math.max(num(d.stage.width, this.stageOpt.width), 1);
				this.stageOpt.height = Math.max(num(d.stage.height, this.stageOpt.height), 1);
				if (d.stage.background !== undefined) this.stageOpt.background = d.stage.background;
			}
			if (this.editingId) this.endEdit(true);
			this.items = [];
			list.forEach(function (raw) {
				var it = self._normalize(raw, used);
				if (it) self.items.push(it);
			});
			this.selectedIds = [];
			this.render();
			this._emitSelect();
			if (!init) this.commit();
		},

		exportJSON : function (fileName) {
			var blob = new Blob([JSON.stringify(this.toJSON(), null, 2)], { type : 'application/json' });
			var url = URL.createObjectURL(blob);
			download(url, (fileName || 'layout') + '.json');
			setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
		},

		// src : File / Blob / JSON 문자열 / 객체 → Promise
		importJSON : function (src) {
			var self = this;
			var getText = (window.Blob && src instanceof Blob) ? readFile(src, 'text') : Promise.resolve(src);
			return getText.then(function (data) {
				self.load(data);
				return self.toJSON();
			});
		},

		// option : { type : 'png' | 'jpeg' | 'svg', pixelRatio : 2, fileName : 'layout', download : true, imageOption : {} (html-to-image 옵션) } → Promise(dataURL)
		exportImage : function (option) {
			var o = extend({ type : 'png', pixelRatio : 2, fileName : 'layout', download : true, imageOption : null }, option);
			var fn = { png : 'toPng', jpeg : 'toJpeg', jpg : 'toJpeg', svg : 'toSvg' }[o.type] || 'toPng';
			var ext = fn === 'toJpeg' ? 'jpg' : fn === 'toSvg' ? 'svg' : 'png';
			var st = this.stageOpt;

			if (!window.htmlToImage) return Promise.reject(new Error('nLayoutBuilder : html-to-image.js 가 필요합니다.'));
			if (this.editingId) this.endEdit(true);

			return window.htmlToImage[fn](this.stage, extend({
				width : st.width,
				height : st.height,
				pixelRatio : o.pixelRatio,
				backgroundColor : st.background
			}, o.imageOption)).then(function (url) {
				if (o.download) download(url, o.fileName + '.' + ext);
				return url;
			});
		},

		/* ---------- 제거 ---------- */
		destroy : function () {
			var self = this;
			this.frame.removeEventListener('keydown', this._onKeydown);
			['pointerdown', 'pointerup', 'pointercancel'].forEach(function (type) {
				window.removeEventListener(type, self._onPointer, true);
			});
			window.removeEventListener('keydown', this._onKeyShift);
			window.removeEventListener('keyup', this._onKeyShift);
			this.moveable.destroy();
			this.selecto.destroy();
			if (this.frame.parentNode) this.frame.parentNode.removeChild(this.frame);
			this.wrap.classList.remove(CLASS.wrap);
			this._els = {};
		}
	};

	window.nLayoutBuilder = nLayoutBuilder;
})(window, document);
