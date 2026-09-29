import type { ExpiryCopy } from './app'
import type { Locale } from './locales'

/**
 * The words inside the product PREVIEWS — the dashboard picture, its panels,
 * the hero's floating cards and the scan card on the landing page, and the
 * blurred dashboard behind the auth pages.
 *
 * WHY THESE ARE NOW TRANSLATED. They were kept in English on the argument that
 * the app itself was English, so a Telugu picture would advertise a product
 * that did not exist. The app is translated now, and the argument reverses: a
 * Telugu visitor who signs in meets a Telugu dashboard, so an English picture
 * of it is the thing that misrepresents the product.
 *
 * WHAT STAYS AS IT IS: the demo store's own data — product names, the store's
 * name, counts. Those are values read from the store (components/landing/
 * snapshot.ts), exactly as the real app never translates them.
 *
 * THIS MODULE IS LIGHT ON PURPOSE. DashboardShot is rendered by a Client
 * Component (the auth backdrop), so it imports this file; nothing here may
 * pull in the full app dictionary. The nav labels, expiry words and category
 * names are filled in on the SERVER by ./productShotResolve, which reuses the
 * app's own translations rather than restating them.
 */

export type ProductShotCopy = {
  dashboard: string
  products: string
  stockLots: string
  lowStock: string
  expiringSoon: string
  lowStockAlerts: string
  lowStockSub: string
  reorder: string
  writeOff: string
  discount: string
  /** "{n}" lots. */
  expiredLots: string
  /** "{n}" units. */
  units: string
  unitsInStock: string
  /** The dashboard picture's screen-reader description. */
  productLabel: string
  heroItems: string
  heroLots: string
  productsTracked: string
  noteA: string
  noteB: string
  /** The handwritten aside, one entry per line. */
  annotation: readonly string[]
  photoAlt: string
  scanFound: string
  scanMatched: string
  ariaHome: string
  ariaPrimary: string
  ariaFeatures: string
  ariaWhat: string
  ariaOpenMenu: string
  ariaCloseMenu: string
  /** The caption under the auth pages' blurred dashboard. */
  backdropCaption: string
  /** The dashboard's date line, e.g. "Saturday, 19 September". */
  dateLine: string
  /** The snapshot date in captions, e.g. "23 Sep 2026". */
  snapshotLabel: string
  /** Filled on the server from the app dictionary; English falls back to the source labels. */
  nav?: Record<string, string>
  expiry?: ExpiryCopy
  categoryNames?: Record<string, string>
}

const en: ProductShotCopy = {
  dashboard: 'Dashboard',
  products: 'Products',
  stockLots: 'Stock lots',
  lowStock: 'Low Stock',
  expiringSoon: 'Expiring Soon',
  lowStockAlerts: 'Low Stock Alerts',
  lowStockSub: 'At or below each product’s own threshold',
  reorder: 'Reorder',
  writeOff: 'Write off',
  discount: 'Discount',
  expiredLots: '{n} lots already expired',
  units: '{n} units',
  unitsInStock: '{n} units in stock',
  productLabel:
    'The StockPulse dashboard for the demo store on {date}: {products} products, {lots} stock lots, {low} items at or below their reorder level, and {soon} lots expiring within {days} days with {expired} already expired.',
  heroItems: '{n} items',
  heroLots: '{n} lots',
  productsTracked: 'Products tracked',
  noteA: 'Less manual work',
  noteB: 'More time for customers',
  annotation: ['A simpler', 'way to run', 'your store'],
  photoAlt: 'A grocery store owner checking stock on a tablet in the aisle of her store',
  scanFound: 'Barcode found',
  scanMatched: 'Matched in this store’s products',
  ariaHome: 'StockPulse home',
  ariaPrimary: 'Primary',
  ariaFeatures: 'Features',
  ariaWhat: 'What StockPulse does',
  ariaOpenMenu: 'Open menu',
  ariaCloseMenu: 'Close menu',
  backdropCaption: 'The StockPulse dashboard · demo store',
  // English keeps the exact strings the page shipped with.
  dateLine: 'Saturday, 19 September',
  snapshotLabel: '23 Sep 2026',
}

const te: ProductShotCopy = {
  dashboard: 'డాష్‌బోర్డ్',
  products: 'వస్తువులు',
  stockLots: 'స్టాక్ లాట్‌లు',
  lowStock: 'తక్కువ నిల్వ',
  expiringSoon: 'త్వరలో గడువు',
  lowStockAlerts: 'తక్కువ నిల్వ హెచ్చరికలు',
  lowStockSub: 'ప్రతి వస్తువు సొంత పరిమితికి సమానంగా లేదా తక్కువగా',
  reorder: 'మళ్లీ ఆర్డర్',
  writeOff: 'రాసివేయి',
  discount: 'తగ్గింపు',
  expiredLots: 'ఇప్పటికే గడువు ముగిసిన {n} లాట్‌లు',
  units: '{n} యూనిట్లు',
  unitsInStock: 'నిల్వలో {n} యూనిట్లు',
  productLabel:
    '{date} నాటి డెమో దుకాణం StockPulse డాష్‌బోర్డ్: {products} వస్తువులు, {lots} స్టాక్ లాట్‌లు, మళ్లీ ఆర్డర్ స్థాయికి సమానంగా లేదా తక్కువగా {low} వస్తువులు, {days} రోజుల్లో గడువు ముగిసే {soon} లాట్‌లు, ఇప్పటికే గడువు ముగిసినవి {expired}.',
  heroItems: '{n} వస్తువులు',
  heroLots: '{n} లాట్‌లు',
  productsTracked: 'ట్రాక్ చేస్తున్న వస్తువులు',
  noteA: 'తక్కువ చేతి పని',
  noteB: 'కస్టమర్లకు ఎక్కువ సమయం',
  annotation: ['దుకాణం నడపడానికి', 'మరింత సులువైన', 'మార్గం'],
  photoAlt: 'తన దుకాణం వరుసలో ట్యాబ్లెట్‌పై నిల్వను చూస్తున్న కిరాణా దుకాణ యజమాని',
  scanFound: 'బార్‌కోడ్ దొరికింది',
  scanMatched: 'ఈ దుకాణం వస్తువులతో సరిపోలింది',
  ariaHome: 'StockPulse హోమ్',
  ariaPrimary: 'ప్రధాన మెనూ',
  ariaFeatures: 'ఫీచర్లు',
  ariaWhat: 'StockPulse ఏమి చేస్తుంది',
  ariaOpenMenu: 'మెనూ తెరవండి',
  ariaCloseMenu: 'మెనూ మూసివేయండి',
  backdropCaption: 'StockPulse డాష్‌బోర్డ్ · డెమో దుకాణం',
  dateLine: '',
  snapshotLabel: '',
}

const hi: ProductShotCopy = {
  dashboard: 'डैशबोर्ड',
  products: 'सामान',
  stockLots: 'स्टॉक लॉट',
  lowStock: 'कम स्टॉक',
  expiringSoon: 'जल्द एक्सपायरी',
  lowStockAlerts: 'कम स्टॉक अलर्ट',
  lowStockSub: 'हर सामान की अपनी सीमा पर या उससे कम',
  reorder: 'दोबारा ऑर्डर',
  writeOff: 'बट्टे खाते',
  discount: 'छूट',
  expiredLots: '{n} लॉट पहले ही एक्सपायर',
  units: '{n} यूनिट',
  unitsInStock: 'स्टॉक में {n} यूनिट',
  productLabel:
    '{date} को डेमो दुकान का StockPulse डैशबोर्ड: {products} सामान, {lots} स्टॉक लॉट, दोबारा ऑर्डर स्तर पर या उससे नीचे {low} सामान, और {days} दिनों में एक्सपायर होने वाले {soon} लॉट, जिनमें से {expired} पहले ही एक्सपायर हो चुके हैं।',
  heroItems: '{n} सामान',
  heroLots: '{n} लॉट',
  productsTracked: 'ट्रैक किए गए सामान',
  noteA: 'कम हाथ का काम',
  noteB: 'ग्राहकों के लिए ज़्यादा समय',
  annotation: ['दुकान चलाने का', 'ज़्यादा आसान', 'तरीक़ा'],
  photoAlt: 'अपनी दुकान की गली में टैबलेट पर स्टॉक देखती हुई किराना दुकान की मालकिन',
  scanFound: 'बारकोड मिल गया',
  scanMatched: 'इस दुकान के सामान से मेल खाता है',
  ariaHome: 'StockPulse होम',
  ariaPrimary: 'मुख्य मेन्यू',
  ariaFeatures: 'फ़ीचर',
  ariaWhat: 'StockPulse क्या करता है',
  ariaOpenMenu: 'मेन्यू खोलें',
  ariaCloseMenu: 'मेन्यू बंद करें',
  backdropCaption: 'StockPulse डैशबोर्ड · डेमो दुकान',
  dateLine: '',
  snapshotLabel: '',
}

/** Words only; dates and app vocabulary are completed by ./productShotResolve. */
export const PRODUCT_SHOT_STRINGS: Record<Locale, ProductShotCopy> = { en, te, hi }

/** The default for any caller that passes nothing — identical to what shipped. */
export const PRODUCT_SHOT_EN = en

/** "{n}"-style template fill. */
export function fillShot(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m))
}
