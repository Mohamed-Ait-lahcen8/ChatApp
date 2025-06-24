<template>
    <div>
        <div class="main">
            <div class="mainHeader">
                <div class="header-row">
                  <span class="user-icon">{{ otherUserName.charAt(0).toUpperCase() }}</span>
                  <div class="header-info">
                    <p class="header-name">{{ otherUserName }}</p>
                    <p class="status">{{ statusString }}</p>
                    <p v-if="otherTyping" class="typing-indicator">{{ otherUserName }} is typing...</p>
                  </div>
                </div>
            </div>
            <div class="mainMessages" ref="mainMessagesRef">
                <div v-for="(message, index) in messages" :key="index" :class="['message', message.senderId === userId ? 'mine' : 'not_mine']">
                    <div class="msg-content-container">
                      <p class="msg-content">{{ message.content }}</p>
                      <div class="msg-meta-row">
                        <span class="msg-time">{{ formatMessageTime(message.createdAt?.seconds ? new Date(message.createdAt.seconds * 1000) : null) }}</span>
                        <span v-if="message.senderId === userId" class="msg-status-icon">
                          <svg v-if="!message.seen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
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
                      </div>
                    </div>
                </div>
            </div>
            <div class="mainInput">
                <form @submit.prevent="sendMessage">
                    <input type="text" v-model="message" @input="handleTyping"  placeholder="Type a messsage" required>
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import {db} from '~/firebase'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, getDoc, updateDoc} from 'firebase/firestore'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { database } from '~/firebase'
import { ref as dbRef, onValue, set, get } from 'firebase/database'
import { formatDistanceToNow, format, isToday, isThisWeek } from 'date-fns'
import { ref as vueRef, nextTick } from 'vue'
const {user, initAuth} = useAuth()
const userId = computed(() => user.value && user.value.uid)
const route = useRoute()
const otherUserId = route.params.id
const message = ref("")
const messages = ref([])
const { setupPresence } = usePresence()
const chatId = computed(() => {
  if (!userId.value || !otherUserId) return ''
  return [userId.value, otherUserId].sort().join('_')
})

const isOnline = ref(null)
const lastSeen = ref(null)

const statusRef = dbRef(database, `/presence/${otherUserId}`)
onValue(statusRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
        isOnline.value = data.status
        lastSeen.value = data.lastSeen
    }
})

let statusInterval = null

const otherUserName = ref('')
const fetchOtherUser = async() => {
    const docref = doc(db, 'users', otherUserId)
    const userSnap = await getDoc(docref)
    if (userSnap.exists()) {
        otherUserName.value = userSnap.data().name
    } else {
        otherUserName.value = 'Unknown User'
    }
}

let unsubscribe = null

const sendMessage = async() => {
    if (!userId.value || !chatId.value || !message.value.trim()) return;
    try {
        const docref = collection(db, 'chats', chatId.value, 'messages')
        await addDoc(docref, {
            senderId: userId.value,
            content: message.value,
            seen: false,
            createdAt: serverTimestamp()
        })
        message.value = ""
    } catch (e) {
        alert('Failed to send message:', e)
    }
}

const fetchMessages = () => {
    if (!chatId.value) return;
    if (unsubscribe) unsubscribe();
    const docref = collection(db, 'chats', chatId.value, 'messages')
    const q = query(docref, orderBy('createdAt', 'asc'))
    unsubscribe = onSnapshot(q, (querysnapshot) => {
        messages.value = []
        querysnapshot.forEach((message) => {
            messages.value.push({
                id: message.id,
                ...message.data()
            })
        })
    })
}

watch(userId, (newId) => {
  if (newId) {
    setupPresence(newId)
  }
}, {immediate: true})

const now = ref(Date.now())
let nowInterval = null

const mainMessagesRef = vueRef(null)

function scrollToBottom() {
  nextTick(() => {
    const el = mainMessagesRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

watch(messages, () => {
  scrollToBottom()
})

onMounted(async() => {
    await initAuth()
    if(userId.value) {
        setupPresence(userId.value)
    }
    fetchMessages()
    fetchOtherUser()
    nowInterval = setInterval(() => {
      now.value = Date.now()
    }, 60000)
    scrollToBottom()
})

watch(chatId, () => {
    fetchMessages()
})

watch(messages, () =>{
    messages.value.forEach(async (msg) => {
        if (msg.senderId !== userId.value && !msg.seen) {
            const msgRef = doc(db, 'chats', chatId.value, 'messages', msg.id)
            await updateDoc(msgRef, { seen: true })
                
        }
    })
})

const statusString = computed(() => {
    now.value
  if (isOnline.value === true) return 'online'
  if (lastSeen.value) {
    return formatDistanceToNow(new Date(lastSeen.value), { addSuffix: true })
  }
  return 'offline'
})

const typingStatusRef = dbRef(database, `typingStatus/${chatId.value}/${userId.value}`)
const otherTyping = ref(false)
const otherTypingRef = dbRef(database, `typingStatus/${chatId.value}/${otherUserId}`)

const handleTyping = () => {
  set(typingStatusRef, true)

  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    set(typingStatusRef, false)
  }, 3000)
}
let typingTimeout = null


onValue(otherTypingRef, (snapshot) => {
            otherTyping.value = snapshot.val() === true
        })

onUnmounted(() => {
    if (unsubscribe) unsubscribe()
    if (statusInterval) clearInterval(statusInterval)
    if (nowInterval) clearInterval(nowInterval)
})

function formatMessageTime(date) {
  if (!date) return ''
  if (isToday(date)) return format(date, 'HH:mm')
  if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEE')
  return format(date, 'dd/MM')
}
</script>

<style scoped>
html, body, #__nuxt, .main {
  height: 100%;
  margin: 0;
  padding: 0;
}
body {
  background: #fff;
}
.main {
  min-height: 100vh;
  height: 100vh;
  max-width: 100vw;
  margin: 0;
  border: none;
  border-radius: 0;
  background: #ece5dd;
  display: flex;
  flex-direction: column;
  box-shadow: none;
}
.mainHeader {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 18px 24px;
  border-bottom: 1px solid #d1d7db;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: left;
  background: #f7f7f7;
  color: #222;
  letter-spacing: 0.5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.header-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: #d1f5d3;
  color: #075e54;
  font-weight: 700;
  font-size: 1.25rem;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(7,94,84,0.07);
  flex-shrink: 0;
}
.header-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.header-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: #222;
  margin: 0;
  padding: 0;
}
.status {
  font-size: 0.97rem;
  color: #888;
  margin-top: 2px;
}
.typing-indicator {
  font-size: 0.97rem;
  color: #4fc3f7;
  margin-top: 2px;
  font-style: italic;
  animation: blink 1.2s linear infinite;
}
.mainMessages {
  flex: 1;
  padding: 24px 16px 24px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ece5dd;
}
.message {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 1.08rem;
  word-break: break-word;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-end;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  position: relative;
}
.msg-content-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.msg-content {
  margin: 0;
  padding: 0 0 2px 0;
}
.msg-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.93rem;
  color: #8696a0;
  margin-top: 2px;
}
.msg-time {
  font-size: 0.93rem;
  color: #8696a0;
}
.msg-status-icon {
  display: flex;
  align-items: center;
  margin-left: 2px;
}
.mine {
  align-self: flex-end;
  background: #d9fdd3;
  color: #222;
  border-radius: 8px 8px 2px 8px;
  box-shadow: 0 1px 1.5px rgba(0,0,0,0.10);
}
.not_mine {
  align-self: flex-start;
  background: #fff;
  color: #222;
  border-radius: 8px 8px 8px 2px;
  border: 1px solid #e5e5e5;
  box-shadow: 0 1px 1.5px rgba(0,0,0,0.07);
}
.mainInput {
  padding: 18px 16px;
  border-top: 1px solid #d1d7db;
  background: #f7f7f7;
}
.mainInput form {
  display: flex;
  gap: 8px;
}
.mainInput input[type="text"] {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 24px;
  font-size: 1.05rem;
  background: #fff;
  color: #222;
  outline: none;
  transition: background 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.mainInput input[type="text"]:focus {
  background: #f0f0f0;
}
.mainInput button {
  padding: 10px 22px;
  background: #075e54;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 1.05rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.mainInput button:hover {
  background: #128c7e;
}
::-webkit-scrollbar {
  width: 8px;
  background: #ece5dd;
}
::-webkit-scrollbar-thumb {
  background: #d1d7db;
  border-radius: 4px;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>