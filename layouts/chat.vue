<template>
  <div class="chat-layout">
    <ChatSidebar class="sidebar" />
    <div class="main-content">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
import ChatSidebar from '~/components/ChatSidebar.vue'
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #f7f7f7;
}
.sidebar {
  width: 340px;
  min-width: 260px;
  max-width: 400px;
  background: #fff;
  border-right: 1px solid #eee;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 2px 0 8px rgba(0,0,0,0.03);
  z-index: 2;
}
.main-content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100vw !important;
    min-width: 0 !important;
    max-width: 100vw !important;
    height: 100vh;
  }
  .main-content {
    display: none !important;
  }
}
</style> 