<template>
  <ul class="file-tree">
    <li v-for="(node, index) in tree" :key="index" :class="{ 'selected': node.path === selectedFilePath, 'directory': !!node.children, 'file': !node.children }">
      <span class="node-name" @click="handleNodeClick(node, index)" style="cursor: pointer;">
        {{ node.name }}
        <span v-if="node.children">[{{ isExpanded(index) ? '-' : '+' }}]</span>
      </span>
      <button @click="deleteNode(node.handle)" v-if="!node.children">删除</button>
      <FileTreeNode
        v-if="node.children && isExpanded(index)"
        :tree="node.children"
        @delete-file="$emit('delete-file', $event)"
        @file-click="$emit('file-click', $event)"
        :selectedFilePath="selectedFilePath"
      />
    </li>
  </ul>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  tree: {
    type: Array,
    required: true
  },
  selectedFilePath: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['delete-file', 'file-click'])

const expanded = ref({})

onMounted(() => {
  // 默认展开所有目录
  // tree.forEach((node, index) => {
  //   if (node.children) {
  //     expanded.value[index] = true
  //   }
  // })
})

const toggleExpand = (index) => {
  expanded.value[index] = !expanded.value[index]
}

const isExpanded = (index) => {
  return expanded.value[index] || false
}

const deleteNode = (handle) => {
  emit('delete-file', handle)
}

const handleNodeClick = (node, index) => {
  if (node.children) {
    toggleExpand(index)
  } else {
    emit('file-click', node)
  }
}
</script>

<style scoped>
ul {
  list-style-type: none;
  padding-left: 20px;
}
ul li {
  display: flex;
}
ul li.directory {
  display: flex;
  flex-direction: column;
}
ul li .node-name {
  flex: 1;
  border-bottom: 1px solid #ccc;
}

li.selected {
  background-color: #e0f7fa; /* 高亮颜色 */
}
</style>