// i18n — мультиязычность MealBot
// Namespaces: common (общие кнопки), errors, dish, fridge, chat, auth, profile, groups, plan, home
// По мере портирования страниц добавляем ключи в соответствующий namespace.

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// ── Русские локали (стартовый набор — пополняем по мере портирования страниц) ──
import ruCommon  from './locales/ru/common.json'
import ruErrors  from './locales/ru/errors.json'
import ruDish    from './locales/ru/dish.json'
import ruFridge  from './locales/ru/fridge.json'
import ruChat    from './locales/ru/chat.json'
import ruAuth    from './locales/ru/auth.json'
import ruProfile from './locales/ru/profile.json'
import ruGroups  from './locales/ru/groups.json'
import ruPlan    from './locales/ru/plan.json'
import ruHome    from './locales/ru/home.json'

const resources = {
  ru: {
    common:  ruCommon,
    errors:  ruErrors,
    dish:    ruDish,
    fridge:  ruFridge,
    chat:    ruChat,
    auth:    ruAuth,
    profile: ruProfile,
    groups:  ruGroups,
    plan:    ruPlan,
    home:    ruHome,
  },
  // en — добавим отдельным проходом позже
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en'],
    defaultNS: 'common',
    ns: ['common', 'errors', 'dish', 'fridge', 'chat', 'auth', 'profile', 'groups', 'plan', 'home'],

    interpolation: { escapeValue: false }, // React уже эскейпит

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'mealbot_lang',
      caches: ['localStorage'],
    },

    returnEmptyString: false, // если ключ пуст — используем fallbackLng
  })

export default i18n
