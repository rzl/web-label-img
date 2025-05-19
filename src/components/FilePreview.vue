<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import VueDraggableResizable from 'vue-draggable-resizable'

const props = defineProps({
  fileHandle: {
    type: Object,
    required: true
  },
  selectedAnnotation: {
    type: Object,
    default: null
  },
  annotations: {
    type: Array,
    default: () => []
  }
})

const fileContent = ref(null)
const isImage = ref(false)
const emit = defineEmits(['image-dimensions', 'annotations-update', 'update:selectedAnnotation'])
const scale = ref(1)
const isDeleteButtonVisible = ref(true)
const isAnnotationNameVisible = ref(true)
const lastClickPosition = ref({ x: 0, y: 0 })
const activeAnnotation = ref(null)
const isReverse = ref(false)

const getImageDimensions = (url) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.src = url
  })
}

watch(() => props.fileHandle, async (newHandle) => {
  if (newHandle) {
    const file = await newHandle.getFile()
    if (file.type.startsWith('image/')) {
      fileContent.value = URL.createObjectURL(file)
      isImage.value = true
      const dimensions = await getImageDimensions(fileContent.value)
      emit('image-dimensions', dimensions)
    } else {
      fileContent.value = await file.text()
      isImage.value = false
    }
  }
})

watch(scale, (newScale) => {
  // 监听缩放比例的变化
  // 这里可以添加额外的逻辑，比如限制缩放比例的范围
})

const addAnnotation = (annotation) => {
  props.annotations.push(annotation)
  emit('annotations-update', props.annotations)
}

const removeAnnotation = (index) => {
  props.annotations.splice(index, 1)
  emit('annotations-update', props.annotations)
}

const annotationList = computed(() => {
  return annotations.map((annotation, index) => ({
    id: index,
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height
  }))
})

const randomColor = () => {
  const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const a = 'FF'; // 透明度
  return `#${r}${g}${b}${a}`;
};

const createAnnotation = () => {
  const newAnnotation = {
    id: Date.now() + parseFloat(Math.random() * 999999),
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    name: '未命名',
    backgroundColor: randomColor()
  };
  addAnnotation(newAnnotation);
}

const handleActivated = (annotation) => {
  emit('update:selectedAnnotation', annotation)
  activeAnnotation.value = annotation
}

const handleHideDeleteButton = () => {
  isDeleteButtonVisible.value = !isDeleteButtonVisible.value
}
const handleHideAnnotationName = () => {
  isAnnotationNameVisible.value = !isAnnotationNameVisible.value
}

// 监听图片点击事件
const handleImageClick = (event) => {
  const rect = event.target.getBoundingClientRect()
  lastClickPosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

// 处理键盘事件，支持上下左右键移动选中的标注框
const handleKeyDown = (event) => {
  event.preventDefault()
  event.stopPropagation()
  if (event.key === 'a') {
    createAnnotationAtPosition(lastClickPosition.value)
  }
  if (activeAnnotation.value) {
    const step = 1 // 移动步长
    let dx = 0, dy = 0, dw = 0, dh = 0
    switch (event.key) {
      case 'ArrowUp': // 上键
        dy = -step
        break
      case 'ArrowDown': // 下键
        dy = step
        break
      case 'ArrowLeft': // 左键
        dx = -step
        break
      case 'ArrowRight': // 右键
        dx = step
        break
      case '8':
        // 上边向上平移
        dy = -step
        dh = step
        break
      case '2':
        // 下边向下平移
        dh = step
        break
      case '4':
        // 左边向左平移，上下边变长
        dx = -step
        dw = step
        break
      case '6':
        // 右边向右平移
        dw = step
        break
      case '7':
        // 左上角向左上移动
        dx = -step
        dy = -step
        dw = step
        dh = step
        break
      case '9':
        // 右上角向右上移动
        dy = -step
        dw = step
        dh = step
        break
      case '1':
        // 左下角向左下移动
        dx = -step
        dw = step
        dh = step
        break
      case '3':
        // 右下角向右下移动
        dw = step
        dh = step
        break
      case '5':
        isReverse.value = !isReverse.value
        return
      default:
        return
    }
    if (isReverse.value) {
      dx = -dx
      dy = -dy
      dw = -dw
      dh = -dh
    }
    // 更新标注框的位置和尺寸
    activeAnnotation.value.x = Math.max(0, parseInt(activeAnnotation.value.x) + dx)
    activeAnnotation.value.y = Math.max(0, parseInt(activeAnnotation.value.y) + dy)
    activeAnnotation.value.width = Math.max(10, parseInt(activeAnnotation.value.width) + dw)
    activeAnnotation.value.height = Math.max(10, parseInt(activeAnnotation.value.height) + dh)
    emit('annotations-update', props.annotations) // 更新标注框位置和尺寸
  }
}

// 新增：处理键盘释放事件，用于支持数字键5的长按操作
const handleKeyUp = (event) => {
  if (event.key === '5') {
    isReverse.value = false // 取消反向操作状态
  }
}

// 在指定位置创建标注框
const createAnnotationAtPosition = (position) => {
  let x = Number(position.x) - 50
  let y = Number(position.y) - 50
  if (x < 0) x = 0
  if (y < 0) y = 0
  const newAnnotation = {
    id: Date.now() + parseFloat(Math.random() * 999999),
    x,
    y,
    width: 100,
    height: 100,
    name: '未命名',
    backgroundColor: randomColor()
  }
  addAnnotation(newAnnotation)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp) // 添加 keyup 事件监听
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp) // 移除 keyup 事件监听
})

</script>

<template>
  <div style="height: 100%; width: 100%; position: relative;">
    <div v-if="isImage" class="image-preview">
      <div class="annotation-controls">
        <div class="annotation-controls left">
          <button @click="createAnnotation">增加标注</button>
          <button @click="scale = parseFloat((scale - 0.1).toFixed(1))" :disabled="scale <= 0.1">-</button>
          <input type="number" v-model="scale" step="0.1" min="0.1" max="5" placeholder="缩放比例" />
          <button @click="scale = parseFloat((scale + 0.1).toFixed(1))" :disabled="scale >= 5">+</button>
        </div>
        <div class="annotation-controls right">
          <button @click="handleHideDeleteButton">
            {{ isDeleteButtonVisible ? '隐藏删除' : '显示删除' }}
          </button>
          <button @click="handleHideAnnotationName">
            {{ isAnnotationNameVisible ? '隐藏名称' : '显示名称' }}
          </button>
        </div>
      </div>
      <div class="annotations-img">
        <div style="position: relative;">
          <img 
            :src="fileContent" 
            :style="{ pointerEvents: 'auto', transform: `scale(${scale})`, transformOrigin: 'top left' }"
            alt="File Preview" 
            @click="handleImageClick"
            @mousemove="handleImageClick"
            draggable="false"
            @dragstart.prevent
          />
          <vue-draggable-resizable 
            v-for="(annotation, index) in annotations" 
            :class="{'draggable-resizable':true, active: annotation == props.selectedAnnotation}"
            :key="annotation.id" 
            :x="Number(parseFloat(annotation.x * scale).toFixed(0))"
            :y="Number(parseFloat(annotation.y * scale).toFixed(0))" 
            :w="Number(parseFloat(annotation.width * scale).toFixed(0))"
            :h="Number(parseFloat(annotation.height * scale).toFixed(0))"
            @dragging="(x, y) => Object.assign(annotation, { x: parseFloat(x / scale).toFixed(0), y: parseFloat(y / scale).toFixed(0) })"
            @resizing="(x, y, width, height) => Object.assign(annotation, { x: parseFloat(x / scale).toFixed(0), y: parseFloat(y / scale).toFixed(0), width: parseFloat(width / scale).toFixed(0), height: parseFloat(height / scale).toFixed(0) })"
            @activated="() => handleActivated(annotation)" 
            @deactivated="() => activeAnnotation = null"
            @dragstop="() => emit('annotations-update', annotations)"
            @resizestop="() => emit('annotations-update', annotations)" 
            :style="{
              border: `3px solid ${annotation.backgroundColor || '#ccc'} `,
              backgroundColor: annotation == props.selectedAnnotation ? `${annotation.backgroundColor.slice(0, -2)}AA` : 'transparent'
            }">
            <button v-if="isDeleteButtonVisible" class="delete-button" @click="removeAnnotation(index)">X</button>
            <span v-if="isAnnotationNameVisible" class="annotation-name" :style="{ color: '#fff', fontSize: '12px' }">
              {{ annotation.name }}
            </span>
          </vue-draggable-resizable>
        </div>
      </div>
    </div>
    <pre style="text-align: left;" v-else>{{ fileContent }}</pre>
  </div>
</template>

<style>
.image-preview {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.annotation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 0 10px;
}

.annotation-controls.left,
.annotation-controls.right {
  display: flex;
  align-items: center;
}

.annotation-controls.left button {
  margin-right: 5px;
}

.annotation-controls.right button {
  margin-left: 5px;
}

.annotations-img {
  flex: 1;
  overflow: auto;
}

.draggable-resizable {
  position: absolute;
  top: 0px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.draggable-resizable.active {
  z-index: 1!important;
}
</style>