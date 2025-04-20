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
          <label class="annotation-label">背景颜色:</label>
          <input type="color" v-model="selectedAnnotation.backgroundColor" class="annotation-input" />
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
          <input type="text"
            :style="{ backgroundColor: annotation == selectedAnnotation ? annotation.backgroundColor : `${annotation.backgroundColor.slice(0, -2)}AA`, width: '100%', boxSizing: 'border-box', maxWidth: '100%' }"
            v-model="annotation.name" placeholder="未命名" />
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
  methods: {
    handleSaveAnnotations() {
      this.$emit('save-annotations');
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
}
</style>