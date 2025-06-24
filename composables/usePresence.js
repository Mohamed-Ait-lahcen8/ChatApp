import { ref, onMounted, onUnmounted } from 'vue'
import { database } from '~/firebase'
import { ref as dbRef, onValue, onDisconnect, serverTimestamp, set } from 'firebase/database'

export const usePresence = () => {
    const isOnline = ref(false)
    const lastSeen = ref(null)
    let presenceRef = null
    let lastSeenInterval = null

    const setupPresence = (userId) => {
        if (!userId) return

        // Reference to user's presence in Realtime Database
        presenceRef = dbRef(database, `presence/${userId}`)
        
        // Set up onDisconnect handler
        onDisconnect(presenceRef).update({
            status: 'offline',
            lastSeen: serverTimestamp()
        })

        // Set initial online status
        set(presenceRef, {
            status: 'online',
            lastSeen: serverTimestamp()
        })

        // Update lastSeen every 30 seconds
        lastSeenInterval = setInterval(() => {
            set(presenceRef, {
                status: 'online',
                lastSeen: serverTimestamp()
            })
        }, 30000)

        // Listen for changes in user's presence
        onValue(presenceRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                isOnline.value = data.status === 'online'
                lastSeen.value = data.lastSeen
            }
        })
    }

    const cleanup = () => {
        if (lastSeenInterval) {
            clearInterval(lastSeenInterval)
        }
        if (presenceRef) {
            set(presenceRef, {
                status: 'offline',
                lastSeen: serverTimestamp()
            })
        }
    }

    onUnmounted(() => {
        cleanup()
    })

    return {
        isOnline,
        lastSeen,
        setupPresence,
        cleanup
    }
} 