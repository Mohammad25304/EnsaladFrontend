/* eslint-disable prettier/prettier */
import { Locale, Localized } from "./api";

/* eslint-disable prettier/prettier */
export function pickLocale(value: Localized, locale: Locale = "en"): string {
    return value[locale] ?? value["en"] ?? "";
}