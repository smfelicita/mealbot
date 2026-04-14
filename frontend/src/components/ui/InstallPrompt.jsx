import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'pwa-install-dismissed-date'

function isDismissedToday() {
  const val = localStorage.getItem(DISMISSED_KEY)
  if (!val) return false
  return val === new Date().toISOString().slice(0, 10)
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isIOSSafari() {
  return isIOS() && /safari/i.test(navigator.userAgent) && !/crios|fxios|opios|mercury|yabrowser/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
    || window.matchMedia('(pointer: coarse)').matches
}

export default function InstallPrompt() {
  const [showAndroid, setShowAndroid]           = useState(false)
  const [showIOS, setShowIOS]                   = useState(false)
  const [showIOSNotSafari, setShowIOSNotSafari] = useState(false)
  const [deferredPrompt, setDeferredPrompt]     = useState(null)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (!isMobile()) return
    if (isDismissedToday()) return

    if (isIOS()) {
      if (isIOSSafari()) {
        const t = setTimeout(() => setShowIOS(true), 3000)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setShowIOSNotSafari(true), 3000)
        return () => clearTimeout(t)
      }
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString().slice(0, 10))
    setShowAndroid(false)
    setShowIOS(false)
    setShowIOSNotSafari(false)
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, new Date().toISOString().slice(0, 10))
    }
    setShowAndroid(false)
    setDeferredPrompt(null)
  }

  if (showAndroid) {
    return (
      <div className="mx-5 mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 bg-white shadow-card">
        <span className="text-[22px] shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text">Установить приложение</p>
          <p className="text-xs truncate text-text-3">Работает без браузера</p>
        </div>
        <button
          onClick={installAndroid}
          className="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold text-white bg-accent">
          Установить
        </button>
        <button onClick={dismiss} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-[16px] text-text-3">
          ✕
        </button>
      </div>
    )
  }

  if (showIOS) {
    return (
      <div className="mx-5 mb-1 flex items-start gap-3 rounded-2xl px-4 py-3 bg-white shadow-card">
        <span className="text-[22px] shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text">Установить на iPhone</p>
          <p className="text-xs text-text-3">
            Нажмите ⎙ внизу браузера → «На экран "Домой"»
          </p>
        </div>
        <button onClick={dismiss} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-[16px] text-text-3">
          ✕
        </button>
      </div>
    )
  }

  if (showIOSNotSafari) {
    return (
      <div className="mx-5 mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 bg-white shadow-card">
        <span className="text-[22px] shrink-0">🧭</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text">Установить приложение</p>
          <p className="text-xs text-text-3">Откройте сайт в Safari для установки</p>
        </div>
        <button onClick={dismiss} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-[16px] text-text-3">
          ✕
        </button>
      </div>
    )
  }

  return null
}
