<template>
  <div class="sidebar-container">
    <div class="sidebar-header">
      <span class="sidebar-title">What is up</span>
    </div>
    <div class="sidebar-search">
      <input v-model="search" placeholder="Search chats by name..." class="chat-search" />
    </div>
    <div class="sidebar-chats">
      <div v-for="chat in filteredChats" :key="chat.chatId" class="chat-preview" :class="{'unread': chat.lastMsg && chat.lastMsg.senderId !== userId && !chat.lastMsg.seen}">
        <nuxt-link :to="`/chats/${chat.user.uid}`" class="chat-link">
          <div class="chat-user-row">
            <span class="user-icon">{{ chat.user.name.charAt(0).toUpperCase() }}</span>
            <div class="chat-user-info">
              <div class="chat-user-name">{{ chat.user.name }}</div>
              <div v-if="chat.lastMsg" class="chat-last-msg-row">
                <span class="msg-content">{{ chat.lastMsg.content }}</span>
              </div>
            </div>
            <div class="chat-meta-col">
              <span v-if="chat.lastMsg" class="msg-meta">
                {{ chat.lastMsg.createdAt?.seconds ? format(new Date(chat.lastMsg.createdAt.seconds * 1000), 'HH:mm') : '' }}
              </span>
              <span v-if="chat.lastMsg && chat.lastMsg.senderId === userId" class="msg-status">
                <svg v-if="!chat.lastMsg.seen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <g>
                    <polyline points="20 6 11 17 4 10" stroke="#8696a0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="20 6 11 17 4 10" stroke="#8696a0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(4,0)"/>
                  </g>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <g>
                    <polyline points="20 6 11 17 4 10" stroke="#4fc3f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="20 6 11 17 4 10" stroke="#4fc3f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(4,0)"/>
                  </g>
                </svg>
              </span>
              <span v-if="chat.lastMsg && chat.lastMsg.senderId !== userId && !chat.lastMsg.seen" class="unread-dot"></span>
            </div>
          </div>
        </nuxt-link>
      </div>
    </div>
    <div v-if="suggestions.length" class="sidebar-suggestions">
      <h2 class="suggestion-title">Suggestions</h2>
      <div v-for="user in suggestions" :key="user.uid" class="suggestion">
        <nuxt-link :to="`/chats/${user.uid}`" class="chat-link">
          <span class="user-icon">{{ user.name.charAt(0).toUpperCase() }}</span>
          <div class="chat-user-name">{{ user.name }}</div>
        </nuxt-link>
      </div>
    </div>
    <button type="button" @click="logout" class="logout-btn">Logout</button>
  </div>
</template>

<script setup>
import {db, auth} from '~/firebase'
import { signOut } from 'firebase/auth'
import { ref, onMounted, computed } from 'vue'
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { format } from 'date-fns'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { usePresence } from '~/composables/usePresence'
const {user, initAuth} = useAuth()
const userId = computed(() => user.value && user.value.uid)
const { setupPresence } = usePresence()
const search = ref('')
const chatPreviews = ref([])
const suggestions = ref([])
const router = useRouter()
const logout = () => {
  signOut(auth).then(()=>{
    router.push('/')
  })
}
const filteredChats = computed(() => {
  if (!search.value) return chatPreviews.value
  return chatPreviews.value.filter(chat =>
    chat.user.name.toLowerCase().includes(search.value.toLowerCase())
  )
})
const fetchChatsAndUsers = async () => {
  const usersRef = collection(db, 'users')
  const usersSnap = await getDocs(usersRef)
  const allUsers = []
  usersSnap.forEach(docu => {
    if (docu.data().uid !== userId.value) {
      allUsers.push(docu.data())
    }
  })
  const chatsList = []
  const suggestionsList = []
  for (const otherUser of allUsers) {
    const chatId = [userId.value, otherUser.uid].sort().join('_')
    const messagesRef = collection(db, 'chats', chatId, 'messages')
    const convo = await getDocs(messagesRef)
    if (!convo.empty) {
      const lastMsgQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1))
      const lastMsgSnap = await getDocs(lastMsgQuery)
      let lastMsg = null
      if (!lastMsgSnap.empty) {
        lastMsg = lastMsgSnap.docs[0].data()
      }
      chatsList.push({
        chatId,
        user: otherUser,
        lastMsg
      })
    } else {
      suggestionsList.push(otherUser)
    }
  }
  chatPreviews.value = chatsList.sort((a, b) => {
    const aTime = a.lastMsg?.createdAt?.seconds || 0
    const bTime = b.lastMsg?.createdAt?.seconds || 0
    return bTime - aTime
  })
  suggestions.value = suggestionsList.sort((a, b) => a.name.localeCompare(b.name))
}
onMounted(async() => {
  await initAuth()
  if(userId.value) {
    setupPresence(userId.value)
  }
  fetchChatsAndUsers()
})
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #ddd;
}
.sidebar-header {
  background: #fff;
  color: #075e54;
  padding: 22px 0 18px 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
  border-bottom: 1px solid #0b4f44;
  position: sticky;
  top: 0;
  z-index: 10;
}
.sidebar-title {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: 1px;
}
.sidebar-search {
  padding: 12px 16px 8px 16px;
  background: #f0f2f5;
  border-bottom: 1px solid #e5e5e5;
}
.chat-search {
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  outline: none;
  transition: box-shadow 0.2s;
}
.chat-search:focus {
  box-shadow: 0 2px 8px rgba(7,94,84,0.10);
}
.sidebar-chats {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
}
.chat-preview {
  padding: 14px 18px 10px 18px;
  border-bottom: 1px solid #e5e5e5;
  background: #f0f2f5;
  transition: background 0.18s;
}
.chat-preview:hover {
  background: #e6ffed;
  cursor: pointer;
}
.chat-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
.chat-user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  gap: 8px;
}
.chat-user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.chat-user-name {
  font-weight: 600;
  font-size: 1.08rem;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-last-msg-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.97rem;
  color: #555;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-meta-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 48px;
  gap: 2px;
}
.msg-meta {
  color: #888;
  font-size: 0.93rem;
  margin-left: 0;
}
.msg-status {
  color: #1976d2;
  font-size: 0.93rem;
  margin-left: 0;
  margin-top: 2px;
}
.unread {
  background: #e7fbe7;
}
.unread .chat-user-name,
.unread .msg-content {
  font-weight: bold;
  color: #222;
}
.unread-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #25d366;
  border-radius: 50%;
  margin-left: 8px;
  vertical-align: middle;
}
.sidebar-suggestions {
  background: #f0f2f5;
  padding: 10px 0 0 0;
  border-top: 1px solid #e5e5e5;
}
.suggestion-title {
  font-size: 1.08rem;
  color: #075e54;
  font-weight: 600;
  margin: 10px 0 6px 18px;
}
.suggestion {
  padding: 10px 18px;
  border-bottom: 1px dashed #ddd;
}
.logout-btn {
  margin: 18px 18px 12px 18px;
  padding: 10px 0;
  width: calc(100% - 36px);
  background: #075e54;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.logout-btn:hover {
  background: #128c7e;
}
.user-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: #d1f5d3;
  color: #075e54;
  font-weight: 700;
  font-size: 1.15rem;
  border-radius: 50%;
  margin-right: 12px;
  box-shadow: 0 1px 2px rgba(7,94,84,0.07);
  flex-shrink: 0;
}
.suggestion .chat-link {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style> 