import { defaultLocale, defaultMessages } from '@/locale'
import Vue, { Component } from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)
const i18n = new VueI18n({
	locale: defaultLocale,
	messages: {[defaultLocale]: defaultMessages},
	silentTranslationWarn: true,
})
const loadedLanguages: string[] = [defaultLocale]

function setI18nLanguage(lang: string) {
	i18n.locale = lang
	const html = document.querySelector('html')
	if (html) {
		html.setAttribute('lang', lang)
	}
	return lang
}

function loadLanguageAsync(vue: any, locale: string) {
	const currentRoute = (vue.$router as any).history.current.matched[0]
	if (currentRoute) {
		loadComponentLanguage(locale, currentRoute.components.default, currentRoute.instances.default)
	}
	if (!loadedLanguages.includes(locale)) {
		return import(/* webpackChunkName: "locale-[request]" */ `@/lang/locale/${locale}`).then(messages => {
			i18n.setLocaleMessage(locale, messages.translations)
			loadedLanguages.push(locale)
			vue.onLanguageLoaded()
			return setI18nLanguage(locale)
		})
	}
	return Promise.resolve(setI18nLanguage(locale))
}

function loadInstanceTranslations(locale: string, instance: any) {
	if (!instance.$options.name || !instance.$options.i18n) {
		return
	}
	let name = instance.$options.name.toLowerCase()
	if (name.indexOf("bank-") === 0) { name = "bank" }

	if (!loadedLanguages.includes(locale)) {
		return import(/* webpackChunkName: "locale-[request]" */ `@/lang/locale/${locale}`).then((module: any) => {
			if (!(name in module.translations)) {
				return
			}
			const instanceI18n = (instance as any)._i18n
			instanceI18n.setLocaleMessage(locale, module.translations[name])
		})
	} else {
		if (!(name in i18n.messages[locale])) {
			return
		}
		const instanceI18n = (instance as any)._i18n
		instanceI18n.setLocaleMessage(locale, i18n.messages[locale][name])
	}
}

function loadComponentLanguage(locale: string, component: any, instance: Component | undefined) {
	if (!component.options) { return }
	let name = (component as any).options.name.toLowerCase()
	if (name === "bankbuy" || name === "bankvalidate") { name = "bank" }
	// console.log("Load translation of:", name)
	if (component === undefined) {
		return
	}
	if (instance && (instance as any).$i18n && (instance as any).$i18n.messages[locale]) {
		// console.log("i18n already loaded on instance!")
		return 
	}
	if (component && component.options.i18n && component.options.i18n.messages && component.options.i18n.messages[locale]) {
		// console.log("i18n already set on component!")
		return 
	}
	return import(/* webpackChunkName: "locale-[request]" */ `@/lang/locale/${locale}`).then((module: any) => {
		if (!(name in module.translations)) {
			// console.log("No messages for '" + name + "' in '" + locale + "'!")
			return
		}
		if (instance && (instance as any).$i18n) {
			const instanceI18n = (instance as any).$i18n
			instanceI18n.setLocaleMessage(locale, module.translations[name])
			// console.log("installed '" + locale + "' messages on instance '" + name + "'")
		} else {
			(component as any).options.i18n = {messages: {[locale]: module.translations[name]}}
			// console.log("set '" + locale + "' messages on component '" + name + "'")
		}
	})
}

export { i18n, loadComponentLanguage, loadLanguageAsync, loadInstanceTranslations }
