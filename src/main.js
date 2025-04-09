import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import VueDraggableResizable from 'vue-draggable-resizable'
import "vue-draggable-resizable/style.css";

createApp(App).component("vue-draggable-resizable", VueDraggableResizable)
    .mount('#app')
