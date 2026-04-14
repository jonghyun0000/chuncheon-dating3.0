// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './router/index'
import './styles/global.css'

// 개발 환경에서 window 전역 노출 여부 검사
if (import.meta.env.DEV) {
  const warnGlobal = () => {
    const dangerous = ['supabase', 'sb', '_supabase', 'auth', 'session']
    dangerous.forEach(key => {
      if (key in window) {
        console.warn(
          `[보안 경고] window.${key} 가 노출되어 있습니다. ` +
          'supabaseClient.ts 를 확인하세요.'
        )
      }
    })
  }
  setTimeout(warnGlobal, 1000)
}

const root = document.getElementById('root')
if (!root) throw new Error('root 엘리먼트를 찾을 수 없습니다.')

createRoot(root).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)
