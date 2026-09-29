import type { Locale } from './locales'

/**
 * THE LANDING PAGE'S COPY, in the three supported languages.
 *
 * WHAT IS HERE AND WHAT IS NOT. Prose only — headings, body, list items,
 * button labels, captions. The demo store's figures are NOT here: dates,
 * counts and product names come from components/landing/snapshot.ts, which
 * holds real values read from the demo store, and are interpolated into the
 * sentences below. Translating a product name would make the page claim
 * something the store does not contain.
 *
 * THE PRODUCT SCREENSHOTS STAY IN ENGLISH, deliberately. The panels on this
 * page are the app's own components, and the app itself is not translated — so
 * a Telugu page showing a Telugu dashboard would be advertising a product that
 * does not exist. The page describes the product in your language and shows it
 * as it actually is.
 *
 * SPLIT HEADINGS. Several headings are two fields (`titleA` / `titleB`)
 * because the design colours the second half. They split on a clause boundary,
 * never mid-sentence, so each language can phrase its own half naturally —
 * Telugu and Hindi put the verb last, and a split that preserved English word
 * order would have produced nonsense.
 *
 * TRANSLATION NOTE: the Telugu and Hindi copy is written for a shopkeeper
 * rather than transliterated from the English, and keeps the loanwords a shop
 * actually uses (బిల్లింగ్ / स्टॉक / बारकोड) instead of literary equivalents
 * nobody says at a counter. It has NOT been reviewed by a native speaker —
 * worth doing before this is shown to customers.
 */

export interface LandingCopy {
  nav: {
    product: string
    how: string
    pricing: string
    login: string
    getStarted: string
    demoShort: string
    demoLong: string
    languageLabel: string
  }
  hero: {
    badge: string
    titleA: string
    titleAccent: string
    titleHighlight: string
    /** Follows the highlighted word. Empty in English; carries the negation in
     *  Telugu and Hindi, where it comes after the noun. */
    titleTail: string
    body: string
    note: string
  }
  strip: { inventory: string; sales: string; expiry: string; suppliers: string; staff: string; reports: string }
  product: { label: string; titleA: string; titleB: string; body: string; cta: string; caption: string }
  chapters: { inventory: Chapter; sales: Chapter; alerts: Chapter }
  captions: { sales: string; standard: string; demoStore: string; figures: string }
  also: { label: string; titleA: string; titleB: string; items: Item[] }
  how: { label: string; titleA: string; titleB: string; steps: Item[] }
  trust: { label: string; titleA: string; titleB: string; items: Item[] }
  pricing: { label: string; title: string; body: string }
  footer: { login: string; getStarted: string; demo: string; privacy: string; terms: string }
}

interface Chapter {
  kicker: string
  title: string
  body: string
  points: string[]
}

interface Item {
  title: string
  body: string
}

const en: LandingCopy = {
  nav: {
    product: 'Product',
    how: 'How it works',
    pricing: 'Pricing',
    login: 'Log in',
    getStarted: 'Get started',
    demoShort: 'Explore demo',
    demoLong: 'Explore the demo store',
    languageLabel: 'Language',
  },
  hero: {
    badge: 'Store management for independent grocers',
    titleA: 'Run the store.',
    titleAccent: 'Not the ',
    titleHighlight: 'spreadsheets.',
    titleTail: '',
    body: 'Inventory, sales, suppliers, staff, expiry dates and more — all in one simple app, so you spend less time on paperwork and more time with your customers.',
    note: 'Free while in beta · No card required',
  },
  strip: {
    inventory: 'Inventory',
    sales: 'Sales / POS',
    expiry: 'Expiry alerts',
    suppliers: 'Suppliers',
    staff: 'Staff & shifts',
    reports: 'Reports',
  },
  product: {
    label: 'The product',
    titleA: 'Everything you need,',
    titleB: ' in one place.',
    body: 'One dashboard for the whole store — what is running low, what is close to its date, and everything from stock and sales to suppliers, staff and reports.',
    cta: 'See what it does',
    caption: 'The real StockPulse dashboard · demo store',
  },
  chapters: {
    inventory: {
      kicker: 'Inventory',
      title: 'Every delivery keeps its own expiry date.',
      body: 'Stock is kept lot by lot, so two deliveries of the same product never have to share one date. The nearest expiry is always the one you see.',
      points: [
        'Add products by hand, or import the spreadsheet you already keep',
        'Export back to Excel with every column intact',
        'A blank expiry is fine — most of a grocery shop does not perish',
      ],
    },
    sales: {
      kicker: 'Sales',
      title: 'A till that keeps selling when the internet drops.',
      body: 'Log a sale by search or by scanning a barcode with the phone’s camera, and stock comes off by itself. With no signal, sales wait safely on the device and are sent when it returns.',
      points: [
        'A sale queued offline is checked on the device before it is called saved',
        'The price charged is the price recorded — even if it changes later',
        'A scan shows the product’s nearest expiry before it goes in the basket',
      ],
    },
    alerts: {
      kicker: 'Alerts',
      title: 'Know what to reorder, and what to sell first.',
      body: 'Each product has its own reorder level, and the dashboard lists what has fallen to it. Lots near their date are listed too — expired ones kept apart from the ones you can still sell.',
      points: [
        'Your own warning window, from one day to three months',
        'Low stock and expiry on the first screen you open each morning',
      ],
    },
  },
  captions: {
    sales: 'What a barcode scan shows: the product and its nearest expiry.',
    standard: 'From the StockPulse dashboard.',
    demoStore: 'Demo store',
    figures: 'Figures from the demo store',
  },
  also: {
    label: 'Also in StockPulse',
    titleA: 'Suppliers, staff and reports,',
    titleB: ' in the same app.',
    items: [
      { title: 'Barcode scanning', body: 'The phone’s camera is the scanner, at the shelf or at the till.' },
      { title: 'Suppliers', body: 'Every supplier’s details in one list.' },
      { title: 'Staff and shifts', body: 'Invite your team and keep track of shifts.' },
      { title: 'Reports', body: 'Sales over any period, set against the one before.' },
      { title: 'Customers', body: 'A record of the people who shop with you.' },
      { title: 'AI assistant', body: 'Ask about your own store in plain words.' },
      { title: 'Installs on a phone', body: 'Add it to the home screen like an app.' },
      { title: 'Activity log', body: 'See what changed in the store, and who changed it.' },
    ],
  },
  how: {
    label: 'How it works',
    titleA: 'From your spreadsheet',
    titleB: ' to your first sale.',
    steps: [
      { title: 'Add your stock', body: 'Type it in, or import the spreadsheet you already keep.' },
      { title: 'Sell as usual', body: 'Log sales at the counter, or scan a barcode.' },
      { title: 'Open the dashboard', body: 'See what is low and what is expiring, every morning.' },
    ],
  },
  trust: {
    label: 'Built for the counter',
    titleA: 'Private to your store.',
    titleB: ' Safe on a shared phone.',
    items: [
      {
        title: 'Your store’s data stays your store’s.',
        body: 'Every record belongs to one store, and the database itself refuses to show it to anyone else.',
      },
      {
        title: 'A shared phone is safe to share.',
        body: 'The counter phone never keeps a signed-in page, so the next person cannot see the last person’s takings.',
      },
      {
        title: 'Owners decide who can do what.',
        body: 'Staff work the till. Prices, stock levels and reports stay with the owner and managers.',
      },
    ],
  },
  pricing: {
    label: 'Pricing',
    title: 'Free while we’re in beta.',
    body: 'Every feature, for every store. No card required — and nothing to install.',
  },
  footer: {
    login: 'Log in',
    getStarted: 'Get started',
    demo: 'Demo',
    privacy: 'Privacy',
    terms: 'Terms',
  },
}

const te: LandingCopy = {
  nav: {
    product: 'ఉత్పత్తి',
    how: 'ఎలా పనిచేస్తుంది',
    pricing: 'ధర',
    login: 'లాగిన్',
    getStarted: 'ప్రారంభించండి',
    demoShort: 'డెమో చూడండి',
    demoLong: 'డెమో దుకాణాన్ని చూడండి',
    languageLabel: 'భాష',
  },
  hero: {
    badge: 'స్వతంత్ర కిరాణా దుకాణాల కోసం స్టోర్ నిర్వహణ',
    titleA: 'దుకాణాన్ని నడపండి.',
    titleAccent: '',
    titleHighlight: 'స్ప్రెడ్‌షీట్‌లను',
    titleTail: ' కాదు.',
    body: 'నిల్వ, అమ్మకాలు, సరఫరాదారులు, సిబ్బంది, గడువు తేదీలు — అన్నీ ఒకే సులభమైన యాప్‌లో. కాగితపు పనికి తక్కువ సమయం, మీ కస్టమర్లకు ఎక్కువ సమయం.',
    note: 'బీటాలో ఉన్నంత వరకు ఉచితం · కార్డు అవసరం లేదు',
  },
  strip: {
    inventory: 'నిల్వ',
    sales: 'అమ్మకాలు / బిల్లింగ్',
    expiry: 'గడువు హెచ్చరికలు',
    suppliers: 'సరఫరాదారులు',
    staff: 'సిబ్బంది & షిఫ్టులు',
    reports: 'నివేదికలు',
  },
  product: {
    label: 'ఉత్పత్తి',
    titleA: 'మీకు కావలసినదంతా,',
    titleB: ' ఒకే చోట.',
    body: 'మొత్తం దుకాణానికి ఒకే డాష్‌బోర్డ్ — ఏది తగ్గిపోతోంది, ఏది గడువుకు దగ్గరలో ఉంది, అలాగే నిల్వ, అమ్మకాల నుండి సరఫరాదారులు, సిబ్బంది, నివేదికల వరకు అన్నీ.',
    cta: 'ఏం చేస్తుందో చూడండి',
    caption: 'నిజమైన StockPulse డాష్‌బోర్డ్ · డెమో దుకాణం',
  },
  chapters: {
    inventory: {
      kicker: 'నిల్వ',
      title: 'ప్రతి డెలివరీకి దాని సొంత గడువు తేదీ.',
      body: 'నిల్వను లాట్ల వారీగా ఉంచుతాం, కాబట్టి ఒకే వస్తువుకు వచ్చిన రెండు డెలివరీలు ఒకే తేదీని పంచుకోవాల్సిన అవసరం ఉండదు. దగ్గరలో ఉన్న గడువు తేదీ ఎప్పుడూ మీకు కనిపిస్తూనే ఉంటుంది.',
      points: [
        'వస్తువులను చేతితో చేర్చండి, లేదా మీ దగ్గర ఉన్న స్ప్రెడ్‌షీట్‌ను దిగుమతి చేయండి',
        'ప్రతి కాలమ్‌తో సహా తిరిగి Excel‌కు ఎగుమతి చేయండి',
        'గడువు ఖాళీగా ఉన్నా పరవాలేదు — కిరాణా సామాన్లలో చాలా వాటికి గడువు ఉండదు',
      ],
    },
    sales: {
      kicker: 'అమ్మకాలు',
      title: 'ఇంటర్నెట్ పోయినా బిల్లింగ్ ఆగదు.',
      body: 'వెతికి లేదా ఫోన్ కెమెరాతో బార్‌కోడ్ స్కాన్ చేసి అమ్మకాన్ని నమోదు చేయండి, నిల్వ దానంతట అదే తగ్గుతుంది. సిగ్నల్ లేకపోతే అమ్మకాలు ఫోన్‌లోనే భద్రంగా ఉండి, సిగ్నల్ వచ్చాక పంపబడతాయి.',
      points: [
        'ఆఫ్‌లైన్‌లో ఆగిన అమ్మకాన్ని, భద్రంగా ఉందని చెప్పే ముందే ఫోన్‌లో సరిచూస్తాం',
        'వసూలు చేసిన ధరే నమోదవుతుంది — తర్వాత ధర మారినా సరే',
        'బాస్కెట్‌లో వేసే ముందే స్కాన్ ఆ వస్తువు దగ్గరి గడువును చూపుతుంది',
      ],
    },
    alerts: {
      kicker: 'హెచ్చరికలు',
      title: 'ఏది మళ్లీ ఆర్డర్ చేయాలో, ఏది ముందు అమ్మాలో తెలుసుకోండి.',
      body: 'ప్రతి వస్తువుకు దాని సొంత రీఆర్డర్ స్థాయి ఉంటుంది, ఆ స్థాయికి పడిపోయిన వాటిని డాష్‌బోర్డ్ చూపుతుంది. గడువుకు దగ్గరైన లాట్లు కూడా కనిపిస్తాయి — గడువు ముగిసినవి, ఇంకా అమ్మగలిగే వాటి నుండి వేరుగా.',
      points: [
        'ఒక రోజు నుండి మూడు నెలల వరకు, మీ సొంత హెచ్చరిక వ్యవధి',
        'ప్రతి ఉదయం మీరు తెరిచే మొదటి స్క్రీన్‌లోనే తక్కువ నిల్వ, గడువు',
      ],
    },
  },
  captions: {
    sales: 'బార్‌కోడ్ స్కాన్ చూపేది: వస్తువు, దాని దగ్గరి గడువు.',
    standard: 'StockPulse డాష్‌బోర్డ్ నుండి.',
    demoStore: 'డెమో దుకాణం',
    figures: 'డెమో దుకాణం గణాంకాలు',
  },
  also: {
    label: 'StockPulse‌లో ఇంకా',
    titleA: 'సరఫరాదారులు, సిబ్బంది, నివేదికలు —',
    titleB: ' అన్నీ ఇదే యాప్‌లో.',
    items: [
      { title: 'బార్‌కోడ్ స్కానింగ్', body: 'ఫోన్ కెమెరాయే స్కానర్ — షెల్ఫ్ దగ్గరైనా, కౌంటర్ దగ్గరైనా.' },
      { title: 'సరఫరాదారులు', body: 'ప్రతి సరఫరాదారు వివరాలు ఒకే జాబితాలో.' },
      { title: 'సిబ్బంది, షిఫ్టులు', body: 'మీ బృందాన్ని ఆహ్వానించండి, షిఫ్టులను గమనించండి.' },
      { title: 'నివేదికలు', body: 'ఏ కాలానికైనా అమ్మకాలు, అంతకు ముందటి కాలంతో పోల్చి.' },
      { title: 'కస్టమర్లు', body: 'మీ దగ్గర కొనేవారి రికార్డు.' },
      { title: 'AI అసిస్టెంట్', body: 'మీ దుకాణం గురించి సాధారణ మాటల్లో అడగండి.' },
      { title: 'ఫోన్‌లో ఇన్‌స్టాల్', body: 'యాప్ లాగే హోమ్ స్క్రీన్‌కు చేర్చుకోండి.' },
      { title: 'కార్యకలాపాల రికార్డు', body: 'దుకాణంలో ఏం మారిందో, ఎవరు మార్చారో చూడండి.' },
    ],
  },
  how: {
    label: 'ఎలా పనిచేస్తుంది',
    titleA: 'మీ స్ప్రెడ్‌షీట్ నుండి',
    titleB: ' మీ మొదటి అమ్మకం వరకు.',
    steps: [
      { title: 'మీ నిల్వను చేర్చండి', body: 'టైప్ చేయండి, లేదా మీ దగ్గర ఉన్న స్ప్రెడ్‌షీట్‌ను దిగుమతి చేయండి.' },
      { title: 'ఎప్పటిలాగే అమ్మండి', body: 'కౌంటర్ దగ్గర అమ్మకాలు నమోదు చేయండి, లేదా బార్‌కోడ్ స్కాన్ చేయండి.' },
      { title: 'డాష్‌బోర్డ్ తెరవండి', body: 'ప్రతి ఉదయం ఏది తక్కువగా ఉందో, ఏది గడువు దగ్గరలో ఉందో చూడండి.' },
    ],
  },
  trust: {
    label: 'కౌంటర్ కోసం తయారు చేసినది',
    titleA: 'మీ దుకాణానికే పరిమితం.',
    titleB: ' అందరూ వాడే ఫోన్‌లోనూ సురక్షితం.',
    items: [
      {
        title: 'మీ దుకాణం సమాచారం మీ దుకాణానిదే.',
        body: 'ప్రతి రికార్డు ఒకే దుకాణానికి చెందుతుంది, దానిని వేరెవరికీ చూపడానికి డేటాబేస్ నిరాకరిస్తుంది.',
      },
      {
        title: 'అందరూ వాడే ఫోన్‌ను పంచుకోవడం సురక్షితం.',
        body: 'కౌంటర్ ఫోన్ లాగిన్ అయిన పేజీని ఎప్పుడూ నిల్వ ఉంచదు, కాబట్టి తర్వాతి వ్యక్తికి ముందటి వ్యక్తి వసూళ్లు కనిపించవు.',
      },
      {
        title: 'ఎవరు ఏం చేయవచ్చో యజమానే నిర్ణయిస్తారు.',
        body: 'సిబ్బంది బిల్లింగ్ చూస్తారు. ధరలు, నిల్వ స్థాయిలు, నివేదికలు యజమాని, మేనేజర్ల దగ్గరే ఉంటాయి.',
      },
    ],
  },
  pricing: {
    label: 'ధర',
    title: 'బీటాలో ఉన్నంత వరకు ఉచితం.',
    body: 'ప్రతి దుకాణానికి, ప్రతి ఫీచర్. కార్డు అవసరం లేదు — ఇన్‌స్టాల్ చేయాల్సిందీ ఏమీ లేదు.',
  },
  footer: {
    login: 'లాగిన్',
    getStarted: 'ప్రారంభించండి',
    demo: 'డెమో',
    privacy: 'గోప్యత',
    terms: 'నిబంధనలు',
  },
}

const hi: LandingCopy = {
  nav: {
    product: 'प्रोडक्ट',
    how: 'यह कैसे काम करता है',
    pricing: 'क़ीमत',
    login: 'लॉग इन',
    getStarted: 'शुरू करें',
    demoShort: 'डेमो देखें',
    demoLong: 'डेमो दुकान देखें',
    languageLabel: 'भाषा',
  },
  hero: {
    badge: 'स्वतंत्र किराना दुकानों के लिए स्टोर मैनेजमेंट',
    titleA: 'दुकान चलाइए।',
    titleAccent: '',
    titleHighlight: 'स्प्रेडशीट',
    titleTail: ' नहीं।',
    body: 'स्टॉक, बिक्री, सप्लायर, स्टाफ़, एक्सपायरी तारीख़ें और भी बहुत कुछ — सब एक ही आसान ऐप में, ताकि काग़ज़ी काम में कम समय जाए और ग्राहकों के साथ ज़्यादा।',
    note: 'बीटा के दौरान मुफ़्त · कार्ड की ज़रूरत नहीं',
  },
  strip: {
    inventory: 'स्टॉक',
    sales: 'बिक्री / बिलिंग',
    expiry: 'एक्सपायरी अलर्ट',
    suppliers: 'सप्लायर',
    staff: 'स्टाफ़ और शिफ़्ट',
    reports: 'रिपोर्ट',
  },
  product: {
    label: 'प्रोडक्ट',
    titleA: 'जो कुछ चाहिए,',
    titleB: ' सब एक जगह।',
    body: 'पूरी दुकान के लिए एक डैशबोर्ड — क्या कम हो रहा है, क्या एक्सपायरी के क़रीब है, और स्टॉक तथा बिक्री से लेकर सप्लायर, स्टाफ़ और रिपोर्ट तक सब कुछ।',
    cta: 'देखिए यह क्या करता है',
    caption: 'असली StockPulse डैशबोर्ड · डेमो दुकान',
  },
  chapters: {
    inventory: {
      kicker: 'स्टॉक',
      title: 'हर डिलीवरी की अपनी एक्सपायरी तारीख़।',
      body: 'स्टॉक लॉट के हिसाब से रखा जाता है, इसलिए एक ही सामान की दो डिलीवरी को एक ही तारीख़ साझा नहीं करनी पड़ती। सबसे पास वाली एक्सपायरी ही आपको हमेशा दिखती है।',
      points: [
        'सामान हाथ से जोड़ें, या जो स्प्रेडशीट आप पहले से रखते हैं उसे इम्पोर्ट करें',
        'हर कॉलम के साथ वापस Excel में एक्सपोर्ट करें',
        'एक्सपायरी ख़ाली छोड़ना ठीक है — किराना का ज़्यादातर सामान ख़राब नहीं होता',
      ],
    },
    sales: {
      kicker: 'बिक्री',
      title: 'इंटरनेट जाने पर भी चलती रहने वाली बिलिंग।',
      body: 'खोज कर या फ़ोन के कैमरे से बारकोड स्कैन करके बिक्री दर्ज करें, स्टॉक अपने आप घट जाता है। सिग्नल न हो तो बिक्री फ़ोन में सुरक्षित रुकी रहती है और सिग्नल आते ही भेज दी जाती है।',
      points: [
        'ऑफ़लाइन रुकी बिक्री को सुरक्षित कहने से पहले फ़ोन पर ही जाँचा जाता है',
        'जो क़ीमत ली गई, वही दर्ज होती है — भले बाद में क़ीमत बदल जाए',
        'टोकरी में डालने से पहले ही स्कैन उस सामान की सबसे पास वाली एक्सपायरी दिखाता है',
      ],
    },
    alerts: {
      kicker: 'अलर्ट',
      title: 'जानिए क्या दोबारा मँगाना है, और क्या पहले बेचना है।',
      body: 'हर सामान का अपना रीऑर्डर स्तर होता है, और डैशबोर्ड बताता है कि क्या उस स्तर तक गिर चुका है। एक्सपायरी के क़रीब वाले लॉट भी दिखते हैं — जो ख़राब हो चुके हैं वे उनसे अलग जो अब भी बिक सकते हैं।',
      points: [
        'एक दिन से तीन महीने तक, अपनी पसंद की चेतावनी अवधि',
        'हर सुबह जो पहली स्क्रीन खोलते हैं, उसी पर कम स्टॉक और एक्सपायरी',
      ],
    },
  },
  captions: {
    sales: 'बारकोड स्कैन क्या दिखाता है: सामान और उसकी सबसे पास वाली एक्सपायरी।',
    standard: 'StockPulse डैशबोर्ड से।',
    demoStore: 'डेमो दुकान',
    figures: 'डेमो दुकान के आँकड़े',
  },
  also: {
    label: 'StockPulse में और भी',
    titleA: 'सप्लायर, स्टाफ़ और रिपोर्ट,',
    titleB: ' सब इसी ऐप में।',
    items: [
      { title: 'बारकोड स्कैनिंग', body: 'फ़ोन का कैमरा ही स्कैनर है — शेल्फ़ पर हो या काउंटर पर।' },
      { title: 'सप्लायर', body: 'हर सप्लायर का ब्योरा एक ही सूची में।' },
      { title: 'स्टाफ़ और शिफ़्ट', body: 'अपनी टीम को बुलाइए और शिफ़्ट का हिसाब रखिए।' },
      { title: 'रिपोर्ट', body: 'किसी भी अवधि की बिक्री, पिछली अवधि से तुलना करके।' },
      { title: 'ग्राहक', body: 'आपसे ख़रीदने वालों का रिकॉर्ड।' },
      { title: 'AI असिस्टेंट', body: 'अपनी दुकान के बारे में आसान भाषा में पूछिए।' },
      { title: 'फ़ोन पर इंस्टॉल', body: 'ऐप की तरह होम स्क्रीन पर जोड़ लीजिए।' },
      { title: 'गतिविधि रिकॉर्ड', body: 'देखिए दुकान में क्या बदला, और किसने बदला।' },
    ],
  },
  how: {
    label: 'यह कैसे काम करता है',
    titleA: 'आपकी स्प्रेडशीट से',
    titleB: ' आपकी पहली बिक्री तक।',
    steps: [
      { title: 'अपना स्टॉक जोड़िए', body: 'टाइप कीजिए, या जो स्प्रेडशीट पहले से रखते हैं उसे इम्पोर्ट कीजिए।' },
      { title: 'हमेशा की तरह बेचिए', body: 'काउंटर पर बिक्री दर्ज कीजिए, या बारकोड स्कैन कीजिए।' },
      { title: 'डैशबोर्ड खोलिए', body: 'हर सुबह देखिए क्या कम है और क्या एक्सपायर हो रहा है।' },
    ],
  },
  trust: {
    label: 'काउंटर के लिए बनाया गया',
    titleA: 'सिर्फ़ आपकी दुकान तक।',
    titleB: ' साझा फ़ोन पर भी सुरक्षित।',
    items: [
      {
        title: 'आपकी दुकान का डेटा आपकी दुकान का ही रहता है।',
        body: 'हर रिकॉर्ड एक ही दुकान का होता है, और डेटाबेस ख़ुद उसे किसी और को दिखाने से मना कर देता है।',
      },
      {
        title: 'साझा फ़ोन साझा करना सुरक्षित है।',
        body: 'काउंटर वाला फ़ोन लॉग-इन पेज कभी सहेजता नहीं, इसलिए अगले व्यक्ति को पिछले व्यक्ति की कमाई नहीं दिखती।',
      },
      {
        title: 'कौन क्या कर सकता है, यह मालिक तय करता है।',
        body: 'स्टाफ़ बिलिंग सँभालता है। क़ीमतें, स्टॉक स्तर और रिपोर्ट मालिक और मैनेजर के पास रहती हैं।',
      },
    ],
  },
  pricing: {
    label: 'क़ीमत',
    title: 'बीटा के दौरान मुफ़्त।',
    body: 'हर दुकान के लिए, हर सुविधा। कार्ड की ज़रूरत नहीं — और इंस्टॉल करने को कुछ नहीं।',
  },
  footer: {
    login: 'लॉग इन',
    getStarted: 'शुरू करें',
    demo: 'डेमो',
    privacy: 'गोपनीयता',
    terms: 'शर्तें',
  },
}

export const LANDING_COPY: Record<Locale, LandingCopy> = { en, te, hi }
