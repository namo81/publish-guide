var editable = document.getElementById('editable');

editable.addEventListener('keyup', (event) => {
  const inputText = event.target.innerText;
  const regex = /.*\s@.*/g; // space + @ 패턴 정규식
  if (inputText.match(regex)) {
    // space + @ 패턴이 일치할 때 추가 기능 실행
    console.log('space + @ detected!');
  }
});




var editable = document.getElementById('editable');

  editable.addEventListener('input', e => {
    const inputText = e.target.textContent;

    // @ 문자의 위치를 찾습니다.
    const index = inputText.indexOf('@');
    
    // @ 문자가 없는 경우 함수를 종료합니다.
    if (index === -1) return;
    
    // @ 문자를 제거합니다.
    const textWithoutAt = inputText.replace('@', '');
    
    // span 태그를 만듭니다.
    const span = document.createElement('span');
    span.textContent = '@';
    
    // contenteditable 내에 span 태그를 삽입합니다.
    const range = new Range();
    range.setStart(e.target.childNodes[0], index);
    range.setEnd(e.target.childNodes[0], index + 1);
    range.deleteContents();
    range.insertNode(span);
  });