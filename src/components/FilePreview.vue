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
const isDeleteButtonVisible = ref(true) // 新增状态变量控制删除按钮的显示
const lastClickPosition = ref({ x: 0, y: 0 }) // 新增状态变量记录点击位置

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
  annotations.splice(index, 1)
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
  emit('update:selectedAnnotation', annotation);
}

const handleHideDeleteButton = () => {
  isDeleteButtonVisible.value = !isDeleteButtonVisible.value // 切换删除按钮的显示状态
}

// 监听图片点击事件
const handleImageClick = (event) => {
  const rect = event.target.getBoundingClientRect()
  lastClickPosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

// 监听键盘事件
const handleKeyDown = (event) => {
  if (event.key === 'a') {
    createAnnotationAtPosition(lastClickPosition.value)
  }
}

// 在指定位置创建标注框
const createAnnotationAtPosition = (position) => {
  const newAnnotation = {
    id: Date.now() + parseFloat(Math.random() * 999999),
    x: position.x,
    y: position.y,
    width: 100,
    height: 100,
    name: '未命名',
    backgroundColor: randomColor()
  }
  addAnnotation(newAnnotation)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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
          <button @click="handleHideDeleteButton">{{ isDeleteButtonVisible ? '隐藏删除' : '显示删除' }} </button>
        </div>
      </div>
      <div class="annotations-img">
        <div style="position: relative;">
          <img 
            :src="fileContent" 
            :style="{ pointerEvents: 'auto', transform: `scale(${scale})`, transformOrigin: 'top left' }"
            alt="File Preview" 
            @click="handleImageClick"
            draggable="false"
            @dragstart.prevent
          />
          <vue-draggable-resizable 
            v-for="(annotation, index) in annotations" 
            :class="{'draggable-resizable':true, active: annotation == props.selectedAnnotation}"
            :key="annotation.id" 
            :x="parseFloat(annotation.x * scale).toFixed(0)"
            :y="parseFloat(annotation.y * scale).toFixed(0)" 
            :w="parseFloat(annotation.width * scale).toFixed(0)"
            :h="parseFloat(annotation.height * scale).toFixed(0)"
            @dragging="(x, y) => Object.assign(annotation, { x: parseFloat(x / scale).toFixed(0), y: parseFloat(y / scale).toFixed(0) })"
            @resizing="(x, y, width, height) => Object.assign(annotation, { x: parseFloat(x / scale).toFixed(0), y: parseFloat(y / scale).toFixed(0), width: parseFloat(width / scale).toFixed(0), height: parseFloat(height / scale).toFixed(0) })"
            @activated="() => handleActivated(annotation)" 
            @deactivated="() => activeAnnotationIndex = null"
            @dragstop="() => emit('annotations-update', annotations)"
            @resizestop="() => emit('annotations-update', annotations)" 
            :style="{
              border: `3px solid ${annotation.backgroundColor || '#ccc'} `,
              backgroundColor: annotation == props.selectedAnnotation ? `${annotation.backgroundColor.slice(0, -2)}AA` : 'transparent'
            }">
            <button v-if="isDeleteButtonVisible" class="delete-button" @click="removeAnnotation(index)">X</button>
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
  /* 修改为左右布局 */
  align-items: center;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 0 10px;
  /* 添加内边距 */
}

.annotation-controls.left,
.annotation-controls.right {
  display: flex;
  align-items: center;
}

.annotation-controls.left button {
  margin-right: 5px;
  /* 添加按钮之间的间距 */
}

.annotation-controls.right button {
  margin-left: 5px;
  /* 添加按钮之间的间距 */
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