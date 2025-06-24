<template>
  <div>
    <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  </div>
</template>

<script setup>
import {onMounted} from 'vue'
const {initAuth} = useAuth()
onMounted(
  () =>{
    initAuth()
  }
)
</script>
