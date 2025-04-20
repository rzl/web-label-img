<template>
  <div class="property-list">
    <div v-if="selectedAnnotation" class="selected-annotation-details">
      <div class="annotation-title" style="text-align: center;">标注详情</div>
      <div>
        <div class="annotation-field">
          <label class="annotation-label">名称:</label>
          <input type="text" v-model="selectedAnnotation.name" class="annotation-input" />
        </div>
        <div class="annotation-field" style="display: flex;">
          <div class="annotation-field-content">
            <span class="annotation-label">X:</span>
            <input type="number" v-model="selectedAnnotation.x" class="annotation-input" />
          </div>
          <div class="annotation-field-content">
            <span class="annotation-label">Y:</span>
            <input type="number" v-model="selectedAnnotation.y" class="annotation-input" />
          </div>
        </div>
        <div class="annotation-field" style="display: flex;">
          <div class="annotation-field-content">
            <span class="annotation-label">宽:</span>
            <input type="number" v-model="selectedAnnotation.width" class="annotation-input" />
          </div>
          <div class="annotation-field-content">
            <span class="annotation-label">高:</span>
            <input type="number" v-model="selectedAnnotation.height" class="annotation-input" />
          </div>
        </div>
        <div class="annotation-field">
          <label class="annotation-label-100">背景颜色:</label>
          <input type="color" v-model="backgroundColorWithoutAlpha" class="annotation-input" />
        </div>
      </div>
    </div>
    <div>
      <button @click="handleSaveAnnotations">保存</button>
    </div>
    <div class="label-list">
      <ul v-if="annotations.length" style="list-style: none; padding-left: 0px;">
        <li v-for="annotation in annotations" :key="annotation.id"
          :style="{ backgroundColor: annotation == selectedAnnotation ? annotation.backgroundColor : `${annotation.backgroundColor.slice(0, -2)}AA` }"
          @click="selectAnnotation(annotation)">
          <input type="text" :style="{
            backgroundColor: annotation == selectedAnnotation ? annotation.backgroundColor : `${annotation.backgroundColor.slice(0, -2)}AA`,
            color: getFontColor(annotation.backgroundColor), // 新增字体颜色计算
            width: '100%', boxSizing: 'border-box', maxWidth: '100%'
          }" v-model="annotation.name" placeholder="未命名" />
          <!-- 新增删除按钮 -->
          <button class="delete-button" @click.stop="deleteAnnotation(annotation.id)">删除</button>
        </li>
      </ul>
      <p v-else>没有标注</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    selectedAnnotation: Object,
    annotations: Array,
    selectAnnotation: Function
  },
  computed: {
    backgroundColorWithoutAlpha: {
      get() {
        return this.selectedAnnotation?.backgroundColor.slice(0, -2) || '#ffffff';
      },
      set(newValue) {
        // 直接更新 selectedAnnotation.backgroundColor
        if (this.selectedAnnotation) {
          this.selectedAnnotation.backgroundColor = `${newValue}FF`;
        }
      }
    }
  },
  methods: {
    handleSaveAnnotations() {
      this.$emit('save-annotations');
    },
    getFontColor(backgroundColor) {
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#FFFFFF';
    },
    deleteAnnotation(annotationId) {
      let annotations = this.annotations.filter(annotation => annotation.id !== annotationId);
      this.$emit('annotations-update', annotations);
    }
  }
}
</script>

<style scoped>
.property-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.selected-annotation-details {
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: left;
}

.annotation-field {
  display: flex;
  margin-bottom: 10px;
}

.annotation-label {
  width: 60px;
  text-align: right;
  padding-right: 10px;
  font-weight: bold;
}

.annotation-label-100 {
  width: 100px;
  text-align: right;
  padding-right: 10px;
  font-weight: bold;
}

.annotation-input {
  flex: 1;
  width: 100%;
}

.annotation-field-content {
  display: flex;
  flex: 1;
}

.label-list {
  flex: 1;
  overflow: auto;
}

.label-list li {
  cursor: pointer;
  padding: 5px;
  margin: 2px 0;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 新增样式：删除按钮 */
.delete-button {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-button:hover {
  background-color: #ff7875;
}
</style>