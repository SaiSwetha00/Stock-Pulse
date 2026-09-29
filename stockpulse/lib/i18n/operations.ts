import type { Locale } from './locales'

/**
 * THE SHOP-FLOOR SURFACES' COPY: /monitoring, the offline banner, the barcode
 * scanner (and its /scan test page), and every dashboard page's <title> and
 * description.
 *
 * A SIBLING OF ./app, NOT A SECOND SYSTEM. These sections are keys on AppCopy
 * like any other — `useAppCopy().monitoring`, `appCopy(locale).meta` — and
 * each locale object in ./app spreads its entry from here. They live in their
 * own file only because ./app had passed five thousand lines, and a reviewer
 * checking the Telugu for one screen should not have to scroll past every
 * other screen to find it.
 *
 * The same rules as ./app apply: {placeholders} are template strings rather
 * than functions (dictionaries cross the server/client boundary and React
 * cannot serialise a function), and the shop's own data — counter names,
 * product names, payment types stored on a row, database error messages — is
 * never translated.
 *
 * TRANSLATION NOTE: written for a shopkeeper, not transliterated, and NOT yet
 * reviewed by a native speaker — the same caveat ./app carries.
 */

export type StationStatusCopy = {
  available: string
  in_use: string
  review: string
  assistance: string
  maintenance: string
}

/** /monitoring — the live checkout board and its station setup panel. */
export type MonitoringCopy = {
  eyebrow: string
  title: string
  /** "{n}" is the number of configured stations. */
  subtitleOne: string
  subtitleMany: string
  statAlerts: string
  statAlertsHint: string
  statActive: string
  statActiveHint: string
  statRate: string
  /** "{n}" stations flagged right now. */
  statRateHint: string
  setupTitle: string
  setupIntroManage: string
  setupIntroView: string
  /** "{n}" configured. */
  configured: string
  newNamePlaceholder: string
  newNameAria: string
  addCounter: string
  noCounters: string
  /** "{name}" is the station's current label. */
  renameAria: string
  save: string
  cancel: string
  rename: string
  confirm: string
  remove: string
  /**
   * An unnamed station's label. "{n}" is already zero-padded ("07"). The
   * pad stays because it is how the lanes are numbered on the floor.
   */
  stationN: string
  /**
   * 'Cash & Card' — the payment_type this app writes on every counter it
   * creates (and the column default in schema_phase3.sql). Translated only
   * when the stored value is exactly that; anything else on the row is shown
   * as stored.
   */
  paymentCashCard: string
  emptyTitle: string
  emptyBody: string
  setUpFour: string
  /** Title case, for the setup list. */
  status: StationStatusCopy
  /** The coloured badge on each card, which the design sets in capitals. */
  badge: StationStatusCopy
  /** Two lines each; the alert strip breaks them. */
  weightLine1: string
  weightLine2: string
  ageLine1: string
  ageLine2: string
  /** "{v}" is a weight in kilograms. */
  expected: string
  actual: string
  itemsScanned: string
  currentTotal: string
  sessionTime: string
  waitingForCustomer: string
  working: string
  overrideApprove: string
  verifyId: string
  ownerApproval: string
  /** "{n} item" · total — the live basket summary. */
  basketOne: string
  basketMany: string
  endMaintenance: string
  maintenanceMode: string
  removeQuestion: string
  removeCounter: string
  dispatchStaff: string
  // Toasts. The second line of each is either a station's label or the
  // database's own message, neither of which is ours to translate.
  tClearFailed: string
  tCleared: string
  tStatusFailed: string
  tOffline: string
  tOnline: string
  tDispatchFailed: string
  tDispatched: string
  tRemoveFailed: string
  tNotRemoved: string
  tNotRemovedBody: string
  tRemoved: string
  tAddFailed: string
  /** "{name}" is the new station's numbered label. */
  tAddedNoName: string
  tAddedNoNameBody: string
  tAdded: string
  tNamingNeedsMigration: string
  tRenameFailed: string
  tNotRenamed: string
  tNotRenamedBody: string
  tRenamed: string
}

/**
 * The offline banner above Inventory and Sales, and the sync toasts.
 *
 * Every plural is split into One/Many rather than suffixed, because neither
 * Telugu nor Hindi forms a plural by adding a letter.
 */
export type OfflineCopy = {
  offline: string
  /** "{time}" is when the saved list was taken, HH:MM. */
  savedFrom: string
  savedNoTime: string
  backOnline: string
  tryAgain: string
  goneOne: string
  goneMany: string
  /** "{expected}" / "{actual}" are counts of saved sales. */
  goneBodyOne: string
  goneBodyMany: string
  /** "{n}" sales, "{total}" their value. */
  waitingOne: string
  waitingMany: string
  /** "{time} · {n} item · {total}" */
  lineOne: string
  lineMany: string
  /** "{n}" further sales not listed. */
  andMore: string
  /** " (tried {n} times)" — appended, so it carries its own leading space. */
  tried: string
  syncing: string
  waitingSignal: string
  syncNow: string
  staysOnDevice: string
  oldestFirst: string
  tDiscrepancyOne: string
  tDiscrepancyMany: string
  /** "{name}: sold {sold}, only {left} left" */
  tDiscrepancyLine: string
  /** "{lines}" are the discrepancy lines joined. */
  tDiscrepancyBodyOne: string
  tDiscrepancyBodyMany: string
  tSynced: string
  tSent: string
  tAlreadyRecorded: string
  tFailedOne: string
  tFailedMany: string
  tUnknownReason: string
  tSeeBelow: string
  tStillSaved: string
}

type FaultCopy = { title: string; body: string }

/** The camera scanner, and the /scan test page that hosts it on its own. */
export type ScannerCopy = {
  faults: {
    denied: FaultCopy
    'no-camera': FaultCopy
    'in-use': FaultCopy
    insecure: FaultCopy
    unsupported: FaultCopy
    iframe: FaultCopy
    other: FaultCopy
  }
  asking: string
  cameraOff: string
  scanning: string
  stopCamera: string
  starting: string
  startCamera: string
  framesOne: string
  framesMany: string
  videoRefusedTitle: string
  videoRefusedBody: string
  decoderFailed: string
  looking: string
  /** "{format}" is the symbology's own name (QR_CODE, Code128). */
  wrongKindTitle: string
  wrongKindBody: string
  detected: string
  lastDecoded: string
  clearLastAria: string
  nothingSaved: string
  diagnostics: string
  dSecure: string
  dOrigin: string
  dIframe: string
  dPermission: string
  dInputs: string
  dVideo: string
  dFrames: string
  dLastError: string
  notSampled: string
  none: string
  pagePrototype: string
  pageTitle: string
  pageIntro: string
  pageCanReadTitle: string
  pageCanReadBody: string
  pagePrivacy: string
}

type PageMeta = { title: string; description: string }

/**
 * Each dashboard page's <title> and meta description. app/layout.tsx appends
 * " · StockPulse", so these are the page's own name only.
 */
export type PageMetaCopy = {
  dashboard: PageMeta
  inventory: PageMeta
  sales: PageMeta
  reports: PageMeta
  customers: PageMeta
  suppliers: PageMeta
  staff: PageMeta
  team: PageMeta
  monitoring: PageMeta
  settings: PageMeta
  categories: PageMeta
  profile: PageMeta
  audit: PageMeta
  help: PageMeta
  support: PageMeta
  scan: PageMeta
}

/**
 * The five categories migration 0013 seeds into every store, in the reader's
 * language. Applied ONLY while a store still carries the seeded English name —
 * see localizeCategories() in lib/categories.ts. A category the shop created
 * or renamed is the shop's own data and is shown exactly as they typed it.
 */
export type CategoryNamesCopy = {
  produce: string
  dairy: string
  packaged: string
  beverages: string
  household: string
}

/**
 * Messages written by Server Actions: returned errors (shown as toasts or form
 * errors) and the notifications those actions raise. Read on the server from
 * the actor's cookie, the same way every other action's copy is.
 *
 * A notification is a stored row, so it keeps the language of the person whose
 * action raised it — the rule the supplier feed already follows. These used to
 * be hard-coded English whatever language the actor was using.
 */
export type ServerCopy = {
  missingBarcode: string
  missingBatches: string
  lotRefused: string
  productNotSaved: string
  productInPastSales: string
  /** "{limit}" is the row cap. */
  importTooMany: string
  notifLowTitle: string
  notifOutTitle: string
  /** "{name} is down to {n} (reorder at {min})." */
  notifLowBody: string
  notifRevokedTitle: string
  /** "{name}" is the invitee. */
  notifRevokedBody: string
  notifInvitedTitle: string
  /** "{name}" invitee, "{role}" their role in the actor's language. */
  notifInvitedBody: string
  storeNameRequired: string
  storeNameTooLong: string
  nameRequired: string
  nameTooLong: string
  accountFailed: string
  notAuthenticated: string
  ownerOnlyInvites: string
  notInStore: string
  ownerCannotRevoke: string
  alreadyAccepted: string
  inviteRateLimited: string
  ownerOnlyAddStaff: string
  inviteNameRequired: string
  inviteNameTooLong: string
  inviteBadRole: string
  staffAccountFailed: string
}

export type OperationsCopy = {
  server: ServerCopy
  categoryNames: CategoryNamesCopy
  monitoring: MonitoringCopy
  offline: OfflineCopy
  scanner: ScannerCopy
  meta: PageMetaCopy
}

const en: OperationsCopy = {
  server: {
    missingBarcode:
      'Barcodes are not set up on this database yet. Run supabase/migrations/0014_product_barcode.sql in the Supabase SQL editor.',
    missingBatches:
      'Expiry tracking is not set up on this database yet. Run supabase/migrations/0016_product_batches.sql in the Supabase SQL editor.',
    lotRefused:
      'That stock lot could not be changed - it may have just been removed, or your account may not have permission. Refresh and try again.',
    productNotSaved: 'That product could not be saved - it may have just been removed. Refresh and try again.',
    productInPastSales:
      'This product appears in past sales and cannot be removed. Set its stock to 0 to retire it instead.',
    importTooMany: 'Too many rows in one import (limit {limit}).',
    notifLowTitle: 'Low stock',
    notifOutTitle: 'Out of stock',
    notifLowBody: '{name} is down to {n} (reorder at {min}).',
    notifRevokedTitle: 'Invitation revoked',
    notifRevokedBody: 'The invitation for {name} was cancelled.',
    notifInvitedTitle: 'New team member invited',
    notifInvitedBody: '{name} was invited as {role}.',
    storeNameRequired: 'Your store needs a name.',
    storeNameTooLong: 'Keep the store name to 120 characters or fewer.',
    nameRequired: 'Please enter your name.',
    nameTooLong: 'Keep your name to 120 characters or fewer.',
    accountFailed: 'Could not create account. Please try again.',
    notAuthenticated: 'Not authenticated',
    ownerOnlyInvites: 'Only the store owner can manage invitations.',
    notInStore: 'That team member is not in this store.',
    ownerCannotRevoke: 'The store owner cannot be revoked.',
    alreadyAccepted: 'That person has already accepted — there is no pending invitation.',
    inviteRateLimited:
      'Email sending is rate-limited. This project is still using Supabase’s built-in SMTP, which only allows a few messages an hour. Configure custom SMTP under Project Settings → Authentication → SMTP Settings to send invitations reliably.',
    ownerOnlyAddStaff: 'Only the store owner can add staff.',
    inviteNameRequired: 'Enter the person’s name.',
    inviteNameTooLong: 'Keep the name to 120 characters or fewer.',
    inviteBadRole: 'Choose a valid role for this team member.',
    staffAccountFailed: 'Could not create staff account.',
  },
  categoryNames: {
    produce: 'Produce',
    dairy: 'Dairy & Eggs',
    packaged: 'Packaged Goods',
    beverages: 'Beverages',
    household: 'Household',
  },
  monitoring: {
    eyebrow: 'Live operations',
    title: 'Live Operations Center',
    subtitleOne: 'Monitoring {n} Self-Checkout Station',
    subtitleMany: 'Monitoring {n} Self-Checkout Stations',
    statAlerts: 'Active Alerts',
    statAlertsHint: 'Require immediate attention',
    statActive: 'Stations Active',
    statActiveHint: 'Optimal utilization',
    statRate: 'Current Intervention Rate',
    statRateHint: '{n} flagged now',
    setupTitle: 'Station Setup',
    setupIntroManage: 'Add the counters your shop actually has, and name them the way your staff do.',
    setupIntroView: 'The counters configured for this store. Ask an owner or manager to change them.',
    configured: '{n} configured',
    newNamePlaceholder: 'Counter name (optional) — e.g. Express',
    newNameAria: 'New counter name',
    addCounter: 'Add Counter',
    noCounters: 'No counters configured yet.',
    renameAria: 'Rename {name}',
    save: 'Save',
    cancel: 'Cancel',
    rename: 'Rename',
    confirm: 'Confirm',
    remove: 'Remove',
    stationN: 'Station {n}',
    paymentCashCard: 'Cash & Card',
    emptyTitle: 'No checkout stations configured yet',
    emptyBody: 'Set up your lanes to start monitoring live checkout activity.',
    setUpFour: 'Set Up 4 Stations',
    status: {
      available: 'Available',
      in_use: 'In Use',
      review: 'Review',
      assistance: 'Assistance',
      maintenance: 'Maintenance',
    },
    badge: {
      available: 'AVAILABLE',
      in_use: 'IN USE',
      review: 'REVIEW',
      assistance: 'ASSISTANCE',
      maintenance: 'MAINTENANCE',
    },
    weightLine1: 'WEIGHT',
    weightLine2: 'MISMATCH',
    ageLine1: 'AGE',
    ageLine2: 'VERIFICATION',
    expected: 'Expected: {v}kg',
    actual: 'Actual: {v}kg',
    itemsScanned: 'Items Scanned',
    currentTotal: 'Current Total',
    sessionTime: 'Session Time',
    waitingForCustomer: 'Waiting for customer',
    working: 'Working…',
    overrideApprove: 'Override & Approve',
    verifyId: 'Verify ID via Camera',
    ownerApproval: 'Owner approval required',
    basketOne: '{n} item',
    basketMany: '{n} items',
    endMaintenance: 'End Maintenance',
    maintenanceMode: 'Maintenance Mode',
    removeQuestion: 'Remove this counter?',
    removeCounter: 'Remove Counter',
    dispatchStaff: 'Dispatch Staff',
    tClearFailed: 'Could not clear alert',
    tCleared: 'Alert cleared',
    tStatusFailed: 'Could not change station status',
    tOffline: 'Station taken offline',
    tOnline: 'Station back online',
    tDispatchFailed: 'Could not dispatch staff',
    tDispatched: 'Staff dispatched',
    tRemoveFailed: 'Could not remove counter',
    tNotRemoved: 'Counter not removed',
    tNotRemovedBody:
      'Nothing was removed — this counter may already be gone. If it stays on the board, apply supabase/migrations/0012_checkout_stations_delete_policy.sql.',
    tRemoved: 'Counter removed',
    tAddFailed: 'Could not add counter',
    tAddedNoName: '{name} added without a name',
    tAddedNoNameBody:
      'The counter was added, but naming needs supabase/migrations/0020_checkout_station_name.sql applied first.',
    tAdded: 'Counter added',
    tNamingNeedsMigration:
      'Naming counters needs supabase/migrations/0020_checkout_station_name.sql applied first.',
    tRenameFailed: 'Could not rename counter',
    tNotRenamed: 'Counter not renamed',
    tNotRenamedBody:
      'Nothing was renamed. Renaming a counter is a manager or owner action, and the counter may also have just been removed.',
    tRenamed: 'Counter renamed',
  },
  offline: {
    offline: 'You are offline.',
    savedFrom: 'Showing saved products from {time}. Sales you complete are saved on this device.',
    savedNoTime: 'Showing saved products. Sales you complete are saved on this device.',
    backOnline: 'Back online.',
    tryAgain: 'Try again',
    goneOne: '{n} saved sale disappeared from this device',
    goneMany: '{n} saved sales disappeared from this device',
    goneBodyOne:
      "This device held {expected} and now has {actual}. Nothing here removed it, so the browser may have cleared storage. Any sale that had not synced is not recorded anywhere — check today's takings against the till.",
    goneBodyMany:
      "This device held {expected} and now has {actual}. Nothing here removed them, so the browser may have cleared storage. Any sale that had not synced is not recorded anywhere — check today's takings against the till.",
    waitingOne: '{n} sale waiting to sync · {total}',
    waitingMany: '{n} sales waiting to sync · {total}',
    lineOne: '{time} · {n} item · {total}',
    lineMany: '{time} · {n} items · {total}',
    andMore: 'and {n} more.',
    tried: ' (tried {n} times)',
    syncing: 'Syncing…',
    waitingSignal: 'Waiting for signal',
    syncNow: 'Sync now',
    staysOnDevice: 'These stay on this device until you are back online.',
    oldestFirst: 'They are sent one at a time, oldest first.',
    tDiscrepancyOne: 'Stock did not add up on {n} item',
    tDiscrepancyMany: 'Stock did not add up on {n} items',
    tDiscrepancyLine: '{name}: sold {sold}, only {left} left',
    tDiscrepancyBodyOne: '{lines}. The sale went through and stock is now 0 — please check the shelf.',
    tDiscrepancyBodyMany: '{lines}. The sales went through and stock is now 0 — please check the shelf.',
    tSynced: 'Offline sales synced',
    tSent: '{n} sent',
    tAlreadyRecorded: '{n} already recorded',
    tFailedOne: '{n} sale could not sync',
    tFailedMany: '{n} sales could not sync',
    tUnknownReason: 'Unknown reason.',
    tSeeBelow: 'See the list below.',
    tStillSaved: 'They are still saved on this device.',
  },
  scanner: {
    faults: {
      denied: {
        title: 'Camera permission was refused',
        // Names the actual remedy, because the browser will not ask again once
        // it has been refused — waiting for another prompt is a dead end.
        //
        // Both layers are named on purpose. Android has TWO separate
        // permissions and granting one does not grant the other: the OS
        // permission for the Chrome app, and Chrome's own per-site permission
        // for this origin. A user who has checked the first and been told
        // "your browser is blocking the camera" has been sent to the wrong
        // place.
        body: 'This is set in two independent places, and both must allow it. In Chrome or Safari, tap the padlock or the icon at the left of the address bar and set Camera to Allow, then reload. Separately, on Android check Settings → Apps → Chrome → Permissions → Camera; on iPhone, Settings → Safari → Camera.',
      },
      'no-camera': {
        title: 'No camera found',
        body: 'This device has no camera the browser can reach. If you are on a desktop, try again on a phone or tablet, or plug in a webcam and reload.',
      },
      'in-use': {
        title: 'The camera is busy',
        body: 'Another app or browser tab already has the camera. Close it — video calls are the usual culprit — and try again.',
      },
      insecure: {
        title: 'Camera needs a secure connection',
        body: 'Browsers only allow camera access over HTTPS (or on localhost). Open this page over https:// and try again.',
      },
      unsupported: {
        title: 'This browser cannot open a camera',
        body: 'The browser does not support camera capture from a web page. Try the current version of Safari, Chrome, Edge or Firefox.',
      },
      iframe: {
        title: 'Camera blocked inside an embedded frame',
        body: 'This page is running inside an iframe that has not been given camera permission. Open it in its own tab, or the embedding page needs allow="camera" on the iframe.',
      },
      other: {
        title: 'The camera could not be started',
        body: 'The browser refused the camera for a reason it did not classify. The exact error is shown below.',
      },
    },
    asking: 'Asking for camera access…',
    cameraOff: 'The camera is off.',
    scanning: 'Scanning',
    stopCamera: 'Stop camera',
    starting: 'Starting…',
    startCamera: 'Start camera',
    framesOne: '{n} frame checked',
    framesMany: '{n} frames checked',
    videoRefusedTitle: 'The video element refused to start playing',
    videoRefusedBody:
      "The camera is open and scanning continues — this is usually the browser's autoplay policy and is harmless. Reported so it is not invisible.",
    decoderFailed: 'The decoder could not be loaded',
    looking: 'Looking for a barcode… hold it inside the frame, filling most of the width.',
    wrongKindTitle: 'That is a {format}, not a product barcode',
    wrongKindBody: 'It scanned cleanly — the code just is not a retail barcode. It reads:',
    detected: 'Barcode detected',
    lastDecoded: 'Last decoded value',
    clearLastAria: 'Clear the last decoded value',
    nothingSaved:
      'Nothing was saved. This prototype only reads the code — matching it to a product comes in a later phase.',
    diagnostics: 'Diagnostics',
    dSecure: 'Secure context',
    dOrigin: 'Origin',
    dIframe: 'In an iframe',
    dPermission: 'Permissions API camera state',
    dInputs: 'Video input devices',
    dVideo: 'Video element',
    dFrames: 'Frames checked',
    dLastError: 'Last error',
    notSampled: 'not sampled yet',
    none: 'none',
    pagePrototype: 'Prototype',
    pageTitle: 'Barcode scanner',
    pageIntro:
      'Point the camera at a product barcode. The decoded number appears below — nothing is looked up and nothing is saved. Connecting this to your inventory and to the till comes in the next two phases.',
    pageCanReadTitle: 'What this can read',
    pageCanReadBody:
      'EAN-13, EAN-8, UPC-A, UPC-E and ITF — the barcodes printed on retail packaging. It also recognises QR codes and Code 128, but reports them as the wrong kind of code rather than treating them as products.',
    pagePrivacy:
      'The camera never leaves your device: frames are decoded in the browser and are not uploaded anywhere.',
  },
  meta: {
    dashboard: {
      title: 'Dashboard',
      description: "Today's takings, low stock, and what needs attention in your store.",
    },
    inventory: {
      title: 'Inventory',
      description: 'Every product you stock, what is running low, and what is close to expiry.',
    },
    sales: {
      title: 'Sales',
      description: 'Log sales and review every transaction your store has taken.',
    },
    reports: {
      title: 'Reports',
      description: 'Period reports for your store, exportable as CSV or PDF.',
    },
    customers: {
      title: 'Customers',
      description: 'The people who shop with you, and what they buy.',
    },
    suppliers: {
      title: 'Suppliers',
      description: 'Who you buy from, and where each delivery has got to.',
    },
    staff: { title: 'Staff Schedule', description: 'This week and who is covering each shift.' },
    team: { title: 'Team', description: 'Everyone who works in your store, and what they can do.' },
    monitoring: { title: 'Monitoring', description: 'Live checkout status across the shop floor.' },
    settings: {
      title: 'Store Settings',
      description: 'Store details, appearance, and operational thresholds.',
    },
    categories: {
      title: 'Product Categories',
      description: 'Add, rename and reorder the categories your products are filed under.',
    },
    profile: { title: 'Profile', description: 'Your name, photo, contact details and password.' },
    audit: { title: 'Activity', description: 'A record of who changed what, and when.' },
    help: {
      title: 'Help Centre',
      description: 'Guides for running your store in StockPulse, and a way to reach support.',
    },
    support: { title: 'Support', description: 'Requests raised from the Help Centre.' },
    scan: {
      title: 'Barcode scanner (prototype)',
      description: 'A standalone test of camera barcode scanning. Reads a code and shows it.',
    },
  },
}

const te: OperationsCopy = {
  server: {
    missingBarcode:
      'ఈ డేటాబేస్‌లో బార్‌కోడ్‌లు ఇంకా సెటప్ కాలేదు. Supabase SQL ఎడిటర్‌లో supabase/migrations/0014_product_barcode.sql నడపండి.',
    missingBatches:
      'ఈ డేటాబేస్‌లో గడువు ట్రాకింగ్ ఇంకా సెటప్ కాలేదు. Supabase SQL ఎడిటర్‌లో supabase/migrations/0016_product_batches.sql నడపండి.',
    lotRefused:
      'ఆ స్టాక్ లాట్‌ను మార్చలేకపోయాం — అది ఇప్పుడే తీసివేయబడి ఉండవచ్చు, లేదా మీ ఖాతాకు అనుమతి లేకపోవచ్చు. రిఫ్రెష్ చేసి మళ్లీ ప్రయత్నించండి.',
    productNotSaved: 'ఆ వస్తువును సేవ్ చేయలేకపోయాం — అది ఇప్పుడే తీసివేయబడి ఉండవచ్చు. రిఫ్రెష్ చేసి మళ్లీ ప్రయత్నించండి.',
    productInPastSales:
      'ఈ వస్తువు పాత అమ్మకాల్లో ఉంది, కాబట్టి తొలగించలేరు. దాన్ని నిలిపివేయడానికి నిల్వను 0కి మార్చండి.',
    importTooMany: 'ఒకే దిగుమతిలో వరుసలు చాలా ఎక్కువ (పరిమితి {limit}).',
    notifLowTitle: 'తక్కువ నిల్వ',
    notifOutTitle: 'నిల్వ అయిపోయింది',
    notifLowBody: '{name} {n}కి తగ్గింది ({min} వద్ద మళ్లీ ఆర్డర్ చేయండి).',
    notifRevokedTitle: 'ఆహ్వానం రద్దయింది',
    notifRevokedBody: '{name} కోసం ఆహ్వానం రద్దు చేయబడింది.',
    notifInvitedTitle: 'కొత్త బృంద సభ్యుడిని ఆహ్వానించారు',
    notifInvitedBody: '{name}ను {role}గా ఆహ్వానించారు.',
    storeNameRequired: 'మీ దుకాణానికి ఒక పేరు కావాలి.',
    storeNameTooLong: 'దుకాణం పేరు 120 అక్షరాలు లేదా అంతకంటే తక్కువ ఉంచండి.',
    nameRequired: 'దయచేసి మీ పేరు నమోదు చేయండి.',
    nameTooLong: 'మీ పేరు 120 అక్షరాలు లేదా అంతకంటే తక్కువ ఉంచండి.',
    accountFailed: 'ఖాతా తయారు చేయలేకపోయాం. దయచేసి మళ్లీ ప్రయత్నించండి.',
    notAuthenticated: 'సైన్ ఇన్ కాలేదు',
    ownerOnlyInvites: 'ఆహ్వానాలను దుకాణ యజమాని మాత్రమే నిర్వహించగలరు.',
    notInStore: 'ఆ బృంద సభ్యుడు ఈ దుకాణంలో లేరు.',
    ownerCannotRevoke: 'దుకాణ యజమానిని రద్దు చేయలేరు.',
    alreadyAccepted: 'ఆ వ్యక్తి ఇప్పటికే అంగీకరించారు — పెండింగ్ ఆహ్వానం ఏదీ లేదు.',
    inviteRateLimited:
      'ఈమెయిల్ పంపడంపై పరిమితి ఉంది. ఈ ప్రాజెక్ట్ ఇంకా Supabase అంతర్నిర్మిత SMTPనే వాడుతోంది, అది గంటకు కొన్ని సందేశాలే అనుమతిస్తుంది. ఆహ్వానాలు నమ్మకంగా పంపడానికి Project Settings → Authentication → SMTP Settingsలో కస్టమ్ SMTP సెట్ చేయండి.',
    ownerOnlyAddStaff: 'సిబ్బందిని దుకాణ యజమాని మాత్రమే చేర్చగలరు.',
    inviteNameRequired: 'ఆ వ్యక్తి పేరు నమోదు చేయండి.',
    inviteNameTooLong: 'పేరు 120 అక్షరాలు లేదా అంతకంటే తక్కువ ఉంచండి.',
    inviteBadRole: 'ఈ బృంద సభ్యుడికి సరైన పాత్రను ఎంచుకోండి.',
    staffAccountFailed: 'సిబ్బంది ఖాతా తయారు చేయలేకపోయాం.',
  },
  categoryNames: {
    produce: 'కూరగాయలు & పండ్లు',
    dairy: 'పాలు & గుడ్లు',
    packaged: 'ప్యాక్ చేసిన వస్తువులు',
    beverages: 'పానీయాలు',
    household: 'ఇంటి సామాగ్రి',
  },
  monitoring: {
    eyebrow: 'ప్రత్యక్ష నిర్వహణ',
    title: 'ప్రత్యక్ష కార్యకలాపాల కేంద్రం',
    subtitleOne: '{n} సెల్ఫ్-చెకౌట్ స్టేషన్‌ను పర్యవేక్షిస్తోంది',
    subtitleMany: '{n} సెల్ఫ్-చెకౌట్ స్టేషన్లను పర్యవేక్షిస్తోంది',
    statAlerts: 'క్రియాశీల హెచ్చరికలు',
    statAlertsHint: 'వెంటనే గమనించాలి',
    statActive: 'పనిచేస్తున్న స్టేషన్లు',
    statActiveHint: 'సరైన వినియోగం',
    statRate: 'ప్రస్తుత జోక్యం రేటు',
    statRateHint: 'ఇప్పుడు {n} గుర్తించబడ్డాయి',
    setupTitle: 'స్టేషన్ సెటప్',
    setupIntroManage: 'మీ దుకాణంలో నిజంగా ఉన్న కౌంటర్లను జోడించండి, మీ సిబ్బంది పిలిచే పేర్లు పెట్టండి.',
    setupIntroView: 'ఈ దుకాణానికి సెట్ చేసిన కౌంటర్లు. వీటిని మార్చడానికి యజమాని లేదా మేనేజర్‌ను అడగండి.',
    configured: '{n} సెట్ చేశారు',
    newNamePlaceholder: 'కౌంటర్ పేరు (ఐచ్ఛికం) — ఉదా. ఎక్స్‌ప్రెస్',
    newNameAria: 'కొత్త కౌంటర్ పేరు',
    addCounter: 'కౌంటర్ జోడించు',
    noCounters: 'ఇంకా కౌంటర్లు ఏవీ సెట్ చేయలేదు.',
    renameAria: '{name} పేరు మార్చండి',
    save: 'సేవ్ చేయి',
    cancel: 'రద్దు',
    rename: 'పేరు మార్చు',
    confirm: 'నిర్ధారించు',
    remove: 'తీసివేయి',
    stationN: 'స్టేషన్ {n}',
    paymentCashCard: 'నగదు & కార్డ్',
    emptyTitle: 'ఇంకా చెకౌట్ స్టేషన్లు ఏవీ సెట్ చేయలేదు',
    emptyBody: 'ప్రత్యక్ష చెకౌట్ కార్యకలాపాన్ని పర్యవేక్షించడానికి మీ లేన్లను సెటప్ చేయండి.',
    setUpFour: '4 స్టేషన్లు సెటప్ చేయి',
    status: {
      available: 'ఖాళీగా ఉంది',
      in_use: 'వాడుకలో ఉంది',
      review: 'సమీక్ష',
      assistance: 'సహాయం కావాలి',
      maintenance: 'మెయింటెనెన్స్',
    },
    badge: {
      available: 'ఖాళీ',
      in_use: 'వాడుకలో',
      review: 'సమీక్ష',
      assistance: 'సహాయం',
      maintenance: 'మెయింటెనెన్స్',
    },
    weightLine1: 'బరువు',
    weightLine2: 'సరిపోలలేదు',
    ageLine1: 'వయసు',
    ageLine2: 'నిర్ధారణ',
    expected: 'అంచనా: {v}కి.గ్రా',
    actual: 'అసలు: {v}కి.గ్రా',
    itemsScanned: 'స్కాన్ చేసిన వస్తువులు',
    currentTotal: 'ప్రస్తుత మొత్తం',
    sessionTime: 'సెషన్ సమయం',
    waitingForCustomer: 'కస్టమర్ కోసం వేచి ఉంది',
    working: 'పని జరుగుతోంది…',
    overrideApprove: 'ఓవర్‌రైడ్ చేసి ఆమోదించు',
    verifyId: 'కెమెరాతో ID నిర్ధారించు',
    ownerApproval: 'యజమాని ఆమోదం అవసరం',
    basketOne: '{n} వస్తువు',
    basketMany: '{n} వస్తువులు',
    endMaintenance: 'మెయింటెనెన్స్ ముగించు',
    maintenanceMode: 'మెయింటెనెన్స్ మోడ్',
    removeQuestion: 'ఈ కౌంటర్‌ను తీసివేయాలా?',
    removeCounter: 'కౌంటర్ తీసివేయి',
    dispatchStaff: 'సిబ్బందిని పంపు',
    tClearFailed: 'హెచ్చరికను తొలగించలేకపోయాం',
    tCleared: 'హెచ్చరిక తొలగించబడింది',
    tStatusFailed: 'స్టేషన్ స్థితిని మార్చలేకపోయాం',
    tOffline: 'స్టేషన్ ఆఫ్‌లైన్‌లోకి తీసుకెళ్లబడింది',
    tOnline: 'స్టేషన్ మళ్లీ ఆన్‌లైన్‌లో ఉంది',
    tDispatchFailed: 'సిబ్బందిని పంపలేకపోయాం',
    tDispatched: 'సిబ్బందిని పంపాం',
    tRemoveFailed: 'కౌంటర్‌ను తీసివేయలేకపోయాం',
    tNotRemoved: 'కౌంటర్ తీసివేయబడలేదు',
    tNotRemovedBody:
      'ఏమీ తీసివేయబడలేదు — ఈ కౌంటర్ ఇప్పటికే తీసివేయబడి ఉండవచ్చు. ఇది బోర్డుపై అలాగే ఉంటే, supabase/migrations/0012_checkout_stations_delete_policy.sql అప్లై చేయండి.',
    tRemoved: 'కౌంటర్ తీసివేయబడింది',
    tAddFailed: 'కౌంటర్‌ను జోడించలేకపోయాం',
    tAddedNoName: '{name} పేరు లేకుండా జోడించబడింది',
    tAddedNoNameBody:
      'కౌంటర్ జోడించబడింది, కానీ పేరు పెట్టాలంటే ముందు supabase/migrations/0020_checkout_station_name.sql అప్లై చేయాలి.',
    tAdded: 'కౌంటర్ జోడించబడింది',
    tNamingNeedsMigration:
      'కౌంటర్లకు పేరు పెట్టాలంటే ముందు supabase/migrations/0020_checkout_station_name.sql అప్లై చేయాలి.',
    tRenameFailed: 'కౌంటర్ పేరు మార్చలేకపోయాం',
    tNotRenamed: 'కౌంటర్ పేరు మారలేదు',
    tNotRenamedBody:
      'ఏ పేరూ మారలేదు. కౌంటర్ పేరు మార్చడం మేనేజర్ లేదా యజమాని చేసే పని, అలాగే ఆ కౌంటర్ ఇప్పుడే తీసివేయబడి ఉండవచ్చు.',
    tRenamed: 'కౌంటర్ పేరు మార్చబడింది',
  },
  offline: {
    offline: 'మీరు ఆఫ్‌లైన్‌లో ఉన్నారు.',
    savedFrom: '{time} నాటి సేవ్ చేసిన వస్తువులను చూపుతోంది. మీరు పూర్తి చేసే అమ్మకాలు ఈ పరికరంలో సేవ్ అవుతాయి.',
    savedNoTime: 'సేవ్ చేసిన వస్తువులను చూపుతోంది. మీరు పూర్తి చేసే అమ్మకాలు ఈ పరికరంలో సేవ్ అవుతాయి.',
    backOnline: 'మళ్లీ ఆన్‌లైన్‌లో ఉన్నారు.',
    tryAgain: 'మళ్లీ ప్రయత్నించండి',
    goneOne: 'సేవ్ చేసిన {n} అమ్మకం ఈ పరికరం నుండి కనిపించకుండా పోయింది',
    goneMany: 'సేవ్ చేసిన {n} అమ్మకాలు ఈ పరికరం నుండి కనిపించకుండా పోయాయి',
    goneBodyOne:
      'ఈ పరికరంలో {expected} ఉండేవి, ఇప్పుడు {actual} ఉన్నాయి. ఈ యాప్ దాన్ని తీసివేయలేదు, కాబట్టి బ్రౌజర్ స్టోరేజ్‌ను క్లియర్ చేసి ఉండవచ్చు. సింక్ కాని అమ్మకం ఎక్కడా నమోదు కాలేదు — ఈరోజు వసూళ్లను గల్లాపెట్టెతో సరిచూసుకోండి.',
    goneBodyMany:
      'ఈ పరికరంలో {expected} ఉండేవి, ఇప్పుడు {actual} ఉన్నాయి. ఈ యాప్ వాటిని తీసివేయలేదు, కాబట్టి బ్రౌజర్ స్టోరేజ్‌ను క్లియర్ చేసి ఉండవచ్చు. సింక్ కాని ఏ అమ్మకమూ ఎక్కడా నమోదు కాలేదు — ఈరోజు వసూళ్లను గల్లాపెట్టెతో సరిచూసుకోండి.',
    waitingOne: '{n} అమ్మకం సింక్ కోసం వేచి ఉంది · {total}',
    waitingMany: '{n} అమ్మకాలు సింక్ కోసం వేచి ఉన్నాయి · {total}',
    lineOne: '{time} · {n} వస్తువు · {total}',
    lineMany: '{time} · {n} వస్తువులు · {total}',
    andMore: 'ఇంకా {n}.',
    tried: ' ({n} సార్లు ప్రయత్నించాం)',
    syncing: 'సింక్ అవుతోంది…',
    waitingSignal: 'సిగ్నల్ కోసం వేచి ఉంది',
    syncNow: 'ఇప్పుడే సింక్ చేయి',
    staysOnDevice: 'మీరు మళ్లీ ఆన్‌లైన్‌కు వచ్చే వరకు ఇవి ఈ పరికరంలోనే ఉంటాయి.',
    oldestFirst: 'ఇవి ఒక్కొక్కటిగా, పాతవి ముందుగా పంపబడతాయి.',
    tDiscrepancyOne: '{n} వస్తువుపై నిల్వ లెక్క సరిపోలలేదు',
    tDiscrepancyMany: '{n} వస్తువులపై నిల్వ లెక్క సరిపోలలేదు',
    tDiscrepancyLine: '{name}: {sold} అమ్మారు, {left} మాత్రమే ఉన్నాయి',
    tDiscrepancyBodyOne: '{lines}. అమ్మకం నమోదైంది, నిల్వ ఇప్పుడు 0 — దయచేసి షెల్ఫ్‌ను తనిఖీ చేయండి.',
    tDiscrepancyBodyMany: '{lines}. అమ్మకాలు నమోదయ్యాయి, నిల్వ ఇప్పుడు 0 — దయచేసి షెల్ఫ్‌ను తనిఖీ చేయండి.',
    tSynced: 'ఆఫ్‌లైన్ అమ్మకాలు సింక్ అయ్యాయి',
    tSent: '{n} పంపబడ్డాయి',
    tAlreadyRecorded: '{n} ఇప్పటికే నమోదై ఉన్నాయి',
    tFailedOne: '{n} అమ్మకం సింక్ కాలేదు',
    tFailedMany: '{n} అమ్మకాలు సింక్ కాలేదు',
    tUnknownReason: 'కారణం తెలియదు.',
    tSeeBelow: 'కింది జాబితా చూడండి.',
    tStillSaved: 'అవి ఇప్పటికీ ఈ పరికరంలో సేవ్ అయి ఉన్నాయి.',
  },
  scanner: {
    faults: {
      denied: {
        title: 'కెమెరా అనుమతి నిరాకరించబడింది',
        body: 'ఇది రెండు వేర్వేరు చోట్ల సెట్ అవుతుంది, రెండూ అనుమతించాలి. Chrome లేదా Safariలో, అడ్రస్ బార్ ఎడమవైపు ఉన్న తాళం లేదా ఐకాన్‌ను నొక్కి, Cameraను Allowకి మార్చి, పేజీని రీలోడ్ చేయండి. అలాగే, Androidలో Settings → Apps → Chrome → Permissions → Camera చూడండి; iPhoneలో Settings → Safari → Camera.',
      },
      'no-camera': {
        title: 'కెమెరా కనిపించలేదు',
        body: 'ఈ పరికరంలో బ్రౌజర్ వాడగలిగే కెమెరా లేదు. మీరు డెస్క్‌టాప్‌లో ఉంటే, ఫోన్ లేదా ట్యాబ్లెట్‌లో మళ్లీ ప్రయత్నించండి, లేదా వెబ్‌క్యామ్ పెట్టి రీలోడ్ చేయండి.',
      },
      'in-use': {
        title: 'కెమెరా వేరే చోట వాడుకలో ఉంది',
        body: 'వేరే యాప్ లేదా బ్రౌజర్ ట్యాబ్ ఇప్పటికే కెమెరాను వాడుతోంది. దాన్ని మూసివేసి — సాధారణంగా వీడియో కాల్స్ కారణం — మళ్లీ ప్రయత్నించండి.',
      },
      insecure: {
        title: 'కెమెరాకు సురక్షిత కనెక్షన్ అవసరం',
        body: 'బ్రౌజర్లు HTTPS ద్వారా (లేదా localhostలో) మాత్రమే కెమెరాను అనుమతిస్తాయి. ఈ పేజీని https:// ద్వారా తెరిచి మళ్లీ ప్రయత్నించండి.',
      },
      unsupported: {
        title: 'ఈ బ్రౌజర్ కెమెరాను తెరవలేదు',
        body: 'వెబ్ పేజీ నుండి కెమెరా వాడకాన్ని ఈ బ్రౌజర్ సపోర్ట్ చేయదు. Safari, Chrome, Edge లేదా Firefox తాజా వెర్షన్‌లో ప్రయత్నించండి.',
      },
      iframe: {
        title: 'ఎంబెడ్ చేసిన ఫ్రేమ్‌లో కెమెరా నిరోధించబడింది',
        body: 'ఈ పేజీ కెమెరా అనుమతి ఇవ్వని iframeలో నడుస్తోంది. దీన్ని వేరే ట్యాబ్‌లో తెరవండి, లేదా ఎంబెడ్ చేసే పేజీ iframeపై allow="camera" పెట్టాలి.',
      },
      other: {
        title: 'కెమెరాను ప్రారంభించలేకపోయాం',
        body: 'బ్రౌజర్ వర్గీకరించని కారణంతో కెమెరాను నిరాకరించింది. అసలు లోపం కింద చూపబడింది.',
      },
    },
    asking: 'కెమెరా అనుమతి అడుగుతోంది…',
    cameraOff: 'కెమెరా ఆఫ్‌లో ఉంది.',
    scanning: 'స్కాన్ చేస్తోంది',
    stopCamera: 'కెమెరా ఆపు',
    starting: 'ప్రారంభమవుతోంది…',
    startCamera: 'కెమెరా ప్రారంభించు',
    framesOne: '{n} ఫ్రేమ్ తనిఖీ చేయబడింది',
    framesMany: '{n} ఫ్రేమ్‌లు తనిఖీ చేయబడ్డాయి',
    videoRefusedTitle: 'వీడియో ప్లే అవడానికి నిరాకరించింది',
    videoRefusedBody:
      'కెమెరా తెరిచి ఉంది, స్కానింగ్ కొనసాగుతోంది — ఇది సాధారణంగా బ్రౌజర్ ఆటోప్లే నియమం వల్ల, హానికరం కాదు. కనిపించకుండా ఉండకూడదని తెలియజేస్తున్నాం.',
    decoderFailed: 'డీకోడర్‌ను లోడ్ చేయలేకపోయాం',
    looking: 'బార్‌కోడ్ కోసం చూస్తోంది… దాన్ని ఫ్రేమ్ లోపల, వెడల్పులో ఎక్కువ భాగం నిండేలా పట్టుకోండి.',
    wrongKindTitle: 'అది {format}, వస్తువు బార్‌కోడ్ కాదు',
    wrongKindBody: 'స్కాన్ సరిగ్గానే అయింది — కానీ ఈ కోడ్ రిటైల్ బార్‌కోడ్ కాదు. ఇందులో ఉన్నది:',
    detected: 'బార్‌కోడ్ గుర్తించబడింది',
    lastDecoded: 'చివరిగా చదివిన విలువ',
    clearLastAria: 'చివరిగా చదివిన విలువను తొలగించు',
    nothingSaved:
      'ఏదీ సేవ్ కాలేదు. ఈ నమూనా కోడ్‌ను చదువుతుంది మాత్రమే — దాన్ని వస్తువుతో సరిపోల్చడం తర్వాతి దశలో వస్తుంది.',
    diagnostics: 'సాంకేతిక వివరాలు',
    dSecure: 'సురక్షిత సందర్భం',
    dOrigin: 'మూలం',
    dIframe: 'iframeలో ఉందా',
    dPermission: 'Permissions API కెమెరా స్థితి',
    dInputs: 'వీడియో ఇన్‌పుట్ పరికరాలు',
    dVideo: 'వీడియో ఎలిమెంట్',
    dFrames: 'తనిఖీ చేసిన ఫ్రేమ్‌లు',
    dLastError: 'చివరి లోపం',
    notSampled: 'ఇంకా నమూనా తీయలేదు',
    none: 'ఏమీ లేదు',
    pagePrototype: 'నమూనా',
    pageTitle: 'బార్‌కోడ్ స్కానర్',
    pageIntro:
      'కెమెరాను వస్తువు బార్‌కోడ్ వైపు చూపండి. చదివిన సంఖ్య కింద కనిపిస్తుంది — ఏదీ వెతకబడదు, ఏదీ సేవ్ కాదు. దీన్ని మీ నిల్వకు, కౌంటర్‌కు కలపడం తర్వాతి రెండు దశల్లో వస్తుంది.',
    pageCanReadTitle: 'ఇది ఏవి చదవగలదు',
    pageCanReadBody:
      'EAN-13, EAN-8, UPC-A, UPC-E మరియు ITF — రిటైల్ ప్యాకేజింగ్‌పై ముద్రించే బార్‌కోడ్‌లు. ఇది QR కోడ్‌లు, Code 128ను కూడా గుర్తిస్తుంది, కానీ వాటిని వస్తువులుగా కాకుండా వేరే రకం కోడ్‌గా తెలియజేస్తుంది.',
    pagePrivacy:
      'కెమెరా చిత్రాలు మీ పరికరం దాటి వెళ్లవు: ఫ్రేమ్‌లు బ్రౌజర్‌లోనే డీకోడ్ అవుతాయి, ఎక్కడికీ అప్‌లోడ్ కావు.',
  },
  meta: {
    dashboard: {
      title: 'డాష్‌బోర్డ్',
      description: 'ఈరోజు వసూళ్లు, తక్కువ నిల్వ, మీ దుకాణంలో గమనించాల్సినవి.',
    },
    inventory: {
      title: 'నిల్వ',
      description: 'మీరు ఉంచే ప్రతి వస్తువు, ఏది తక్కువగా ఉంది, ఏది గడువుకు దగ్గరగా ఉంది.',
    },
    sales: {
      title: 'అమ్మకాలు',
      description: 'అమ్మకాలు నమోదు చేయండి, మీ దుకాణం చేసిన ప్రతి లావాదేవీని చూడండి.',
    },
    reports: {
      title: 'నివేదికలు',
      description: 'మీ దుకాణం కాలవారీ నివేదికలు, CSV లేదా PDFగా ఎగుమతి చేయవచ్చు.',
    },
    customers: {
      title: 'కస్టమర్లు',
      description: 'మీ దగ్గర కొనేవారు, వారు ఏమి కొంటారు.',
    },
    suppliers: {
      title: 'సరఫరాదారులు',
      description: 'మీరు ఎవరి దగ్గర కొంటారు, ప్రతి డెలివరీ ఎక్కడ ఉంది.',
    },
    staff: { title: 'సిబ్బంది షెడ్యూల్', description: 'ఈ వారం, ప్రతి షిఫ్ట్‌లో ఎవరు ఉన్నారు.' },
    team: { title: 'బృందం', description: 'మీ దుకాణంలో పనిచేసే అందరూ, వారు ఏమి చేయగలరు.' },
    monitoring: { title: 'పర్యవేక్షణ', description: 'దుకాణంలోని చెకౌట్ల ప్రత్యక్ష స్థితి.' },
    settings: {
      title: 'దుకాణ సెట్టింగ్‌లు',
      description: 'దుకాణ వివరాలు, రూపం, నిర్వహణ పరిమితులు.',
    },
    categories: {
      title: 'వస్తువుల వర్గాలు',
      description: 'మీ వస్తువులను ఉంచే వర్గాలను జోడించండి, పేరు మార్చండి, క్రమం మార్చండి.',
    },
    profile: { title: 'ప్రొఫైల్', description: 'మీ పేరు, ఫోటో, సంప్రదింపు వివరాలు, పాస్‌వర్డ్.' },
    audit: { title: 'కార్యకలాపాలు', description: 'ఎవరు ఏమి ఎప్పుడు మార్చారో రికార్డు.' },
    help: {
      title: 'సహాయ కేంద్రం',
      description: 'StockPulseలో మీ దుకాణం నడపడానికి మార్గదర్శకాలు, సపోర్ట్‌ను సంప్రదించే మార్గం.',
    },
    support: { title: 'సహాయం', description: 'సహాయ కేంద్రం నుండి వచ్చిన అభ్యర్థనలు.' },
    scan: {
      title: 'బార్‌కోడ్ స్కానర్ (నమూనా)',
      description: 'కెమెరా బార్‌కోడ్ స్కానింగ్ ప్రత్యేక పరీక్ష. కోడ్‌ను చదివి చూపిస్తుంది.',
    },
  },
}

const hi: OperationsCopy = {
  server: {
    missingBarcode:
      'इस डेटाबेस पर बारकोड अभी सेट नहीं हैं। Supabase SQL एडिटर में supabase/migrations/0014_product_barcode.sql चलाएँ।',
    missingBatches:
      'इस डेटाबेस पर एक्सपायरी ट्रैकिंग अभी सेट नहीं है। Supabase SQL एडिटर में supabase/migrations/0016_product_batches.sql चलाएँ।',
    lotRefused:
      'वह स्टॉक लॉट बदला नहीं जा सका — हो सकता है वह अभी-अभी हटाया गया हो, या आपके खाते को अनुमति न हो। रीफ़्रेश करके फिर कोशिश करें।',
    productNotSaved: 'वह सामान सेव नहीं हो सका — हो सकता है वह अभी-अभी हटाया गया हो। रीफ़्रेश करके फिर कोशिश करें।',
    productInPastSales:
      'यह सामान पुरानी बिक्री में शामिल है, इसलिए हटाया नहीं जा सकता। इसे बंद करने के लिए इसका स्टॉक 0 कर दें।',
    importTooMany: 'एक इम्पोर्ट में बहुत ज़्यादा पंक्तियाँ (सीमा {limit})।',
    notifLowTitle: 'कम स्टॉक',
    notifOutTitle: 'स्टॉक ख़त्म',
    notifLowBody: '{name} घटकर {n} रह गया ({min} पर दोबारा ऑर्डर करें)।',
    notifRevokedTitle: 'निमंत्रण रद्द',
    notifRevokedBody: '{name} का निमंत्रण रद्द कर दिया गया।',
    notifInvitedTitle: 'नए टीम सदस्य को बुलाया गया',
    notifInvitedBody: '{name} को {role} के रूप में बुलाया गया।',
    storeNameRequired: 'आपकी दुकान का एक नाम होना चाहिए।',
    storeNameTooLong: 'दुकान का नाम 120 अक्षरों या उससे कम रखें।',
    nameRequired: 'कृपया अपना नाम डालें।',
    nameTooLong: 'अपना नाम 120 अक्षरों या उससे कम रखें।',
    accountFailed: 'खाता नहीं बन सका। कृपया फिर कोशिश करें।',
    notAuthenticated: 'साइन इन नहीं है',
    ownerOnlyInvites: 'निमंत्रण सिर्फ़ दुकान का मालिक संभाल सकता है।',
    notInStore: 'वह टीम सदस्य इस दुकान में नहीं है।',
    ownerCannotRevoke: 'दुकान के मालिक को रद्द नहीं किया जा सकता।',
    alreadyAccepted: 'उस व्यक्ति ने पहले ही स्वीकार कर लिया है — कोई लंबित निमंत्रण नहीं है।',
    inviteRateLimited:
      'ईमेल भेजने पर सीमा लगी है। यह प्रोजेक्ट अभी Supabase का बिल्ट-इन SMTP इस्तेमाल कर रहा है, जो घंटे में कुछ ही संदेश भेजने देता है। निमंत्रण भरोसे से भेजने के लिए Project Settings → Authentication → SMTP Settings में कस्टम SMTP सेट करें।',
    ownerOnlyAddStaff: 'स्टाफ़ सिर्फ़ दुकान का मालिक जोड़ सकता है।',
    inviteNameRequired: 'उस व्यक्ति का नाम डालें।',
    inviteNameTooLong: 'नाम 120 अक्षरों या उससे कम रखें।',
    inviteBadRole: 'इस टीम सदस्य के लिए सही भूमिका चुनें।',
    staffAccountFailed: 'स्टाफ़ खाता नहीं बन सका।',
  },
  categoryNames: {
    produce: 'सब्ज़ी-फल',
    dairy: 'दूध व अंडे',
    packaged: 'पैक्ड सामान',
    beverages: 'पेय',
    household: 'घरेलू सामान',
  },
  monitoring: {
    eyebrow: 'लाइव संचालन',
    title: 'लाइव ऑपरेशंस सेंटर',
    subtitleOne: '{n} सेल्फ़-चेकआउट स्टेशन की निगरानी',
    subtitleMany: '{n} सेल्फ़-चेकआउट स्टेशनों की निगरानी',
    statAlerts: 'सक्रिय अलर्ट',
    statAlertsHint: 'तुरंत ध्यान दें',
    statActive: 'सक्रिय स्टेशन',
    statActiveHint: 'सही उपयोग',
    statRate: 'मौजूदा हस्तक्षेप दर',
    statRateHint: 'अभी {n} पर ध्यान चाहिए',
    setupTitle: 'स्टेशन सेटअप',
    setupIntroManage: 'आपकी दुकान में जो काउंटर सच में हैं, उन्हें जोड़ें, और वही नाम दें जो आपका स्टाफ़ बोलता है।',
    setupIntroView: 'इस दुकान के लिए सेट किए गए काउंटर। इन्हें बदलने के लिए मालिक या मैनेजर से कहें।',
    configured: '{n} सेट हैं',
    newNamePlaceholder: 'काउंटर का नाम (वैकल्पिक) — जैसे एक्सप्रेस',
    newNameAria: 'नए काउंटर का नाम',
    addCounter: 'काउंटर जोड़ें',
    noCounters: 'अभी कोई काउंटर सेट नहीं है।',
    renameAria: '{name} का नाम बदलें',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    rename: 'नाम बदलें',
    confirm: 'पक्का करें',
    remove: 'हटाएँ',
    stationN: 'स्टेशन {n}',
    paymentCashCard: 'नकद और कार्ड',
    emptyTitle: 'अभी कोई चेकआउट स्टेशन सेट नहीं है',
    emptyBody: 'लाइव चेकआउट गतिविधि की निगरानी शुरू करने के लिए अपनी लेन सेट करें।',
    setUpFour: '4 स्टेशन सेट करें',
    status: {
      available: 'ख़ाली',
      in_use: 'उपयोग में',
      review: 'समीक्षा',
      assistance: 'मदद चाहिए',
      maintenance: 'मेंटेनेंस',
    },
    badge: {
      available: 'ख़ाली',
      in_use: 'उपयोग में',
      review: 'समीक्षा',
      assistance: 'मदद',
      maintenance: 'मेंटेनेंस',
    },
    weightLine1: 'वज़न',
    weightLine2: 'मेल नहीं',
    ageLine1: 'उम्र',
    ageLine2: 'सत्यापन',
    expected: 'अपेक्षित: {v} कि.ग्रा.',
    actual: 'वास्तविक: {v} कि.ग्रा.',
    itemsScanned: 'स्कैन हुए सामान',
    currentTotal: 'मौजूदा कुल',
    sessionTime: 'सत्र का समय',
    waitingForCustomer: 'ग्राहक का इंतज़ार',
    working: 'काम चल रहा है…',
    overrideApprove: 'ओवरराइड कर मंज़ूर करें',
    verifyId: 'कैमरे से ID जाँचें',
    ownerApproval: 'मालिक की मंज़ूरी ज़रूरी',
    basketOne: '{n} सामान',
    basketMany: '{n} सामान',
    endMaintenance: 'मेंटेनेंस ख़त्म करें',
    maintenanceMode: 'मेंटेनेंस मोड',
    removeQuestion: 'यह काउंटर हटाएँ?',
    removeCounter: 'काउंटर हटाएँ',
    dispatchStaff: 'स्टाफ़ भेजें',
    tClearFailed: 'अलर्ट हटाया नहीं जा सका',
    tCleared: 'अलर्ट हटाया गया',
    tStatusFailed: 'स्टेशन की स्थिति बदली नहीं जा सकी',
    tOffline: 'स्टेशन ऑफ़लाइन किया गया',
    tOnline: 'स्टेशन फिर ऑनलाइन',
    tDispatchFailed: 'स्टाफ़ भेजा नहीं जा सका',
    tDispatched: 'स्टाफ़ भेजा गया',
    tRemoveFailed: 'काउंटर हटाया नहीं जा सका',
    tNotRemoved: 'काउंटर नहीं हटा',
    tNotRemovedBody:
      'कुछ नहीं हटाया गया — हो सकता है यह काउंटर पहले ही हट चुका हो। अगर यह बोर्ड पर बना रहे, तो supabase/migrations/0012_checkout_stations_delete_policy.sql लागू करें।',
    tRemoved: 'काउंटर हटाया गया',
    tAddFailed: 'काउंटर जोड़ा नहीं जा सका',
    tAddedNoName: '{name} बिना नाम के जोड़ा गया',
    tAddedNoNameBody:
      'काउंटर जोड़ दिया गया, लेकिन नाम देने के लिए पहले supabase/migrations/0020_checkout_station_name.sql लागू करना होगा।',
    tAdded: 'काउंटर जोड़ा गया',
    tNamingNeedsMigration:
      'काउंटर को नाम देने के लिए पहले supabase/migrations/0020_checkout_station_name.sql लागू करना होगा।',
    tRenameFailed: 'काउंटर का नाम बदला नहीं जा सका',
    tNotRenamed: 'काउंटर का नाम नहीं बदला',
    tNotRenamedBody:
      'कोई नाम नहीं बदला। काउंटर का नाम बदलना मैनेजर या मालिक का काम है, और हो सकता है काउंटर अभी-अभी हटाया गया हो।',
    tRenamed: 'काउंटर का नाम बदला गया',
  },
  offline: {
    offline: 'आप ऑफ़लाइन हैं।',
    savedFrom: '{time} के सेव किए सामान दिखा रहे हैं। आप जो बिक्री पूरी करेंगे, वह इस डिवाइस पर सेव होगी।',
    savedNoTime: 'सेव किए सामान दिखा रहे हैं। आप जो बिक्री पूरी करेंगे, वह इस डिवाइस पर सेव होगी।',
    backOnline: 'फिर ऑनलाइन।',
    tryAgain: 'फिर कोशिश करें',
    goneOne: 'सेव की गई {n} बिक्री इस डिवाइस से ग़ायब हो गई',
    goneMany: 'सेव की गई {n} बिक्रियाँ इस डिवाइस से ग़ायब हो गईं',
    goneBodyOne:
      'इस डिवाइस पर {expected} थीं और अब {actual} हैं। इस ऐप ने इसे नहीं हटाया, इसलिए हो सकता है ब्राउज़र ने स्टोरेज साफ़ कर दी हो। जो बिक्री सिंक नहीं हुई थी, वह कहीं दर्ज नहीं है — आज की कमाई गल्ले से मिलाकर देखें।',
    goneBodyMany:
      'इस डिवाइस पर {expected} थीं और अब {actual} हैं। इस ऐप ने इन्हें नहीं हटाया, इसलिए हो सकता है ब्राउज़र ने स्टोरेज साफ़ कर दी हो। जो बिक्री सिंक नहीं हुई थी, वह कहीं दर्ज नहीं है — आज की कमाई गल्ले से मिलाकर देखें।',
    waitingOne: '{n} बिक्री सिंक होने का इंतज़ार कर रही है · {total}',
    waitingMany: '{n} बिक्रियाँ सिंक होने का इंतज़ार कर रही हैं · {total}',
    lineOne: '{time} · {n} सामान · {total}',
    lineMany: '{time} · {n} सामान · {total}',
    andMore: 'और {n}।',
    tried: ' ({n} बार कोशिश हुई)',
    syncing: 'सिंक हो रहा है…',
    waitingSignal: 'सिग्नल का इंतज़ार',
    syncNow: 'अभी सिंक करें',
    staysOnDevice: 'ऑनलाइन आने तक ये इसी डिवाइस पर रहेंगी।',
    oldestFirst: 'ये एक-एक करके भेजी जाती हैं, सबसे पुरानी पहले।',
    tDiscrepancyOne: '{n} सामान पर स्टॉक का हिसाब नहीं मिला',
    tDiscrepancyMany: '{n} सामानों पर स्टॉक का हिसाब नहीं मिला',
    tDiscrepancyLine: '{name}: {sold} बिके, सिर्फ़ {left} बचे थे',
    tDiscrepancyBodyOne: '{lines}। बिक्री दर्ज हो गई और स्टॉक अब 0 है — कृपया शेल्फ़ जाँच लें।',
    tDiscrepancyBodyMany: '{lines}। बिक्रियाँ दर्ज हो गईं और स्टॉक अब 0 है — कृपया शेल्फ़ जाँच लें।',
    tSynced: 'ऑफ़लाइन बिक्रियाँ सिंक हुईं',
    tSent: '{n} भेजी गईं',
    tAlreadyRecorded: '{n} पहले से दर्ज थीं',
    tFailedOne: '{n} बिक्री सिंक नहीं हो सकी',
    tFailedMany: '{n} बिक्रियाँ सिंक नहीं हो सकीं',
    tUnknownReason: 'कारण पता नहीं।',
    tSeeBelow: 'नीचे की सूची देखें।',
    tStillSaved: 'ये अब भी इस डिवाइस पर सेव हैं।',
  },
  scanner: {
    faults: {
      denied: {
        title: 'कैमरे की अनुमति नहीं मिली',
        body: 'यह दो अलग-अलग जगह तय होता है, और दोनों में अनुमति चाहिए। Chrome या Safari में, एड्रेस बार के बाईं ओर ताले या आइकन पर टैप करें, Camera को Allow करें, फिर पेज रीलोड करें। अलग से, Android पर Settings → Apps → Chrome → Permissions → Camera देखें; iPhone पर Settings → Safari → Camera।',
      },
      'no-camera': {
        title: 'कोई कैमरा नहीं मिला',
        body: 'इस डिवाइस में ऐसा कोई कैमरा नहीं जिस तक ब्राउज़र पहुँच सके। अगर आप डेस्कटॉप पर हैं, तो फ़ोन या टैबलेट पर फिर कोशिश करें, या वेबकैम लगाकर रीलोड करें।',
      },
      'in-use': {
        title: 'कैमरा कहीं और इस्तेमाल हो रहा है',
        body: 'कोई और ऐप या ब्राउज़र टैब पहले से कैमरा इस्तेमाल कर रहा है। उसे बंद करें — अक्सर वीडियो कॉल वजह होती है — और फिर कोशिश करें।',
      },
      insecure: {
        title: 'कैमरे के लिए सुरक्षित कनेक्शन चाहिए',
        body: 'ब्राउज़र कैमरा सिर्फ़ HTTPS पर (या localhost पर) इस्तेमाल करने देते हैं। यह पेज https:// से खोलकर फिर कोशिश करें।',
      },
      unsupported: {
        title: 'यह ब्राउज़र कैमरा नहीं खोल सकता',
        body: 'यह ब्राउज़र वेब पेज से कैमरा इस्तेमाल करने का समर्थन नहीं करता। Safari, Chrome, Edge या Firefox का नया वर्शन आज़माएँ।',
      },
      iframe: {
        title: 'एम्बेड किए फ़्रेम में कैमरा ब्लॉक है',
        body: 'यह पेज ऐसे iframe में चल रहा है जिसे कैमरे की अनुमति नहीं मिली। इसे अलग टैब में खोलें, या एम्बेड करने वाले पेज को iframe पर allow="camera" लगाना होगा।',
      },
      other: {
        title: 'कैमरा शुरू नहीं हो सका',
        body: 'ब्राउज़र ने किसी ऐसे कारण से कैमरा मना किया जिसे उसने बताया नहीं। असली त्रुटि नीचे दिखाई गई है।',
      },
    },
    asking: 'कैमरे की अनुमति माँगी जा रही है…',
    cameraOff: 'कैमरा बंद है।',
    scanning: 'स्कैन हो रहा है',
    stopCamera: 'कैमरा बंद करें',
    starting: 'शुरू हो रहा है…',
    startCamera: 'कैमरा शुरू करें',
    framesOne: '{n} फ़्रेम जाँचा गया',
    framesMany: '{n} फ़्रेम जाँचे गए',
    videoRefusedTitle: 'वीडियो चलने से मना कर दिया',
    videoRefusedBody:
      'कैमरा खुला है और स्कैनिंग जारी है — यह आमतौर पर ब्राउज़र की ऑटोप्ले नीति की वजह से होता है और नुक़सानदेह नहीं है। बताया इसलिए ताकि यह छिपा न रहे।',
    decoderFailed: 'डिकोडर लोड नहीं हो सका',
    looking: 'बारकोड ढूँढ रहे हैं… उसे फ़्रेम के अंदर रखें, ताकि चौड़ाई का ज़्यादातर हिस्सा भर जाए।',
    wrongKindTitle: 'यह {format} है, सामान का बारकोड नहीं',
    wrongKindBody: 'स्कैन ठीक से हुआ — बस यह कोड रिटेल बारकोड नहीं है। इसमें लिखा है:',
    detected: 'बारकोड मिल गया',
    lastDecoded: 'आख़िरी पढ़ा गया मान',
    clearLastAria: 'आख़िरी पढ़ा गया मान हटाएँ',
    nothingSaved:
      'कुछ भी सेव नहीं हुआ। यह प्रोटोटाइप सिर्फ़ कोड पढ़ता है — उसे सामान से मिलाना बाद के चरण में आएगा।',
    diagnostics: 'तकनीकी जानकारी',
    dSecure: 'सुरक्षित संदर्भ',
    dOrigin: 'ओरिजिन',
    dIframe: 'iframe में है',
    dPermission: 'Permissions API कैमरा स्थिति',
    dInputs: 'वीडियो इनपुट डिवाइस',
    dVideo: 'वीडियो एलिमेंट',
    dFrames: 'जाँचे गए फ़्रेम',
    dLastError: 'आख़िरी त्रुटि',
    notSampled: 'अभी जाँचा नहीं गया',
    none: 'कोई नहीं',
    pagePrototype: 'प्रोटोटाइप',
    pageTitle: 'बारकोड स्कैनर',
    pageIntro:
      'कैमरे को सामान के बारकोड की ओर करें। पढ़ा गया नंबर नीचे दिखेगा — न कुछ खोजा जाता है, न कुछ सेव होता है। इसे आपके स्टॉक और काउंटर से जोड़ना अगले दो चरणों में आएगा।',
    pageCanReadTitle: 'यह क्या पढ़ सकता है',
    pageCanReadBody:
      'EAN-13, EAN-8, UPC-A, UPC-E और ITF — रिटेल पैकिंग पर छपे बारकोड। यह QR कोड और Code 128 भी पहचानता है, लेकिन उन्हें सामान मानने के बजाय ग़लत तरह का कोड बताता है।',
    pagePrivacy:
      'कैमरे की तस्वीरें आपके डिवाइस से बाहर नहीं जातीं: फ़्रेम ब्राउज़र में ही पढ़े जाते हैं और कहीं अपलोड नहीं होते।',
  },
  meta: {
    dashboard: {
      title: 'डैशबोर्ड',
      description: 'आज की कमाई, कम स्टॉक, और आपकी दुकान में किस पर ध्यान देना है।',
    },
    inventory: {
      title: 'स्टॉक',
      description: 'आपका हर सामान, क्या कम हो रहा है, और क्या एक्सपायरी के क़रीब है।',
    },
    sales: {
      title: 'बिक्री',
      description: 'बिक्री दर्ज करें और अपनी दुकान का हर लेन-देन देखें।',
    },
    reports: {
      title: 'रिपोर्ट',
      description: 'आपकी दुकान की अवधि-वार रिपोर्ट, CSV या PDF में एक्सपोर्ट करने लायक।',
    },
    customers: {
      title: 'ग्राहक',
      description: 'आपसे ख़रीदने वाले लोग, और वे क्या ख़रीदते हैं।',
    },
    suppliers: {
      title: 'सप्लायर',
      description: 'आप किससे ख़रीदते हैं, और हर डिलीवरी कहाँ तक पहुँची।',
    },
    staff: { title: 'स्टाफ़ शेड्यूल', description: 'यह हफ़्ता, और हर शिफ़्ट पर कौन है।' },
    team: { title: 'टीम', description: 'आपकी दुकान में काम करने वाले सभी लोग, और वे क्या कर सकते हैं।' },
    monitoring: { title: 'निगरानी', description: 'दुकान के सभी चेकआउट की लाइव स्थिति।' },
    settings: {
      title: 'दुकान सेटिंग्स',
      description: 'दुकान का विवरण, रूप-रंग, और संचालन की सीमाएँ।',
    },
    categories: {
      title: 'सामान की श्रेणियाँ',
      description: 'जिन श्रेणियों में सामान रखे जाते हैं, उन्हें जोड़ें, नाम बदलें और क्रम बदलें।',
    },
    profile: { title: 'प्रोफ़ाइल', description: 'आपका नाम, फ़ोटो, संपर्क विवरण और पासवर्ड।' },
    audit: { title: 'गतिविधि', description: 'किसने क्या और कब बदला, इसका रिकॉर्ड।' },
    help: {
      title: 'हेल्प सेंटर',
      description: 'StockPulse में दुकान चलाने के लिए गाइड, और सपोर्ट से संपर्क का तरीक़ा।',
    },
    support: { title: 'सहायता', description: 'हेल्प सेंटर से आए अनुरोध।' },
    scan: {
      title: 'बारकोड स्कैनर (प्रोटोटाइप)',
      description: 'कैमरे से बारकोड स्कैनिंग का अलग परीक्षण। कोड पढ़कर दिखाता है।',
    },
  },
}

export const OPERATIONS_COPY: Record<Locale, OperationsCopy> = { en, te, hi }
