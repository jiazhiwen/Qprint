import Vue from 'vue'
Vue.directive('draggable', {
  bind: function (el, binding, vnode) {
    console.log(binding)
    el.onDragStart = function (e) {
      e.target.classList.add('dragging')
      // e.dataTransfer.dropEffect = 'move'
      e.dataTransfer.effectAllowed = 'move'
      // pass drag info
      const dragInfo = {
        type: e.target.dataset.type,
        id: e.target.id,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        dropArea: binding.value.dropArea ? binding.value.dropArea : null
      }
      e.dataTransfer.setData('text/plain', JSON.stringify(dragInfo))
    }

    // drag end
    el.onDragEnd = function (e) {
      // console.log('drag end')
      e.target.classList.remove('dragging', 'drag-over', 'drag-enter', 'hide')
      const handleDrop = binding.value.handleDrop
      if (typeof handleDrop === 'function') {
        handleDrop(e)
      }
    }

    // add event listener
    el.setAttribute('draggable', true)
    el.addEventListener('dragstart', el.onDragStart.bind(binding), false)
    el.addEventListener('dragend', el.onDragEnd, false)
  },
  unbind: function (el, binding, vnode) {
    el.removeEventListener('dragstart', el.onDragStart)
    el.removeEventListener('dragend', el.onDragEnd)
  }
})

Vue.directive('droppable', {
  bind: function (el, binding, vnode) {
    const {handleDrop} = binding.value
    // drop
    el.onDrop = e => {
      if (e.preventDefault) {
        e.preventDefault()
      }
      var data = e.dataTransfer.getData('text/plain')

      try {
        var dragInfo = JSON.parse(data)
      } catch (e) {
        return
      }
      // 如果设置了目标放置容器，则判断是否放置
      if (dragInfo.dropArea && e.target.classList.value.split(' ').indexOf(dragInfo.dropArea) === -1) {
        return
      }

      var dragObject = document.getElementById(dragInfo.id)

      // 如果是控件，则拷贝一份
      if (dragInfo.type === 'widget') {
        var dragCopy = dragObject.cloneNode(true)
        dragCopy.classList.add('component')
        dragCopy.id = 'component_' + dragInfo.id + '_' + Date.now()
        dragCopy.dataset.type = 'component'
        // touch the listener to the new copy component
        // dragCopy.onDragStart = dragObject.onDragStart
        // dragCopy.onDragEnd = dragObject.onDragEnd
        // copy the event handler to the new node
        // dragCopy.addEventListener('dragstart', dragCopy.onDragStart, false)
        // dragCopy.addEventListener('dragend', dragCopy.onDragEnd, false)

        dragCopy.style.left = (e.offsetX - dragInfo.offsetX) + 'px'
        dragCopy.style.top = (e.offsetY - dragInfo.offsetY) + 'px'
        // copy a new object to the droppable area
        // e.target.appendChild(dragCopy)

        if (typeof handleDrop === 'function') {
          let el = {
            id: dragCopy.id,
            left: (e.offsetX - dragInfo.offsetX) + 'px',
            top: (e.offsetY - dragInfo.offsetY) + 'px',
            fontSize: '14px',
            widgetId: dragInfo.id,
            text: ''
          }
          binding.value.handleDrop(el)
        }
      } else {
        // 如果是 page 内组件，则更改移动位置
        dragObject.style.left = (e.offsetX - dragInfo.offsetX) + 'px'
        dragObject.style.top = (e.offsetY - dragInfo.offsetY) + 'px'
        console.log('drag inside')
      }
      if (e.stopPropagation) {
        e.stopPropagation()
      }
      return false
    }
    // drag over
    el.onDragOver = function (e) {
      console.log('drag over')
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      e.target.classList.add('drag-over')
      return false
    }
    el.onDragEnter = function (e) {
      console.log('drag enter')
      e.target.classList.add('drag-enter')
    }
    el.onDragLeave = function (e) {
      console.log('drag leave')
      e.target.classList.remove('drag-enter')
    }
    el.addEventListener('dragover', el.onDragOver, false)
    el.addEventListener('dragenter', el.onDragEnter, false)
    el.addEventListener('drop', el.onDrop.bind(binding), false)
    el.addEventListener('dragleave', el.onDragLeave, false)
  },
  unbind: function (el, binding, vnode) {
    // shut er' down
    el.classList.remove('dragging', 'drag-over', 'drag-enter')
    // el.removeAttribute('draggable')
    el.removeEventListener('dragstart', el.onDragStart)
    el.removeEventListener('dragenter', el.onDragEnter)
    el.removeEventListener('dragover', el.onDragOver)
    el.removeEventListener('dragleave', el.onDragLeave)
    el.removeEventListener('drag', el.onDrag)
  }
})

Vue.directive('moveable', {
  bind: function (el, binding, vnode) {
    el.style.position = 'absolute'
    let startX, startY, initialMouseX, initialMouseY
    const {scale, handleMove} = binding.value
    console.log('scale:' + scale)
    function mousemove (e) {
      var dx = (e.clientX - initialMouseX) / scale
      var dy = (e.clientY - initialMouseY) / scale
      el.style.top = (startY + dy) + 'px'
      el.style.left = (startX + dx) + 'px'
      return false
    }

    function mouseup (e) {
      document.removeEventListener('mousemove', mousemove)
      document.removeEventListener('mouseup', mouseup)
      if (typeof handleMove === 'function') {
        handleMove({
          id: el.id,
          left: el.style.left,
          top: el.style.top
        })
      }
    }

    el.addEventListener('mousedown', function (e) {
      startX = el.offsetLeft
      startY = el.offsetTop
      initialMouseX = e.clientX
      initialMouseY = e.clientY
      document.addEventListener('mousemove', mousemove)
      document.addEventListener('mouseup', mouseup)
      return false
    })
  }
})