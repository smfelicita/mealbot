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
  const [showAndroid, setShowAndroid]       = useState(false)
  const [showIOS, setShowIOS]               = useState(false)
  const [showIOSNotSafari, setShowIOSNotSafari] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Уже установлено, не мобильный, или уже закрыли — не показывать
    if (isInStandaloneMode()) return
    if (!isMobile()) return
    if (isDismissedToday()) return

    if (isIOS()) {
      if (isIOSSafari()) {
        // Safari на iOS: показываем инструкцию через 3 секунды
        const t = setTimeout(() => setShowIOS(true), 3000)
        return () => clearTimeout(t)
      } else {
        // Chrome/Firefox/Яндекс на iOS: предлагаем открыть в Safari
        const t = setTimeout(() => setShowIOSNotSafari(true), 3000)
        return () => clearTimeout(t)
      }
    }

    // Android/Chrome: ловим браузерный промпт
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
      <div className="install-prompt">
        <div className="install-prompt__icon">📲</div>
        <div className="install-prompt__text">
          <strong>Установить MealBot</strong>
          <span>Добавьте на экран — работает как приложение</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={installAndroid}>Установить</button>
        <button className="install-prompt__close" onClick={dismiss} aria-label="Закрыть">✕</button>
      </div>
    )
  }

  if (showIOS) {
    return (
      <div className="install-prompt install-prompt--ios">
        <button className="install-prompt__close" onClick={dismiss} aria-label="Закрыть">✕</button>
        <div className="install-prompt__ios-content">
          <div className="install-prompt__icon">📲</div>
          <div className="install-prompt__text">
            <strong>Установить MealBot на iPhone</strong>
            <span>
              Нажмите <span className="install-prompt__share">⎙</span> внизу браузера,
              затем «На экран "Домой"»
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (showIOSNotSafari) {
    return (
      <div className="install-prompt install-prompt--ios">
        <button className="install-prompt__close" onClick={dismiss} aria-label="Закрыть">✕</button>
        <div className="install-prompt__ios-content">
          <div className="install-prompt__icon">🧭</div>
          <div className="install-prompt__text">
            <strong>Установить MealBot</strong>
            <span>Для установки на экран откройте сайт в <strong>Safari</strong></span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
