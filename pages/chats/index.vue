<template>
  <div class="start-texting-placeholder">
    <h2>Start texting</h2>
    <p>Select a chat from the sidebar or start a new conversation!</p>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'chat' })
</script>

<style scoped>
.start-texting-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #888;
  font-size: 1.2rem;
  background: #f0f2f5;
}
.start-texting-placeholder h2 {
  color: #075e54;
  margin-bottom: 12px;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 1px;
}
.start-texting-placeholder p {
  font-size: 1.1rem;
  color: #555;
}
</style>