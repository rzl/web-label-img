<script setup>
import { ref } from 'vue'
import FileTreeNode from './components/FileTreeNode.vue'
import FilePreview from './components/FilePreview.vue'
import PropertyList from './components/PropertyList.vue' // 引入 PropertyList 组件

const fileTree = ref([])
const fileInput = ref(null)
const directoryPath = ref('')
const fileName = ref('')
const selectedFileHandle = ref(null)
const fileProperties = ref({}) // 添加文件属性对象
const annotations = ref([]) // 增加标注框数组
const selectedFilePath = ref('') // 添加选中的文件路径

let currentDirHandle = null;

async function openDirectory() {
  try {
    currentDirHandle = await window.showDirectoryPicker();
    directoryPath.value = currentDirHandle.name;
    fileTree.value = await buildFileTree(currentDirHandle);
  } catch (error) {
    console.error('Error opening directory:', error);
  }
}

async function buildFileTree(dirHandle, path = '') {
  const entries = [];
  for await (const entry of dirHandle.values()) {
    const fullPath = `${path}/${entry.name}`;
    if (entry.kind === 'directory') {
      entries.push({
        name: entry.name,
        children: await buildFileTree(entry, fullPath),
        handle: entry,
        path: fullPath, // 增加 path 属性
        kind: entry.kind
      });
    } else {
      entries.push({
        name: entry.name,
        handle: entry,
        path: fullPath, // 增加 path 属性
        kind: entry.kind
      });
    }
  }
  // 对 entries 按 kind 和 name 属性进行排序
  entries.sort((a, b) => {
    if (a.kind === 'directory' && b.kind !== 'directory') {
      return -1;
    } else if (a.kind !== 'directory' && b.kind === 'directory') {
      return 1;
    } else if (a.kind === 'directory' && b.kind === 'directory') {
      return a.name.localeCompare(b.name);
    } else if (a.kind !== 'directory' && b.kind !== 'directory') {
      return a.name.localeCompare(b.name);
    } else {
      return a.name.localeCompare(b.name);
    }
  });
  return entries;
}

async function createFile() {
  if (!currentDirHandle || !fileName.value) {
    alert('请选择目录并输入文件名')
    return
  }

  try {
    let dirHandle = currentDirHandle;
    const pathParts = directoryPath.value.split('/');
    for (const part of pathParts) {
      if (part) {
        dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
      }
    }
    const fileHandle = await dirHandle.getFileHandle(fileName.value, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write('');
    await writable.close();
    fileTree.value = await buildFileTree(currentDirHandle);
    fileName.value = ''; // 清空文件名输入框
  } catch (error) {
    console.error('Error creating file:', error);
  }
}

async function deleteFile(fileHandle) {
  try {
    await fileHandle.remove();
    fileTree.value = await buildFileTree(currentDirHandle);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

async function handleFileClick(node) {
  let fileHandle = node.handle;
  selectedFileHandle.value = fileHandle;
  selectedFilePath.value = node.path; // 更新选中的文件路径
  if (fileHandle) {
    const file = await fileHandle.getFile();
    fileProperties.value = {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toLocaleString()
    };
    if (file.type.startsWith('image/')) {
      fileHandle.getFile().then(file => {
        const url = URL.createObjectURL(file);
        getImageDimensions(url).then(dimensions => {
          fileProperties.value.width = dimensions.width;
          fileProperties.value.height = dimensions.height;
        });
      });
      // 读取同名文件后缀为 .json 的文件内容
      const jsonFileName = `${file.name}.json`;
      console.log('jsonFileName:', jsonFileName); // 调试输出
      const jsonFileHandle = await currentDirHandle.getFileHandle(jsonFileName, { create: false }).catch(() => null);
      if (jsonFileHandle) {
        const jsonFile = await jsonFileHandle.getFile();
        const jsonContent = await jsonFile.text();
        annotations.value = JSON.parse(jsonContent).annotations || []; // 读取标注数据
      } else {
        annotations.value = []; // 清空 annotations
      }
    }
    // 更新 directoryPath 为选中文件所在的目录路径
    directoryPath.value = node.path.split('/').slice(0, -1).join('/') || ''; // 使用 node.path 更新 directoryPath
  } else {
    fileProperties.value = {};
    annotations.value = []; // 清空 annotations
  }
}

function getImageDimensions(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = url;
  });
}

async function refreshDirectory() {
  if (!currentDirHandle) {
    alert('请先打开一个目录');
    return;
  }

  try {
    fileTree.value = await buildFileTree(currentDirHandle);
    console.log('Directory refreshed successfully.', fileTree.value);
  } catch (error) {
    console.error('Error refreshing directory:', error);
  }
}

function updateAnnotations(newAnnotations) {
  annotations.value = newAnnotations;
}

const selectedAnnotation = ref(null);

function selectAnnotation(annotation) {
  selectedAnnotation.value = annotation;
}

// 新增方法：更新 selectedAnnotation
const updateSelectedAnnotation = (annotation) => {
  selectedAnnotation.value = annotation;
}

// 新增方法：保存标注数据到文件
async function saveAnnotationsToFile() {
  if (!selectedFileHandle.value) {
    alert('请选择一个文件');
    return;
  }

  try {
    let dirHandle = currentDirHandle;
    const pathParts = directoryPath.value.split('/');
    for (const part of pathParts) {
      if (part) {
        dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
      }
    }
    const fileHandle = await dirHandle.getFileHandle(`${fileProperties.value.name}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify({ annotations: annotations.value }, null, 2));
    await writable.close();
    refreshDirectory(); // 刷新目录以显示新文件
    // alert('标注数据已保存');
  } catch (error) {
    console.error('Error saving annotations:', error);
  }
}
</script>

<template>
  <div class="app-container">
    <!-- 头部操作栏 -->
    <header class="header">
      <div class="header-content">
        <button @click="refreshDirectory">刷新目录</button> <!-- 新增刷新目录按钮 -->
        <button @click="openDirectory">打开目录</button>
        <button>当前目录：{{ directoryPath }}/</button> 
        <input type="text" v-model="fileName" placeholder="文件名" />
        <button @click="createFile">创建文件</button>
      </div>
    </header>

    <!-- 中部内容 -->
    <main class="main-content">
      <div class="left-sidebar">
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button>按钮1</button>
          <button>按钮2</button>
          <!-- 添加更多按钮 -->
        </div>
        <!-- 树状文件结构 -->
        <div class="file-tree">
          <FileTreeNode :tree="fileTree" @delete-file="deleteFile" @file-click="handleFileClick"
            :selectedFilePath="selectedFilePath" />
        </div>
      </div>
      <div class="center-content">
        <FilePreview :fileHandle="selectedFileHandle" @image-dimensions="updateImageDimensions"
          @annotations-update="updateAnnotations" :selectedAnnotation="selectedAnnotation"
          @update:selectedAnnotation="updateSelectedAnnotation" :annotations="annotations" />
        <!-- 新增 :annotations="annotations" -->
      </div>
      <div class="right-sidebar">
        <!-- 属性列表 -->
        <PropertyList :selectedAnnotation="selectedAnnotation" :annotations="annotations"
          :selectAnnotation="selectAnnotation" @save-annotations="saveAnnotationsToFile" />
      </div>
    </main>

    <!-- 状态栏 -->
    <footer class="footer">
      <div class="footer-content">
        <div v-if="Object.keys(fileProperties).length">
          <span class="file-properties">文件名: {{ fileProperties.name }}</span>
          <span class="file-properties">类型: {{ fileProperties.type }}</span>
          <span class="file-properties">大小: {{ fileProperties.size }} 字节</span>
          <span class="file-properties">最后修改时间: {{ fileProperties.lastModified }}</span>
          <span class="file-properties" v-if="fileProperties.width && fileProperties.height">宽度: {{ fileProperties.width
          }}px</span>
          <span class="file-properties" v-if="fileProperties.width && fileProperties.height">高度: {{
            fileProperties.height }}px</span>
        </div>
        <span v-else>请选择一个文件以查看其属性</span>
        <!-- 可以添加其他状态信息 -->
      </div>
    </footer>

    <!-- 隐藏的文件输入元素 -->
    <input type="file" webkitdirectory multiple ref="fileInput" @change="handleDirectorySelect" style="display: none;">
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  background-color: #f1f1f1;
  text-align: left;
  height: 50px;
}

.header-content {
  display: flex;
  align-items: center;
  height: 50px;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-sidebar {
  width: 25%;
  background-color: #f9f9f9;
  padding: 10px;
  overflow: auto;
}

.file-tree {
  color: black;
  text-align: left;
}

.file-tree ul {
  list-style-type: none;
  padding-left: 20px;
  background-color: #f9f9f9;
}

.right-sidebar {
  width: 25%;
  background-color: #ffffff;
  color: black;
  padding: 10px;
}

.center-content {
  flex: 1;
  background-color: #e0e0e0;
  padding: 0px;
  overflow-y: auto;
}

.footer {
  background-color: #f1f1f1;
  text-align: center;
  height: 50px;
}

.footer-content {
  height: 50px;
  text-align: left;
  display: flex;
  align-items: center;
}

.file-properties {
  margin-left: 20px;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>