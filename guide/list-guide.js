/**
 * list-guide.js - 퍼블리싱 화면 목록(가이드) 페이지용 스크립트
 *
 * 의존 파일 : 없음 (단독 사용 가능)
 *
 * 기능
 *  - 목록 테이블 넘버링 / 섹션 구분선 / 섹션별 토글(행 30개 초과 시)
 *  - 링크 · 완료일 유무에 따른 진행상태 표기 및 진행율 계산
 *  - iframe 미리보기 (PC / 모바일)
 *  - 링크 화면 내 text 검색
 *  - 폴더 트리 토글 / top 버튼 추가
 *  - guide_menuSet(num) : 상단 메뉴 현재 페이지 활성화 (외부 호출)
 *
 * 버전 이력 (AI 클로드 작성)
 *  2026-10-16 : ES8(ES2017) 기준으로 문법 정리 및 오류 수정
 *               - 다중 테이블에서 토글/이벤트가 중복 등록되던 문제 수정
 *               - 미정의 변수(clickEvt) 참조 오류 수정
 *               - text 검색 XHR → fetch(async/await) 변경, 정규식 오류 수정
 */

const GUIDE_TGL_MIN_ROWS = 30; // 행 수가 이 값을 초과할 때 섹션 토글 버튼 생성
const GUIDE_LINK_SELECTOR = '.list table:not(.info) td.link > a'; // 목록 테이블 링크 (info 테이블 제외)

/** 섹션 구분행(tr.div) 다음부터 다음 구분행 전까지의 행 목록 반환 */
const getSectionRows = (divTr) => {
	const rows = [];
	let tr = divTr.nextElementSibling;
	while (tr && !tr.classList.contains('div')) {
		rows.push(tr);
		tr = tr.nextElementSibling;
	}
	return rows;
};

/** 섹션 열기/닫기 - btn 의 'open' 클래스 = 섹션 닫힘 상태 */
const setSectionFold = (btn, fold) => {
	getSectionRows(btn.closest('tr')).forEach((tr) => tr.classList.toggle('hide', fold));
	btn.classList.toggle('open', fold);
	btn.setAttribute('aria-expanded', String(!fold));
};

/** 테이블 단위 설정 - 넘버링된 행 수를 반환 */
function guide_tblSet(tbl) {
	const trs = Array.from(tbl.querySelectorAll('tbody > tr'));
	let numCount = 0;

	// 페이지 수 넘버링 추가
	trs.forEach((tr) => {
		const tdNo = tr.querySelector('.no');
		if (!tdNo) return;
		tdNo.textContent = Array.prototype.indexOf.call(tr.parentNode.children, tr) + 1;
		numCount++;
	});

	// depth1 에 텍스트 있을 경우 구분선 생성 및 토글버튼 추가
	const useTgl = trs.length > GUIDE_TGL_MIN_ROWS;
	const tglBtns = [];

	tbl.querySelectorAll('.depth1').forEach((td) => {
		if (td.textContent.trim().length > 0) {
			td.parentNode.classList.add('div');
			if (useTgl) {
				td.insertAdjacentHTML('beforeend', '<button type="button" class="btn-tr-tgl" title="ctrl 누른 채 클릭 시 전체 제어" aria-expanded="true">Toggle</button>');
				tglBtns.push(td.lastElementChild);
			}
		} else {
			td.style.borderTop = 'none';
		}
	});

	// 섹션별 토글기능 (ctrl / mac cmd 누른 채 클릭 시 테이블 전체 제어)
	tglBtns.forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const fold = !btn.classList.contains('open');
			if (e.ctrlKey || e.metaKey) tglBtns.forEach((item) => setSectionFold(item, fold));
			else setSectionFold(btn, fold);
		});

		// 미사용 화면 리스트 닫기
		if (btn.closest('tr').classList.contains('notuse')) setSectionFold(btn, true);
	});

	// 링크값 유무 + 종료일 유무에 따른 진행상태 표기
	trs.forEach((tr) => {
		const btn = tr.querySelector('.link > a'),
			tdState = tr.querySelector('.state'),
			tdEnd = tr.querySelector('.end-date');

		if (!btn || !tdState) return;

		if ((btn.getAttribute('href') || '').length > 0) {
			const isEnd = !!tdEnd && tdEnd.textContent.trim().length > 0;
			tdState.classList.add(isEnd ? 'end' : 'ing');
		} else {
			btn.classList.add('ready');
			btn.addEventListener('click', (e) => e.preventDefault());
		}
	});

	return numCount;
}

/** iframe 미리보기 설정 */
function guide_previewSet() {
	const frameWrap = document.querySelector('.iframe');
	if (!frameWrap) return;

	const frame = frameWrap.querySelector('iframe'),
		frameClose = frameWrap.querySelector('.btn-frame-close'),
		previewChk = document.querySelector('#view-chk'),
		mobileChk = document.querySelector('#view-mobile');

	if (!frame || !previewChk) return;

	const openPreview = (e) => {
		const btn = e.target.closest(GUIDE_LINK_SELECTOR);
		if (!btn || !previewChk.checked || btn.classList.contains('ready')) return;
		frame.setAttribute('src', btn.getAttribute('href'));
		frameWrap.classList.add('show');
	};
	// 마우스 오버 + 키보드 포커스 시 미리보기 (이벤트 위임)
	document.addEventListener('mouseover', openPreview);
	document.addEventListener('focusin', openPreview);

	if (frameClose) {
		frameClose.addEventListener('click', () => {
			frame.setAttribute('src', '');
			frameWrap.classList.remove('show');
			if (window.outerWidth > 701) previewChk.checked = false;
		});
	}

	if (mobileChk) {
		const setMobile = () => frameWrap.classList.toggle('mobile', mobileChk.checked);
		mobileChk.addEventListener('change', setMobile);
		setMobile();
	}
}

/** 전체 페이지 수 및 완료 페이지 표기 */
function guide_progressSet(total) {
	const pageTotal = document.querySelector('.total-page'),
		pageEnd = document.querySelector('.end-page'),
		pagePer = document.querySelector('.per'),
		endCount = document.querySelectorAll('.list td.end, .list td.include').length,
		endPer = total > 0 ? (endCount / total) * 100 : 0;

	if (pageTotal) pageTotal.textContent = total;
	if (pageEnd) pageEnd.textContent = endCount;
	if (pagePer) pagePer.textContent = endPer.toFixed(1);
}

/** 링크 화면 내 text 검색 - 검색어가 포함된 화면의 링크에 'classUse' 클래스 추가 */
function guide_findSet() {
	const findBtn = document.querySelector('.btn-find-tx'),
		findInp = document.querySelector('#find-tx');
	if (!findBtn || !findInp) return;

	const htmlCache = new Map();

	const getHtml = async (url) => {
		if (!htmlCache.has(url)) {
			const res = await fetch(url);
			htmlCache.set(url, res.ok ? await res.text() : '');
		}
		return htmlCache.get(url);
	};

	const find = async () => {
		const srchTx = findInp.value.trim(),
			links = Array.from(document.querySelectorAll(GUIDE_LINK_SELECTOR));

		links.forEach((btn) => btn.classList.remove('classUse'));
		if (!srchTx) return;

		await Promise.all(links.map(async (btn) => {
			const url = btn.getAttribute('href');
			if (!url || url.charAt(0) === '#') return;
			try {
				if ((await getHtml(url)).includes(srchTx)) btn.classList.add('classUse');
			} catch (err) {
				console.warn('[list-guide] 검색 실패 : ' + url, err);
			}
		}));
	};

	findBtn.addEventListener('click', find);
	findInp.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') find();
	});
}

/** 폴더 트리 토글 */
function guide_treeSet() {
	const fldTree = document.querySelector('.folder-tree');
	if (!fldTree) return;

	fldTree.querySelectorAll('button').forEach((btn) => {
		if (btn.classList.contains('btn-tree')) {
			btn.addEventListener('click', () => btn.parentNode.classList.toggle('on'));
		} else if (!btn.nextElementSibling) {
			btn.classList.add('tree-last');
		}
	});
}

/** top 버튼 추가 */
function guide_topBtnSet() {
	const topBtn = document.createElement('a');
	topBtn.className = 'btn-guide-top';
	topBtn.href = '#work-list';
	topBtn.title = '맨 위로';
	topBtn.setAttribute('aria-label', '맨 위로');
	document.body.appendChild(topBtn);
}

/** 현재 페이지 활성화 */
function guide_menuSet(num) {
	const menu = document.querySelector('.menu');
	if (!menu) return;

	menu.querySelectorAll('a').forEach((link, idx) => link.classList.toggle('view', idx === num));
}

window.addEventListener('load', () => {
	let tblTotal = 0;
	document.querySelectorAll('.list table').forEach((tbl) => {
		if (!tbl.classList.contains('info')) tblTotal += guide_tblSet(tbl);
	});

	guide_previewSet();
	guide_progressSet(tblTotal);
	guide_findSet();
	guide_treeSet();
	guide_topBtnSet();
});
