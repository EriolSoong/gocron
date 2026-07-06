import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const uid = ref(0)
  const username = ref('')
  const isAdmin = ref(false)
  const isLoggedIn = computed(() => !!token.value)

  function setUser(user) {
    token.value = user.token; uid.value = user.uid
    username.value = user.username; isAdmin.value = user.is_admin
    localStorage.setItem('gocron_user', JSON.stringify(user))
  }

  function loadFromStorage() {
    const saved = localStorage.getItem('gocron_user')
    if (saved) {
      try { const u = JSON.parse(saved); setUser(u) } catch(e) {}
    }
  }

  function logout() {
    token.value = ''; uid.value = 0; username.value = ''; isAdmin.value = false
    localStorage.removeItem('gocron_user')
  }

  loadFromStorage()
  return { token, uid, username, isAdmin, isLoggedIn, setUser, logout }
})
