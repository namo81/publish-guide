// 드래그 앤 드롭을 위한 이벤트 리스너 등록
function tbl_dragable(option){
    const wrap = typeof option.wrap === 'string' ? document.querySelector(option.wrap) : option.wrap,
        dropzone = wrap.querySelector('tbody');
    let rows,
        drag_chk = false;

    function row_update(){
        let rows = wrap.querySelectorAll('tbody > tr');
        rows.forEach(row => {
            row.draggable = true;
            row.addEventListener('dragstart', e => {
                //e.dataTransfer.setData('text/plain', row.dataset.num);
                row.classList.add('dragging');
            });
        });
    }
    row_update();


    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        drag_chk = true;
        let afterElement = getDragAfterElement(dropzone, e.clientY),       
            draggable = document.querySelector('.dragging');

        if (afterElement == null) {
            dropzone.appendChild(draggable);
        } else {
            dropzone.insertBefore(draggable, afterElement);
        }
    });

    // 드롭 대상 행 중 이동할 위치를 결정하는 함수
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            let box = child.getBoundingClientRect(),
                offset = y - box.top - box.height / 2;
        
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    document.addEventListener('dragend', e => {
        if(drag_chk == false) return;
        const draggable = e.target.closest('tr');
        draggable.classList.remove('dragging');
        drag_chk = false;
    
    });

    this.update = function(){
        row_update();
    }
}