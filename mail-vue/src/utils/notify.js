import { useUiStore } from '@/store/ui.js'

export function notifySupported() {
    return 'Notification' in window
}

export function notifyPermission() {
    if (!notifySupported()) return 'denied'
    return Notification.permission
}

export async function requestNotifyPermission() {
    if (!notifySupported()) return 'denied'
    if (Notification.permission === 'default') {
        return await Notification.requestPermission()
    }
    return Notification.permission
}

export function notifyNewEmail(email) {
    if (!notifySupported() || Notification.permission !== 'granted') return

    const uiStore = useUiStore()
    if (uiStore.notifyOnlyHidden && !document.hidden) return

    const title = email.name || email.sendEmail || 'New Email'
    const body = email.subject || ''

    let notification = null
    try {
        notification = new Notification(title, {
            body,
            icon: '/public/mail.png',
            tag: 'email-' + email.emailId,
            badge: '/public/mail.png'
        })

        notification.onclick = () => {
            window.focus()
            if (notification) {
                try { notification.close() } catch (e) {}
            }
        }

        setTimeout(() => {
            if (notification) {
                try { notification.close() } catch (e) {}
            }
        }, 10000)
    } catch (e) {
        console.error('Notification creation failed:', e)
    }
}

export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true
}
