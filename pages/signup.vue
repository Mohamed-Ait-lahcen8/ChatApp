<template>
    <div class="signup-container">
        <div class="signup-box">
            <h1 class="signup-title">What is up</h1>
            <p class="app-description">Create your account to start messaging</p>

            <button type="button" @click="google" class="google-button">
                <img src="https://www.google.com/favicon.ico" alt="Google" class="google-icon">
                Continue with Google
            </button>

            <div class="divider">
                <span>or</span>
            </div>

            <form @submit.prevent="signup" class="signup-form">
                <div class="form-group">
                    <input 
                        type="text" 
                        v-model="name" 
                        placeholder="Name" 
                        required
                        class="form-input"
                    >
                </div>
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
                <div class="form-group">
                    <input 
                        type="password" 
                        v-model="con_password" 
                        placeholder="Confirm Password" 
                        required
                        class="form-input"
                    >
                </div>
                <button type="submit" class="signup-btn">Sign Up</button>
            </form>

            <div v-if="err" class="error-message">
                {{ err }}
            </div>

            <div class="auth-footer">
                <p>Already have an account?</p>
                <NuxtLink to="/" class="auth-link">Sign in</NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup>
import { auth, provider, db } from '~/firebase';
import { ref } from 'vue';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { collection, query, where, getDocs, setDoc, doc} from 'firebase/firestore'; // <-- Add this import

const router = useRouter()
const name = ref("")
const email = ref("")
const password = ref("")
const con_password = ref("")
const err = ref(null)

const signup = async () => {
    if (password.value !== con_password.value) {
        err.value = "Passwords do not match"
        return
    }
    try {
        const userData = await createUserWithEmailAndPassword(auth, email.value, password.value)
        await updateProfile(userData.user, { displayName: name.value })
        // Add user to Firestore
        await setDoc(doc(db, "users", userData.user.uid), {
            name: name.value,
            uid: userData.user.uid
        })
        err.value = null
        router.push('/chats')
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
        router.push('/dashboard')
    } catch(error) {
        err.value = error.message
    }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  background: #ece5dd;
  display: flex;
  align-items: center;
  justify-content: center;
}
.signup-box {
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
.signup-title {
  color: #075e54;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 18px;
  letter-spacing: 1px;
}
.signup-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.signup-form input {
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
.signup-form input:focus {
  background: #e6ffed;
  box-shadow: 0 2px 8px rgba(7,94,84,0.10);
}
.signup-btn {
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
.signup-btn:hover {
  background: #128c7e;
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
  margin-top: 10px;
}
.google-button:hover {
  background: #e6ffed;
  border: 1px solid #25d366;
}
.google-icon {
  width: 20px;
  height: 20px;
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
.error-message {
  color: #d32f2f;
  background: #fff0f0;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 1rem;
  text-align: center;
}
</style>
