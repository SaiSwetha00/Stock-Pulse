import type { Locale } from './locales'

/**
 * THE AUTH PAGES' COPY — /login, /signup, /forgot-password, /reset-password.
 *
 * WHAT IS NOT HERE. The demo credentials printed on the sign-in page are
 * literal values somebody types; translating them would stop them working.
 * "StockPulse" is a product name and stays in Latin script in all three
 * languages.
 *
 * TERMINOLOGY. Sign-in vocabulary uses the register a shopkeeper already meets
 * on every Indian app: సైన్ ఇన్ / साइन इन, పాస్‌వర్డ్ / पासवर्ड, ఇమెయిల్ /
 * ईमेल. Translating those into literary equivalents would be technically
 * defensible and practically unreadable.
 *
 * TRANSLATION NOTE: as with ./landing, the Telugu and Hindi here are written
 * for a shopkeeper rather than transliterated, and have NOT been reviewed by a
 * native speaker. Worth doing before this reaches customers.
 */

export interface AuthCopy {
  /** The shared shell every auth page renders inside (components/auth/AuthUI). */
  shell: {
    backToSite: string
    heroTitle: string
    heroBody: string
    chipInventory: string
    chipInventoryValue: string
    chipExpiry: string
    chipExpiryValue: string
    chipOffline: string
    chipOfflineValue: string
    signupProgress: string
    showPassword: string
    hidePassword: string
    pleaseWait: string
    switchToLight: string
    switchToDark: string
  }
  login: {
    title: string
    subtitle: string
    demoTitle: string
    demoBody: string
    demoCta: string
    demoLoading: string
    email: string
    password: string
    forgot: string
    submit: string
    submitLoading: string
    signupPrompt: string
    signupCta: string
  }
  signup: {
    steps: { title: string; blurb: string }[]
    created: string
    redirecting: string
    storeName: string
    fullName: string
    fullNamePlaceholder: string
    workEmail: string
    password: string
    passwordHint: string
    back: string
    continueCta: string
    createCta: string
    createLoading: string
    loginPrompt: string
    loginCta: string
  }
  forgot: {
    title: string
    sent: string
    prompt: string
    email: string
    submit: string
    submitLoading: string
    backToLogin: string
  }
  reset: {
    /** "{n}" is the minimum length. */
    tooShort: string
    lengthHint: string
    mismatch: string
    updatedTitle: string
    goToLogin: string
    expiredTitle: string
    expiredBody: string
    requestNew: string
    title: string
    subtitle: string
    newPassword: string
    confirmPassword: string
    submit: string
    submitLoading: string
  }
}

const en: AuthCopy = {
  shell: {
    backToSite: 'Back to site',
    heroTitle: 'Sign in to your store.',
    heroBody:
      'Stock, sales, suppliers and every expiry date — the dashboard behind this form is the one you land on.',
    chipInventory: 'Inventory',
    chipInventoryValue: 'products',
    chipExpiry: 'Expiry alerts',
    chipExpiryValue: 'lots expiring',
    chipOffline: 'Offline till',
    chipOfflineValue: 'Sales queue on the device',
    signupProgress: 'Sign-up progress',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    pleaseWait: 'Please wait…',
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to your store dashboard.',
    demoTitle: 'Reviewing this project?',
    demoBody: 'Sign in to a demo store with 135 products and 30 days of sales already in it.',
    demoCta: 'Explore the demo store',
    demoLoading: 'Signing in…',
    email: 'Store Email',
    password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Log In',
    submitLoading: 'Signing in…',
    signupPrompt: 'New store owner?',
    signupCta: 'Set up your store',
  },
  signup: {
    steps: [
      { title: 'Name your store', blurb: 'What should we call your workspace?' },
      { title: 'About you', blurb: 'Tell us who owns this store.' },
      { title: 'Secure your account', blurb: 'Set your sign-in credentials.' },
    ],
    created: 'Store created',
    redirecting: 'Taking you to your dashboard…',
    storeName: 'Store Name',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Jane Doe',
    workEmail: 'Work Email',
    password: 'Password',
    passwordHint: 'Must be at least 8 characters long.',
    back: 'Back',
    continueCta: 'Continue',
    createCta: 'Create Account',
    createLoading: 'Creating…',
    loginPrompt: 'Already have an account?',
    loginCta: 'Sign in',
  },
  forgot: {
    title: 'Reset Password',
    sent: 'Check your inbox for a reset link.',
    prompt: "Enter your work email and we'll send you a reset link.",
    email: 'Store Email',
    submit: 'Send Reset Link',
    submitLoading: 'Sending…',
    backToLogin: 'Back to login',
  },
  reset: {
    tooShort: 'Password must be at least {n} characters long.',
    lengthHint: 'Must be at least {n} characters long.',
    mismatch: 'Both passwords must match.',
    updatedTitle: 'Password updated',
    goToLogin: 'Go to login now',
    expiredTitle: 'This link has expired',
    expiredBody:
      'Password reset links expire and can only be used once. Request a new one and it will work from any device.',
    requestNew: 'Request a new link',
    title: 'Set New Password',
    subtitle: 'Choose a new password for your account.',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    submit: 'Update Password',
    submitLoading: 'Updating…',
  },
}

const te: AuthCopy = {
  shell: {
    backToSite: 'సైట్కు తిరిగి',
    heroTitle: 'మీ దుకాణంలోకి సైన్ ఇన్ చేయండి.',
    heroBody:
      'నిల్వ, అమ్మకాలు, సరఫరాదారులు, ప్రతి గడువు తేదీ — ఈ ఫారం వెనుక ఉన్న డాష్‌బోర్డ్ మీరు చేరుకునేదే.',
    chipInventory: 'నిల్వ',
    chipInventoryValue: 'వస్తువులు',
    chipExpiry: 'గడువు హెచ్చరికలు',
    chipExpiryValue: 'లాట్ల గడువు దగ్గరలో',
    chipOffline: 'ఆఫ్‌లైన్ బిల్లింగ్',
    chipOfflineValue: 'అమ్మకాలు ఫోన్‌లోనే నిల్వ ఉంటాయి',
    signupProgress: 'సైన్ అప్ పురోగతి',
    showPassword: 'పాస్‌వర్డ్ చూపు',
    hidePassword: 'పాస్‌వర్డ్ దాచు',
    pleaseWait: 'కొంచెం ఆగండి…',
    switchToLight: 'లైట్ థీమ్‌కు మార్చండి',
    switchToDark: 'డార్క్ థీమ్‌కు మార్చండి',
  },
  login: {
    title: 'మళ్లీ స్వాగతం',
    subtitle: 'మీ దుకాణం డాష్‌బోర్డ్‌కు సైన్ ఇన్ చేయండి.',
    demoTitle: 'ఈ ప్రాజెక్ట్‌ను పరిశీలిస్తున్నారా?',
    demoBody: 'ఇప్పటికే 135 వస్తువులు, 30 రోజుల అమ్మకాలు ఉన్న డెమో దుకాణంలోకి సైన్ ఇన్ చేయండి.',
    demoCta: 'డెమో దుకాణాన్ని చూడండి',
    demoLoading: 'సైన్ ఇన్ అవుతోంది…',
    email: 'దుకాణం ఇమెయిల్',
    password: 'పాస్‌వర్డ్',
    forgot: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    submit: 'లాగిన్',
    submitLoading: 'సైన్ ఇన్ అవుతోంది…',
    signupPrompt: 'కొత్త దుకాణ యజమానా?',
    signupCta: 'మీ దుకాణాన్ని ఏర్పాటు చేయండి',
  },
  signup: {
    steps: [
      { title: 'మీ దుకాణానికి పేరు పెట్టండి', blurb: 'మీ వర్క్‌స్పేస్‌ను ఏమని పిలవాలి?' },
      { title: 'మీ గురించి', blurb: 'ఈ దుకాణం యజమాని ఎవరో చెప్పండి.' },
      { title: 'మీ ఖాతాను భద్రపరచండి', blurb: 'మీ సైన్ ఇన్ వివరాలను సెట్ చేయండి.' },
    ],
    created: 'దుకాణం సిద్ధమైంది',
    redirecting: 'మిమ్మల్ని డాష్‌బోర్డ్‌కు తీసుకెళ్తున్నాం…',
    storeName: 'దుకాణం పేరు',
    fullName: 'పూర్తి పేరు',
    fullNamePlaceholder: 'మీ పేరు',
    workEmail: 'పని ఇమెయిల్',
    password: 'పాస్‌వర్డ్',
    passwordHint: 'కనీసం 8 అక్షరాలు ఉండాలి.',
    back: 'వెనక్కి',
    continueCta: 'కొనసాగించండి',
    createCta: 'ఖాతా సృష్టించండి',
    createLoading: 'సృష్టిస్తోంది…',
    loginPrompt: 'ఇప్పటికే ఖాతా ఉందా?',
    loginCta: 'సైన్ ఇన్',
  },
  forgot: {
    title: 'పాస్‌వర్డ్ రీసెట్',
    sent: 'రీసెట్ లింక్ కోసం మీ ఇన్‌బాక్స్ చూడండి.',
    prompt: 'మీ పని ఇమెయిల్ ఇవ్వండి, రీసెట్ లింక్ పంపుతాం.',
    email: 'దుకాణం ఇమెయిల్',
    submit: 'రీసెట్ లింక్ పంపండి',
    submitLoading: 'పంపుతోంది…',
    backToLogin: 'లాగిన్‌కు తిరిగి',
  },
  reset: {
    tooShort: 'పాస్‌వర్డ్ కనీసం {n} అక్షరాలు ఉండాలి.',
    lengthHint: 'కనీసం {n} అక్షరాలు ఉండాలి.',
    mismatch: 'రెండు పాస్‌వర్డ్‌లూ ఒకేలా ఉండాలి.',
    updatedTitle: 'పాస్‌వర్డ్ మారింది',
    goToLogin: 'ఇప్పుడే లాగిన్‌కు వెళ్లండి',
    expiredTitle: 'ఈ లింక్ గడువు ముగిసింది',
    expiredBody:
      'పాస్‌వర్డ్ రీసెట్ లింక్‌లకు గడువు ఉంటుంది, ఒకసారి మాత్రమే వాడగలరు. కొత్తది అడగండి, అది ఏ పరికరంలోనైనా పనిచేస్తుంది.',
    requestNew: 'కొత్త లింక్ అడగండి',
    title: 'కొత్త పాస్‌వర్డ్ పెట్టండి',
    subtitle: 'మీ ఖాతాకు కొత్త పాస్‌వర్డ్ ఎంచుకోండి.',
    newPassword: 'కొత్త పాస్‌వర్డ్',
    confirmPassword: 'పాస్‌వర్డ్ నిర్ధారించండి',
    submit: 'పాస్‌వర్డ్ మార్చండి',
    submitLoading: 'మారుస్తోంది…',
  },
}

const hi: AuthCopy = {
  shell: {
    backToSite: 'साइट पर वापस',
    heroTitle: 'अपनी दुकान में साइन इन कीजिए।',
    heroBody:
      'स्टॉक, बिक्री, सप्लायर और हर एक्सपायरी तारीख़ — इस फ़ॉर्म के पीछे वही डैशबोर्ड है जहाँ आप पहुँचेंगे।',
    chipInventory: 'स्टॉक',
    chipInventoryValue: 'सामान',
    chipExpiry: 'एक्सपायरी अलर्ट',
    chipExpiryValue: 'लॉट एक्सपायर हो रहे',
    chipOffline: 'ऑफ़लाइन बिलिंग',
    chipOfflineValue: 'बिक्री फ़ोन में रुकी रहती है',
    signupProgress: 'साइन-अप प्रगति',
    showPassword: 'पासवर्ड दिखाएँ',
    hidePassword: 'पासवर्ड छिपाएँ',
    pleaseWait: 'कृपया प्रतीक्षा कीजिए…',
    switchToLight: 'लाइट थीम पर जाएँ',
    switchToDark: 'डार्क थीम पर जाएँ',
  },
  login: {
    title: 'फिर से स्वागत है',
    subtitle: 'अपनी दुकान के डैशबोर्ड में साइन इन कीजिए।',
    demoTitle: 'इस प्रोजेक्ट को देख रहे हैं?',
    demoBody: '135 सामान और 30 दिन की बिक्री वाली डेमो दुकान में साइन इन कीजिए।',
    demoCta: 'डेमो दुकान देखें',
    demoLoading: 'साइन इन हो रहा है…',
    email: 'दुकान का ईमेल',
    password: 'पासवर्ड',
    forgot: 'पासवर्ड भूल गए?',
    submit: 'लॉग इन',
    submitLoading: 'साइन इन हो रहा है…',
    signupPrompt: 'नए दुकान मालिक हैं?',
    signupCta: 'अपनी दुकान सेट कीजिए',
  },
  signup: {
    steps: [
      { title: 'अपनी दुकान का नाम रखिए', blurb: 'आपके वर्कस्पेस को क्या कहें?' },
      { title: 'आपके बारे में', blurb: 'बताइए यह दुकान किसकी है।' },
      { title: 'अपना खाता सुरक्षित कीजिए', blurb: 'अपने साइन-इन विवरण तय कीजिए।' },
    ],
    created: 'दुकान बन गई',
    redirecting: 'आपको डैशबोर्ड पर ले जा रहे हैं…',
    storeName: 'दुकान का नाम',
    fullName: 'पूरा नाम',
    fullNamePlaceholder: 'आपका नाम',
    workEmail: 'काम का ईमेल',
    password: 'पासवर्ड',
    passwordHint: 'कम से कम 8 अक्षर होने चाहिए।',
    back: 'पीछे',
    continueCta: 'आगे बढ़ें',
    createCta: 'खाता बनाइए',
    createLoading: 'बनाया जा रहा है…',
    loginPrompt: 'पहले से खाता है?',
    loginCta: 'साइन इन',
  },
  forgot: {
    title: 'पासवर्ड रीसेट',
    sent: 'रीसेट लिंक के लिए अपना इनबॉक्स देखिए।',
    prompt: 'अपना काम का ईमेल दीजिए, हम रीसेट लिंक भेज देंगे।',
    email: 'दुकान का ईमेल',
    submit: 'रीसेट लिंक भेजें',
    submitLoading: 'भेजा जा रहा है…',
    backToLogin: 'लॉग इन पर वापस',
  },
  reset: {
    tooShort: 'पासवर्ड कम से कम {n} अक्षरों का होना चाहिए।',
    lengthHint: 'कम से कम {n} अक्षर होने चाहिए।',
    mismatch: 'दोनों पासवर्ड एक जैसे होने चाहिए।',
    updatedTitle: 'पासवर्ड बदल गया',
    goToLogin: 'अभी लॉग इन पर जाइए',
    expiredTitle: 'इस लिंक की अवधि ख़त्म हो गई',
    expiredBody:
      'पासवर्ड रीसेट लिंक की एक अवधि होती है और वह सिर्फ़ एक बार चलता है। नया माँगिए, वह किसी भी डिवाइस पर काम करेगा।',
    requestNew: 'नया लिंक माँगें',
    title: 'नया पासवर्ड बनाइए',
    subtitle: 'अपने खाते के लिए नया पासवर्ड चुनिए।',
    newPassword: 'नया पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि',
    submit: 'पासवर्ड बदलें',
    submitLoading: 'बदला जा रहा है…',
  },
}

export const AUTH_COPY: Record<Locale, AuthCopy> = { en, te, hi }

export function authCopy(locale: Locale): AuthCopy {
  return AUTH_COPY[locale]
}
