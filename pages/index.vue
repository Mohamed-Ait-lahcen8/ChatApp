<template>
  <div class="home-container">
    <div class="home-box">
      <h1 class="app-title">What is up</h1>
      <p class="app-description">Sign in to start messaging</p>
      
      <form @submit.prevent="login" class="auth-form">
        <div class="form-group">
          <input 
            type="email" 
            v-model="email" 
            placeholder="Email" 
            required
            class="form-input"
          >
        </div>
        <div class="form-group">
          <input 
            type="password" 
            v-model="password" 
            placeholder="Password" 
            required
            class="form-input"
          >
        </div>
        <button type="submit" class="auth-button">Sign In</button>
      </form>

      <div class="divider">
        <span>or</span>
      </div>

      <button type="button" @click="google" class="google-button">
        <img src="https://www.google.com/favicon.ico" alt="Google" class="google-icon">
        Continue with Google
      </button>

      <div v-if="err" class="error-message">
        {{ err }}
      </div>

      <div class="auth-footer">
        <p>Don't have an account?</p>
        <NuxtLink to="/signup" class="auth-link">Sign up</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { auth, provider, db } from '~/firebase'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
const router = useRouter()
const email = ref("")
const password = ref("")
const err = ref("")

const login = async () => {
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value)
        err.value = null
        router.push("/dashboard")
    } catch (error) {
        err.value = error.message
    }
}

const google = async() => {
    try {
        const result = await signInWithPopup(auth, provider)
        // Check if user already exists
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("uid", "==", result.user.uid))
        const querySnapshot = await getDocs(q)
        if (querySnapshot.empty) {
            // Add user if not exists
           await setDoc(doc(db, "users", result.user.uid), {
                name: result.user.displayName,
                uid: result.user.uid,
            })
        }
        err.value = null
        router.push('/chats')
    } catch(error) {
        err.value = error.message
    }
}

</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #ece5dd;
  display: flex;
  align-items: center;
  justify-content: center;
}
.home-box {
  background: #fff;
  padding: 36px 32px 28px 32px;
  border-radius: 18px;
  box-shadow: 0 2px 16px rgba(7,94,84,0.07);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.app-title {
  color: #075e54;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 18px;
  letter-spacing: 1px;
}
.app-description {
  color: #555;
  font-size: 1.1rem;
  margin-bottom: 18px;
}
.auth-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  width: 100%;
}
.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 20px;
  background: #f0f2f5;
  font-size: 1rem;
  color: #222;
  outline: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
}
.form-group input:focus {
  background: #e6ffed;
  box-shadow: 0 2px 8px rgba(7,94,84,0.10);
}
.auth-button {
  width: 100%;
  padding: 12px 0;
  background: #075e54;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.auth-button:hover {
  background: #128c7e;
}
.divider {
  text-align: center;
  margin: 18px 0 10px 0;
  color: #888;
  font-size: 1rem;
}
.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  background: #fff;
  color: #222;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, border 0.18s;
  width: 100%;
}
.google-button:hover {
  background: #e6ffed;
  border: 1px solid #25d366;
}
.google-icon {
  width: 20px;
  height: 20px;
}
.error-message {
  color: #d32f2f;
  background: #fff0f0;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 1rem;
  text-align: center;
}
.auth-footer {
  margin-top: 18px;
  text-align: center;
  color: #888;
}
.auth-link {
  color: #075e54;
  font-weight: 600;
  margin-left: 4px;
  text-decoration: none;
}
.auth-link:hover {
  text-decoration: underline;
}
</style>
