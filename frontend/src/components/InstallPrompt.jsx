import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'pwa-install-dismissed'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

export default function InstallPrompt() {
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS]         = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Уже установлено или уже закрыли — не показывать
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    if (isIOS()) {
      // iOS: показываем инструкцию через 3 секунды
      const t = setTimeout(() => setShowIOS(true), 3000)
      return () => clearTimeout(t)
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
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setShowAndroid(false)
    setShowIOS(false)
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      sessionStorage.setItem(DISMISSED_KEY, '1')
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

  return null
}
