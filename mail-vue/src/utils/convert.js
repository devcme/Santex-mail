import {useSettingStore} from "@/store/setting.js";
export function cvtR2Url(key) {

    if (!key) {
        return ''
    }

    if (key.startsWith('https://') || key.startsWith('http://')) {
        return key
    }

    return '/' + key
}

export function toOssDomain(domain) {

    if (!domain) {
        return ''
    }

    if (!domain.startsWith('http')) {
        return 'https://' + domain
    }

    if (domain.endsWith("/")) {
        domain = domain.slice(0, -1);
    }

    return domain
}
