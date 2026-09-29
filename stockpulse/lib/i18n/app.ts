import type { Locale } from './locales'
import { OPERATIONS_COPY, type OperationsCopy } from './operations'

/**
 * THE AUTHENTICATED APP'S COPY.
 *
 * STAGE 1 COVERS THE SHELL: navigation, page titles, the topbar, the mobile
 * header and tab bar, and the few strings the dashboard layout renders itself.
 * That is what every screen shows, so translating it is what makes the chosen
 * language visibly follow a user from the landing page through sign-in and
 * across the app. The screens' own bodies — Inventory, POS, Reports and the
 * rest — are still English and are the next stage; the note at the foot of
 * this file says how to extend it.
 *
 * ROLE LABELS ARE DUPLICATED HERE ON PURPOSE. lib/permissions.ts has
 * ROLE_LABELS, but that file mirrors the database's can_manage() and is one
 * half of a pair CLAUDE.md warns must be changed together. Display strings do
 * not belong in it, so the translated labels live here and permissions.ts is
 * left alone.
 *
 * NOT TRANSLATED, DELIBERATELY: "StockPulse" (a product name), and the store's
 * own name, product names, categories and figures — the shop's data, not our
 * copy.
 *
 * TRANSLATION NOTE: written for a shopkeeper, not transliterated, and NOT yet
 * reviewed by a native speaker. The stock and money vocabulary matters more
 * here than on the landing page — a review before customers see it is worth
 * more here than anywhere else in the product.
 */

/**
 * ExpiryTag's words, exported as their own type because that component is one
 * of the few rendered on BOTH sides of the sign-in — the landing page's
 * product panels are Server Components with no AppCopyProvider above them. It
 * therefore takes this as a PROP rather than reading a hook, which keeps it a
 * Server Component and keeps the state word and the relative phrase travelling
 * together, so a single line can never come out half translated.
 *
 * {n} is a day or lot count.
 *
 * MONTH NAMES ARE HERE, and this reverses an earlier decision. They were left
 * in English on the argument that a shelf label prints "Sep". That argument
 * did not survive contact with the rest of the app: once <LocalDate> follows
 * the chosen language, a Telugu sales row reads "24 ఆగ" while the expiry tag
 * beside it still reads "24 Aug 2026" — one line, two languages, which reads
 * as a bug rather than as a convention. The abbreviations are ICU's own short
 * forms for te-IN and hi-IN, and the numerals stay Latin because that is what
 * both those locales use.
 */
export type ExpiryCopy = {
  /** Twelve short month names, January first, for formatExpiry. */
  months: readonly string[]
  expired: string
  expiringSoon: string
  expires: string
  noDate: string
  moreLot: string
  moreLots: string
  relToday: string
  relTomorrow: string
  relYesterday: string
  relInDays: string
  relDaysAgo: string
}

/**
 * /inventory's copy, named rather than inlined because it is large enough that
 * an inline literal would bury the rest of AppCopy.
 */
export type InventoryCopy = {
  eyebrow: string
  title: string
  subtitle: string
  scan: string
  importCsv: string
  addProduct: string
  searchAria: string
  searchPlaceholder: string
  filterByStatus: string
  allCategories: string
  statusAny: string
  statusIn: string
  statusLow: string
  statusOut: string
  badgeIn: string
  badgeLow: string
  badgeOut: string
  totalValue: string
  lowStock: string
  outOfStock: string
  /** "{n} items" */
  itemsCount: string
  /** Plural noun for the CSV export toasts ("153 products exported"). */
  exportItems: string
  colProduct: string
  colSkuCategory: string
  colUnitPrice: string
  colStock: string
  colExpiry: string
  colStatus: string
  colActions: string
  /** "SKU: {v}" / "Barcode: {v}" / "Min: {v}" */
  skuPrefix: string
  barcodePrefix: string
  minPrefix: string
  /** "Edit {name}" / "Delete {name}" */
  editRow: string
  deleteRow: string
  emptyTitle: string
  emptyBody: string
  noMatchTitle: string
  noMatchBody: string
  scanTitle: string
  scanHelp: string
  scanLooking: string
  scanFoundTitle: string
  /** "{name} \u2014 {state} {date}, {rel}." */
  scanFoundExpiry: string
  scanFoundNoExpiry: string
  scanExpiredWord: string
  scanExpiresWord: string
  scanNoMatchTitle: string
  scanNoMatchBody: string
  /** "{name} is in your saved list, but editing stock needs a connection." */
  scanCacheHit: string
  /** "{code}" is the scanned barcode. */
  scanCacheMiss: string
  scanFailed: string
  deleteTitle: string
  /** Two fragments around the product's name, which renders bold between. */
  deleteBodyA: string
  deleteBodyB: string
  deleteConfirm: string
  deleteFailed: string
  deleteFailedToast: string
  deletedToast: string
  formEdit: string
  formAdd: string
  saveChanges: string
  fName: string
  fBrand: string
  fSku: string
  fBarcode: string
  barcodeHint: string
  barcodePlaceholder: string
  fCategory: string
  manageCategories: string
  fPrice: string
  fUnit: string
  unitPlaceholder: string
  fThreshold: string
  lotsLegend: string
  lotsHelp: string
  fQuantity: string
  fExpiryDate: string
  optional: string
  /** "Remove lot {n}" */
  removeLot: string
  addLot: string
  totalStock: string
  saveFailed: string
  updateFailedToast: string
  addFailedToast: string
  updatedToast: string
  addedToast: string
  photoLabel: string
  photoReplace: string
  photoAdd: string
  photoRemove: string
  photoHint: string
  photoChooseAria: string
  photoAdjustTitle: string
  photoUseImage: string
  photoTypeError: string
  /** "{mb}" is the file's size in MB. */
  photoSizeError: string
  photoBucketError: string
  /** "{msg}" is the storage error. */
  photoUploadError: string
  detailsTitle: string
  detailsLoading: string
  openInInventory: string
  noBrand: string
  dSku: string
  dBarcode: string
  dCategory: string
  dBrand: string
  dPrice: string
  dUnit: string
  dCurrentStock: string
  dMinStock: string
  dInventoryValue: string
  dNextExpiry: string
  noExpiryDate: string
  batchesHeading: string
  noBatches: string
  lotQuantity: string
  lotExpiry: string
  lotReceived: string
  lotNote: string
  notFoundTitle: string
  notFoundBody: string
  importTitle: string
  /**
   * Three fragments around the literal column names Name and SKU, which stay
   * English because they ARE the CSV's headers. Telugu and Hindi put the noun
   * first, so importIntroA is empty in both - that is correct, not a gap.
   */
  importIntroA: string
  importIntroB: string
  importIntroC: string
  requiredLabel: string
  optionalLabel: string
  formatNote: string
  newToThis: string
  sampleBlurb: string
  downloadSample: string
  chooseFile: string
  chooseAnother: string
  /** "Import {n} row" / "Import {n} rows" */
  importRow: string
  importRows: string
  statToAdd: string
  statToUpdate: string
  statProblems: string
  colLine: string
  colImportProduct: string
  colAction: string
  actAdd: string
  actUpdate: string
  actSkip: string
  /** "{cols}" is the comma-joined list. */
  unknownCol: string
  unknownCols: string
  replacesLots: string
  errTooBig: string
  /** "{cols}" is the missing header list. */
  errMissingCol: string
  errNoRows: string
  errNotCsv: string
  nothingToImport: string
  nothingToImportBody: string
  importFailed: string
  importedProblems: string
  importComplete: string
  /** "{n} added" / "{n} updated" / "{n} failed" */
  sumAdded: string
  sumUpdated: string
  sumFailed: string
  /**
   * The Server Actions' own replies. Copy belongs here rather than in the
   * action file, and the action resolves it from the cookie itself - a message
   * the browser supplied is not one the server should repeat back.
   */
  actNoPermission: string
  actFixFields: string
  actSkuExists: string
  actBadBarcode: string
  actNoImportPermission: string
  actNothingToImport: string
  /** "{v}" is the repeated SKU or barcode. */
  dupSku: string
  dupBarcode: string
}

/** /sales, its table, its panels and the Log a Sale dialog. */
export type PosCopy = {
  eyebrow: string
  title: string
  /** "{week}" and "{avg}" are already-formatted money. */
  subtitleRevenue: string
  subtitlePlain: string
  logSale: string
  transactions: string
  weeklyPerformance: string
  revenue7: string
  popularCategories: string
  noSalesDataTitle: string
  noSalesDataBody: string
  recentTransactions: string
  salesHistory: string
  searchPlaceholder: string
  searchAria: string
  filterByMethod: string
  methodAny: string
  methodCash: string
  methodCard: string
  methodNfc: string
  /**
   * The short forms the table cell and the CSV carry. NFC names a technology
   * (like QR or SKU) and stays as it is in every language. CC is English
   * shorthand for "credit card", so Telugu and Hindi use their own word for
   * card — the same word the method filter above the table uses.
   */
  labelCash: string
  labelCard: string
  labelNfc: string
  from: string
  to: string
  colDateTime: string
  colOrderId: string
  colAmount: string
  colMethod: string
  colSoldBy: string
  noSalesTitle: string
  noSalesBody: string
  noMatchTitle: string
  noMatchBody: string
  topSelling: string
  noTopTitle: string
  noTopBody: string
  /** "{n} units sold" */
  unitsSold: string
  viewInventory: string
  modalTitle: string
  total: string
  completeSale: string
  loggingSale: string
  hideScanner: string
  scanBarcode: string
  scanLooking: string
  scannedOne: string
  scannedMany: string
  searchProducts: string
  /** "{n} in stock" */
  inStock: string
  emptyCartTitle: string
  emptyCartBody: string
  /** "{price} each" */
  eachPrice: string
  paymentMethod: string
  /** "{code}" is the scanned barcode, "{name}" the product. */
  scanNoSavedMatch: string
  scanNoMatch: string
  scanOutOfStock: string
  scanLookupFailed: string
  addedFromCache: string
  addedToSale: string
  /** The toast's expiry phrase. "{rel}" is relative, "{date}" is a date. */
  expiredSuffix: string
  expiresSoonSuffix: string
  expiresSuffix: string
  notSavedTitle: string
  notSavedBody: string
  savedLocally: string
  /** "{n}" lines, "{total}" already-formatted money. */
  savedLocallyBodyOne: string
  savedLocallyBodyMany: string
  couldNotLog: string
  saleLogged: string
  saleLoggedOne: string
  saleLoggedMany: string
  /**
   * The milestone notification. It is PERSISTED, so a notification keeps the
   * language it was written in even if the shop later switches.
   */
  milestoneTitle: string
  milestoneBody: string
}

/**
 * /reports: the range picker, the four KPIs, the charts and the tables.
 *
 * The PDF export's OWN strings are NOT here. lib/pdf.ts draws with jsPDF's
 * core `helvetica`, which covers Latin-1 only, so Telugu and Devanagari would
 * render as empty boxes. The toasts around the export are translated; the
 * document stays English until a Unicode font is embedded.
 *
 * Placeholders: {range} {prevFrom} {prevTo} {from} {to} {n} {money} {pct}.
 */
export type ReportsCopy = {
  eyebrow: string
  title: string
  subtitleCompared: string
  subtitlePlain: string
  exportPdf: string
  from: string
  to: string
  preset7: string
  preset30: string
  preset90: string
  allTime: string
  rangeLabel: string
  kpiRevenue: string
  kpiTransactions: string
  kpiAvgOrder: string
  kpiUnitsSold: string
  outsideWindow: string
  noPriorData: string
  vsPrevious: string
  emptyTitle: string
  emptyBody: string
  logASale: string
  viewAllProducts: string
  colProduct: string
  colUnits: string
  colRevenue: string
  colDate: string
  colCategory: string
  colShare: string
  colMethod: string
  colTransactions: string
  itemProducts: string
  itemDays: string
  itemCategories: string
  itemMethods: string
  revenueByDay: string
  categoryMix: string
  paymentMethods: string
  chartRevenueOverTime: string
  /** Under the revenue chart. "{n}" is the number of days charted. */
  rangeDaysOne: string
  rangeDaysMany: string
  chartSalesByCategory: string
  chartCategorySub: string
  chartTopProducts: string
  chartTopSub: string
  tooltipUnits: string
  tooltipShare: string
  nothingToExport: string
  nothingToExportBody: string
  exported: string
  exportedBody: string
  exportFailed: string
  exportFailedBody: string
  uncategorised: string
  payCash: string
  payCard: string
  payNfc: string
}

/**
 * /customers, its two dialogs and the one-time setup notice.
 *
 * `tierLabels` mirrors LOYALTY_TIER_LABELS in types/index.ts. That constant
 * stays and is still the English default; reading the dictionary here keeps
 * the table cell, the filter chip, the CSV column and the search index all
 * saying the same word in the same language.
 */
export type CustomersCopy = {
  eyebrow: string
  title: string
  subtitle: string
  addCustomer: string
  itemLabel: string
  searchAria: string
  searchPlaceholder: string
  filterByActivity: string
  activityAny: string
  activityRecent: string
  activityDormant: string
  allTiers: string
  statTotal: string
  statRevenue: string
  statRepeat: string
  colCustomer: string
  colContact: string
  colTier: string
  colVisits: string
  colTotalSpent: string
  colLastVisit: string
  colActions: string
  csvName: string
  csvEmail: string
  csvPhone: string
  emptyTitle: string
  emptyBody: string
  noMatchTitle: string
  noMatchBody: string
  editRow: string
  deleteRow: string
  formEdit: string
  formAdd: string
  saveChanges: string
  fFullName: string
  fEmail: string
  fPhone: string
  fTier: string
  fTotalSpent: string
  fVisits: string
  fNotes: string
  emailPlaceholder: string
  phonePlaceholder: string
  notesHint: string
  saveFailed: string
  updateFailedToast: string
  addFailedToast: string
  updatedToast: string
  addedToast: string
  deleteTitle: string
  deleteBodyA: string
  deleteBodyB: string
  deleteConfirm: string
  deleteFailed: string
  deleteFailedToast: string
  deletedToast: string
  setupTitle: string
  setupBodyA: string
  setupBodyB: string
  setupBodyC: string
  setupStep1: string
  setupStep2: string
  setupStep3: string
  goToSettings: string
  actNoPermission: string
  actFixFields: string
  actEmailExists: string
  vNameRequired: string
  vNameTooLong: string
  vEmailInvalid: string
  vTierInvalid: string
  vSpentMin: string
  vVisitsWhole: string
  tierLabels: { bronze: string; silver: string; gold: string; platinum: string }
}

/**
 * /suppliers, its three dialogs and the shipment tracker.
 *
 * The feed and notify strings are PERSISTED into supplier_activity and
 * notifications, so a row keeps the language it was written in even if the
 * shop later switches. That is the same trade the sales milestone makes.
 */
export type SuppliersCopy = {
  eyebrow: string
  title: string
  subtitle: string
  addSupplier: string
  itemLabel: string
  searchAria: string
  searchPlaceholder: string
  filterByStatus: string
  statusAny: string
  catAll: string
  arrivingToday: string
  colName: string
  colContact: string
  colCategory: string
  colActiveOrders: string
  colStatus: string
  colActions: string
  emptyTitle: string
  emptyBody: string
  noMatchTitle: string
  noMatchBody: string
  editRow: string
  deleteRow: string
  todaysInbound: string
  palletsExpected: string
  received: string
  pending: string
  incomingShipments: string
  addShipment: string
  noShipmentsTitle: string
  noShipmentsBody: string
  trackOrdered: string
  trackShipped: string
  trackTransit: string
  trackDock: string
  recentActivity: string
  noActivity: string
  formEdit: string
  formAdd: string
  saveChanges: string
  fName: string
  fContact: string
  contactPlaceholder: string
  fCategory: string
  fStatus: string
  saveFailed: string
  updateFailedToast: string
  addFailedToast: string
  updatedToast: string
  addedToast: string
  deleteTitle: string
  deleteBodyA: string
  deleteBodyB: string
  deleteConfirm: string
  deleteFailed: string
  deleteFailedToast: string
  deletedToast: string
  poTitle: string
  poCreate: string
  poSaving: string
  fSupplier: string
  fPoNumber: string
  poPlaceholder: string
  fPallets: string
  fEta: string
  addSupplierFirst: string
  shipmentSaveFailed: string
  shipmentFailedToast: string
  shipmentLogged: string
  poPrefix: string
  actNoPermission: string
  actFixFields: string
  actShipNoPermission: string
  actPoRequired: string
  actBadStatus: string
  actBadEta: string
  actBadPallets: string
  actSupplierNotHere: string
  actSupplierGone: string
  feedNewSupplier: string
  notifyNewSupplierTitle: string
  notifyNewSupplierBody: string
  feedShipment: string
  notifyShipmentTitle: string
  notifyShipmentBody: string
  notifyShipmentBodyEta: string
  vNameRequired: string
  vNameTooLong: string
  vContactTooLong: string
  vCategoryInvalid: string
  vStatusInvalid: string
  categoryLabels: { produce: string; dairy: string; dry_goods: string; beverages: string; bakery: string }
  statusLabels: { active: string; inactive: string; issue: string }
  shipmentLabels: { ordered: string; shipped: string; transit: string; dock: string }
}

/**
 * /staff and /staff/team: the rota, the roster and their five dialogs.
 *
 * NOT HERE, DELIBERATELY:
 *  - ShiftModal's ROLE_LABELS preset list. Those strings are STORED in
 *    shifts.role_label, and StaffScheduleClient's shiftStyle() colours a
 *    block by comparing that column against 'manager' and 'produce'.
 *    Translating the presets would write Telugu into the column and break
 *    the colour coding silently.
 *  - the role names themselves. AppCopy.roles already carries them, because
 *    lib/permissions.ts mirrors the database's can_manage() and CLAUDE.md
 *    says display strings do not belong in it.
 *
 * The notify strings are PERSISTED, so a notification keeps the language it
 * was written in.
 */
export type StaffCopy = {
  eyebrow: string
  title: string
  subtitle: string
  myScheduleBtn: string
  recordLeave: string
  assignShift: string
  prevWeek: string
  nextWeek: string
  weekView: string
  rotaAria: string
  dayMon: string
  dayTue: string
  dayWed: string
  dayThu: string
  dayFri: string
  daySat: string
  daySun: string
  editLeaveAria: string
  leaveLabel: string
  leaveLabelNote: string
  teamMember: string
  unassigned: string
  you: string
  staffFallback: string
  editShiftAria: string
  deleteShiftAria: string
  staffAvailability: string
  nobodyYet: string
  inviteFirst: string
  ownerCanInvite: string
  leaveUntil: string
  onShiftToday: string
  notScheduledToday: string
  onLeaveTodayTip: string
  onShiftCount: string
  onLeaveCount: string
  tabsAria: string
  tabSchedule: string
  tabTeam: string
  shiftEdit: string
  shiftAdd: string
  saveChanges: string
  fTeamMember: string
  teamMemberHint: string
  optUnassigned: string
  fRole: string
  fDate: string
  fStart: string
  fEnd: string
  clashText: string
  thatPerson: string
  shiftSaveFailed: string
  shiftUpdateFailed: string
  shiftScheduleFailed: string
  shiftUpdated: string
  shiftScheduled: string
  deleteShiftTitle: string
  deleteShiftA: string
  deleteShiftB: string
  deleteShiftC: string
  deleteShiftD: string
  unassignedSlot: string
  deleteShiftFailed: string
  deleteShiftFailedToast: string
  shiftDeleted: string
  leaveEdit: string
  leaveAdd: string
  leaveSaveBtn: string
  removeLeaveQ: string
  yes: string
  no: string
  remove: string
  fWho: string
  fFirstDay: string
  fLastDay: string
  fType: string
  fNote: string
  noteOptional: string
  notePlaceholder: string
  spanDay: string
  spanDays: string
  leaveRemoveFailed: string
  leaveRemoved: string
  leaveSaveFailed: string
  leaveUpdated: string
  leaveRecorded: string
  leaveToastOne: string
  leaveToastRange: string
  teamTitle: string
  addStaff: string
  activeOne: string
  activeMany: string
  pendingSuffix: string
  colEmployee: string
  colRole: string
  colJoined: string
  colStatus: string
  colActions: string
  storeOwnerBadge: string
  badgeInvited: string
  badgeActive: string
  badgeDeactivated: string
  working: string
  edit: string
  removeAccessQ: string
  restoreAccessQ: string
  deactivate: string
  reactivate: string
  editAria: string
  deactivateAria: string
  reactivateAria: string
  storeOwnerNote: string
  thisIsYou: string
  teamEmptyTitle: string
  teamEmptyBody: string
  deactivateFailed: string
  reactivateFailed: string
  accessRemoved: string
  accessRestored: string
  canNoLongerSignIn: string
  canSignInAgain: string
  revokeQ: string
  resend: string
  revoke: string
  revokeAria: string
  resendFailed: string
  resent: string
  revokeFailed: string
  revoked: string
  addStaffTitle: string
  sendInvite: string
  sendingInvite: string
  done: string
  fFullName: string
  fWorkEmail: string
  fJobTitle: string
  jobTitlePlaceholder: string
  roleHintManager: string
  roleHintStaff: string
  inviteFailed: string
  invitationSent: string
  invitedBodyA: string
  invitedBodyB: string
  editStaffTitle: string
  emailNote: string
  editSaveFailed: string
  memberUpdated: string
  vRoleRequired: string
  vRoleTooLong: string
  vDateRequired: string
  vStartRequired: string
  vEndRequired: string
  vEndAfterStart: string
  vLeaveWho: string
  vLeaveStart: string
  vLeaveEnd: string
  vLeaveEndBefore: string
  vLeaveTooLong: string
  vLeaveKind: string
  vLeaveNote: string
  actSchedNoPermission: string
  actFixFields: string
  actNotOnTeam: string
  actOnLeaveField: string
  actOnLeaveMessage: string
  actLeaveNoPermission: string
  actLeaveNotSetUp: string
  actOwnRole: string
  actNotInStore: string
  actOwnerAccount: string
  actNameRequired: string
  actBadRole: string
  actNotAuthenticated: string
  actOwnerOnly: string
  notifyRoleChanged: string
  /** "{name}" and "{role}". */
  notifyRoleBody: string
  notifyDeactivatedBody: string
  notifyReactivated: string
  notifyDeactivated: string
  leaveKindLabels: { holiday: string; sick: string; unpaid: string; other: string }
}

/**
 * /settings and /settings/categories.
 *
 * The two screens share one section because they are one feature wearing two
 * routes: the categories page is reached from a card on Settings and links
 * back to it. `cat` is nested rather than split out so a reader of this file
 * sees that relationship without following a second name.
 *
 * NOT TRANSLATED, and both are deliberate: the migration filenames
 * (`0013_categories.sql`, `0017_...`) are paths a developer types, and the
 * values written to `stores.theme` stay 'light'/'dark' — only their labels move.
 */
export type SettingsCopy = {
  eyebrow: string
  title: string
  /** "{store}" is the shop's own name, never translated. */
  subtitle: string
  unsaved: string
  discard: string
  saving: string
  savedTick: string
  save: string
  saveFailed: string
  savedToast: string
  /** "{message}" is the database's own message, which stays as it came. */
  saveErrorBanner: string
  needsMigration: string
  details: string
  storeName: string
  address: string
  phone: string
  appearance: string
  theme: string
  themeHint: string
  light: string
  dark: string
  controls: string
  thresholds: string
  lowStock: string
  unitsValue: string
  lowStockAria: string
  expiryWarning: string
  dayValue: string
  daysValue: string
  expiryAria: string
  oneDay: string
  maxDays: string
  notifications: string
  criticalAlerts: string
  criticalAlertsHint: string
  dailyDigest: string
  dailyDigestHint: string
  supplierUpdates: string
  supplierUpdatesHint: string
  team: string
  teamHint: string
  manageTeam: string
  categories: string
  categoriesHint: string
  manageCategories: string
  legal: string
  legalHint: string
  privacy: string
  terms: string
  sample: string
  sampleHint: string
  sampleButton: string
  sampleTitle: string
  sampleBody1: string
  sampleBody2: string
  sampleKept: string
  sampleRemovedOne: string
  sampleRemovedMany: string
  sampleWithSales: string
  sampleNext: string
  vNameRequired: string
  vNameTooLong: string
  vAddressTooLong: string
  vPhoneTooLong: string
  vPhoneShape: string
  /** "{min}"/"{max}" mirror the CHECK in migration 0017. */
  vExpiryRange: string
  /** removeSampleData's refusals. The action lives in inventory/actions.ts;
   *  the only screen that calls it is this one. */
  sampleDemoStore: string
  sampleNoPermission: string
  sampleReadFailed: string
  sampleDeleteFailed: string
  cat: {
    back: string
    eyebrow: string
    title: string
    subtitle: string
    notReadyTitle: string
    /** Either side of the <code> filename, which is not translated. */
    notReadyBefore: string
    notReadyAfter: string
    listHeading: string
    emptyTitle: string
    emptyBody: string
    nameLabel: string
    saveName: string
    /** Either side of the category's own name, which is data. */
    removePrefix: string
    removeSuffix: string
    remove: string
    noProducts: string
    oneProduct: string
    manyProducts: string
    moveUp: string
    moveDown: string
    renameAria: string
    rename: string
    cannotRemoveOne: string
    cannotRemoveMany: string
    removeAria: string
    addHeading: string
    nameHint: string
    namePlaceholder: string
    addButton: string
    footnote: string
    addFailed: string
    added: string
    renameFailed: string
    renamed: string
    reorderFailed: string
    notRemoved: string
    removed: string
    vNameRequired: string
    vNameTooLong: string
    vNameNoAlnum: string
    vNameDuplicate: string
    needsMigration: string
    zeroRows: string
    noPermission: string
    slugClash: string
    nameTaken: string
    nameUnusable: string
    inUseOne: string
    inUseMany: string
    lastCategory: string
    movedIn: string
  }
}

/**
 * /profile, its two dialogs and the avatar control.
 *
 * NOT TRANSLATED, deliberately: `phonePlaceholder` and `locationPlaceholder`
 * hold the same example in all three languages. One is a number format and the
 * other a place name — translating either would produce a hint that is wrong
 * rather than one that is localised. They live here anyway so changing the
 * examples is one edit rather than three.
 */
export type ProfileCopy = {
  eyebrow: string
  storeOwner: string
  /** "{year}" is the year the account was created. */
  memberSince: string
  editProfile: string
  logOut: string
  personalInfo: string
  fullName: string
  email: string
  phone: string
  location: string
  notSet: string
  security: string
  password: string
  passwordHint: string
  update: string
  itemsManaged: string
  staffMembers: string
  editTitle: string
  saving: string
  saveChanges: string
  vNameRequired: string
  /** "{n}" is the character limit. */
  vNameTooLong: string
  updateFailed: string
  updated: string
  phonePlaceholder: string
  locationPlaceholder: string
  pwTitle: string
  pwUpdating: string
  pwUpdate: string
  pwDone: string
  pwDoneButton: string
  pwNew: string
  pwConfirm: string
  pwTooShort: string
  pwMismatch: string
  pwFailed: string
  pwUpdated: string
  avatarLabel: string
  avatarReplace: string
  avatarUpload: string
  avatarRemove: string
  avatarHint: string
  avatarAdjust: string
  avatarType: string
  /** "{size}" is the chosen file's size in MB, to one decimal. */
  avatarTooBig: string
  avatarNoBucket: string
  /** "{message}" is the storage API's own message. */
  avatarFailed: string
}

/**
 * /audit — the Activity & Audit Log.
 *
 * NOT TRANSLATED, deliberately: the CHANGED FIELD NAMES. `summarizeChange` and
 * the expanded diff both print `products.unit_price` as "unit price", straight
 * from the column name in the jsonb snapshot. Those are database identifiers,
 * and a translated one could not be matched back to the column it names. The
 * entity and action labels beside them do move, because those are a fixed set
 * this dictionary can hold.
 */
export type AuditCopy = {
  eyebrow: string
  title: string
  subtitle: string
  /** Plural noun for the exporter, the pager and the "N of M" line. */
  items: string
  searchAria: string
  searchPlaceholder: string
  filterType: string
  allTypes: string
  filterAction: string
  allActions: string
  filterPerson: string
  anyone: string
  from: string
  to: string
  colWhen: string
  colWho: string
  colAction: string
  colType: string
  colRecord: string
  colChanged: string
  /** Shown as the actor when a change had no signed-in user behind it. */
  system: string
  emptyTitle: string
  emptyBody: string
  noMatchTitle: string
  noMatchBody: string
  entityProduct: string
  entityCustomer: string
  entitySupplier: string
  entitySale: string
  actionInsert: string
  actionUpdate: string
  actionDelete: string
  summaryCreated: string
  summaryDeleted: string
  summaryNoChanges: string
  yes: string
  no: string
  /** Audited column names in this language; see AuditLabelCopy.fields. */
  fields?: Record<string, string>
}

/**
 * The notification bell and its panel.
 *
 * A NOTIFICATION'S OWN title AND body ARE NOT HERE, and cannot be: they are
 * rows in `notifications`, written when the event happened. They keep the
 * language they were written in, the same rule supplier activity and the sales
 * milestone follow. Only the chrome around them moves.
 */
export type NotificationsCopy = {
  panelTitle: string
  markAllRead: string
  loading: string
  caughtUp: string
  unread: string
  bellNone: string
  bellOne: string
  /** "{n}" is the unread count. */
  bellMany: string
  kindGeneral: string
  kindLowStock: string
  kindStaff: string
  kindSupplier: string
  kindSales: string
}

/**
 * /help — the Help Centre's own chrome, and the support request form that
 * sits under every article.
 *
 * `suggested` is the list offered when a search finds nothing, and each term
 * must be one that actually matches an article — a suggestion that finds
 * nothing is precisely the state it exists to rescue the reader from.
 */
export type HelpCopy = {
  eyebrow: string
  title: string
  subtitle: string
  searchAria: string
  searchPlaceholder: string
  /** "{q}" is what was typed, quoted. */
  noMatch: string
  oneMatch: string
  manyMatch: string
  nothingTitle: string
  nothingBody: string
  suggested: readonly string[]
  browse: string
  allTopics: string
  moreOnThis: string
  articleNotFound: string
  formTitle: string
  formIntro: string
  sentTitle: string
  /** Either side of the ticket reference, which is an identifier. */
  sentBefore: string
  sentAfter: string
  sendAnother: string
  fName: string
  fEmail: string
  fEmailHint: string
  fCategory: string
  fMessage: string
  /** "{n}" typed so far, "{max}" the limit. */
  fMessageHint: string
  fMessagePlaceholder: string
  sending: string
  send: string
  catGettingStarted: string
  catInventory: string
  catSales: string
  catSuppliers: string
  catCustomers: string
  catStaff: string
  catSettings: string
  catAi: string
  catRoles: string
  catBilling: string
  catBug: string
  catOther: string
  vName: string
  vNameTooLong: string
  vEmail: string
  vEmailTooLong: string
  vEmailInvalid: string
  vCategory: string
  vMessage: string
  vMessageShort: string
  vMessageLong: string
  fixFields: string
  detailsRejected: string
  noStore: string
  savedNoRef: string
  /** "{message}" is the database's own message. */
  sendFailed: string
}

/** /support — the owner's triage view of what people have written in about. */
export type SupportCopy = {
  eyebrow: string
  title: string
  waitingOne: string
  waitingMany: string
  allDescription: string
  filterOpen: string
  filterAll: string
  nothingTitle: string
  nothingBody: string
  emptyTitle: string
  emptyBody: string
  statusOpen: string
  statusResolved: string
  markResolved: string
  reopen: string
  updateFailed: string
  markedResolved: string
  reopened: string
  noPermission: string
}

/**
 * The AI assistant: its panel, its history drawer, voice input, and the
 * sentences /api/ai/chat streams back when it cannot answer.
 *
 * `replyLanguage` is the one entry no component reads. It is appended to the
 * model's system instruction so the ASSISTANT'S OWN ANSWERS come back in the
 * reader's language — without it the panel chrome would be Telugu around a
 * reply in English, which is the half-translated screen this stage exists to
 * remove. It is written in English in all three languages on purpose: it is a
 * directive to the model, not something anyone reads, and models follow an
 * English instruction about output language more reliably.
 *
 * NOT HERE, deliberately: the tool DECLARATIONS in lib/gemini/tools.ts. Those
 * descriptions are the function-calling contract the model reads to decide
 * which tool to invoke; they are API surface, not interface copy.
 *
 * A STORED CONVERSATION keeps the language it was held in. Titles and message
 * text are rows, like a notification's.
 */
export type AiCopy = {
  title: string
  online: string
  history: string
  unmute: string
  mute: string
  close: string
  opening: string
  emptyTitle: string
  emptyBody: string
  sLowStock: string
  sExpiring: string
  sToday: string
  sWeek: string
  sValue: string
  clearCurrent: string
  placeholder: string
  sendAria: string
  disclaimer: string
  clearTitle: string
  clearButton: string
  /** "{n}" is the message count. */
  clearBodyOne: string
  clearBodyMany: string
  clearBody2: string
  prefSaveFailed: string
  threadStartFailed: string
  openFailed: string
  deleteFailed: string
  clearFailed: string
  streamError: string
  newChat: string
  loadingThreads: string
  noThreads: string
  bucketToday: string
  bucketYesterday: string
  bucketEarlier: string
  untitled: string
  deleteQ: string
  /** "{name}" is the conversation's own title. */
  deleteAria: string
  vAudioCapture: string
  vNetwork: string
  vNoSpeech: string
  vLangUnsupported: string
  vServiceNotAllowed: string
  /** "{host}" is the site the permission applies to. */
  vBlocked: string
  vStartFailed: string
  /** "{host}" is the origin; "{code}" the browser's own error code. */
  vInsecure: string
  vUnknown: string
  vStop: string
  vAsk: string
  vRecording: string
  vProcessing: string
  rMalformed: string
  rInvalid: string
  rRateLimit: string
  rNotConfigured: string
  rTooManyLookups: string
  rNoAnswer: string
  /** "{message}" is the upstream error. */
  rError: string
  ownerOnly: string
  replyLanguage: string
}

/**
 * /dashboard: the greeting, the KPI tiles, the alert feed and the two
 * attention tables, plus the alert sentences the page itself composes.
 *
 * THE DAY NAMES ARE NOT HERE. The trend chart's axis reads them from
 * `staff.dayMon`…`daySun`, which the rota already owns — one Monday for the
 * whole app, rather than two that can disagree.
 */
export type DashboardCopy = {
  greetMorning: string
  greetAfternoon: string
  greetEvening: string
  allInOrder: string
  /** "{n}" is a count in each of these. */
  lowOnStockOne: string
  lowOnStockMany: string
  /** "{busy}" and "{total}". */
  countersBusy: string
  updated: string
  liveUpdates: string
  agoJustNow: string
  agoSeconds: string
  agoOneMin: string
  agoMins: string
  todaySalesOwner: string
  todayTotalStaff: string
  vsYesterday: string
  salesTodayOne: string
  salesTodayMany: string
  sparklineAria: string
  transactionsToday: string
  logged: string
  weekRevenue: string
  transactionsOne: string
  transactionsMany: string
  viewAll: string
  lowStockTile: string
  expiringTile: string
  alreadyExpired: string
  withinOne: string
  withinMany: string
  quickActions: string
  qaNewOrder: string
  qaCheckout: string
  qaCheckStock: string
  qaReports: string
  trendTitle: string
  trendSubtitle: string
  chartSeries: string
  noSalesWeekTitle: string
  noSalesWeekBody: string
  logSale: string
  recentSales: string
  latest: string
  noSalesTitle: string
  noSalesBody: string
  staffFallback: string
  completed: string
  viewHistory: string
  recentAlerts: string
  alertsNew: string
  noAlertsTitle: string
  noAlertsBody: string
  lowStockTitle: string
  colItem: string
  colCategory: string
  colStockLevel: string
  colAction: string
  colExpires: string
  allStockedTitle: string
  allStockedBody: string
  unitsLeft: string
  restock: string
  expiringTitle: string
  expiryReadError: string
  nothingExpiringTitle: string
  nothingExpiringOne: string
  nothingExpiringMany: string
  expiredWord: string
  expiresWord: string
  unitOne: string
  unitMany: string
  writeOff: string
  discount: string
  aExpiredTitleOne: string
  aExpiredTitleMany: string
  /** "{name}" is a product's own name and is never translated. */
  aExpiredBodyOne: string
  aExpiredBodyTwo: string
  aExpiredBodyMany: string
  aExpiringTitleOne: string
  aExpiringTitleMany: string
  aExpiringBodyOne: string
  aExpiringBodyMany: string
  /** "{category}" is the store's own category name. */
  aLowStockTitle: string
  aLowStockBodyOne: string
  aLowStockBodyMany: string
  aStationTitle: string
  aWeightMismatch: string
  aAgeCheck: string
  aDeliveryTitle: string
  /** "{supplier}" is the supplier's own name. */
  aDeliveryBody: string
  supplierFallback: string
  timeNow: string
}

/** The shop-floor sections (monitoring, offline, scanner, page metadata) live in ./operations. */
export interface AppCopy extends OperationsCopy {
  /** Keyed by the NAV_ITEMS key in lib/nav.ts, plus the destinations off-nav. */
  nav: {
    dashboard: string
    inventory: string
    sales: string
    reports: string
    audit: string
    customers: string
    suppliers: string
    staff: string
    monitoring: string
    settings: string
    support: string
    help: string
    profile: string
  }
  shell: {
    skipToContent: string
    storeOperations: string
    demoBadge: string
    openNavigation: string
    closeNavigation: string
    searchPlaceholder: string
    searchShort: string
    aiAssistant: string
    notifications: string
    yourProfile: string
    /** Names the phone nav drawer's dialog landmark. */
    navigation: string
    /**
     * Screen-reader sentence on the topbar avatar. A TEMPLATE STRING with
     * {name}/{role}/{store} placeholders, not a function: dictionaries are
     * resolved on the server and handed to Client Components, and React
     * cannot serialise a function across that boundary. It typechecks and
     * builds either way — it only fails when the page actually renders, which
     * is how this was found.
     */
    profileSummary: string
  }
  roles: { owner: string; manager: string; staff: string }
  /** The four mobile tabs, which the design sets in uppercase. */
  tabs: { dashboard: string; inventory: string; monitoring: string; settings: string }
  /**
   * The shared primitives in components/ui — the export button, the dialog
   * shell, the table footer, the toast rail, the image cropper. They belong
   * together because no screen owns them: the same word has to be right on
   * every page that mounts one.
   *
   * {items} is a plural noun supplied by the CALLING screen ("products",
   * "suppliers"). Those nouns are still English until their own stage.
   */
  common: {
    exportCsv: string
    nothingToExportTitle: string
    nothingToExportBody: string
    exportedTitle: string
    cancel: string
    delete: string
    clearAll: string
    clearFilters: string
    clearSearch: string
    closeDialog: string
    loading: string
    loadingPage: string
    previousPage: string
    nextPage: string
    rows: string
    pageOf: string
    showingRange: string
    notificationsRegion: string
    dismissNotification: string
    usePhoto: string
    dragToReposition: string
    zoom: string
    imageError: string
    canvasError: string
    /**
     * "3h ago" on a notification and on a customer's last visit.
     * Structurally a lib/format.ts RelativeTimeCopy, so `t.common` can be
     * passed straight to formatRelativeTime and to <RelativeTime>.
     */
    relJustNow: string
    relMinutesAgo: string
    relHoursAgo: string
    relDaysAgo: string
  }
  expiry: ExpiryCopy
  /** /inventory, its four dialogs and the product form. */
  inventory: InventoryCopy
  /** /sales and the till. */
  pos: PosCopy
  /** /customers. */
  customers: CustomersCopy
  /** /staff and /staff/team. */
  staff: StaffCopy
  /** /suppliers. */
  suppliers: SuppliersCopy
  /** /reports. */
  reports: ReportsCopy
  /** SortableTh's announced sort state; shared by every table in the app. */
  sort: { ascending: string; descending: string; none: string }
  /**
   * The product form's validation messages.
   *
   * They live here but are CONSUMED by lib/validation/product.ts, which takes
   * them as an OPTIONAL argument and falls back to English. The rules are
   * untouched - only the words move - and the Server Action passes the same
   * object, so a re-validation on the server answers in the language the form
   * asked in.
   */
  validation: {
    nameRequired: string
    nameTooLong: string
    skuTooLong: string
    barcodeShape: string
    brandTooLong: string
    categoryInvalid: string
    priceMin: string
    priceTooLarge: string
    thresholdWhole: string
    unitRequired: string
    /** "{n}" is MAX_LOTS. */
    tooManyLots: string
    quantityWhole: string
    useDatePicker: string
    /** "{year}" is the year typed. */
    badYear: string
    /** "{n}" is the lot number, "{message}" its message. */
    lotPrefix: string
  }
  /** /settings and /settings/categories. */
  settings: SettingsCopy
  /** /profile and its dialogs. */
  profile: ProfileCopy
  /** /audit. */
  audit: AuditCopy
  /** The notification bell and panel. */
  notif: NotificationsCopy
  /** /help and the support request form. */
  help: HelpCopy
  /** /support. */
  support: SupportCopy
  /** The AI assistant, its voice input, and /api/ai/chat's own sentences. */
  ai: AiCopy
  /** /dashboard. */
  dash: DashboardCopy
  palette: {
    ariaLabel: string
    searchPlaceholder: string
    searchAria: string
    results: string
    noResultsTitle: string
    /** {query} is the text the reader typed. */
    noResultsBody: string
    groupNavigation: string
    groupActions: string
    groupProducts: string
    openAssistant: string
    viewProfile: string
    signOut: string
  }
}

const en: AppCopy = {
  ...OPERATIONS_COPY.en,
  nav: {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    sales: 'Sales',
    reports: 'Reports',
    audit: 'Activity',
    customers: 'Customers',
    suppliers: 'Suppliers',
    staff: 'Staff',
    monitoring: 'Monitoring',
    settings: 'Settings',
    support: 'Support',
    help: 'Help Center',
    profile: 'Profile',
  },
  shell: {
    skipToContent: 'Skip to main content',
    storeOperations: 'Store Operations',
    demoBadge: 'Demo store — sample data',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    searchPlaceholder: 'Search products, sales, customers...',
    searchShort: 'Search or jump to...',
    aiAssistant: 'AI Assistant',
    notifications: 'Notifications',
    yourProfile: 'Your profile',
    navigation: 'Navigation',
    profileSummary: 'Your profile — {name}, {role} at {store}',
  },
  roles: { owner: 'Owner', manager: 'Manager', staff: 'Staff' },
  common: {
    exportCsv: 'Export CSV',
    nothingToExportTitle: 'Nothing to export',
    nothingToExportBody: 'No {items} match the current filters.',
    exportedTitle: 'Exported {count} {items}',
    cancel: 'Cancel',
    delete: 'Delete',
    clearAll: 'Clear all',
    clearFilters: 'Clear filters',
    clearSearch: 'Clear search',
    closeDialog: 'Close dialog',
    loading: 'Loading',
    loadingPage: 'Loading page content…',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    rows: 'Rows',
    pageOf: 'of {total}',
    showingRange: 'Showing {start}-{end} of {total} {items}',
    notificationsRegion: 'Notifications',
    dismissNotification: 'Dismiss notification',
    usePhoto: 'Use photo',
    dragToReposition: 'Drag to reposition',
    zoom: 'Zoom',
    imageError: 'Could not process that image.',
    canvasError: 'Canvas is unavailable in this browser.',
    relJustNow: 'just now',
    relMinutesAgo: '{n}m ago',
    relHoursAgo: '{n}h ago',
    relDaysAgo: '{n}d ago',
  },
  expiry: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    expired: 'Expired',
    expiringSoon: 'Expiring soon',
    expires: 'Expires',
    noDate: 'No expiry date',
    moreLot: '+{n} more lot',
    moreLots: '+{n} more lots',
    relToday: 'today',
    relTomorrow: 'tomorrow',
    relYesterday: 'yesterday',
    relInDays: 'in {n} days',
    relDaysAgo: '{n} days ago',
  },
  sort: {
    ascending: ', sorted ascending. Activate to reverse.',
    descending: ', sorted descending. Activate to reverse.',
    none: ', not sorted. Activate to sort.',
  },
  validation: {
    nameRequired: 'Name is required.',
    nameTooLong: 'Name must be 120 characters or fewer.',
    skuTooLong: 'SKU must be 40 characters or fewer.',
    barcodeShape: 'Use 8 to 14 digits, numbers only.',
    brandTooLong: 'Brand must be 80 characters or fewer.',
    categoryInvalid: 'Choose a valid category.',
    priceMin: 'Must be zero or more.',
    priceTooLarge: 'That price looks too large.',
    thresholdWhole: 'Must be a whole number, zero or more.',
    unitRequired: 'Unit is required.',
    tooManyLots: 'At most {n} lots per product.',
    quantityWhole: 'Must be a whole number, zero or more.',
    useDatePicker: 'Use the date picker.',
    badYear: 'Check the year \u2014 nothing expires in {year}.',
    lotPrefix: 'Lot {n}: {message}',
  },
  inventory: {
    eyebrow: 'Stock',
    title: 'Inventory Management',
    subtitle: 'Manage stock levels, categories, and pricing.',
    scan: 'Scan',
    importCsv: 'Import CSV',
    addProduct: 'Add Product',
    searchAria: 'Search inventory',
    searchPlaceholder: 'Search name, SKU, barcode, brand, category, or unit...',
    filterByStatus: 'Filter by stock status',
    allCategories: 'All Categories',
    statusAny: 'Any status',
    statusIn: 'In stock',
    statusLow: 'Low stock',
    statusOut: 'Out of stock',
    badgeIn: 'In Stock',
    badgeLow: 'Low Stock',
    badgeOut: 'Out of Stock',
    totalValue: 'Total Value',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    itemsCount: '{n} items',
    exportItems: 'products',
    colProduct: 'Product',
    colSkuCategory: 'SKU / Category',
    colUnitPrice: 'Unit Price',
    colStock: 'Stock',
    colExpiry: 'Expiry',
    colStatus: 'Status',
    colActions: 'Actions',
    skuPrefix: 'SKU: {v}',
    barcodePrefix: 'Barcode: {v}',
    minPrefix: 'Min: {v}',
    editRow: 'Edit {name}',
    deleteRow: 'Delete {name}',
    emptyTitle: 'No products yet',
    emptyBody:
      'Add your first product to start tracking stock levels, pricing, and low-stock alerts.',
    noMatchTitle: 'No products match your filters',
    noMatchBody: 'Try a different search term, or clear the category and status filters.',
    scanTitle: 'Scan a barcode',
    scanHelp:
      'Point the camera at a product barcode. If it is already in your inventory you can update its stock; if not, you can add it.',
    scanLooking: 'Looking that barcode up\u2026',
    scanFoundTitle: 'Product found',
    scanFoundExpiry: '{name} \u2014 {state} {date}, {rel}.',
    scanFoundNoExpiry: '{name} \u2014 no expiry date. Update the stock and save.',
    scanExpiredWord: 'EXPIRED',
    scanExpiresWord: 'expires',
    scanNoMatchTitle: 'No product with that barcode',
    scanNoMatchBody: 'Add it now \u2014 the barcode is filled in.',
    scanCacheHit: '{name} is in your saved list, but editing stock needs a connection.',
    scanCacheMiss:
      'No saved product has the barcode {code}. Reconnect to search the full list.',
    scanFailed: 'The lookup failed. Try again.',
    deleteTitle: 'Delete product?',
    deleteBodyA: 'This will permanently remove ',
    deleteBodyB: ' from inventory.',
    deleteConfirm: 'Delete',
    deleteFailed: 'Could not delete the product.',
    deleteFailedToast: 'Could not delete product',
    deletedToast: 'Product deleted',
    formEdit: 'Edit Product',
    formAdd: 'Add Product',
    saveChanges: 'Save Changes',
    fName: 'Product Name',
    fBrand: 'Brand',
    fSku: 'SKU',
    fBarcode: 'Barcode',
    barcodeHint: 'Optional \u00b7 8-14 digits, numbers only',
    barcodePlaceholder: 'e.g. 8901234567895',
    fCategory: 'Category',
    manageCategories: 'Manage categories',
    fPrice: 'Price ($)',
    fUnit: 'Unit',
    unitPlaceholder: 'ea, lb, gal',
    fThreshold: 'Low Stock Threshold',
    lotsLegend: 'Stock & Expiry',
    lotsHelp: 'One row per delivery. Leave the date blank for anything that does not expire.',
    fQuantity: 'Quantity',
    fExpiryDate: 'Expiry Date',
    optional: 'Optional',
    removeLot: 'Remove lot {n}',
    addLot: 'Add another lot',
    totalStock: 'Total stock:',
    saveFailed: 'Could not save the product.',
    updateFailedToast: 'Could not update product',
    addFailedToast: 'Could not add product',
    updatedToast: 'Product updated',
    addedToast: 'Product added',
    photoLabel: 'Product Photo',
    photoReplace: 'Replace',
    photoAdd: 'Add photo',
    photoRemove: 'Remove',
    photoHint: 'JPEG, PNG or WebP. Up to 2 MB.',
    photoChooseAria: 'Choose a product photo',
    photoAdjustTitle: 'Adjust the photo',
    photoUseImage: 'Use image',
    photoTypeError: 'Choose a JPEG, PNG or WebP image.',
    photoSizeError: 'That image is {mb} MB. The limit is 2 MB.',
    photoBucketError:
      'Product image storage is not set up yet. Apply migration 0009, then try again.',
    photoUploadError: 'Upload failed: {msg}',
    detailsTitle: 'Product details',
    detailsLoading: 'Loading product details',
    openInInventory: 'Open in Inventory',
    noBrand: 'No brand recorded',
    dSku: 'SKU',
    dBarcode: 'Barcode',
    dCategory: 'Category',
    dBrand: 'Brand',
    dPrice: 'Price',
    dUnit: 'Unit',
    dCurrentStock: 'Current stock',
    dMinStock: 'Min stock',
    dInventoryValue: 'Inventory value',
    dNextExpiry: 'Next expiry',
    noExpiryDate: 'No expiry date',
    batchesHeading: 'Batches / Lots',
    noBatches:
      'No batches recorded. Stock is tracked per delivery, so this product has none on hand.',
    lotQuantity: 'Quantity',
    lotExpiry: 'Expiry',
    lotReceived: 'Received',
    lotNote: 'Note',
    notFoundTitle: 'Product not found',
    notFoundBody: 'It may have been deleted, or it belongs to another store.',
    importTitle: 'Import products from CSV',
    importIntroA: 'Upload a CSV with a ',
    importIntroB: ' column. Rows are matched to existing products by ',
    importIntroC:
      ' \u2014 a matching SKU updates that product, anything else is added. Nothing is written until you confirm.',
    requiredLabel: 'Required:',
    optionalLabel: 'Optional:',
    formatNote:
      'Dates as YYYY-MM-DD (2026-03-31). Numbers plain, with no currency symbol or thousands separator (1250.50, not $1,250.50). Leave any optional cell blank to skip it.',
    newToThis: 'New to this?',
    sampleBlurb: 'Download the sample CSV to see the required format and example values.',
    downloadSample: 'Download sample CSV',
    chooseFile: 'Choose a CSV file',
    chooseAnother: 'Choose another file',
    importRow: 'Import {n} row',
    importRows: 'Import {n} rows',
    statToAdd: 'To add',
    statToUpdate: 'To update',
    statProblems: 'Problems',
    colLine: 'Line',
    colImportProduct: 'Product',
    colAction: 'Action',
    actAdd: 'Add',
    actUpdate: 'Update',
    actSkip: 'Skip',
    unknownCol: 'Ignored unrecognised column: {cols}',
    unknownCols: 'Ignored unrecognised columns: {cols}',
    replacesLots:
      'This file has a stock column, so each matched product\u2019s existing stock lots and expiry dates are replaced by the single lot its row describes.',
    errTooBig: 'That file is larger than 2 MB. Split it into smaller batches.',
    errMissingCol:
      'The file needs a "{cols}" column. Export your inventory to CSV to see the expected headers.',
    errNoRows: 'No data rows found beneath the header.',
    errNotCsv: 'That file could not be read as CSV.',
    nothingToImport: 'Nothing to import',
    nothingToImportBody: 'Every row in this file has a problem.',
    importFailed: 'Import failed',
    importedProblems: 'Imported with problems',
    importComplete: 'Import complete',
    sumAdded: '{n} added',
    sumUpdated: '{n} updated',
    sumFailed: '{n} failed',
    actNoPermission: 'You do not have permission to change inventory.',
    actFixFields: 'Please correct the highlighted fields.',
    actSkuExists: 'A product with that SKU already exists.',
    actBadBarcode: 'That is not a valid barcode.',
    actNoImportPermission: 'You do not have permission to import inventory.',
    actNothingToImport: 'Nothing to import.',
    dupSku: 'Duplicate SKU "{v}" appears earlier in this file.',
    dupBarcode: 'Duplicate barcode "{v}" appears earlier in this file.',
  },
  pos: {
    eyebrow: 'Transactions',
    title: 'Sales',
    subtitleRevenue: 'This week: {week} · Avg order {avg}',
    subtitlePlain: 'Log new sales and browse recent transactions.',
    logSale: 'Log Sale',
    transactions: 'transactions',
    weeklyPerformance: 'Weekly Performance',
    revenue7: 'Revenue, last 7 days',
    popularCategories: 'Popular Categories',
    noSalesDataTitle: 'No sales data yet',
    noSalesDataBody: 'Category breakdown appears once sales are logged.',
    recentTransactions: 'Recent Transactions',
    salesHistory: 'Sales History',
    searchPlaceholder: 'Search date, ID, or staff...',
    searchAria: 'Search transactions',
    filterByMethod: 'Filter by payment method',
    methodAny: 'Any method',
    methodCash: 'Cash',
    methodCard: 'Card',
    methodNfc: 'NFC',
    labelCash: 'Cash',
    labelCard: 'CC',
    labelNfc: 'NFC',
    from: 'From',
    to: 'To',
    colDateTime: 'Date / Time',
    colOrderId: 'Order ID',
    colAmount: 'Amount',
    colMethod: 'Method',
    colSoldBy: 'Sold By',
    noSalesTitle: 'No sales logged yet',
    noSalesBody: 'Log your first sale to start building transaction history and trends.',
    noMatchTitle: 'No transactions match your filters',
    noMatchBody: 'Try a different search term or date range.',
    topSelling: 'Top Selling Items',
    noTopTitle: 'No sales in the last 30 days',
    noTopBody: 'Your best sellers will be ranked here.',
    unitsSold: '{n} units sold',
    viewInventory: 'View Inventory',
    modalTitle: 'Log a Sale',
    total: 'Total',
    completeSale: 'Complete Sale',
    loggingSale: 'Logging sale…',
    hideScanner: 'Hide the scanner',
    scanBarcode: 'Scan a barcode',
    scanLooking: 'Looking that barcode up…',
    scannedOne: '{n} item scanned into this sale. Press Start camera again for the next one.',
    scannedMany: '{n} items scanned into this sale. Press Start camera again for the next one.',
    searchProducts: 'Search products to add...',
    inStock: '{n} in stock',
    emptyCartTitle: 'No items yet',
    emptyCartBody: 'Search above and add products to build this sale.',
    eachPrice: '{price} each',
    paymentMethod: 'Payment Method',
    scanNoSavedMatch: 'No saved product has the barcode {code}. Nothing was added.',
    scanNoMatch: 'No product in this store has the barcode {code}. Nothing was added.',
    scanOutOfStock: '{name} is out of stock. Nothing was added.',
    scanLookupFailed: 'That scan could not be looked up. Try again, or search by name.',
    addedFromCache: 'Added from saved list',
    addedToSale: 'Added to sale',
    expiredSuffix: 'EXPIRED {rel}',
    expiresSoonSuffix: 'expires {rel}',
    expiresSuffix: 'expires {date}',
    notSavedTitle: 'Sale not saved',
    notSavedBody: 'This sale could NOT be saved on this device. Do not let the customer go without writing it down.',
    savedLocally: 'Saved on this device',
    savedLocallyBodyOne: '{n} line item · {total} — will sync when you are back online.',
    savedLocallyBodyMany: '{n} line items · {total} — will sync when you are back online.',
    couldNotLog: 'Could not log sale',
    saleLogged: 'Sale logged',
    saleLoggedOne: '{n} line item · {total}',
    saleLoggedMany: '{n} line items · {total}',
    milestoneTitle: '{n} sales today',
    milestoneBody: 'Today’s takings are {total} across {n} transactions.',
  },
  reports: {
    eyebrow: 'Reporting',
    title: 'Reports',
    subtitleCompared: '{range}, compared with {prevFrom} to {prevTo}.',
    subtitlePlain: 'Sales performance for a date range you choose.',
    exportPdf: 'Export PDF',
    from: 'From',
    to: 'To',
    preset7: 'Last 7 days',
    preset30: 'Last 30 days',
    preset90: 'Last 90 days',
    allTime: 'All time',
    rangeLabel: '{from} to {to}',
    kpiRevenue: 'Revenue',
    kpiTransactions: 'Transactions',
    kpiAvgOrder: 'Avg Order',
    kpiUnitsSold: 'Units Sold',
    outsideWindow: 'Outside compared window',
    noPriorData: 'No prior data',
    vsPrevious: 'vs previous period',
    emptyTitle: 'No sales in this range',
    emptyBody: 'Widen the date range, or log a sale to see it reported here.',
    logASale: 'Log a sale',
    viewAllProducts: 'View all {n} products',
    colProduct: 'Product',
    colUnits: 'Units',
    colRevenue: 'Revenue',
    colDate: 'Date',
    colCategory: 'Category',
    colShare: 'Share %',
    colMethod: 'Method',
    colTransactions: 'Transactions',
    itemProducts: 'products',
    itemDays: 'days',
    itemCategories: 'categories',
    itemMethods: 'methods',
    revenueByDay: 'Revenue by day',
    categoryMix: 'Category mix',
    paymentMethods: 'Payment methods',
    chartRevenueOverTime: 'Revenue over time',
    rangeDaysOne: '{n} day in the selected range',
    rangeDaysMany: '{n} days in the selected range',
    chartSalesByCategory: 'Sales by category',
    chartCategorySub: 'Revenue share across the store’s categories',
    chartTopProducts: 'Top products',
    chartTopSub: 'Highest revenue, best five of {n}',
    tooltipUnits: '{money} · {n} units',
    tooltipShare: '{money} · {pct}%',
    nothingToExport: 'Nothing to export',
    nothingToExportBody: 'No sales fall in the selected date range.',
    exported: 'Report exported',
    exportedBody: 'PDF saved to your downloads.',
    exportFailed: 'Export failed',
    exportFailedBody: 'The PDF could not be generated. Please try again.',
    uncategorised: 'Uncategorised',
    payCash: 'Cash',
    payCard: 'Card',
    payNfc: 'NFC',
  },
  customers: {
    eyebrow: 'Relationships',
    title: 'Customers',
    subtitle: 'Customer profiles, purchase history, and loyalty tiers.',
    addCustomer: 'Add Customer',
    itemLabel: 'customers',
    searchAria: 'Search customers',
    searchPlaceholder: 'Search by name, email, phone, or tier...',
    filterByActivity: 'Filter by activity',
    activityAny: 'Any activity',
    activityRecent: 'Visited in 30 days',
    activityDormant: 'Dormant 30+ days',
    allTiers: 'All Tiers',
    statTotal: 'Total Customers',
    statRevenue: 'Lifetime Revenue',
    statRepeat: 'Repeat Customers',
    colCustomer: 'Customer',
    colContact: 'Contact',
    colTier: 'Tier',
    colVisits: 'Visits',
    colTotalSpent: 'Total Spent',
    colLastVisit: 'Last Visit',
    colActions: 'Actions',
    csvName: 'Name',
    csvEmail: 'Email',
    csvPhone: 'Phone',
    emptyTitle: 'No customers yet',
    emptyBody: 'Add a customer to start tracking purchase history and loyalty tiers.',
    noMatchTitle: 'No customers match these filters',
    noMatchBody: 'Try a different search term or tier.',
    editRow: 'Edit {name}',
    deleteRow: 'Delete {name}',
    formEdit: 'Edit Customer',
    formAdd: 'Add Customer',
    saveChanges: 'Save Changes',
    fFullName: 'Full Name',
    fEmail: 'Email',
    fPhone: 'Phone',
    fTier: 'Loyalty Tier',
    fTotalSpent: 'Total Spent',
    fVisits: 'Visits',
    fNotes: 'Notes',
    emailPlaceholder: 'name@example.com',
    phonePlaceholder: '555-0100',
    notesHint: 'Allergies, preferences, anything worth remembering',
    saveFailed: 'Could not save the customer.',
    updateFailedToast: 'Could not update customer',
    addFailedToast: 'Could not add customer',
    updatedToast: 'Customer updated',
    addedToast: 'Customer added',
    deleteTitle: 'Delete Customer',
    deleteBodyA: 'Delete ',
    deleteBodyB: ' and their purchase history? This cannot be undone.',
    deleteConfirm: 'Delete',
    deleteFailed: 'Could not delete the customer.',
    deleteFailedToast: 'Could not delete customer',
    deletedToast: 'Customer deleted',
    setupTitle: 'One setup step remaining',
    setupBodyA: 'The ',
    setupBodyB: ' table has not been created yet. Open the Supabase SQL editor for this project, paste the contents of ',
    setupBodyC: ', and run it. Reload this page afterwards and customer management will be live.',
    setupStep1: 'Open your Supabase project → SQL Editor → New query.',
    setupStep2: 'Paste the full contents of supabase/schema_phase4.sql.',
    setupStep3: 'Press Run, then reload this page.',
    goToSettings: 'Go to Settings',
    actNoPermission: 'You do not have permission to manage customers.',
    actFixFields: 'Please correct the highlighted fields.',
    actEmailExists: 'A customer with that email already exists in this store.',
    vNameRequired: 'Name is required.',
    vNameTooLong: 'Name must be 120 characters or fewer.',
    vEmailInvalid: 'Enter a valid email address.',
    vTierInvalid: 'Choose a valid tier.',
    vSpentMin: 'Must be zero or more.',
    vVisitsWhole: 'Must be a whole number, zero or more.',
    tierLabels: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' },
  },
  suppliers: {
    eyebrow: 'Supply chain',
    title: 'Supplier Management',
    subtitle: 'Manage vendor relationships and track inbound freight.',
    addSupplier: 'Add Supplier',
    itemLabel: 'suppliers',
    searchAria: 'Search suppliers',
    searchPlaceholder: 'Search name, contact, category, or status...',
    filterByStatus: 'Filter by status',
    statusAny: 'Any status',
    catAll: 'All',
    arrivingToday: 'Arriving Today',
    colName: 'Supplier Name',
    colContact: 'Primary Contact',
    colCategory: 'Category',
    colActiveOrders: 'Active Orders',
    colStatus: 'Status',
    colActions: 'Actions',
    emptyTitle: 'No suppliers yet',
    emptyBody: 'Add a supplier to track incoming shipments and delivery performance.',
    noMatchTitle: 'No suppliers match your filters',
    noMatchBody: 'Try a different search term or category.',
    editRow: 'Edit {name}',
    deleteRow: 'Delete {name}',
    todaysInbound: 'Today’s Inbound',
    palletsExpected: 'Pallets Expected',
    received: 'Received',
    pending: 'Pending',
    incomingShipments: 'Incoming Shipments',
    addShipment: 'Add shipment',
    noShipmentsTitle: 'No incoming shipments',
    noShipmentsBody: 'Log a shipment to track it from dock to shelf.',
    trackOrdered: 'Ordered',
    trackShipped: 'Shipped',
    trackTransit: 'Transit',
    trackDock: 'Dock',
    recentActivity: 'Recent Supplier Activity',
    noActivity: 'No recent activity.',
    formEdit: 'Edit Supplier',
    formAdd: 'Add Supplier',
    saveChanges: 'Save Changes',
    fName: 'Supplier Name',
    fContact: 'Primary Contact',
    contactPlaceholder: 'Jane Doe',
    fCategory: 'Category',
    fStatus: 'Status',
    saveFailed: 'Could not save the supplier.',
    updateFailedToast: 'Could not update supplier',
    addFailedToast: 'Could not add supplier',
    updatedToast: 'Supplier updated',
    addedToast: 'Supplier added',
    deleteTitle: 'Delete Supplier',
    deleteBodyA: 'Delete ',
    deleteBodyB: '? Any incoming shipments recorded against them, and their entries in the activity feed, are removed too. This cannot be undone.',
    deleteConfirm: 'Delete',
    deleteFailed: 'Could not delete the supplier.',
    deleteFailedToast: 'Could not delete supplier',
    deletedToast: 'Supplier deleted',
    poTitle: 'New Purchase Order',
    poCreate: 'Create PO',
    poSaving: 'Saving…',
    fSupplier: 'Supplier',
    fPoNumber: 'PO Number',
    poPlaceholder: 'PO-2024-0891',
    fPallets: 'Pallets',
    fEta: 'Arrival Estimate',
    addSupplierFirst: 'Add a supplier first.',
    shipmentSaveFailed: 'Could not save the shipment.',
    shipmentFailedToast: 'Could not log shipment',
    shipmentLogged: 'Shipment logged',
    poPrefix: 'PO {n}',
    actNoPermission: 'You do not have permission to manage suppliers.',
    actFixFields: 'Please correct the highlighted fields.',
    actShipNoPermission: 'You do not have permission to manage shipments.',
    actPoRequired: 'PO number is required.',
    actBadStatus: 'Choose a valid shipment status.',
    actBadEta: 'Use the date picker for the ETA.',
    actBadPallets: 'Pallets must be a whole number, zero or more.',
    actSupplierNotHere: 'That supplier is not on this store.',
    actSupplierGone: 'That supplier is no longer on this store.',
    feedNewSupplier: '{name} added as a new supplier',
    notifyNewSupplierTitle: 'New supplier added',
    notifyNewSupplierBody: '{name} is now on your supplier list.',
    feedShipment: '{supplier} PO {po} created',
    notifyShipmentTitle: 'Incoming shipment logged',
    notifyShipmentBody: '{supplier} PO {po}.',
    notifyShipmentBodyEta: '{supplier} PO {po}, due {eta}.',
    vNameRequired: 'Supplier name is required.',
    vNameTooLong: 'Name must be 120 characters or fewer.',
    vContactTooLong: 'Contact must be 120 characters or fewer.',
    vCategoryInvalid: 'Choose a valid category.',
    vStatusInvalid: 'Choose a valid status.',
    categoryLabels: { produce: 'Produce', dairy: 'Dairy', dry_goods: 'Dry Goods', beverages: 'Beverages', bakery: 'Bakery' },
    statusLabels: { active: 'Active', inactive: 'Inactive', issue: 'Issue' },
    shipmentLabels: { ordered: 'Ordered', shipped: 'Shipped', transit: 'In Transit', dock: 'At Dock' },
  },
  staff: {
    eyebrow: 'Team',
    title: 'Staff Scheduling',
    subtitle: 'Manage team shifts and coverage.',
    myScheduleBtn: 'My Schedule',
    recordLeave: 'Record Leave',
    assignShift: 'Assign Shift',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    weekView: 'Week view',
    rotaAria: 'Weekly rota, scrolls horizontally',
    dayMon: 'MON',
    dayTue: 'TUE',
    dayWed: 'WED',
    dayThu: 'THU',
    dayFri: 'FRI',
    daySat: 'SAT',
    daySun: 'SUN',
    editLeaveAria: 'Edit leave: {label}',
    leaveLabel: '{who} — {kind}',
    leaveLabelNote: '{who} — {kind}: {note}',
    teamMember: 'Team member',
    unassigned: 'UNASSIGNED',
    you: 'You',
    staffFallback: 'Staff',
    editShiftAria: 'Edit {role} shift on {date}',
    deleteShiftAria: 'Delete {role} shift on {date}',
    staffAvailability: 'Staff Availability',
    nobodyYet: 'Nobody on the team yet.',
    inviteFirst: 'Invite your first colleague',
    ownerCanInvite: 'The store owner can invite people from the Team tab.',
    leaveUntil: '{kind} until {date}',
    onShiftToday: 'On shift today',
    notScheduledToday: 'Not scheduled today',
    onLeaveTodayTip: 'On {kind} today',
    onShiftCount: '{n} of {m} on shift today',
    onLeaveCount: ' · {n} on leave',
    tabsAria: 'Staff sections',
    tabSchedule: 'Schedule',
    tabTeam: 'Team',
    shiftEdit: 'Edit Shift',
    shiftAdd: 'Assign Shift',
    saveChanges: 'Save Changes',
    fTeamMember: 'Team Member',
    teamMemberHint: 'Leave unassigned to post an open shift',
    optUnassigned: 'Unassigned',
    fRole: 'Role',
    fDate: 'Date',
    fStart: 'Start Time',
    fEnd: 'End Time',
    clashText: '{who} is on {kind} from {from} to {to}. This shift will not save.',
    thatPerson: 'That person',
    shiftSaveFailed: 'Could not save the shift.',
    shiftUpdateFailed: 'Could not update shift',
    shiftScheduleFailed: 'Could not schedule shift',
    shiftUpdated: 'Shift updated',
    shiftScheduled: 'Shift scheduled',
    deleteShiftTitle: 'Delete Shift',
    deleteShiftA: 'Remove the ',
    deleteShiftB: ' shift for ',
    deleteShiftC: ' on ',
    deleteShiftD: '? This cannot be undone.',
    unassignedSlot: 'the unassigned slot',
    deleteShiftFailed: 'Could not delete the shift.',
    deleteShiftFailedToast: 'Could not delete shift',
    shiftDeleted: 'Shift deleted',
    leaveEdit: 'Edit leave',
    leaveAdd: 'Record leave',
    leaveSaveBtn: 'Save changes',
    removeLeaveQ: 'Remove this leave?',
    yes: 'Yes',
    no: 'No',
    remove: 'Remove',
    fWho: 'Who',
    fFirstDay: 'First day',
    fLastDay: 'Last day',
    fType: 'Type',
    fNote: 'Note',
    noteOptional: '(optional)',
    notePlaceholder: 'Covering arranged with Priya',
    spanDay: '{n} day off, including both dates.',
    spanDays: '{n} days off, including both dates.',
    leaveRemoveFailed: 'Could not remove leave',
    leaveRemoved: 'Leave removed',
    leaveSaveFailed: 'Could not save leave',
    leaveUpdated: 'Leave updated',
    leaveRecorded: 'Leave recorded',
    leaveToastOne: '{who}, {from}',
    leaveToastRange: '{who}, {from} to {to}',
    teamTitle: 'Your Team',
    addStaff: 'Add Staff',
    activeOne: '{n} active person',
    activeMany: '{n} active people',
    pendingSuffix: ', {n} awaiting acceptance',
    colEmployee: 'Employee',
    colRole: 'Role',
    colJoined: 'Joined',
    colStatus: 'Status',
    colActions: 'Actions',
    storeOwnerBadge: 'Store Owner',
    badgeInvited: 'Invited',
    badgeActive: 'Active',
    badgeDeactivated: 'Deactivated',
    working: 'Working…',
    edit: 'Edit',
    removeAccessQ: 'Remove access?',
    restoreAccessQ: 'Restore access?',
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    editAria: 'Edit {name}',
    deactivateAria: 'Deactivate {name}',
    reactivateAria: 'Reactivate {name}',
    storeOwnerNote: 'Store owner',
    thisIsYou: 'This is you',
    teamEmptyTitle: 'No one here yet',
    teamEmptyBody: 'Invite the people who work in your shop. They’ll get an email to set a password and sign in.',
    deactivateFailed: 'Could not deactivate',
    reactivateFailed: 'Could not reactivate',
    accessRemoved: 'Access removed',
    accessRestored: 'Access restored',
    canNoLongerSignIn: '{name} can no longer sign in.',
    canSignInAgain: '{name} can sign in again.',
    revokeQ: 'Revoke?',
    resend: 'Resend',
    revoke: 'Revoke',
    revokeAria: 'Revoke invitation for {name}',
    resendFailed: 'Could not resend invitation',
    resent: 'Invitation resent',
    revokeFailed: 'Could not revoke invitation',
    revoked: 'Invitation revoked',
    addStaffTitle: 'Add Staff',
    sendInvite: 'Send Invite',
    sendingInvite: 'Sending invite…',
    done: 'Done',
    fFullName: 'Full Name',
    fWorkEmail: 'Work Email',
    fJobTitle: 'Job Title',
    jobTitlePlaceholder: 'Cashier, Inventory Lead...',
    roleHintManager: 'Runs the shop: inventory, customers, suppliers, shifts and takings.',
    roleHintStaff: 'Works the floor: view stock, log sales, see their own shifts.',
    inviteFailed: 'Could not invite staff member',
    invitationSent: 'Invitation sent',
    invitedBodyA: ' has been invited as ',
    invitedBodyB: '. They’ll receive an email to set their password and sign in.',
    editStaffTitle: 'Edit {name}',
    emailNote: 'The sign-in address cannot be changed here.',
    editSaveFailed: 'Could not save changes',
    memberUpdated: 'Team member updated',
    vRoleRequired: 'Role is required.',
    vRoleTooLong: 'Role must be 60 characters or fewer.',
    vDateRequired: 'Choose a date.',
    vStartRequired: 'Enter a start time.',
    vEndRequired: 'Enter an end time.',
    vEndAfterStart: 'End time must be after the start time.',
    vLeaveWho: 'Choose who this leave is for.',
    vLeaveStart: 'Choose a start date.',
    vLeaveEnd: 'Choose an end date.',
    vLeaveEndBefore: 'The end date cannot be before the start date.',
    vLeaveTooLong: 'That is {n} days. Enter a year or less per entry.',
    vLeaveKind: 'Choose a leave type.',
    vLeaveNote: 'Note must be 200 characters or fewer.',
    actSchedNoPermission: 'You do not have permission to change the schedule.',
    actFixFields: 'Please correct the highlighted fields.',
    actNotOnTeam: 'That person is not on this team.',
    actOnLeaveField: 'That person is on leave on this date.',
    actOnLeaveMessage: 'They are on leave that day. Choose another date, or remove the leave first.',
    actLeaveNoPermission: 'You do not have permission to record leave.',
    actLeaveNotSetUp: 'Leave is not set up yet. Run supabase/migrations/0011_staff_leave.sql in the Supabase SQL editor.',
    actOwnRole: 'You cannot change your own role or access from here.',
    actNotInStore: 'That team member is not in this store.',
    actOwnerAccount: 'The store owner’s account cannot be changed from here.',
    actNameRequired: 'A name is required.',
    actBadRole: 'Choose a valid role for this team member.',
    actNotAuthenticated: 'Not authenticated',
    actOwnerOnly: 'Only the store owner can manage the team.',
    notifyRoleChanged: 'Team role changed',
    notifyRoleBody: '{name} is now {role}.',
    notifyDeactivatedBody: '{name} can no longer sign in. Their history is kept.',
    notifyReactivated: 'Team member reactivated',
    notifyDeactivated: 'Team member deactivated',
    leaveKindLabels: { holiday: 'Holiday', sick: 'Sick', unpaid: 'Unpaid', other: 'Leave' },
  },
  settings: {
    eyebrow: 'Configuration',
    title: 'Store Settings',
    subtitle: 'Configuration and operational parameters for {store}.',
    unsaved: 'Unsaved changes',
    discard: 'Discard',
    saving: 'Saving…',
    savedTick: 'Saved ✓',
    save: 'Save Changes',
    saveFailed: 'Could not save settings',
    savedToast: 'Settings saved',
    saveErrorBanner: 'Could not save settings: {message}',
    needsMigration:
      'The expiry warning setting is not set up on this database yet. Run ' +
      'supabase/migrations/0017_store_expiry_warning_days.sql in the Supabase SQL editor.',
    details: 'Store Details',
    storeName: 'Store Name',
    address: 'Primary Address',
    phone: 'Contact Phone',
    appearance: 'Appearance',
    theme: 'Interface Theme',
    themeHint: 'Toggle light/dark mode',
    light: 'Light',
    dark: 'Dark',
    controls: 'Operational Controls',
    thresholds: 'Inventory Thresholds',
    lowStock: 'Global Low-Stock Alert',
    unitsValue: '{n} Units',
    lowStockAria: 'Global low-stock alert, in units',
    expiryWarning: 'Expiry Warning',
    dayValue: '{n} Day',
    daysValue: '{n} Days',
    expiryAria: 'Expiry warning, in days',
    oneDay: '1 day',
    maxDays: '{n} days',
    notifications: 'Notifications',
    criticalAlerts: 'Critical Stock Alerts',
    criticalAlertsHint: 'SMS & Email when items hit 0',
    dailyDigest: 'Daily Digest',
    dailyDigestHint: 'End-of-day sales summary',
    supplierUpdates: 'Supplier Updates',
    supplierUpdatesHint: 'Delivery ETA changes',
    team: 'Your team',
    teamHint: 'Invitations, roles and access moved to Staff, beside the rota.',
    manageTeam: 'Manage team',
    categories: 'Product categories',
    categoriesHint: 'Add, rename and reorder the categories your products are filed under.',
    manageCategories: 'Manage categories',
    legal: 'Legal',
    legalHint: "The privacy policy and terms that apply to this store's account.",
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    sample: 'Sample data',
    sampleHint:
      'Clear the seeded example products so you can import your own catalogue. Your ' +
      'categories, suppliers, staff and settings are kept, and any product that already ' +
      'appears on a sale is left alone.',
    sampleButton: 'Remove Sample Data',
    sampleTitle: 'Remove sample data?',
    sampleBody1:
      'All sample products and related sample inventory data will be removed. This action ' +
      'is intended to help you start with your own store data.',
    sampleBody2:
      'Categories, suppliers, staff and store settings are not affected, and any sample ' +
      'product that already appears on a sale is kept so your history stays intact.',
    sampleKept: 'Sample data kept',
    sampleRemovedOne: 'Removed {n} sample product',
    sampleRemovedMany: 'Removed {n} sample products',
    sampleWithSales: '{n} kept because they appear on past sales.',
    sampleNext: 'You can now import your own CSV from Inventory.',
    vNameRequired: 'Your store needs a name — it appears across the app.',
    vNameTooLong: 'Keep the name to {n} characters or fewer.',
    vAddressTooLong: 'Keep the address to {n} characters or fewer.',
    vPhoneTooLong: 'That phone number is too long.',
    vPhoneShape: 'Use digits, spaces and + ( ) - only.',
    vExpiryRange: 'Choose between {min} and {max} days.',
    sampleDemoStore:
      'The demo store is shared by everyone who tries StockPulse, so its sample data ' +
      'cannot be removed here — doing so would empty it for the next visitor. Create your ' +
      'own free store to import your catalogue.',
    sampleNoPermission: 'Only an owner or manager can remove sample data.',
    sampleReadFailed: 'Could not read the sample products.',
    sampleDeleteFailed: 'Could not remove the sample products.',
    cat: {
      back: 'Store Settings',
      eyebrow: 'Configuration',
      title: 'Product Categories',
      subtitle:
        'The categories your products are filed under, in the order they appear on the ' +
        'product form.',
      notReadyTitle: 'Showing the five built-in categories.',
      notReadyBefore: 'Your own list is stored in the database, and',
      notReadyAfter:
        'has not been run on this project yet. Adding, renaming and reordering stay ' +
        'disabled until it is.',
      listHeading: 'Your categories',
      emptyTitle: 'No categories yet',
      emptyBody: 'Add the first one to start filing products under it.',
      nameLabel: 'Category name',
      saveName: 'Save name',
      removePrefix: 'Remove ',
      removeSuffix: '?',
      remove: 'Remove',
      noProducts: 'No products',
      oneProduct: '{n} product',
      manyProducts: '{n} products',
      moveUp: 'Move {name} up',
      moveDown: 'Move {name} down',
      renameAria: 'Rename {name}',
      rename: 'Rename',
      cannotRemoveOne: 'Cannot remove {name} — {n} product still uses it',
      cannotRemoveMany: 'Cannot remove {name} — {n} products still use it',
      removeAria: 'Remove {name}',
      addHeading: 'Add a category',
      nameHint: 'Shown on the product form and the inventory filter.',
      namePlaceholder: 'Frozen Foods',
      addButton: 'Add category',
      footnote:
        'Renaming a category only changes its label. Products stay where they are, and ' +
        'past sales keep the category they were filed under.',
      addFailed: 'Could not add category',
      added: 'Category added',
      renameFailed: 'Could not rename category',
      renamed: 'Category renamed',
      reorderFailed: 'Could not reorder categories',
      notRemoved: 'Category not removed',
      removed: 'Category removed',
      vNameRequired: 'Give the category a name.',
      vNameTooLong: 'Keep the name to {n} characters or fewer.',
      vNameNoAlnum: 'Use at least one letter or number.',
      vNameDuplicate: 'You already have a category with that name.',
      needsMigration:
        'Categories are not set up on this database yet. Run ' +
        'supabase/migrations/0013_categories.sql in the SQL editor.',
      zeroRows:
        'Nothing changed — either that category has already been removed, or your role ' +
        'does not allow this. Refreshing the list.',
      noPermission: 'You do not have permission to change categories.',
      slugClash: 'That is too close to a category you already have.',
      nameTaken: 'You already have a category with that name.',
      nameUnusable: 'That name cannot be used.',
      inUseOne:
        '{n} product still uses this category. Move it to another category first, then ' +
        'delete this one.',
      inUseMany:
        '{n} products still use this category. Move them to another category first, then ' +
        'delete this one.',
      lastCategory: 'This is your only category. Add another before removing this one.',
      movedIn:
        'Products were moved into this category a moment ago, so it can no longer be ' +
        'removed. Refresh and check.',
    },
  },
  profile: {
    eyebrow: 'Account',
    storeOwner: 'Store Owner',
    memberSince: 'Member since {year}',
    editProfile: 'Edit Profile',
    logOut: 'Log out',
    personalInfo: 'Personal Information',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    location: 'Location',
    notSet: 'Not set',
    security: 'Account Security',
    password: 'Password',
    passwordHint: 'Keep your account secure with a strong password.',
    update: 'Update',
    itemsManaged: 'Items Managed',
    staffMembers: 'Staff Members',
    editTitle: 'Edit Profile',
    saving: 'Saving…',
    saveChanges: 'Save Changes',
    vNameRequired: 'Your name is required.',
    vNameTooLong: 'Keep your name to {n} characters or fewer.',
    updateFailed: 'Could not update profile',
    updated: 'Profile updated',
    phonePlaceholder: '+1 (555) 123-4567',
    locationPlaceholder: 'Portland, OR',
    pwTitle: 'Change Password',
    pwUpdating: 'Updating…',
    pwUpdate: 'Update Password',
    pwDone: 'Your password has been updated.',
    pwDoneButton: 'Done',
    pwNew: 'New Password',
    pwConfirm: 'Confirm Password',
    pwTooShort: 'Password must be at least 8 characters long.',
    pwMismatch: 'Passwords do not match.',
    pwFailed: 'Could not update password',
    pwUpdated: 'Password updated',
    avatarLabel: 'Profile Photo',
    avatarReplace: 'Replace',
    avatarUpload: 'Upload photo',
    avatarRemove: 'Remove',
    avatarHint: 'JPEG, PNG or WebP. Up to 2 MB.',
    avatarAdjust: 'Adjust your photo',
    avatarType: 'Choose a JPEG, PNG or WebP image.',
    avatarTooBig: 'That image is {size} MB. The limit is 2 MB.',
    avatarNoBucket: 'Photo storage is not set up yet. Apply migration 0008, then try again.',
    avatarFailed: 'Upload failed: {message}',
  },
  audit: {
    eyebrow: 'Accountability',
    title: 'Activity & Audit Log',
    subtitle:
      'Every change to products, customers, suppliers and sales. Append-only — entries ' +
      'cannot be edited or removed, including by you.',
    items: 'entries',
    searchAria: 'Search activity',
    searchPlaceholder: 'Search person, record, or field...',
    filterType: 'Filter by record type',
    allTypes: 'All types',
    filterAction: 'Filter by action',
    allActions: 'All actions',
    filterPerson: 'Filter by person',
    anyone: 'Anyone',
    from: 'From',
    to: 'To',
    colWhen: 'When',
    colWho: 'Who',
    colAction: 'Action',
    colType: 'Type',
    colRecord: 'Record',
    colChanged: 'Changed',
    system: 'System',
    emptyTitle: 'No activity recorded yet',
    emptyBody:
      'Changes to products, customers, suppliers and sales will appear here as they happen.',
    noMatchTitle: 'No entries match your filters',
    noMatchBody: 'Try widening the date range or clearing a filter.',
    entityProduct: 'Product',
    entityCustomer: 'Customer',
    entitySupplier: 'Supplier',
    entitySale: 'Sale',
    actionInsert: 'Created',
    actionUpdate: 'Updated',
    actionDelete: 'Deleted',
    summaryCreated: 'Record created',
    summaryDeleted: 'Record deleted',
    summaryNoChanges: 'No visible field changes',
    yes: 'Yes',
    no: 'No',
  },
  notif: {
    panelTitle: 'Notifications',
    markAllRead: 'Mark all read',
    loading: 'Loading…',
    caughtUp: 'You’re all caught up.',
    unread: 'Unread',
    bellNone: 'Notifications, none unread',
    bellOne: 'Notifications, 1 unread',
    bellMany: 'Notifications, {n} unread',
    kindGeneral: 'Update',
    kindLowStock: 'Low stock',
    kindStaff: 'Staff',
    kindSupplier: 'Supplier',
    kindSales: 'Sales',
  },
  help: {
    eyebrow: 'Help Centre',
    title: 'How can we help?',
    subtitle:
      'Search the guides, or browse by topic below. Every article describes what StockPulse ' +
      'actually does today.',
    searchAria: 'Search help articles',
    searchPlaceholder: 'Search help articles…',
    noMatch: 'No articles match “{q}”',
    oneMatch: '{n} article matching “{q}”',
    manyMatch: '{n} articles matching “{q}”',
    nothingTitle: 'Nothing found for that',
    nothingBody: 'Try a broader word, or one of these:',
    suggested: ['low stock', 'import CSV', 'shift', 'password', 'roles'],
    browse: 'Browse topics',
    allTopics: 'All help topics',
    moreOnThis: 'More on this',
    articleNotFound: 'Article not found',
    formTitle: 'Need more help?',
    formIntro:
      'If none of the articles cover it, tell us what is happening and we will get back to you.',
    sentTitle: 'Request sent',
    sentBefore: 'Thanks — we have it. Your ticket reference is ',
    sentAfter: '. Quote that if you need to follow up. We usually reply within one business day.',
    sendAnother: 'Send another request',
    fName: 'Your name',
    fEmail: 'Email',
    fEmailHint: 'Where we should send the reply.',
    fCategory: 'What is it about?',
    fMessage: 'Message',
    fMessageHint: '{n} of {max} characters',
    fMessagePlaceholder: 'Tell us what you were trying to do, and what happened instead.',
    sending: 'Sending…',
    send: 'Send request',
    catGettingStarted: 'Getting started',
    catInventory: 'Inventory & stock',
    catSales: 'Sales',
    catSuppliers: 'Suppliers',
    catCustomers: 'Customers',
    catStaff: 'Staff & scheduling',
    catSettings: 'Settings',
    catAi: 'AI assistant',
    catRoles: 'Roles & permissions',
    catBilling: 'Billing',
    catBug: 'Something is broken',
    catOther: 'Something else',
    vName: 'Enter your name so we know who is writing.',
    vNameTooLong: 'Name must be {n} characters or fewer.',
    vEmail: 'Enter an email address so we can reply.',
    vEmailTooLong: 'That email address is too long.',
    vEmailInvalid: 'Enter a valid email address, like you@yourshop.com.',
    vCategory: 'Choose a category.',
    vMessage: 'Tell us what is going wrong.',
    vMessageShort: 'Please add a little more detail — at least {n} characters.',
    vMessageLong: 'Please keep this under {n} characters.',
    fixFields: 'Please correct the highlighted fields.',
    detailsRejected: 'Some of those details were rejected. Check the message length and try again.',
    noStore: 'Your account is not attached to a store, so this could not be filed.',
    savedNoRef: 'Your request was saved, but we could not read back its ticket number.',
    sendFailed: 'Could not send your request: {message}',
  },
  support: {
    eyebrow: 'Support',
    title: 'Help requests',
    waitingOne: '{n} request waiting on a reply.',
    waitingMany: '{n} requests waiting on a reply.',
    allDescription: 'Everything raised from the Help Centre, and what has been dealt with.',
    filterOpen: 'Open ({n})',
    filterAll: 'All ({n})',
    nothingTitle: 'Nothing waiting',
    nothingBody: 'Every support request has been dealt with.',
    emptyTitle: 'No requests yet',
    emptyBody: 'Requests raised from the Help Centre will appear here.',
    statusOpen: 'Open',
    statusResolved: 'Resolved',
    markResolved: 'Mark resolved',
    reopen: 'Reopen',
    updateFailed: 'Could not update the request',
    markedResolved: 'Marked resolved',
    reopened: 'Reopened',
    noPermission: 'Only an owner or manager can change a request.',
  },
  ai: {
    title: 'Store Assistant',
    online: 'Online',
    history: 'Conversation history',
    unmute: 'Turn on spoken replies',
    mute: 'Turn off spoken replies',
    close: 'Close assistant',
    opening: 'Opening conversation…',
    emptyTitle: 'How can I help you today?',
    emptyBody: 'I can check stock, analyze sales data, or help manage staff schedules.',
    sLowStock: 'Which products are low on stock?',
    sExpiring: 'Which products are expiring soon?',
    sToday: "What were today's sales?",
    sWeek: "Give me this week's sales summary",
    sValue: 'What is my total inventory value?',
    clearCurrent: 'Clear current chat',
    placeholder: 'Ask about inventory, sales, or staff',
    sendAria: 'Send message',
    disclaimer: 'AI can make mistakes. Verify critical data before acting.',
    clearTitle: 'Clear this conversation?',
    clearButton: 'Clear chat',
    clearBodyOne: 'This removes the {n} message in this conversation. It cannot be undone.',
    clearBodyMany: 'This removes all {n} messages in this conversation. It cannot be undone.',
    clearBody2:
      'The conversation itself stays open, so you can carry on asking questions — it just ' +
      'starts empty. To remove it entirely, use the delete button in the history list.',
    prefSaveFailed: 'Could not save that preference.',
    threadStartFailed: 'Could not start a saved conversation — this exchange will not be kept.',
    openFailed: 'Could not open that conversation.',
    deleteFailed: 'Could not delete that conversation.',
    clearFailed: 'Could not clear this conversation.',
    streamError: 'Sorry, something went wrong. Please try again.',
    newChat: 'New chat',
    loadingThreads: 'Loading conversations…',
    noThreads:
      'No past conversations yet. Anything you ask is saved here so you can pick it up later.',
    bucketToday: 'Today',
    bucketYesterday: 'Yesterday',
    bucketEarlier: 'Earlier',
    untitled: 'New conversation',
    deleteQ: 'Delete this chat?',
    deleteAria: 'Delete conversation: {name}',
    vAudioCapture: 'No microphone found. Check one is connected and not in use by another app.',
    vNetwork: 'Voice input needs an internet connection. Reconnect and try again.',
    vNoSpeech: 'Didn’t catch that — try again, a little closer to the microphone.',
    vLangUnsupported: 'This browser cannot recognise speech here.',
    vServiceNotAllowed: 'Speech recognition is turned off in this browser’s settings.',
    vBlocked:
      'Microphone access is blocked for {host}. Permission is per-site, so allowing it ' +
      'elsewhere does not count — open the icon at the left of the address bar, set ' +
      'Microphone to Allow, then reload.',
    vStartFailed: 'Voice input could not start. Try again.',
    vInsecure:
      'Voice input needs a secure connection. {host} is plain http — use https, or open the ' +
      'app on localhost.',
    vUnknown: 'Voice input stopped ({code}). Try again.',
    vStop: 'Stop recording',
    vAsk: 'Ask by voice',
    vRecording: 'Recording. Speak now.',
    vProcessing: 'Finishing transcription.',
    rMalformed: 'Malformed request body.',
    rInvalid: 'Invalid or oversized message payload.',
    rRateLimit: 'Too many requests. Please wait a moment and try again.',
    rNotConfigured: 'AI Assistant is not configured yet. Add GEMINI_API_KEY to enable it.',
    rTooManyLookups:
      "I wasn't able to finish looking that up — the request needed too many lookups. " +
      'Try asking for one thing at a time.',
    rNoAnswer: "Sorry, I couldn't come up with an answer for that. Try rephrasing?",
    rError: 'Sorry, I ran into an error: {message}',
    ownerOnly: 'This information is only available to owners and managers.',
    replyLanguage: 'Always reply in English.',
  },
  dash: {
    greetMorning: 'Good morning',
    greetAfternoon: 'Good afternoon',
    greetEvening: 'Good evening',
    allInOrder: 'Everything’s in order.',
    lowOnStockOne: '{n} item low on stock',
    lowOnStockMany: '{n} items low on stock',
    countersBusy: '{busy} of {total} counters busy',
    updated: 'Updated',
    liveUpdates: 'Live Updates Active',
    agoJustNow: 'just now',
    agoSeconds: '{n}s ago',
    agoOneMin: '1 min ago',
    agoMins: '{n} min ago',
    todaySalesOwner: "Today's Sales",
    todayTotalStaff: "Today's Total",
    vsYesterday: 'vs yesterday',
    salesTodayOne: '{n} sale today',
    salesTodayMany: '{n} sales today',
    sparklineAria: 'Revenue for the last {n} days',
    transactionsToday: 'Transactions Today',
    logged: 'logged',
    weekRevenue: '7-Day Revenue',
    transactionsOne: '{n} transaction',
    transactionsMany: '{n} transactions',
    viewAll: 'View all',
    lowStockTile: 'Low Stock Items',
    expiringTile: 'Expiring Soon',
    alreadyExpired: '{n} already expired',
    withinOne: 'within {n} day',
    withinMany: 'within {n} days',
    quickActions: 'Quick Actions',
    qaNewOrder: 'New Order',
    qaCheckout: 'Checkout Status',
    qaCheckStock: 'Check Stock',
    qaReports: 'Reports',
    trendTitle: 'Daily Sales Trends',
    trendSubtitle: 'Revenue per day over the last 7 days.',
    chartSeries: 'Sales',
    noSalesWeekTitle: 'No sales this week',
    noSalesWeekBody: 'Once you log sales, the last seven days appear here as a trend.',
    logSale: 'Log a sale',
    recentSales: 'Recent Sales',
    latest: 'Latest {n}',
    noSalesTitle: 'No sales logged yet',
    noSalesBody: 'Sales appear here as your team logs them.',
    staffFallback: 'Staff',
    completed: 'Completed',
    viewHistory: 'View Complete History',
    recentAlerts: 'Recent Alerts',
    alertsNew: '{n} New',
    noAlertsTitle: 'No active alerts',
    noAlertsBody: 'Low stock, checkout issues, and arriving deliveries will show up here.',
    lowStockTitle: 'Low Stock Alerts',
    colItem: 'Item Name',
    colCategory: 'Category',
    colStockLevel: 'Stock Level',
    colAction: 'Action',
    colExpires: 'Expires',
    allStockedTitle: 'All products are well stocked',
    allStockedBody: 'Items fall into this list once they drop to their low-stock threshold.',
    unitsLeft: '{n} left',
    restock: 'Restock',
    expiringTitle: 'Expiring Soon',
    expiryReadError:
      'Expiry dates could not be read just now, so this list may be incomplete. Reload to try ' +
      'again.',
    nothingExpiringTitle: 'Nothing is expiring soon',
    nothingExpiringOne:
      'Items fall into this list once they come within {n} day of their expiry date.',
    nothingExpiringMany:
      'Items fall into this list once they come within {n} days of their expiry date.',
    expiredWord: 'expired',
    expiresWord: 'expires',
    unitOne: '{n} unit',
    unitMany: '{n} units',
    writeOff: 'Write off',
    discount: 'Discount',
    aExpiredTitleOne: 'Expired: {n} item',
    aExpiredTitleMany: 'Expired: {n} items',
    aExpiredBodyOne: '{name} is past its expiry date.',
    aExpiredBodyTwo: '{name} and {n} other are past their expiry date.',
    aExpiredBodyMany: '{name} and {n} others are past their expiry date.',
    aExpiringTitleOne: 'Expiring within {n} day',
    aExpiringTitleMany: 'Expiring within {n} days',
    aExpiringBodyOne: '{n} item to sell or move while there is still time.',
    aExpiringBodyMany: '{n} items to sell or move while there is still time.',
    aLowStockTitle: 'Low Stock: {category}',
    aLowStockBodyOne: '{n} item below minimum threshold.',
    aLowStockBodyMany: '{n} items below minimum threshold.',
    aStationTitle: 'Station 0{n} Alert',
    aWeightMismatch: 'Weight mismatch detected at bagging area.',
    aAgeCheck: 'Age verification required for restricted item.',
    aDeliveryTitle: 'Delivery Arrived',
    aDeliveryBody: '{supplier} delivery is ready for intake.',
    supplierFallback: 'Supplier',
    timeNow: 'now',
  },
  palette: {
    ariaLabel: 'Command palette',
    searchPlaceholder: 'Search pages and actions...',
    searchAria: 'Search pages and actions',
    results: 'Results',
    noResultsTitle: 'No results',
    noResultsBody:
      'Nothing matches “{query}”. Try a page name, or an action like “add product”.',
    groupNavigation: 'Navigation',
    groupActions: 'Actions',
    groupProducts: 'Products',
    openAssistant: 'Open AI Assistant',
    viewProfile: 'View Profile',
    signOut: 'Sign Out',
  },
  tabs: { dashboard: 'DASHBOARD', inventory: 'INVENTORY', monitoring: 'MONITORING', settings: 'SETTINGS' },
}

const te: AppCopy = {
  ...OPERATIONS_COPY.te,
  nav: {
    dashboard: 'డాష్‌బోర్డ్',
    inventory: 'నిల్వ',
    sales: 'అమ్మకాలు',
    reports: 'నివేదికలు',
    audit: 'కార్యకలాపాలు',
    customers: 'కస్టమర్లు',
    suppliers: 'సరఫరాదారులు',
    staff: 'సిబ్బంది',
    monitoring: 'పర్యవేక్షణ',
    settings: 'సెట్టింగ్‌లు',
    support: 'సహాయం',
    help: 'సహాయ కేంద్రం',
    profile: 'ప్రొఫైల్',
  },
  shell: {
    skipToContent: 'ప్రధాన కంటెంట్‌కు వెళ్లండి',
    storeOperations: 'దుకాణ నిర్వహణ',
    demoBadge: 'డెమో దుకాణం — నమూనా డేటా',
    openNavigation: 'మెనూ తెరవండి',
    closeNavigation: 'మెనూ మూసివేయండి',
    searchPlaceholder: 'వస్తువులు, అమ్మకాలు, కస్టమర్లను వెతకండి...',
    searchShort: 'వెతకండి లేదా వెళ్లండి...',
    aiAssistant: 'AI అసిస్టెంట్',
    notifications: 'నోటిఫికేషన్లు',
    yourProfile: 'మీ ప్రొఫైల్',
    navigation: 'నావిగేషన్',
    profileSummary: 'మీ ప్రొఫైల్ — {name}, {store}లో {role}',
  },
  roles: { owner: 'యజమాని', manager: 'మేనేజర్', staff: 'సిబ్బంది' },
  common: {
    exportCsv: 'CSV ఎగుమతి',
    nothingToExportTitle: 'ఎగుమతి చేయడానికి ఏమీ లేదు',
    nothingToExportBody: 'ప్రస్తుత ఫిల్టర్లకు సరిపోయే {items} ఏవీ లేవు.',
    exportedTitle: '{count} {items} ఎగుమతి అయ్యాయి',
    cancel: 'రద్దు',
    delete: 'తొలగించు',
    clearAll: 'అన్నీ తొలగించు',
    clearFilters: 'ఫిల్టర్లు తొలగించు',
    clearSearch: 'వెతుకులాట తొలగించు',
    closeDialog: 'మూసివేయండి',
    loading: 'లోడ్ అవుతోంది',
    loadingPage: 'పేజీ కంటెంట్ లోడ్ అవుతోంది…',
    previousPage: 'మునుపటి పేజీ',
    nextPage: 'తదుపరి పేజీ',
    rows: 'వరుసలు',
    pageOf: '/ {total}',
    showingRange: 'మొత్తం {total} {items}లో {start}-{end} చూపుతోంది',
    notificationsRegion: 'నోటిఫికేషన్లు',
    dismissNotification: 'నోటిఫికేషన్ తొలగించండి',
    usePhoto: 'ఈ ఫోటో వాడండి',
    dragToReposition: 'సర్దుబాటు చేయడానికి లాగండి',
    zoom: 'జూమ్',
    imageError: 'ఆ ఫోటోను ప్రాసెస్ చేయలేకపోయాం.',
    canvasError: 'ఈ బ్రౌజర్‌లో కాన్వాస్ అందుబాటులో లేదు.',
    relJustNow: 'ఇప్పుడే',
    relMinutesAgo: '{n} నిమి క్రితం',
    relHoursAgo: '{n} గం క్రితం',
    relDaysAgo: '{n} రోజుల క్రితం',
  },
  expiry: {
    months: ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జులై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం'],
    expired: 'గడువు ముగిసింది',
    expiringSoon: 'త్వరలో గడువు ముగుస్తుంది',
    expires: 'గడువు',
    noDate: 'గడువు తేదీ లేదు',
    moreLot: '+{n} మరో లాట్',
    moreLots: '+{n} మరిన్ని లాట్లు',
    relToday: 'ఈరోజు',
    relTomorrow: 'రేపు',
    relYesterday: 'నిన్న',
    relInDays: '{n} రోజుల్లో',
    relDaysAgo: '{n} రోజుల క్రితం',
  },
  sort: {
    ascending: ', ఆరోహణ క్రమంలో అమర్చబడింది. తిప్పడానికి నొక్కండి.',
    descending: ', అవరోహణ క్రమంలో అమర్చబడింది. తిప్పడానికి నొక్కండి.',
    none: ', అమర్చబడలేదు. అమర్చడానికి నొక్కండి.',
  },
  validation: {
    nameRequired: 'పేరు తప్పనిసరి.',
    nameTooLong: 'పేరు 120 అక్షరాలకు మించకూడదు.',
    skuTooLong: 'SKU 40 అక్షరాలకు మించకూడదు.',
    barcodeShape: '8 నుండి 14 అంకెలు, సంఖ్యలు మాత్రమే వాడండి.',
    brandTooLong: 'బ్రాండ్ 80 అక్షరాలకు మించకూడదు.',
    categoryInvalid: 'సరైన వర్గాన్ని ఎంచుకోండి.',
    priceMin: 'సున్నా లేదా అంతకంటే ఎక్కువ ఉండాలి.',
    priceTooLarge: 'ఆ ధర చాలా ఎక్కువగా ఉంది.',
    thresholdWhole: 'పూర్ణ సంఖ్య, సున్నా లేదా అంతకంటే ఎక్కువ ఉండాలి.',
    unitRequired: 'యూనిట్ తప్పనిసరి.',
    tooManyLots: 'ఒక వస్తువుకు గరిష్ఠంగా {n} లాట్లు.',
    quantityWhole: 'పూర్ణ సంఖ్య, సున్నా లేదా అంతకంటే ఎక్కువ ఉండాలి.',
    useDatePicker: 'తేదీ ఎంపికను వాడండి.',
    badYear: 'సంవత్సరం సరిచూడండి \u2014 {year}లో ఏదీ గడువు ముగియదు.',
    lotPrefix: 'లాట్ {n}: {message}',
  },
  inventory: {
    eyebrow: 'నిల్వ',
    title: 'నిల్వ నిర్వహణ',
    subtitle: 'స్టాక్ స్థాయిలు, వర్గాలు, ధరలను నిర్వహించండి.',
    scan: 'స్కాన్',
    importCsv: 'CSV దిగుమతి',
    addProduct: 'వస్తువు చేర్చు',
    searchAria: 'నిల్వలో వెతకండి',
    searchPlaceholder: 'పేరు, SKU, బార్‌కోడ్, బ్రాండ్, వర్గం లేదా యూనిట్ వెతకండి...',
    filterByStatus: 'స్టాక్ స్థితి ఆధారంగా ఫిల్టర్',
    allCategories: 'అన్ని వర్గాలు',
    statusAny: 'ఏ స్థితైనా',
    statusIn: 'స్టాక్‌లో ఉంది',
    statusLow: 'తక్కువ స్టాక్',
    statusOut: 'స్టాక్ అయిపోయింది',
    badgeIn: 'స్టాక్‌లో ఉంది',
    badgeLow: 'తక్కువ స్టాక్',
    badgeOut: 'స్టాక్ లేదు',
    totalValue: 'మొత్తం విలువ',
    lowStock: 'తక్కువ స్టాక్',
    outOfStock: 'స్టాక్ లేదు',
    itemsCount: '{n} వస్తువులు',
    exportItems: 'వస్తువులు',
    colProduct: 'వస్తువు',
    colSkuCategory: 'SKU / వర్గం',
    colUnitPrice: 'యూనిట్ ధర',
    colStock: 'స్టాక్',
    colExpiry: 'గడువు',
    colStatus: 'స్థితి',
    colActions: 'చర్యలు',
    skuPrefix: 'SKU: {v}',
    barcodePrefix: 'బార్‌కోడ్: {v}',
    minPrefix: 'కనిష్ఠం: {v}',
    editRow: '{name} సవరించండి',
    deleteRow: '{name} తొలగించండి',
    emptyTitle: 'ఇంకా వస్తువులు లేవు',
    emptyBody:
      'స్టాక్ స్థాయిలు, ధరలు, తక్కువ స్టాక్ హెచ్చరికలను ట్రాక్ చేయడం మొదలుపెట్టడానికి మీ మొదటి వస్తువును చేర్చండి.',
    noMatchTitle: 'మీ ఫిల్టర్లకు సరిపోయే వస్తువులు లేవు',
    noMatchBody: 'వేరే పదంతో వెతకండి, లేదా వర్గం, స్థితి ఫిల్టర్లను తొలగించండి.',
    scanTitle: 'బార్‌కోడ్ స్కాన్ చేయండి',
    scanHelp:
      'కెమెరాను వస్తువు బార్‌కోడ్ వైపు చూపండి. అది ఇప్పటికే మీ నిల్వలో ఉంటే స్టాక్‌ను నవీకరించవచ్చు; లేకపోతే కొత్తగా చేర్చవచ్చు.',
    scanLooking: 'ఆ బార్‌కోడ్‌ను వెతుకుతోంది\u2026',
    scanFoundTitle: 'వస్తువు దొరికింది',
    scanFoundExpiry: '{name} \u2014 {state} {date}, {rel}.',
    scanFoundNoExpiry: '{name} \u2014 గడువు తేదీ లేదు. స్టాక్ నవీకరించి సేవ్ చేయండి.',
    scanExpiredWord: 'గడువు ముగిసింది',
    scanExpiresWord: 'గడువు',
    scanNoMatchTitle: 'ఆ బార్‌కోడ్‌తో వస్తువు లేదు',
    scanNoMatchBody: 'ఇప్పుడే చేర్చండి \u2014 బార్‌కోడ్ ముందే నింపబడింది.',
    scanCacheHit: '{name} మీ సేవ్ చేసిన జాబితాలో ఉంది, కానీ స్టాక్ సవరించడానికి కనెక్షన్ అవసరం.',
    scanCacheMiss:
      'సేవ్ చేసిన జాబితాలో {code} బార్‌కోడ్ ఉన్న వస్తువు లేదు. పూర్తి జాబితాలో వెతకడానికి మళ్లీ కనెక్ట్ అవ్వండి.',
    scanFailed: 'వెతకడం విఫలమైంది. మళ్లీ ప్రయత్నించండి.',
    deleteTitle: 'వస్తువును తొలగించాలా?',
    deleteBodyA: 'ఇది ',
    deleteBodyB: ' ను నిల్వ నుండి శాశ్వతంగా తొలగిస్తుంది.',
    deleteConfirm: 'తొలగించు',
    deleteFailed: 'వస్తువును తొలగించలేకపోయాం.',
    deleteFailedToast: 'వస్తువు తొలగించబడలేదు',
    deletedToast: 'వస్తువు తొలగించబడింది',
    formEdit: 'వస్తువును సవరించండి',
    formAdd: 'వస్తువు చేర్చు',
    saveChanges: 'మార్పులు సేవ్ చేయి',
    fName: 'వస్తువు పేరు',
    fBrand: 'బ్రాండ్',
    fSku: 'SKU',
    fBarcode: 'బార్‌కోడ్',
    barcodeHint: 'ఐచ్ఛికం \u00b7 8-14 అంకెలు, సంఖ్యలు మాత్రమే',
    barcodePlaceholder: 'ఉదా. 8901234567895',
    fCategory: 'వర్గం',
    manageCategories: 'వర్గాలను నిర్వహించండి',
    fPrice: 'ధర ($)',
    fUnit: 'యూనిట్',
    unitPlaceholder: 'ea, lb, gal',
    fThreshold: 'తక్కువ స్టాక్ పరిమితి',
    lotsLegend: 'స్టాక్ & గడువు',
    lotsHelp: 'ప్రతి డెలివరీకి ఒక వరుస. గడువు లేని వాటికి తేదీని ఖాళీగా వదిలేయండి.',
    fQuantity: 'పరిమాణం',
    fExpiryDate: 'గడువు తేదీ',
    optional: 'ఐచ్ఛికం',
    removeLot: 'లాట్ {n} తొలగించు',
    addLot: 'మరో లాట్ చేర్చు',
    totalStock: 'మొత్తం స్టాక్:',
    saveFailed: 'వస్తువును సేవ్ చేయలేకపోయాం.',
    updateFailedToast: 'వస్తువు నవీకరించబడలేదు',
    addFailedToast: 'వస్తువు చేర్చబడలేదు',
    updatedToast: 'వస్తువు నవీకరించబడింది',
    addedToast: 'వస్తువు చేర్చబడింది',
    photoLabel: 'వస్తువు ఫోటో',
    photoReplace: 'మార్చు',
    photoAdd: 'ఫోటో చేర్చు',
    photoRemove: 'తొలగించు',
    photoHint: 'JPEG, PNG లేదా WebP. గరిష్ఠంగా 2 MB.',
    photoChooseAria: 'వస్తువు ఫోటో ఎంచుకోండి',
    photoAdjustTitle: 'ఫోటోను సర్దుబాటు చేయండి',
    photoUseImage: 'ఈ చిత్రం వాడండి',
    photoTypeError: 'JPEG, PNG లేదా WebP చిత్రాన్ని ఎంచుకోండి.',
    photoSizeError: 'ఆ చిత్రం {mb} MB ఉంది. పరిమితి 2 MB.',
    photoBucketError:
      'వస్తువు చిత్రాల నిల్వ ఇంకా సిద్ధం కాలేదు. మైగ్రేషన్ 0009 వర్తింపజేసి మళ్లీ ప్రయత్నించండి.',
    photoUploadError: 'అప్‌లోడ్ విఫలమైంది: {msg}',
    detailsTitle: 'వస్తువు వివరాలు',
    detailsLoading: 'వస్తువు వివరాలు లోడ్ అవుతున్నాయి',
    openInInventory: 'నిల్వలో తెరవండి',
    noBrand: 'బ్రాండ్ నమోదు కాలేదు',
    dSku: 'SKU',
    dBarcode: 'బార్‌కోడ్',
    dCategory: 'వర్గం',
    dBrand: 'బ్రాండ్',
    dPrice: 'ధర',
    dUnit: 'యూనిట్',
    dCurrentStock: 'ప్రస్తుత స్టాక్',
    dMinStock: 'కనీస స్టాక్',
    dInventoryValue: 'నిల్వ విలువ',
    dNextExpiry: 'తదుపరి గడువు',
    noExpiryDate: 'గడువు తేదీ లేదు',
    batchesHeading: 'బ్యాచ్‌లు / లాట్లు',
    noBatches:
      'బ్యాచ్‌లు నమోదు కాలేదు. స్టాక్ ప్రతి డెలివరీ వారీగా లెక్కించబడుతుంది, కాబట్టి ఈ వస్తువు చేతిలో లేదు.',
    lotQuantity: 'పరిమాణం',
    lotExpiry: 'గడువు',
    lotReceived: 'అందిన తేదీ',
    lotNote: 'గమనిక',
    notFoundTitle: 'వస్తువు కనబడలేదు',
    notFoundBody: 'అది తొలగించబడి ఉండవచ్చు, లేదా వేరే దుకాణానికి చెందినది కావచ్చు.',
    importTitle: 'CSV నుండి వస్తువులను దిగుమతి చేయండి',
    importIntroA: '',
    importIntroB: ' కాలమ్ ఉన్న CSV ఫైల్‌ను అప్‌లోడ్ చేయండి. వరుసలు ఇప్పటికే ఉన్న వస్తువులతో ',
    importIntroC:
      ' ఆధారంగా సరిపోల్చబడతాయి \u2014 SKU సరిపోలితే ఆ వస్తువు నవీకరించబడుతుంది, లేకపోతే కొత్తది చేర్చబడుతుంది. మీరు నిర్ధారించే వరకు ఏదీ సేవ్ కాదు.',
    requiredLabel: 'తప్పనిసరి:',
    optionalLabel: 'ఐచ్ఛికం:',
    formatNote:
      'తేదీలు YYYY-MM-DD రూపంలో (2026-03-31). సంఖ్యలు సాదాగా, కరెన్సీ గుర్తు లేదా వేల విభాజకం లేకుండా (1250.50, $1,250.50 కాదు). వద్దనుకున్న ఐచ్ఛిక గడిని ఖాళీగా వదిలేయండి.',
    newToThis: 'కొత్తగా వాడుతున్నారా?',
    sampleBlurb: 'అవసరమైన ఫార్మాట్, ఉదాహరణ విలువలు చూడటానికి నమూనా CSV డౌన్‌లోడ్ చేయండి.',
    downloadSample: 'నమూనా CSV డౌన్‌లోడ్',
    chooseFile: 'CSV ఫైల్ ఎంచుకోండి',
    chooseAnother: 'వేరే ఫైల్ ఎంచుకోండి',
    importRow: '{n} వరుస దిగుమతి',
    importRows: '{n} వరుసలు దిగుమతి',
    statToAdd: 'చేర్చాల్సినవి',
    statToUpdate: 'నవీకరించాల్సినవి',
    statProblems: 'సమస్యలు',
    colLine: 'లైన్',
    colImportProduct: 'వస్తువు',
    colAction: 'చర్య',
    actAdd: 'చేర్చు',
    actUpdate: 'నవీకరించు',
    actSkip: 'వదిలేయి',
    unknownCol: 'గుర్తించని కాలమ్ విస్మరించబడింది: {cols}',
    unknownCols: 'గుర్తించని కాలమ్‌లు విస్మరించబడ్డాయి: {cols}',
    replacesLots:
      'ఈ ఫైల్‌లో స్టాక్ కాలమ్ ఉంది, కాబట్టి సరిపోలిన ప్రతి వస్తువు యొక్క ప్రస్తుత స్టాక్ లాట్లు, గడువు తేదీలు ఆ వరుస చెప్పే ఒకే లాట్‌తో భర్తీ చేయబడతాయి.',
    errTooBig: 'ఆ ఫైల్ 2 MB కంటే పెద్దది. చిన్న భాగాలుగా విడగొట్టండి.',
    errMissingCol:
      'ఫైల్‌కు "{cols}" కాలమ్ అవసరం. ఆశించిన హెడర్లను చూడటానికి మీ నిల్వను CSVగా ఎగుమతి చేయండి.',
    errNoRows: 'హెడర్ కింద డేటా వరుసలు కనబడలేదు.',
    errNotCsv: 'ఆ ఫైల్‌ను CSVగా చదవలేకపోయాం.',
    nothingToImport: 'దిగుమతి చేయడానికి ఏమీ లేదు',
    nothingToImportBody: 'ఈ ఫైల్‌లోని ప్రతి వరుసలో సమస్య ఉంది.',
    importFailed: 'దిగుమతి విఫలమైంది',
    importedProblems: 'సమస్యలతో దిగుమతి అయింది',
    importComplete: 'దిగుమతి పూర్తయింది',
    sumAdded: '{n} చేర్చబడ్డాయి',
    sumUpdated: '{n} నవీకరించబడ్డాయి',
    sumFailed: '{n} విఫలమయ్యాయి',
    actNoPermission: 'నిల్వను మార్చడానికి మీకు అనుమతి లేదు.',
    actFixFields: 'గుర్తించిన ఫీల్డ్‌లను సరిచేయండి.',
    actSkuExists: 'ఆ SKU ఉన్న వస్తువు ఇప్పటికే ఉంది.',
    actBadBarcode: 'అది సరైన బార్‌కోడ్ కాదు.',
    actNoImportPermission: 'నిల్వను దిగుమతి చేయడానికి మీకు అనుమతి లేదు.',
    actNothingToImport: 'దిగుమతి చేయడానికి ఏమీ లేదు.',
    dupSku: 'ఈ ఫైల్‌లో "{v}" SKU ఇంతకు ముందే ఉంది.',
    dupBarcode: 'ఈ ఫైల్‌లో "{v}" బార్‌కోడ్ ఇంతకు ముందే ఉంది.',
  },
  pos: {
    eyebrow: 'లావాదేవీలు',
    title: 'అమ్మకాలు',
    subtitleRevenue: 'ఈ వారం: {week} · సగటు ఆర్డర్ {avg}',
    subtitlePlain: 'కొత్త అమ్మకాలు నమోదు చేయండి, ఇటీవలి లావాదేవీలు చూడండి.',
    logSale: 'అమ్మకం నమోదు',
    transactions: 'లావాదేవీలు',
    weeklyPerformance: 'వారపు పనితీరు',
    revenue7: 'ఆదాయం, గత 7 రోజులు',
    popularCategories: 'ప్రాచుర్యం ఉన్న వర్గాలు',
    noSalesDataTitle: 'ఇంకా అమ్మకాల డేటా లేదు',
    noSalesDataBody: 'అమ్మకాలు నమోదైన తర్వాత వర్గాల వివరణ కనిపిస్తుంది.',
    recentTransactions: 'ఇటీవలి లావాదేవీలు',
    salesHistory: 'అమ్మకాల చరిత్ర',
    searchPlaceholder: 'తేదీ, ID లేదా సిబ్బంది వెతకండి...',
    searchAria: 'లావాదేవీలను వెతకండి',
    filterByMethod: 'చెల్లింపు విధానం ఆధారంగా ఫిల్టర్',
    methodAny: 'ఏ విధానమైనా',
    methodCash: 'నగదు',
    methodCard: 'కార్డ్',
    methodNfc: 'NFC',
    labelCash: 'నగదు',
    labelCard: 'కార్డ్',
    labelNfc: 'NFC',
    from: 'నుండి',
    to: 'వరకు',
    colDateTime: 'తేదీ / సమయం',
    colOrderId: 'ఆర్డర్ ID',
    colAmount: 'మొత్తం',
    colMethod: 'విధానం',
    colSoldBy: 'అమ్మినవారు',
    noSalesTitle: 'ఇంకా అమ్మకాలు నమోదు కాలేదు',
    noSalesBody: 'లావాదేవీల చరిత్ర, ధోరణులు మొదలవడానికి మీ మొదటి అమ్మకాన్ని నమోదు చేయండి.',
    noMatchTitle: 'మీ ఫిల్టర్లకు సరిపోయే లావాదేవీలు లేవు',
    noMatchBody: 'వేరే పదం లేదా వేరే తేదీ పరిధిని ప్రయత్నించండి.',
    topSelling: 'ఎక్కువగా అమ్ముడైనవి',
    noTopTitle: 'గత 30 రోజుల్లో అమ్మకాలు లేవు',
    noTopBody: 'మీ బెస్ట్ సెల్లర్లు ఇక్కడ కనిపిస్తాయి.',
    unitsSold: '{n} యూనిట్లు అమ్ముడయ్యాయి',
    viewInventory: 'నిల్వ చూడండి',
    modalTitle: 'అమ్మకం నమోదు చేయండి',
    total: 'మొత్తం',
    completeSale: 'అమ్మకం పూర్తి చేయి',
    loggingSale: 'నమోదు చేస్తోంది…',
    hideScanner: 'స్కానర్ దాచు',
    scanBarcode: 'బార్‌కోడ్ స్కాన్ చేయండి',
    scanLooking: 'ఆ బార్‌కోడ్‌ను వెతుకుతోంది…',
    scannedOne: 'ఈ అమ్మకంలోకి {n} వస్తువు స్కాన్ అయింది. తర్వాతిదానికి మళ్లీ Start camera నొక్కండి.',
    scannedMany: 'ఈ అమ్మకంలోకి {n} వస్తువులు స్కాన్ అయ్యాయి. తర్వాతిదానికి మళ్లీ Start camera నొక్కండి.',
    searchProducts: 'చేర్చడానికి వస్తువులను వెతకండి...',
    inStock: '{n} స్టాక్‌లో',
    emptyCartTitle: 'ఇంకా వస్తువులు లేవు',
    emptyCartBody: 'పైన వెతికి వస్తువులను చేర్చి ఈ అమ్మకాన్ని తయారు చేయండి.',
    eachPrice: 'ఒక్కొక్కటి {price}',
    paymentMethod: 'చెల్లింపు విధానం',
    scanNoSavedMatch: 'సేవ్ చేసిన జాబితాలో {code} బార్‌కోడ్ ఉన్న వస్తువు లేదు. ఏదీ చేర్చలేదు.',
    scanNoMatch: 'ఈ దుకాణంలో {code} బార్‌కోడ్ ఉన్న వస్తువు లేదు. ఏదీ చేర్చలేదు.',
    scanOutOfStock: '{name} స్టాక్‌లో లేదు. ఏదీ చేర్చలేదు.',
    scanLookupFailed: 'ఆ స్కాన్‌ను వెతకలేకపోయాం. మళ్లీ ప్రయత్నించండి, లేదా పేరుతో వెతకండి.',
    addedFromCache: 'సేవ్ చేసిన జాబితా నుండి చేర్చబడింది',
    addedToSale: 'అమ్మకంలోకి చేర్చబడింది',
    expiredSuffix: 'గడువు ముగిసింది {rel}',
    expiresSoonSuffix: 'గడువు {rel}',
    expiresSuffix: 'గడువు {date}',
    notSavedTitle: 'అమ్మకం సేవ్ కాలేదు',
    notSavedBody: 'ఈ అమ్మకం ఈ పరికరంలో సేవ్ కాలేదు. కస్టమర్ వెళ్లేలోపు దీన్ని రాసి పెట్టుకోండి.',
    savedLocally: 'ఈ పరికరంలో సేవ్ అయింది',
    savedLocallyBodyOne: '{n} లైన్ ఐటమ్ · {total} — మీరు మళ్లీ ఆన్‌లైన్‌కు వచ్చాక సింక్ అవుతుంది.',
    savedLocallyBodyMany: '{n} లైన్ ఐటమ్‌లు · {total} — మీరు మళ్లీ ఆన్‌లైన్‌కు వచ్చాక సింక్ అవుతుంది.',
    couldNotLog: 'అమ్మకం నమోదు కాలేదు',
    saleLogged: 'అమ్మకం నమోదైంది',
    saleLoggedOne: '{n} లైన్ ఐటమ్ · {total}',
    saleLoggedMany: '{n} లైన్ ఐటమ్‌లు · {total}',
    milestoneTitle: 'ఈరోజు {n} అమ్మకాలు',
    milestoneBody: 'ఈరోజు వసూళ్లు {n} లావాదేవీల్లో {total}.',
  },
  reports: {
    eyebrow: 'రిపోర్టింగ్',
    title: 'నివేదికలు',
    subtitleCompared: '{range}, {prevFrom} నుండి {prevTo} తో పోల్చబడింది.',
    subtitlePlain: 'మీరు ఎంచుకున్న తేదీ పరిధిలో అమ్మకాల పనితీరు.',
    exportPdf: 'PDF ఎగుమతి',
    from: 'నుండి',
    to: 'వరకు',
    preset7: 'గత 7 రోజులు',
    preset30: 'గత 30 రోజులు',
    preset90: 'గత 90 రోజులు',
    allTime: 'మొత్తం కాలం',
    rangeLabel: '{from} నుండి {to}',
    kpiRevenue: 'ఆదాయం',
    kpiTransactions: 'లావాదేవీలు',
    kpiAvgOrder: 'సగటు ఆర్డర్',
    kpiUnitsSold: 'అమ్మిన యూనిట్లు',
    outsideWindow: 'పోల్చే పరిధి వెలుపల',
    noPriorData: 'గత డేటా లేదు',
    vsPrevious: 'గత కాలంతో పోలిస్తే',
    emptyTitle: 'ఈ పరిధిలో అమ్మకాలు లేవు',
    emptyBody: 'తేదీ పరిధిని పెంచండి, లేదా అమ్మకాన్ని నమోదు చేసి ఇక్కడ చూడండి.',
    logASale: 'అమ్మకం నమోదు',
    viewAllProducts: 'మొత్తం {n} వస్తువులు చూడండి',
    colProduct: 'వస్తువు',
    colUnits: 'యూనిట్లు',
    colRevenue: 'ఆదాయం',
    colDate: 'తేదీ',
    colCategory: 'వర్గం',
    colShare: 'వాటా %',
    colMethod: 'విధానం',
    colTransactions: 'లావాదేవీలు',
    itemProducts: 'వస్తువులు',
    itemDays: 'రోజులు',
    itemCategories: 'వర్గాలు',
    itemMethods: 'విధానాలు',
    revenueByDay: 'రోజువారీ ఆదాయం',
    categoryMix: 'వర్గాల వాటా',
    paymentMethods: 'చెల్లింపు విధానాలు',
    chartRevenueOverTime: 'కాలక్రమంలో ఆదాయం',
    rangeDaysOne: 'ఎంచుకున్న కాలంలో {n} రోజు',
    rangeDaysMany: 'ఎంచుకున్న కాలంలో {n} రోజులు',
    chartSalesByCategory: 'వర్గాల వారీగా అమ్మకాలు',
    chartCategorySub: 'దుకాణంలోని వర్గాల ఆదాయ వాటా',
    chartTopProducts: 'అగ్ర వస్తువులు',
    chartTopSub: 'అత్యధిక ఆదాయం, {n}లో మొదటి ఐదు',
    tooltipUnits: '{money} · {n} యూనిట్లు',
    tooltipShare: '{money} · {pct}%',
    nothingToExport: 'ఎగుమతి చేయడానికి ఏమీ లేదు',
    nothingToExportBody: 'ఎంచుకున్న తేదీ పరిధిలో అమ్మకాలు లేవు.',
    exported: 'నివేదిక ఎగుమతి అయింది',
    exportedBody: 'PDF మీ డౌన్‌లోడ్‌లలో సేవ్ అయింది.',
    exportFailed: 'ఎగుమతి విఫలమైంది',
    exportFailedBody: 'PDF తయారు కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
    uncategorised: 'వర్గం లేనివి',
    payCash: 'నగదు',
    payCard: 'కార్డ్',
    payNfc: 'NFC',
  },
  customers: {
    eyebrow: 'సంబంధాలు',
    title: 'కస్టమర్లు',
    subtitle: 'కస్టమర్ వివరాలు, కొనుగోళ్ల చరిత్ర, లాయల్టీ టియర్లు.',
    addCustomer: 'కస్టమర్‌ను చేర్చు',
    itemLabel: 'కస్టమర్లు',
    searchAria: 'కస్టమర్లను వెతకండి',
    searchPlaceholder: 'పేరు, ఇమెయిల్, ఫోన్ లేదా టియర్‌తో వెతకండి...',
    filterByActivity: 'కార్యకలాపం ఆధారంగా ఫిల్టర్',
    activityAny: 'ఏదైనా',
    activityRecent: '30 రోజుల్లో వచ్చినవారు',
    activityDormant: '30+ రోజులుగా రానివారు',
    allTiers: 'అన్ని టియర్లు',
    statTotal: 'మొత్తం కస్టమర్లు',
    statRevenue: 'మొత్తం ఆదాయం',
    statRepeat: 'మళ్లీ వచ్చినవారు',
    colCustomer: 'కస్టమర్',
    colContact: 'సంప్రదింపు',
    colTier: 'టియర్',
    colVisits: 'రాకలు',
    colTotalSpent: 'మొత్తం ఖర్చు',
    colLastVisit: 'చివరి రాక',
    colActions: 'చర్యలు',
    csvName: 'పేరు',
    csvEmail: 'ఇమెయిల్',
    csvPhone: 'ఫోన్',
    emptyTitle: 'ఇంకా కస్టమర్లు లేరు',
    emptyBody: 'కొనుగోళ్ల చరిత్ర, లాయల్టీ టియర్లను ట్రాక్ చేయడం మొదలుపెట్టడానికి ఒక కస్టమర్‌ను చేర్చండి.',
    noMatchTitle: 'ఈ ఫిల్టర్లకు సరిపోయే కస్టమర్లు లేరు',
    noMatchBody: 'వేరే పదం లేదా టియర్ ప్రయత్నించండి.',
    editRow: '{name} సవరించండి',
    deleteRow: '{name} తొలగించండి',
    formEdit: 'కస్టమర్‌ను సవరించండి',
    formAdd: 'కస్టమర్‌ను చేర్చు',
    saveChanges: 'మార్పులు సేవ్ చేయి',
    fFullName: 'పూర్తి పేరు',
    fEmail: 'ఇమెయిల్',
    fPhone: 'ఫోన్',
    fTier: 'లాయల్టీ టియర్',
    fTotalSpent: 'మొత్తం ఖర్చు',
    fVisits: 'రాకలు',
    fNotes: 'గమనికలు',
    emailPlaceholder: 'name@example.com',
    phonePlaceholder: '555-0100',
    notesHint: 'అలర్జీలు, ఇష్టాలు, గుర్తుంచుకోదగినదేదైనా',
    saveFailed: 'కస్టమర్‌ను సేవ్ చేయలేకపోయాం.',
    updateFailedToast: 'కస్టమర్ నవీకరించబడలేదు',
    addFailedToast: 'కస్టమర్ చేర్చబడలేదు',
    updatedToast: 'కస్టమర్ నవీకరించబడింది',
    addedToast: 'కస్టమర్ చేర్చబడింది',
    deleteTitle: 'కస్టమర్‌ను తొలగించాలా?',
    deleteBodyA: '',
    deleteBodyB: ' మరియు వారి కొనుగోళ్ల చరిత్రను తొలగించాలా? ఇది తిరిగి రాదు.',
    deleteConfirm: 'తొలగించు',
    deleteFailed: 'కస్టమర్‌ను తొలగించలేకపోయాం.',
    deleteFailedToast: 'కస్టమర్ తొలగించబడలేదు',
    deletedToast: 'కస్టమర్ తొలగించబడింది',
    setupTitle: 'ఒక సెటప్ దశ మిగిలి ఉంది',
    setupBodyA: '',
    setupBodyB: ' టేబుల్ ఇంకా సృష్టించబడలేదు. ఈ ప్రాజెక్టు కోసం Supabase SQL ఎడిటర్ తెరిచి, ',
    setupBodyC: ' కంటెంట్‌ను అతికించి రన్ చేయండి. తర్వాత ఈ పేజీని రీలోడ్ చేస్తే కస్టమర్ నిర్వహణ పనిచేస్తుంది.',
    setupStep1: 'మీ Supabase ప్రాజెక్టు → SQL Editor → New query తెరవండి.',
    setupStep2: 'supabase/schema_phase4.sql పూర్తి కంటెంట్‌ను అతికించండి.',
    setupStep3: 'Run నొక్కి, ఈ పేజీని రీలోడ్ చేయండి.',
    goToSettings: 'సెట్టింగ్స్‌కు వెళ్లండి',
    actNoPermission: 'కస్టమర్లను నిర్వహించడానికి మీకు అనుమతి లేదు.',
    actFixFields: 'గుర్తించిన ఫీల్డ్‌లను సరిచేయండి.',
    actEmailExists: 'ఆ ఇమెయిల్ ఉన్న కస్టమర్ ఈ దుకాణంలో ఇప్పటికే ఉన్నారు.',
    vNameRequired: 'పేరు తప్పనిసరి.',
    vNameTooLong: 'పేరు 120 అక్షరాలకు మించకూడదు.',
    vEmailInvalid: 'సరైన ఇమెయిల్ చిరునామా ఇవ్వండి.',
    vTierInvalid: 'సరైన టియర్ ఎంచుకోండి.',
    vSpentMin: 'సున్నా లేదా అంతకంటే ఎక్కువ ఉండాలి.',
    vVisitsWhole: 'పూర్ణ సంఖ్య, సున్నా లేదా అంతకంటే ఎక్కువ ఉండాలి.',
    tierLabels: { bronze: 'కాంస్యం', silver: 'వెండి', gold: 'బంగారం', platinum: 'ప్లాటినం' },
  },
  suppliers: {
    eyebrow: 'సరఫరా గొలుసు',
    title: 'సరఫరాదారుల నిర్వహణ',
    subtitle: 'సరఫరాదారులతో సంబంధాలను నిర్వహించి, వచ్చే సరుకును ట్రాక్ చేయండి.',
    addSupplier: 'సరఫరాదారుని చేర్చు',
    itemLabel: 'సరఫరాదారులు',
    searchAria: 'సరఫరాదారులను వెతకండి',
    searchPlaceholder: 'పేరు, సంప్రదింపు, వర్గం లేదా స్థితిని వెతకండి...',
    filterByStatus: 'స్థితి ఆధారంగా ఫిల్టర్',
    statusAny: 'ఏ స్థితైనా',
    catAll: 'అన్నీ',
    arrivingToday: 'ఈరోజు వస్తుంది',
    colName: 'సరఫరాదారు పేరు',
    colContact: 'ప్రధాన సంప్రదింపు',
    colCategory: 'వర్గం',
    colActiveOrders: 'ప్రస్తుత ఆర్డర్లు',
    colStatus: 'స్థితి',
    colActions: 'చర్యలు',
    emptyTitle: 'ఇంకా సరఫరాదారులు లేరు',
    emptyBody: 'వచ్చే సరుకును, డెలివరీ పనితీరును ట్రాక్ చేయడానికి ఒక సరఫరాదారుని చేర్చండి.',
    noMatchTitle: 'మీ ఫిల్టర్లకు సరిపోయే సరఫరాదారులు లేరు',
    noMatchBody: 'వేరే పదం లేదా వర్గం ప్రయత్నించండి.',
    editRow: '{name} సవరించండి',
    deleteRow: '{name} తొలగించండి',
    todaysInbound: 'ఈరోజు వచ్చేవి',
    palletsExpected: 'ఆశించిన ప్యాలెట్లు',
    received: 'అందినవి',
    pending: 'పెండింగ్',
    incomingShipments: 'వస్తున్న సరుకు',
    addShipment: 'సరుకును చేర్చు',
    noShipmentsTitle: 'వస్తున్న సరుకు లేదు',
    noShipmentsBody: 'డాక్ నుండి షెల్ఫ్ వరకు ట్రాక్ చేయడానికి సరుకును నమోదు చేయండి.',
    trackOrdered: 'ఆర్డర్',
    trackShipped: 'పంపారు',
    trackTransit: 'దారిలో',
    trackDock: 'డాక్',
    recentActivity: 'ఇటీవలి సరఫరాదారు కార్యకలాపాలు',
    noActivity: 'ఇటీవలి కార్యకలాపాలు లేవు.',
    formEdit: 'సరఫరాదారుని సవరించండి',
    formAdd: 'సరఫరాదారుని చేర్చు',
    saveChanges: 'మార్పులు సేవ్ చేయి',
    fName: 'సరఫరాదారు పేరు',
    fContact: 'ప్రధాన సంప్రదింపు',
    contactPlaceholder: 'ఉదా. రమేష్',
    fCategory: 'వర్గం',
    fStatus: 'స్థితి',
    saveFailed: 'సరఫరాదారుని సేవ్ చేయలేకపోయాం.',
    updateFailedToast: 'సరఫరాదారు నవీకరించబడలేదు',
    addFailedToast: 'సరఫరాదారు చేర్చబడలేదు',
    updatedToast: 'సరఫరాదారు నవీకరించబడ్డారు',
    addedToast: 'సరఫరాదారు చేర్చబడ్డారు',
    deleteTitle: 'సరఫరాదారుని తొలగించాలా?',
    deleteBodyA: '',
    deleteBodyB: ' ను తొలగించాలా? వారిపై నమోదైన సరుకు, కార్యకలాపాల జాబితాలోని వారి నమోదులు కూడా తొలగిపోతాయి. ఇది తిరిగి రాదు.',
    deleteConfirm: 'తొలగించు',
    deleteFailed: 'సరఫరాదారుని తొలగించలేకపోయాం.',
    deleteFailedToast: 'సరఫరాదారు తొలగించబడలేదు',
    deletedToast: 'సరఫరాదారు తొలగించబడ్డారు',
    poTitle: 'కొత్త కొనుగోలు ఆర్డర్',
    poCreate: 'PO సృష్టించు',
    poSaving: 'సేవ్ అవుతోంది…',
    fSupplier: 'సరఫరాదారు',
    fPoNumber: 'PO నంబర్',
    poPlaceholder: 'PO-2024-0891',
    fPallets: 'ప్యాలెట్లు',
    fEta: 'వచ్చే అంచనా తేదీ',
    addSupplierFirst: 'ముందు ఒక సరఫరాదారుని చేర్చండి.',
    shipmentSaveFailed: 'సరుకును సేవ్ చేయలేకపోయాం.',
    shipmentFailedToast: 'సరుకు నమోదు కాలేదు',
    shipmentLogged: 'సరుకు నమోదైంది',
    poPrefix: 'PO {n}',
    actNoPermission: 'సరఫరాదారులను నిర్వహించడానికి మీకు అనుమతి లేదు.',
    actFixFields: 'గుర్తించిన ఫీల్డ్‌లను సరిచేయండి.',
    actShipNoPermission: 'సరుకును నిర్వహించడానికి మీకు అనుమతి లేదు.',
    actPoRequired: 'PO నంబర్ తప్పనిసరి.',
    actBadStatus: 'సరైన సరుకు స్థితిని ఎంచుకోండి.',
    actBadEta: 'వచ్చే తేదీకి తేదీ ఎంపికను వాడండి.',
    actBadPallets: 'ప్యాలెట్లు పూర్ణ సంఖ్య, సున్నా లేదా అంతకంటే ఎక్కువ ఉండాలి.',
    actSupplierNotHere: 'ఆ సరఫరాదారు ఈ దుకాణంలో లేరు.',
    actSupplierGone: 'ఆ సరఫరాదారు ఇక ఈ దుకాణంలో లేరు.',
    feedNewSupplier: '{name} కొత్త సరఫరాదారుగా చేర్చబడ్డారు',
    notifyNewSupplierTitle: 'కొత్త సరఫరాదారు చేర్చబడ్డారు',
    notifyNewSupplierBody: '{name} ఇప్పుడు మీ సరఫరాదారుల జాబితాలో ఉన్నారు.',
    feedShipment: '{supplier} PO {po} సృష్టించబడింది',
    notifyShipmentTitle: 'వచ్చే సరుకు నమోదైంది',
    notifyShipmentBody: '{supplier} PO {po}.',
    notifyShipmentBodyEta: '{supplier} PO {po}, {eta}కి రావాలి.',
    vNameRequired: 'సరఫరాదారు పేరు తప్పనిసరి.',
    vNameTooLong: 'పేరు 120 అక్షరాలకు మించకూడదు.',
    vContactTooLong: 'సంప్రదింపు 120 అక్షరాలకు మించకూడదు.',
    vCategoryInvalid: 'సరైన వర్గాన్ని ఎంచుకోండి.',
    vStatusInvalid: 'సరైన స్థితిని ఎంచుకోండి.',
    categoryLabels: { produce: 'కూరగాయలు', dairy: 'పాల ఉత్పత్తులు', dry_goods: 'పొడి సరుకులు', beverages: 'పానీయాలు', bakery: 'బేకరీ' },
    statusLabels: { active: 'చురుకైన', inactive: 'నిష్క్రియ', issue: 'సమస్య' },
    shipmentLabels: { ordered: 'ఆర్డర్ చేశారు', shipped: 'పంపారు', transit: 'దారిలో', dock: 'డాక్‌లో' },
  },
  staff: {
    eyebrow: 'బృందం',
    title: 'సిబ్బంది షెడ్యూల్',
    subtitle: 'బృందం షిఫ్టులు, కవరేజీని నిర్వహించండి.',
    myScheduleBtn: 'నా షెడ్యూల్',
    recordLeave: 'సెలవు నమోదు',
    assignShift: 'షిఫ్ట్ కేటాయించు',
    prevWeek: 'మునుపటి వారం',
    nextWeek: 'తదుపరి వారం',
    weekView: 'వారం వీక్షణ',
    rotaAria: 'వారపు రోస్టర్, అడ్డంగా స్క్రోల్ అవుతుంది',
    dayMon: 'సోమ',
    dayTue: 'మంగళ',
    dayWed: 'బుధ',
    dayThu: 'గురు',
    dayFri: 'శుక్ర',
    daySat: 'శని',
    daySun: 'ఆది',
    editLeaveAria: 'సెలవు సవరించండి: {label}',
    leaveLabel: '{who} — {kind}',
    leaveLabelNote: '{who} — {kind}: {note}',
    teamMember: 'బృంద సభ్యుడు',
    unassigned: 'కేటాయించలేదు',
    you: 'మీరు',
    staffFallback: 'సిబ్బంది',
    editShiftAria: '{date} నాటి {role} షిఫ్ట్ సవరించండి',
    deleteShiftAria: '{date} నాటి {role} షిఫ్ట్ తొలగించండి',
    staffAvailability: 'సిబ్బంది అందుబాటు',
    nobodyYet: 'బృందంలో ఇంకా ఎవరూ లేరు.',
    inviteFirst: 'మీ మొదటి సహోద్యోగిని ఆహ్వానించండి',
    ownerCanInvite: 'దుకాణ యజమాని Team ట్యాబ్ నుండి వ్యక్తులను ఆహ్వానించవచ్చు.',
    leaveUntil: '{date} వరకు {kind}',
    onShiftToday: 'ఈరోజు షిఫ్ట్‌లో ఉన్నారు',
    notScheduledToday: 'ఈరోజు షెడ్యూల్ లేదు',
    onLeaveTodayTip: 'ఈరోజు {kind}లో ఉన్నారు',
    onShiftCount: '{m}లో {n} మంది ఈరోజు షిఫ్ట్‌లో',
    onLeaveCount: ' · {n} మంది సెలవులో',
    tabsAria: 'సిబ్బంది విభాగాలు',
    tabSchedule: 'షెడ్యూల్',
    tabTeam: 'బృందం',
    shiftEdit: 'షిఫ్ట్ సవరించండి',
    shiftAdd: 'షిఫ్ట్ కేటాయించు',
    saveChanges: 'మార్పులు సేవ్ చేయి',
    fTeamMember: 'బృంద సభ్యుడు',
    teamMemberHint: 'ఖాళీ షిఫ్ట్ పెట్టాలంటే ఎవరినీ ఎంచుకోకండి',
    optUnassigned: 'కేటాయించలేదు',
    fRole: 'పాత్ర',
    fDate: 'తేదీ',
    fStart: 'ప్రారంభ సమయం',
    fEnd: 'ముగింపు సమయం',
    clashText: '{who} {from} నుండి {to} వరకు {kind}లో ఉన్నారు. ఈ షిఫ్ట్ సేవ్ కాదు.',
    thatPerson: 'ఆ వ్యక్తి',
    shiftSaveFailed: 'షిఫ్ట్‌ను సేవ్ చేయలేకపోయాం.',
    shiftUpdateFailed: 'షిఫ్ట్ నవీకరించబడలేదు',
    shiftScheduleFailed: 'షిఫ్ట్ కేటాయించబడలేదు',
    shiftUpdated: 'షిఫ్ట్ నవీకరించబడింది',
    shiftScheduled: 'షిఫ్ట్ కేటాయించబడింది',
    deleteShiftTitle: 'షిఫ్ట్ తొలగించాలా?',
    deleteShiftA: '',
    deleteShiftB: ' షిఫ్ట్‌ను ',
    deleteShiftC: ' కోసం ',
    deleteShiftD: ' నాడు తొలగించాలా? ఇది తిరిగి రాదు.',
    unassignedSlot: 'కేటాయించని స్లాట్',
    deleteShiftFailed: 'షిఫ్ట్‌ను తొలగించలేకపోయాం.',
    deleteShiftFailedToast: 'షిఫ్ట్ తొలగించబడలేదు',
    shiftDeleted: 'షిఫ్ట్ తొలగించబడింది',
    leaveEdit: 'సెలవు సవరించండి',
    leaveAdd: 'సెలవు నమోదు',
    leaveSaveBtn: 'మార్పులు సేవ్ చేయి',
    removeLeaveQ: 'ఈ సెలవును తొలగించాలా?',
    yes: 'అవును',
    no: 'కాదు',
    remove: 'తొలగించు',
    fWho: 'ఎవరు',
    fFirstDay: 'మొదటి రోజు',
    fLastDay: 'చివరి రోజు',
    fType: 'రకం',
    fNote: 'గమనిక',
    noteOptional: '(ఐచ్ఛికం)',
    notePlaceholder: 'ప్రియతో కవరింగ్ ఏర్పాటు చేశాం',
    spanDay: '{n} రోజు సెలవు, రెండు తేదీలతో కలిపి.',
    spanDays: '{n} రోజుల సెలవు, రెండు తేదీలతో కలిపి.',
    leaveRemoveFailed: 'సెలవు తొలగించబడలేదు',
    leaveRemoved: 'సెలవు తొలగించబడింది',
    leaveSaveFailed: 'సెలవు సేవ్ కాలేదు',
    leaveUpdated: 'సెలవు నవీకరించబడింది',
    leaveRecorded: 'సెలవు నమోదైంది',
    leaveToastOne: '{who}, {from}',
    leaveToastRange: '{who}, {from} నుండి {to}',
    teamTitle: 'మీ బృందం',
    addStaff: 'సిబ్బందిని చేర్చు',
    activeOne: '{n} చురుకైన వ్యక్తి',
    activeMany: '{n} చురుకైన వ్యక్తులు',
    pendingSuffix: ', {n} అంగీకారం కోసం ఎదురుచూస్తున్నారు',
    colEmployee: 'ఉద్యోగి',
    colRole: 'పాత్ర',
    colJoined: 'చేరిన తేదీ',
    colStatus: 'స్థితి',
    colActions: 'చర్యలు',
    storeOwnerBadge: 'దుకాణ యజమాని',
    badgeInvited: 'ఆహ్వానించారు',
    badgeActive: 'చురుకైన',
    badgeDeactivated: 'నిష్క్రియం',
    working: 'పని జరుగుతోంది…',
    edit: 'సవరించు',
    removeAccessQ: 'ప్రవేశం తొలగించాలా?',
    restoreAccessQ: 'ప్రవేశం పునరుద్ధరించాలా?',
    deactivate: 'నిష్క్రియం చేయి',
    reactivate: 'మళ్లీ చురుకుగా చేయి',
    editAria: '{name} సవరించండి',
    deactivateAria: '{name} నిష్క్రియం చేయండి',
    reactivateAria: '{name} మళ్లీ చురుకుగా చేయండి',
    storeOwnerNote: 'దుకాణ యజమాని',
    thisIsYou: 'ఇది మీరే',
    teamEmptyTitle: 'ఇక్కడ ఇంకా ఎవరూ లేరు',
    teamEmptyBody: 'మీ దుకాణంలో పనిచేసేవారిని ఆహ్వానించండి. పాస్‌వర్డ్ పెట్టి సైన్ ఇన్ చేయడానికి వారికి ఇమెయిల్ వస్తుంది.',
    deactivateFailed: 'నిష్క్రియం చేయలేకపోయాం',
    reactivateFailed: 'మళ్లీ చురుకుగా చేయలేకపోయాం',
    accessRemoved: 'ప్రవేశం తొలగించబడింది',
    accessRestored: 'ప్రవేశం పునరుద్ధరించబడింది',
    canNoLongerSignIn: '{name} ఇక సైన్ ఇన్ చేయలేరు.',
    canSignInAgain: '{name} మళ్లీ సైన్ ఇన్ చేయవచ్చు.',
    revokeQ: 'రద్దు చేయాలా?',
    resend: 'మళ్లీ పంపు',
    revoke: 'రద్దు చేయి',
    revokeAria: '{name} ఆహ్వానాన్ని రద్దు చేయండి',
    resendFailed: 'ఆహ్వానం మళ్లీ పంపబడలేదు',
    resent: 'ఆహ్వానం మళ్లీ పంపబడింది',
    revokeFailed: 'ఆహ్వానం రద్దు కాలేదు',
    revoked: 'ఆహ్వానం రద్దు చేయబడింది',
    addStaffTitle: 'సిబ్బందిని చేర్చు',
    sendInvite: 'ఆహ్వానం పంపు',
    sendingInvite: 'ఆహ్వానం పంపుతోంది…',
    done: 'పూర్తయింది',
    fFullName: 'పూర్తి పేరు',
    fWorkEmail: 'ఆఫీసు ఇమెయిల్',
    fJobTitle: 'హోదా',
    jobTitlePlaceholder: 'క్యాషియర్, నిల్వ ఇన్‌ఛార్జ్...',
    roleHintManager: 'దుకాణాన్ని నడుపుతారు: నిల్వ, కస్టమర్లు, సరఫరాదారులు, షిఫ్టులు, వసూళ్లు.',
    roleHintStaff: 'దుకాణంలో పనిచేస్తారు: నిల్వ చూడటం, అమ్మకాలు నమోదు, తమ షిఫ్టులు చూడటం.',
    inviteFailed: 'సిబ్బందిని ఆహ్వానించలేకపోయాం',
    invitationSent: 'ఆహ్వానం పంపబడింది',
    invitedBodyA: ' ను ',
    invitedBodyB: ' గా ఆహ్వానించాం. పాస్‌వర్డ్ పెట్టి సైన్ ఇన్ చేయడానికి వారికి ఇమెయిల్ వస్తుంది.',
    editStaffTitle: '{name} సవరించండి',
    emailNote: 'సైన్ ఇన్ చిరునామాను ఇక్కడ మార్చలేరు.',
    editSaveFailed: 'మార్పులు సేవ్ కాలేదు',
    memberUpdated: 'బృంద సభ్యుడు నవీకరించబడ్డారు',
    vRoleRequired: 'పాత్ర తప్పనిసరి.',
    vRoleTooLong: 'పాత్ర 60 అక్షరాలకు మించకూడదు.',
    vDateRequired: 'తేదీని ఎంచుకోండి.',
    vStartRequired: 'ప్రారంభ సమయం ఇవ్వండి.',
    vEndRequired: 'ముగింపు సమయం ఇవ్వండి.',
    vEndAfterStart: 'ముగింపు సమయం ప్రారంభ సమయం తర్వాత ఉండాలి.',
    vLeaveWho: 'ఈ సెలవు ఎవరికో ఎంచుకోండి.',
    vLeaveStart: 'ప్రారంభ తేదీని ఎంచుకోండి.',
    vLeaveEnd: 'ముగింపు తేదీని ఎంచుకోండి.',
    vLeaveEndBefore: 'ముగింపు తేదీ ప్రారంభ తేదీ కంటే ముందు ఉండకూడదు.',
    vLeaveTooLong: 'అది {n} రోజులు. ఒక నమోదుకు ఒక సంవత్సరం లేదా తక్కువ ఇవ్వండి.',
    vLeaveKind: 'సెలవు రకాన్ని ఎంచుకోండి.',
    vLeaveNote: 'గమనిక 200 అక్షరాలకు మించకూడదు.',
    actSchedNoPermission: 'షెడ్యూల్ మార్చడానికి మీకు అనుమతి లేదు.',
    actFixFields: 'గుర్తించిన ఫీల్డ్‌లను సరిచేయండి.',
    actNotOnTeam: 'ఆ వ్యక్తి ఈ బృందంలో లేరు.',
    actOnLeaveField: 'ఆ వ్యక్తి ఈ తేదీన సెలవులో ఉన్నారు.',
    actOnLeaveMessage: 'ఆ రోజు వారు సెలవులో ఉన్నారు. వేరే తేదీని ఎంచుకోండి, లేదా ముందు సెలవును తొలగించండి.',
    actLeaveNoPermission: 'సెలవు నమోదు చేయడానికి మీకు అనుమతి లేదు.',
    actLeaveNotSetUp: 'సెలవు ఇంకా సిద్ధం కాలేదు. Supabase SQL ఎడిటర్‌లో supabase/migrations/0011_staff_leave.sql రన్ చేయండి.',
    actOwnRole: 'మీ స్వంత పాత్రను లేదా ప్రవేశాన్ని ఇక్కడ మార్చలేరు.',
    actNotInStore: 'ఆ బృంద సభ్యుడు ఈ దుకాణంలో లేరు.',
    actOwnerAccount: 'దుకాణ యజమాని ఖాతాను ఇక్కడ నుండి మార్చలేరు.',
    actNameRequired: 'పేరు తప్పనిసరి.',
    actBadRole: 'ఈ బృంద సభ్యుడికి సరైన పాత్రను ఎంచుకోండి.',
    actNotAuthenticated: 'ప్రామాణీకరణ లేదు',
    actOwnerOnly: 'దుకాణ యజమాని మాత్రమే బృందాన్ని నిర్వహించగలరు.',
    notifyRoleChanged: 'బృంద పాత్ర మారింది',
    notifyRoleBody: '{name} ఇప్పుడు {role}.',
    notifyDeactivatedBody: '{name} ఇక సైన్ ఇన్ చేయలేరు. వారి చరిత్ర భద్రంగా ఉంటుంది.',
    notifyReactivated: 'బృంద సభ్యుడు మళ్లీ చురుకుగా',
    notifyDeactivated: 'బృంద సభ్యుడు నిష్క్రియం',
    leaveKindLabels: { holiday: 'సెలవు దినం', sick: 'అనారోగ్యం', unpaid: 'జీతం లేని సెలవు', other: 'సెలవు' },
  },
  settings: {
    eyebrow: 'కాన్ఫిగరేషన్',
    title: 'స్టోర్ సెట్టింగ్స్',
    subtitle: '{store} కోసం కాన్ఫిగరేషన్ మరియు నిర్వహణ సెట్టింగ్స్.',
    unsaved: 'సేవ్ చేయని మార్పులు',
    discard: 'రద్దు చేయి',
    saving: 'సేవ్ అవుతోంది…',
    savedTick: 'సేవ్ అయింది ✓',
    save: 'మార్పులు సేవ్ చేయి',
    saveFailed: 'సెట్టింగ్స్ సేవ్ చేయలేకపోయాం',
    savedToast: 'సెట్టింగ్స్ సేవ్ అయ్యాయి',
    saveErrorBanner: 'సెట్టింగ్స్ సేవ్ చేయలేకపోయాం: {message}',
    needsMigration:
      'గడువు హెచ్చరిక సెట్టింగ్ ఇంకా ఈ డేటాబేస్‌లో సిద్ధంగా లేదు. Supabase SQL ' +
      'ఎడిటర్‌లో supabase/migrations/0017_store_expiry_warning_days.sql రన్ చేయండి.',
    details: 'స్టోర్ వివరాలు',
    storeName: 'స్టోర్ పేరు',
    address: 'ప్రధాన చిరునామా',
    phone: 'సంప్రదింపు ఫోన్',
    appearance: 'రూపు',
    theme: 'ఇంటర్ఫేస్ థీమ్',
    themeHint: 'లైట్/డార్క్ మోడ్ మార్చండి',
    light: 'లైట్',
    dark: 'డార్క్',
    controls: 'నిర్వహణ నియంత్రణలు',
    thresholds: 'స్టాక్ పరిమితులు',
    lowStock: 'తక్కువ స్టాక్ హెచ్చరిక',
    unitsValue: '{n} యూనిట్లు',
    lowStockAria: 'తక్కువ స్టాక్ హెచ్చరిక, యూనిట్లలో',
    expiryWarning: 'గడువు హెచ్చరిక',
    dayValue: '{n} రోజు',
    daysValue: '{n} రోజులు',
    expiryAria: 'గడువు హెచ్చరిక, రోజులలో',
    oneDay: '1 రోజు',
    maxDays: '{n} రోజులు',
    notifications: 'నోటిఫికేషన్లు',
    criticalAlerts: 'కీలక స్టాక్ హెచ్చరికలు',
    criticalAlertsHint: 'సరుకులు 0కి చేరినప్పుడు SMS & ఈమెయిల్',
    dailyDigest: 'రోజువారీ సారాంశం',
    dailyDigestHint: 'రోజు చివర అమ్మకాల సారాంశం',
    supplierUpdates: 'సప్లయర్ అప్‌డేట్లు',
    supplierUpdatesHint: 'డెలివరీ సమయంలో మార్పులు',
    team: 'మీ బృందం',
    teamHint: 'ఆహ్వానాలు, పాత్రలు, యాక్సెస్ ఇప్పుడు సిబ్బంది విభాగంలో, రోటా పక్కనే ఉన్నాయి.',
    manageTeam: 'బృందం నిర్వహణ',
    categories: 'ఉత్పత్తి విభాగాలు',
    categoriesHint: 'మీ ఉత్పత్తులు చేరిన విభాగాలను జోడించండి, పేరు మార్చండి, క్రమం మార్చండి.',
    manageCategories: 'విభాగాల నిర్వహణ',
    legal: 'చట్టపరమైనవి',
    legalHint: 'ఈ స్టోర్ ఖాతాకు వర్తించే గోప్యతా విధానం మరియు నిబంధనలు.',
    privacy: 'గోప్యతా విధానం',
    terms: 'సేవా నిబంధనలు',
    sample: 'నమూనా డేటా',
    sampleHint:
      'మీ స్వంత కాటలాగ్ దిగుమతి చేసుకోవడానికి నమూనా ఉత్పత్తులను తొలగించండి. మీ విభాగాలు, ' +
      'సప్లయర్లు, సిబ్బంది మరియు సెట్టింగ్స్ అలాగే ఉంటాయి, అమ్మకంలో ఇప్పటికే కనిపించిన ఉత్పత్తి జోలికి వెళ్లం.',
    sampleButton: 'నమూనా డేటా తొలగించు',
    sampleTitle: 'నమూనా డేటా తొలగించాలా?',
    sampleBody1:
      'అన్ని నమూనా ఉత్పత్తులు మరియు వాటి స్టాక్ డేటా తొలగించబడతాయి. మీ స్వంత ' +
      'డేటాతో ప్రారంభించడానికి ఇది సహాయపడుతుంది.',
    sampleBody2:
      'విభాగాలు, సప్లయర్లు, సిబ్బంది మరియు స్టోర్ సెట్టింగ్స్ మారవు, అమ్మకంలో ' +
      'కనిపించిన నమూనా ఉత్పత్తి మీ చరిత్ర కోసం అలాగే ఉంచబడుతుంది.',
    sampleKept: 'నమూనా డేటా అలాగే ఉంచబడింది',
    sampleRemovedOne: '{n} నమూనా ఉత్పత్తి తొలగించబడింది',
    sampleRemovedMany: '{n} నమూనా ఉత్పత్తులు తొలగించబడ్డాయి',
    sampleWithSales: 'గత అమ్మకాలలో కనిపిస్తున్నందున {n} అలాగే ఉంచబడ్డాయి.',
    sampleNext: 'ఇప్పుడు మీ స్వంత CSVని ఇన్వెంటరీ నుండి దిగుమతి చేసుకోవచ్చు.',
    vNameRequired: 'మీ స్టోర్కు పేరు కావాలి — అది యాప్ అంతటా కనబడుతుంది.',
    vNameTooLong: 'పేరును {n} అక్షరాలోపు ఉంచండి.',
    vAddressTooLong: 'చిరునామాను {n} అక్షరాలోపు ఉంచండి.',
    vPhoneTooLong: 'ఆ ఫోన్ నంబర్ చాలా పొడవుగా ఉంది.',
    vPhoneShape: 'అంకెలు, ఖాళీలు మరియు + ( ) - మాత్రమే వాడండి.',
    vExpiryRange: '{min} నుండి {max} రోజుల మధ్య ఎంచుకోండి.',
    sampleDemoStore:
      'StockPulseని పరీక్షించే అందరికీ డెమో స్టోర్ ఉమ్మడి, కాబట్టి దాని నమూనా డేటాను ' +
      'ఇక్కడ తొలగించలేము — అలా చేస్తే తర్వాత వచ్చేవారికి ఖాళీగా కనబడుతుంది. మీ ' +
      'కాటలాగ్ దిగుమతి చేసుకోవడానికి సొంత ఉచిత స్టోర్ సృష్టించండి.',
    sampleNoPermission: 'యజమాని లేదా మేనేజర్ మాత్రమే నమూనా డేటాను తొలగించగలరు.',
    sampleReadFailed: 'నమూనా ఉత్పత్తులను చదవలేకపోయాం.',
    sampleDeleteFailed: 'నమూనా ఉత్పత్తులను తొలగించలేకపోయాం.',
    cat: {
      back: 'స్టోర్ సెట్టింగ్స్',
      eyebrow: 'కాన్ఫిగరేషన్',
      title: 'ఉత్పత్తి విభాగాలు',
      subtitle:
        'మీ ఉత్పత్తులు చేరిన విభాగాలు, ఉత్పత్తి ఫారంలో కనిపించే క్రమంలో.',
      notReadyTitle: 'అందుబాటులో ఉన్న ఐదు విభాగాలు చూపుతున్నాం.',
      notReadyBefore: 'మీ స్వంత జాబితా డేటాబేస్‌లో ఉంటుంది, కానీ',
      notReadyAfter:
        'ఇంకా ఈ ప్రాజెక్ట్‌లో రన్ చేయలేదు. అది జరిగేవరకు జోడించడం, పేరు మార్చడం, ' +
        'క్రమం మార్చడం పనిచేయవు.',
      listHeading: 'మీ విభాగాలు',
      emptyTitle: 'ఇంకా విభాగాలు లేవు',
      emptyBody: 'ఉత్పత్తులను చేర్చడం మొదలుపెట్టడానికి మొదటి దాన్ని జోడించండి.',
      nameLabel: 'విభాగం పేరు',
      saveName: 'పేరు సేవ్ చేయి',
      removePrefix: '',
      removeSuffix: 'ను తొలగించాలా?',
      remove: 'తొలగించు',
      noProducts: 'ఉత్పత్తులు లేవు',
      oneProduct: '{n} ఉత్పత్తి',
      manyProducts: '{n} ఉత్పత్తులు',
      moveUp: '{name} పైకి జరపండి',
      moveDown: '{name} కిందకి జరపండి',
      renameAria: '{name} పేరు మార్చండి',
      rename: 'పేరు మార్చు',
      cannotRemoveOne: '{name} తొలగించలేము — {n} ఉత్పత్తి ఇంకా దీన్ని వాడుతోంది',
      cannotRemoveMany: '{name} తొలగించలేము — {n} ఉత్పత్తులు ఇంకా దీన్ని వాడుతున్నాయి',
      removeAria: '{name} తొలగించండి',
      addHeading: 'విభాగం జోడించండి',
      nameHint: 'ఉత్పత్తి ఫారంలో మరియు ఇన్వెంటరీ ఫిల్టర్‌లో కనబడుతుంది.',
      namePlaceholder: 'ఫ్రోజన్ ఫూడ్స్',
      addButton: 'విభాగం జోడించు',
      footnote:
        'విభాగం పేరు మార్చడం దాని లేబుల్‌ను మాత్రమే మార్చుతుంది. ఉత్పత్తులు ఉన్న చోటే ' +
        'ఉంటాయి, గత అమ్మకాలు అవి చేరిన విభాగాన్నే ఉంచుకుంటాయి.',
      addFailed: 'విభాగం జోడించలేకపోయాం',
      added: 'విభాగం జోడించబడింది',
      renameFailed: 'విభాగం పేరు మార్చలేకపోయాం',
      renamed: 'విభాగం పేరు మారింది',
      reorderFailed: 'విభాగాల క్రమం మార్చలేకపోయాం',
      notRemoved: 'విభాగం తొలగించబడలేదు',
      removed: 'విభాగం తొలగించబడింది',
      vNameRequired: 'విభాగానికి పేరు ఇవ్వండి.',
      vNameTooLong: 'పేరును {n} అక్షరాలోపు ఉంచండి.',
      vNameNoAlnum: 'కనీసం ఒక అక్షరం లేదా అంకె వాడండి.',
      vNameDuplicate: 'ఆ పేరుతో ఒక విభాగం ఇప్పటికే ఉంది.',
      needsMigration:
        'విభాగాలు ఇంకా ఈ డేటాబేస్‌లో సిద్ధంగా లేవు. SQL ఎడిటర్‌లో ' +
        'supabase/migrations/0013_categories.sql రన్ చేయండి.',
      zeroRows:
        'ఏమీ మారలేదు — ఆ విభాగం ఇప్పటికే తొలగించబడి ఉండాలి, లేదా మీ పాత్రకు ' +
        'ఈ అనుమతి లేదు. జాబితా రిఫ్రెష్ అవుతోంది.',
      noPermission: 'విభాగాలను మార్చే అనుమతి మీకు లేదు.',
      slugClash: 'ఇది మీకు ఇప్పటికే ఉన్న ఒక విభాగానికి చాలా దగ్గరగా ఉంది.',
      nameTaken: 'ఆ పేరుతో ఒక విభాగం ఇప్పటికే ఉంది.',
      nameUnusable: 'ఆ పేరు వాడలేము.',
      inUseOne:
        '{n} ఉత్పత్తి ఇంకా ఈ విభాగాన్ని వాడుతోంది. ముందుగా దాన్ని మరొక విభాగానికి ' +
        'మార్చి, తర్వాత దీన్ని తొలగించండి.',
      inUseMany:
        '{n} ఉత్పత్తులు ఇంకా ఈ విభాగాన్ని వాడుతున్నాయి. ముందుగా వాటిని మరొక ' +
        'విభాగానికి మార్చి, తర్వాత దీన్ని తొలగించండి.',
      lastCategory: 'ఇది మీ ఒక్కే విభాగం. దీన్ని తొలగించే ముందు మరొకటి జోడించండి.',
      movedIn:
        'ఇప్పుడే కొన్ని ఉత్పత్తులు ఈ విభాగంలోకి చేరాయి, కాబట్టి దీన్ని ఇక ' +
        'తొలగించలేము. రిఫ్రెష్ చేసి చూడండి.',
    },
  },
  profile: {
    eyebrow: 'ఖాతా',
    storeOwner: 'స్టోర్ యజమాని',
    memberSince: '{year} నుండి సభ్యులు',
    editProfile: 'ప్రొఫైల్ సవరించు',
    logOut: 'లాగ్ అవుట్',
    personalInfo: 'వ్యక్తిగత వివరాలు',
    fullName: 'పూర్తి పేరు',
    email: 'ఈమెయిల్ చిరునామా',
    phone: 'ఫోన్ నంబర్',
    location: 'ప్రాంతం',
    notSet: 'ఇవ్వలేదు',
    security: 'ఖాతా భద్రత',
    password: 'పాస్‌వర్డ్',
    passwordHint: 'బలమైన పాస్‌వర్డ్‌తో మీ ఖాతాను సురక్షితంగా ఉంచండి.',
    update: 'మార్చు',
    itemsManaged: 'నిర్వహిస్తున్న వస్తువులు',
    staffMembers: 'సిబ్బంది',
    editTitle: 'ప్రొఫైల్ సవరించు',
    saving: 'సేవ్ అవుతోంది…',
    saveChanges: 'మార్పులు సేవ్ చేయి',
    vNameRequired: 'మీ పేరు అవసరం.',
    vNameTooLong: 'మీ పేరును {n} అక్షరాలోపు ఉంచండి.',
    updateFailed: 'ప్రొఫైల్ అప్‌డేట్ చేయలేకపోయాం',
    updated: 'ప్రొఫైల్ అప్‌డేట్ అయింది',
    phonePlaceholder: '+1 (555) 123-4567',
    locationPlaceholder: 'Portland, OR',
    pwTitle: 'పాస్‌వర్డ్ మార్చు',
    pwUpdating: 'మారుస్తోంది…',
    pwUpdate: 'పాస్‌వర్డ్ మార్చు',
    pwDone: 'మీ పాస్‌వర్డ్ మారింది.',
    pwDoneButton: 'సరే',
    pwNew: 'కొత్త పాస్‌వర్డ్',
    pwConfirm: 'పాస్‌వర్డ్ నిర్ధారణ',
    pwTooShort: 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.',
    pwMismatch: 'పాస్‌వర్డ్లు సరిపోలడం లేదు.',
    pwFailed: 'పాస్‌వర్డ్ మార్చలేకపోయాం',
    pwUpdated: 'పాస్‌వర్డ్ మారింది',
    avatarLabel: 'ప్రొఫైల్ ఫోటో',
    avatarReplace: 'మార్చు',
    avatarUpload: 'ఫోటో అప్‌లోడ్',
    avatarRemove: 'తొలగించు',
    avatarHint: 'JPEG, PNG లేదా WebP. 2 MB వరకు.',
    avatarAdjust: 'మీ ఫోటోని సర్దుబాటు చేయండి',
    avatarType: 'JPEG, PNG లేదా WebP చిత్రం ఎంచుకోండి.',
    avatarTooBig: 'ఆ చిత్రం {size} MB ఉంది. పరిమితి 2 MB.',
    avatarNoBucket:
      'ఫోటో స్టోరేజ్ ఇంకా సిద్ధంగా లేదు. 0008 మైగ్రేషన్ వర్తింపజేసి, మళ్లీ ప్రయత్నించండి.',
    avatarFailed: 'అప్‌లోడ్ విఫలమైంది: {message}',
  },
  audit: {
    eyebrow: 'జవాబుదారీ',
    title: 'కార్యకలాపాలు & ఆడిట్ లాగ్',
    subtitle:
      'ఉత్పత్తులు, కస్టమర్లు, సప్లయర్లు, అమ్మకాలలో జరిగిన ప్రతి మార్పు. ' +
      'ఇవి కేవలం జోడించబడతాయి — మీతో సహా ఎవరూ వీటిని మార్చలేరు, తొలగించలేరు.',
    items: 'ఎంట్రీలు',
    searchAria: 'కార్యకలాపాలలో వెతకండి',
    searchPlaceholder: 'వ్యక్తి, రికార్డ్ లేదా ఫీల్డ్ వెతకండి...',
    filterType: 'రికార్డ్ రకం ప్రకారం ఫిల్టర్',
    allTypes: 'అన్ని రకాలు',
    filterAction: 'చర్య ప్రకారం ఫిల్టర్',
    allActions: 'అన్ని చర్యలు',
    filterPerson: 'వ్యక్తి ప్రకారం ఫిల్టర్',
    anyone: 'ఎవరైనా',
    from: 'నుండి',
    to: 'వరకు',
    colWhen: 'ఎప్పుడు',
    colWho: 'ఎవరు',
    colAction: 'చర్య',
    colType: 'రకం',
    colRecord: 'రికార్డ్',
    colChanged: 'మారింది',
    system: 'సిస్టమ్',
    emptyTitle: 'ఇంకా ఏ కార్యకలాపం నమోదు కాలేదు',
    emptyBody:
      'ఉత్పత్తులు, కస్టమర్లు, సప్లయర్లు, అమ్మకాలలో మార్పులు జరిగినప్పుడు ' +
      'ఇక్కడ కనిపిస్తాయి.',
    noMatchTitle: 'మీ ఫిల్టర్లకు సరిపోయే ఎంట్రీలు లేవు',
    noMatchBody: 'తేదీ పరిధిని పెంచండి లేదా ఒక ఫిల్టర్ తొలగించండి.',
    entityProduct: 'ఉత్పత్తి',
    entityCustomer: 'కస్టమర్',
    entitySupplier: 'సప్లయర్',
    entitySale: 'అమ్మకం',
    actionInsert: 'సృష్టించబడింది',
    actionUpdate: 'మార్చబడింది',
    actionDelete: 'తొలగించబడింది',
    summaryCreated: 'రికార్డ్ సృష్టించబడింది',
    summaryDeleted: 'రికార్డ్ తొలగించబడింది',
    summaryNoChanges: 'కనిపించే ఫీల్డ్ మార్పులు లేవు',
    yes: 'అవును',
    no: 'కాదు',
    fields: {
      name: 'పేరు',
      brand: 'బ్రాండ్',
      sku: 'SKU',
      barcode: 'బార్‌కోడ్',
      category: 'వర్గం',
      unit_price: 'యూనిట్ ధర',
      unit: 'యూనిట్',
      stock: 'నిల్వ',
      low_stock_threshold: 'తక్కువ నిల్వ పరిమితి',
      expiry_date: 'గడువు తేదీ',
      image_url: 'ఫోటో',
      full_name: 'పూర్తి పేరు',
      email: 'ఈమెయిల్',
      phone: 'ఫోన్',
      loyalty_tier: 'లాయల్టీ స్థాయి',
      total_spent: 'మొత్తం ఖర్చు',
      visits: 'సందర్శనలు',
      notes: 'నోట్స్',
      last_visit_at: 'చివరి సందర్శన',
      primary_contact: 'ప్రధాన సంప్రదింపు',
      status: 'స్థితి',
      logo_url: 'లోగో',
      active_orders: 'క్రియాశీల ఆర్డర్లు',
      sold_by: 'అమ్మినవారు',
      total: 'మొత్తం',
      payment_method: 'చెల్లింపు విధానం',
      client_id: 'క్లయింట్ ID',
    },
  },
  notif: {
    panelTitle: 'నోటిఫికేషన్లు',
    markAllRead: 'అన్నీ చదినవిగా గుర్తించు',
    loading: 'లోడ్ అవుతోంది…',
    caughtUp: 'అన్నీ చూసేశారు.',
    unread: 'చదవనిది',
    bellNone: 'నోటిఫికేషన్లు, చదవనివి లేవు',
    bellOne: 'నోటిఫికేషన్లు, 1 చదవనిది',
    bellMany: 'నోటిఫికేషన్లు, {n} చదవనివి',
    kindGeneral: 'అప్‌డేట్',
    kindLowStock: 'తక్కువ స్టాక్',
    kindStaff: 'సిబ్బంది',
    kindSupplier: 'సప్లయర్',
    kindSales: 'అమ్మకాలు',
  },
  help: {
    eyebrow: 'సహాయ కేంద్రం',
    title: 'మేము ఎలా సహాయపడగలం?',
    subtitle:
      'గైడ్లను వెతకండి, లేదా కింద అంశాల వారీగా చూడండి. ప్రతి వ్యాసం StockPulse ' +
      'ఈరోజు నిజంగా చేసే దాన్ని వివరిస్తుంది.',
    searchAria: 'సహాయ వ్యాసాలను వెతకండి',
    searchPlaceholder: 'సహాయ వ్యాసాలను వెతకండి…',
    noMatch: '“{q}”కి సరిపోయే వ్యాసాలు లేవు',
    oneMatch: '“{q}”కి సరిపోయే {n} వ్యాసం',
    manyMatch: '“{q}”కి సరిపోయే {n} వ్యాసాలు',
    nothingTitle: 'దానికి ఏమీ దొరకలేదు',
    nothingBody: 'మరీ విస్తృత పదం ప్రయత్నించండి, లేదా వీటిలో ఒకటి:',
    // Each must occur in lib/help/articles.te.ts — a chip that finds nothing
    // is the state it exists to rescue the reader from.
    suggested: ['తక్కువ నిల్వ', 'CSV', 'షిఫ్ట్', 'పాస్‌వర్డ్', 'పాత్ర'],
    browse: 'అంశాల వారీగా',
    allTopics: 'అన్ని సహాయ అంశాలు',
    moreOnThis: 'దీనిపై మరిన్ని',
    articleNotFound: 'వ్యాసం దొరకలేదు',
    formTitle: 'మరింత సహాయం కావాలా?',
    formIntro:
      'ఏ వ్యాసంలోనూ సమాధానం లేకపోతే, ఏమి జరుగుతోందో చెప్పండి, మేము స్పందిస్తాం.',
    sentTitle: 'అభ్యర్థన పంపబడింది',
    sentBefore: 'ధన్యవాదాలు — మాకు అందింది. మీ టికెట్ రిఫరెన్స్ ',
    sentAfter:
      '. ఫాలో-అప్ అవసరమైతే దాన్ని చెప్పండి. మేము సాధారణంగా ఒక పనిదినంలోగా సమాధానమిస్తాం.',
    sendAnother: 'మరొక అభ్యర్థన పంపండి',
    fName: 'మీ పేరు',
    fEmail: 'ఈమెయిల్',
    fEmailHint: 'సమాధానం పంపవలసిన చిరునామా.',
    fCategory: 'ఇది దేని గురించి?',
    fMessage: 'సందేశం',
    fMessageHint: '{max}లో {n} అక్షరాలు',
    fMessagePlaceholder: 'మీరు ఏమి చేయాలనుకున్నారో, బదులుగా ఏమి జరిగిందో చెప్పండి.',
    sending: 'పంపుతోంది…',
    send: 'అభ్యర్థన పంపండి',
    catGettingStarted: 'ప్రారంభం',
    catInventory: 'ఇన్వెంటరీ & స్టాక్',
    catSales: 'అమ్మకాలు',
    catSuppliers: 'సప్లయర్లు',
    catCustomers: 'కస్టమర్లు',
    catStaff: 'సిబ్బంది & షెడ్యూల్',
    catSettings: 'సెట్టింగ్స్',
    catAi: 'AI అసిస్టెంట్',
    catRoles: 'పాత్రలు & అనుమతులు',
    catBilling: 'బిల్లింగ్',
    catBug: 'ఏదో పని చేయడం లేదు',
    catOther: 'మరేదైనా',
    vName: 'ఎవరు రాస్తున్నారో తెలియడానికి మీ పేరు ఇవ్వండి.',
    vNameTooLong: 'పేరు {n} అక్షరాలోపు ఉండాలి.',
    vEmail: 'మేము సమాధానం ఇవ్వడానికి ఈమెయిల్ ఇవ్వండి.',
    vEmailTooLong: 'ఆ ఈమెయిల్ చాలా పొడవుగా ఉంది.',
    vEmailInvalid: 'you@yourshop.com లాంటి చెల్లుబాటు అయ్యే ఈమెయిల్ ఇవ్వండి.',
    vCategory: 'ఒక విభాగం ఎంచుకోండి.',
    vMessage: 'ఏమి తప్పు జరుగుతోందో చెప్పండి.',
    vMessageShort: 'కొన్ని వివరాలు చేర్చండి — కనీసం {n} అక్షరాలు.',
    vMessageLong: 'దీన్ని {n} అక్షరాలోపు ఉంచండి.',
    fixFields: 'గుర్తు పెట్టిన ఫీల్డ్లను సరిచేయండి.',
    detailsRejected:
      'ఆ వివరాలలో కొన్ని తిరస్కరించబడ్డాయి. సందేశం పొడవు చూసి మళ్లీ ప్రయత్నించండి.',
    noStore: 'మీ ఖాతా ఏ స్టోర్‌కీ జత చేయబడలేదు, కాబట్టి ఇది నమోదు కాలేదు.',
    savedNoRef:
      'మీ అభ్యర్థన సేవ్ అయింది, కానీ దాని టికెట్ నంబర్‌ను తిరిగి చదవలేకపోయాం.',
    sendFailed: 'మీ అభ్యర్థనను పంపలేకపోయాం: {message}',
  },
  support: {
    eyebrow: 'సహాయం',
    title: 'సహాయ అభ్యర్థనలు',
    waitingOne: '{n} అభ్యర్థన సమాధానం కోసం ఎదురుచూస్తోంది.',
    waitingMany: '{n} అభ్యర్థనలు సమాధానం కోసం ఎదురుచూస్తున్నాయి.',
    allDescription: 'సహాయ కేంద్రం నుండి వచ్చిన అన్నీ, పరిష్కరించినవి కూడా.',
    filterOpen: 'పెండింగ్ ({n})',
    filterAll: 'అన్నీ ({n})',
    nothingTitle: 'ఏమీ పెండింగ్ లేదు',
    nothingBody: 'ప్రతి సహాయ అభ్యర్థనా పరిష్కరించబడింది.',
    emptyTitle: 'ఇంకా అభ్యర్థనలు లేవు',
    emptyBody: 'సహాయ కేంద్రం నుండి వచ్చిన అభ్యర్థనలు ఇక్కడ కనబడతాయి.',
    statusOpen: 'పెండింగ్',
    statusResolved: 'పరిష్కరించబడింది',
    markResolved: 'పరిష్కరించినట్టు గుర్తించు',
    reopen: 'మళ్లీ తెరువు',
    updateFailed: 'అభ్యర్థనను మార్చలేకపోయాం',
    markedResolved: 'పరిష్కరించినట్టు గుర్తించబడింది',
    reopened: 'మళ్లీ తెరిచారు',
    noPermission: 'యజమాని లేదా మేనేజర్ మాత్రమే అభ్యర్థనను మార్చగలరు.',
  },
  ai: {
    title: 'స్టోర్ అసిస్టెంట్',
    online: 'ఆన్‌లైన్',
    history: 'సంభాషణల చరిత్ర',
    unmute: 'మాట్లాడే సమాధానాలను ఆన్ చేయండి',
    mute: 'మాట్లాడే సమాధానాలను ఆఫ్ చేయండి',
    close: 'అసిస్టెంట్ మూసివేయండి',
    opening: 'సంభాషణ తెరుస్తోంది…',
    emptyTitle: 'ఈరోజు నేను ఎలా సహాయపడగలను?',
    emptyBody:
      'నేను స్టాక్ చూడగలను, అమ్మకాల డేటాను విశ్లేషించగలను, సిబ్బంది షెడ్యూళ్లతో సహాయపడగలను.',
    sLowStock: 'ఏ ఉత్పత్తుల స్టాక్ తక్కువగా ఉంది?',
    sExpiring: 'ఏ ఉత్పత్తుల గడువు త్వరలో ముగుస్తుంది?',
    sToday: 'ఈరోజు అమ్మకాలు ఎంత?',
    sWeek: 'ఈ వారం అమ్మకాల సారాంశం ఇవ్వండి',
    sValue: 'నా మొత్తం స్టాక్ విలువ ఎంత?',
    clearCurrent: 'ఈ చాట్‌ను ఖాళీ చేయి',
    placeholder: 'స్టాక్, అమ్మకాలు లేదా సిబ్బంది గురించి అడగండి',
    sendAria: 'సందేశం పంపండి',
    disclaimer: 'AI పొరపాట్లు చేయగలదు. కీలక సమాచారాన్ని పని చేయడం ముందు సరిచూసుకోండి.',
    clearTitle: 'ఈ సంభాషణను ఖాళీ చేయాలా?',
    clearButton: 'చాట్ ఖాళీ చేయి',
    clearBodyOne:
      'ఈ సంభాషణలోని {n} సందేశం తొలగించబడుతుంది. దీన్ని తిరిగి పొందలేరు.',
    clearBodyMany:
      'ఈ సంభాషణలోని {n} సందేశాలు అన్నీ తొలగించబడతాయి. వాటిని తిరిగి పొందలేరు.',
    clearBody2:
      'సంభాషణ అలాగే తెరిచి ఉంటుంది, మీరు ప్రశ్నలు అడగడం కొనసాగవచ్చు — అది ఖాళీగా ' +
      'మొదలవుతుంది. పూర్తిగా తొలగించాలంటే చరిత్ర జాబితాలోని తొలగించు బటన్ వాడండి.',
    prefSaveFailed: 'ఆ ఎంపికను సేవ్ చేయలేకపోయాం.',
    threadStartFailed:
      'సేవ్ అయ్యే సంభాషణను ప్రారంభించలేకపోయాం — ఈ సంభాషణ భద్రపరచబడదు.',
    openFailed: 'ఆ సంభాషణను తెరవలేకపోయాం.',
    deleteFailed: 'ఆ సంభాషణను తొలగించలేకపోయాం.',
    clearFailed: 'ఈ సంభాషణను ఖాళీ చేయలేకపోయాం.',
    streamError: 'క్షమించండి, ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి.',
    newChat: 'కొత్త చాట్',
    loadingThreads: 'సంభాషణలు లోడ్ అవుతున్నాయ…',
    noThreads:
      'ఇంకా గత సంభాషణలు లేవు. మీరు అడిగేదంతా ఇక్కడ సేవ్ అవుతుంది, తర్వాత కొనసాగవచ్చు.',
    bucketToday: 'ఈరోజు',
    bucketYesterday: 'నిన్న',
    bucketEarlier: 'అంతకుముందు',
    untitled: 'కొత్త సంభాషణ',
    deleteQ: 'ఈ చాట్‌ను తొలగించాలా?',
    deleteAria: 'సంభాషణను తొలగించండి: {name}',
    vAudioCapture:
      'మైక్రోఫోన్ దొరకలేదు. అది కనెక్ట్ అయ్యి ఉందో, మరొక యాప్ వాడడం లేదో చూడండి.',
    vNetwork: 'వాయిస్ ఇన్‌పుట్‌కు ఇంటర్నెట్ కావాలి. మళ్లీ కనెక్ట్ అయ్యి ప్రయత్నించండి.',
    vNoSpeech: 'అర్థం కాలేదు — మైక్రోఫోన్ దగ్గరగా మళ్లీ ప్రయత్నించండి.',
    vLangUnsupported: 'ఈ బ్రౌజర్ ఇక్కడ మాటలను గుర్తించలేదు.',
    vServiceNotAllowed: 'ఈ బ్రౌజర్ సెట్టింగ్స్‌లో స్పీచ్ గుర్తింపు ఆఫ్‌లో ఉంది.',
    vBlocked:
      '{host} కోసం మైక్రోఫోన్ యాక్సెస్ బ్లాక్ అయ్యింది. అనుమతి సైట్‌కొకటి, కాబట్టి ' +
      'మరొచోట అనుమతించడం ఇక్కడ పనిచేయదు — అడ్రెస్ బార్ ఎడమపక్కనున్న ఐకాన్ ' +
      'తెరిచి, మైక్రోఫోన్‌ను Allow చేసి, పేజీ రీలోడ్ చేయండి.',
    vStartFailed: 'వాయిస్ ఇన్‌పుట్ ప్రారంభం కాలేదు. మళ్లీ ప్రయత్నించండి.',
    vInsecure:
      'వాయిస్ ఇన్‌పుట్‌కు సురక్షిత కనెక్షన్ కావాలి. {host} కేవలం http. https వాడండి, ' +
      'లేదా localhostలో యాప్ తెరవండి.',
    vUnknown: 'వాయిస్ ఇన్‌పుట్ ఆగింది ({code}). మళ్లీ ప్రయత్నించండి.',
    vStop: 'రికార్డింగ్ ఆపండి',
    vAsk: 'గొంతుతో అడగండి',
    vRecording: 'రికార్డింగ్ అవుతోంది. ఇప్పుడు మాట్లాడండి.',
    vProcessing: 'ట్రాన్స్క్రిప్షన్ పూర్తవుతోంది.',
    rMalformed: 'అభ్యర్థన సరైన రూపంలో లేదు.',
    rInvalid: 'సందేశం చెల్లదు లేదా మరీ పెద్దది.',
    rRateLimit: 'చాలా అభ్యర్థనలు. కొంచెం ఆగి మళ్లీ ప్రయత్నించండి.',
    rNotConfigured:
      'AI అసిస్టెంట్ ఇంకా సిద్ధంగా లేదు. దీన్ని పనిచేయడానికి GEMINI_API_KEY జోడించండి.',
    rTooManyLookups:
      'దాన్ని పూర్తిగా చూడలేకపోయాను — దానికి చాలా పరిశీలనలు అవసరమయ్యాయి. ' +
      'ఒకొక్కటిగా అడగండి.',
    rNoAnswer: 'క్షమించండి, దానికి సమాధానం ఇవ్వలేకపోయాను. వేరే విధంగా అడిగి చూస్తారా?',
    rError: 'క్షమించండి, ఒక లోపం ఎదురైంది: {message}',
    ownerOnly: 'ఈ సమాచారం యజమానులకు, మేనేజర్లకు మాత్రమే అందుబాటులో ఉంటుంది.',
    replyLanguage: 'Always reply in Telugu, using Telugu script.',
  },
  dash: {
    greetMorning: 'శుభోదయం',
    greetAfternoon: 'శుభ మధ్యాహ్నం',
    greetEvening: 'శుభ సాయంత్రం',
    allInOrder: 'అన్నీ సరిగ్గా ఉన్నాయి.',
    lowOnStockOne: '{n} వస్తువు స్టాక్ తక్కువ',
    lowOnStockMany: '{n} వస్తువుల స్టాక్ తక్కువ',
    countersBusy: '{total}లో {busy} కౌంటర్లు బిజీ',
    updated: 'అప్‌డేట్',
    liveUpdates: 'లైవ్ అప్‌డేట్లు ఆన్‌లో',
    agoJustNow: 'ఇప్పుడే',
    agoSeconds: '{n} సె. క్రితం',
    agoOneMin: '1 నిమి క్రితం',
    agoMins: '{n} నిమి క్రితం',
    todaySalesOwner: 'ఈరోజు అమ్మకాలు',
    todayTotalStaff: 'ఈరోజు మొత్తం',
    vsYesterday: 'నిన్నతో పోలిస్తే',
    salesTodayOne: 'ఈరోజు {n} అమ్మకం',
    salesTodayMany: 'ఈరోజు {n} అమ్మకాలు',
    sparklineAria: 'గత {n} రోజుల ఆదాయం',
    transactionsToday: 'ఈరోజు లావాదేవీలు',
    logged: 'నమోదు',
    weekRevenue: '7 రోజుల ఆదాయం',
    transactionsOne: '{n} లావాదేవీ',
    transactionsMany: '{n} లావాదేవీలు',
    viewAll: 'అన్నీ చూడండి',
    lowStockTile: 'తక్కువ స్టాక్ వస్తువులు',
    expiringTile: 'త్వరలో గడువు',
    alreadyExpired: '{n} ఇప్పటికే గడువు ముగిసింది',
    withinOne: '{n} రోజులోగా',
    withinMany: '{n} రోజుల్లోగా',
    quickActions: 'త్వరిత చర్యలు',
    qaNewOrder: 'కొత్త ఆర్డర్',
    qaCheckout: 'చెకౌట్ స్థితి',
    qaCheckStock: 'స్టాక్ చూడండి',
    qaReports: 'నివేదికలు',
    trendTitle: 'రోజువారీ అమ్మకాల గతి',
    trendSubtitle: 'గత 7 రోజులలో రోజుకో ఆదాయం.',
    chartSeries: 'అమ్మకాలు',
    noSalesWeekTitle: 'ఈ వారం అమ్మకాలు లేవు',
    noSalesWeekBody:
      'అమ్మకాలు నమోదు చేసిన తర్వాత గత ఏడు రోజుల గతి ఇక్కడ కనబడుతుంది.',
    logSale: 'అమ్మకం నమోదు చేయండి',
    recentSales: 'ఇటీవలి అమ్మకాలు',
    latest: 'చివరి {n}',
    noSalesTitle: 'ఇంకా అమ్మకాలు నమోదు కాలేదు',
    noSalesBody: 'మీ బృందం నమోదు చేస్తున్న కొద్దీ అమ్మకాలు ఇక్కడ కనబడతాయి.',
    staffFallback: 'సిబ్బంది',
    completed: 'పూర్తయింది',
    viewHistory: 'పూర్తి చరిత్ర చూడండి',
    recentAlerts: 'ఇటీవలి హెచ్చరికలు',
    alertsNew: '{n} కొత్తవి',
    noAlertsTitle: 'క్రియాశీల హెచ్చరికలు లేవు',
    noAlertsBody:
      'తక్కువ స్టాక్, చెకౌట్ సమస్యలు, వచ్చే డెలివరీలు ఇక్కడ కనబడతాయి.',
    lowStockTitle: 'తక్కువ స్టాక్ హెచ్చరికలు',
    colItem: 'వస్తువు పేరు',
    colCategory: 'విభాగం',
    colStockLevel: 'స్టాక్ స్థాయి',
    colAction: 'చర్య',
    colExpires: 'గడువు',
    allStockedTitle: 'అన్ని ఉత్పత్తులు మంచి స్టాక్‌లో ఉన్నాయి',
    allStockedBody:
      'ఉత్పత్తులు తమ తక్కువ స్టాక్ పరిమితికి చేరినప్పుడు ఈ జాబితాలో కనబడతాయి.',
    unitsLeft: '{n} మిగిలింది',
    restock: 'మళ్లీ నింపండి',
    expiringTitle: 'త్వరలో గడువు',
    expiryReadError:
      'గడువు తేదీలను ఇప్పుడు చదవలేకపోయాం, కాబట్టి ఈ జాబితా అపూర్ణంగా ఉండవచ్చు. ' +
      'రీలోడ్ చేసి ప్రయత్నించండి.',
    nothingExpiringTitle: 'త్వరలో గడువు ముగిసేది ఏమీ లేదు',
    nothingExpiringOne:
      'ఉత్పత్తుల గడువుకు {n} రోజు మిగిలినప్పుడు అవి ఈ జాబితాలో కనబడతాయి.',
    nothingExpiringMany:
      'ఉత్పత్తుల గడువుకు {n} రోజులు మిగిలినప్పుడు అవి ఈ జాబితాలో కనబడతాయి.',
    expiredWord: 'గడువు ముగిసింది',
    expiresWord: 'గడువు',
    unitOne: '{n} యూనిట్',
    unitMany: '{n} యూనిట్లు',
    writeOff: 'రాయితీ వేయండి',
    discount: 'తగ్గించండి',
    aExpiredTitleOne: 'గడువు ముగిసింది: {n} వస్తువు',
    aExpiredTitleMany: 'గడువు ముగిసింది: {n} వస్తువులు',
    aExpiredBodyOne: '{name} గడువు దాటింది.',
    aExpiredBodyTwo: '{name} మరియు మరొ {n} గడువు దాటాయి.',
    aExpiredBodyMany: '{name} మరియు మరో {n} గడువు దాటాయి.',
    aExpiringTitleOne: '{n} రోజులో గడువు',
    aExpiringTitleMany: '{n} రోజుల్లో గడువు',
    aExpiringBodyOne: 'ఇంకా సమయం ఉండగా అమ్మాల్సిన {n} వస్తువు.',
    aExpiringBodyMany: 'ఇంకా సమయం ఉండగా అమ్మాల్సిన {n} వస్తువులు.',
    aLowStockTitle: 'తక్కువ స్టాక్: {category}',
    aLowStockBodyOne: '{n} వస్తువు కనిష్ట పరిమితి కంటే తక్కువ.',
    aLowStockBodyMany: '{n} వస్తువులు కనిష్ట పరిమితి కంటే తక్కువ.',
    aStationTitle: 'స్టేషన్ 0{n} హెచ్చరిక',
    aWeightMismatch: 'బ్యాగింగ్ ప్రాంతంలో బరువు సరిపోలడం లేదు.',
    aAgeCheck: 'నిబంధిత వస్తువుకు వయసు ధృవీకరణ అవసరం.',
    aDeliveryTitle: 'డెలివరీ వచ్చింది',
    aDeliveryBody: '{supplier} డెలివరీ స్వీకరించడానికి సిద్ధంగా ఉంది.',
    supplierFallback: 'సప్లయర్',
    timeNow: 'ఇప్పుడు',
  },
  palette: {
    ariaLabel: 'కమాండ్ ప్యాలెట్',
    searchPlaceholder: 'పేజీలు, చర్యలను వెతకండి...',
    searchAria: 'పేజీలు, చర్యలను వెతకండి',
    results: 'ఫలితాలు',
    noResultsTitle: 'ఫలితాలు లేవు',
    noResultsBody:
      '“{query}”కు ఏదీ సరిపోలేదు. పేజీ పేరు లేదా “వస్తువు చేర్చు” వంటి చర్యను ప్రయత్నించండి.',
    groupNavigation: 'నావిగేషన్',
    groupActions: 'చర్యలు',
    groupProducts: 'వస్తువులు',
    openAssistant: 'AI అసిస్టెంట్ తెరవండి',
    viewProfile: 'ప్రొఫైల్ చూడండి',
    signOut: 'సైన్ అవుట్',
  },
  tabs: { dashboard: 'డాష్‌బోర్డ్', inventory: 'నిల్వ', monitoring: 'పర్యవేక్షణ', settings: 'సెట్టింగ్‌లు' },
}

const hi: AppCopy = {
  ...OPERATIONS_COPY.hi,
  nav: {
    dashboard: 'डैशबोर्ड',
    inventory: 'स्टॉक',
    sales: 'बिक्री',
    reports: 'रिपोर्ट',
    audit: 'गतिविधि',
    customers: 'ग्राहक',
    suppliers: 'सप्लायर',
    staff: 'स्टाफ़',
    monitoring: 'निगरानी',
    settings: 'सेटिंग्स',
    support: 'सहायता',
    help: 'हेल्प सेंटर',
    profile: 'प्रोफ़ाइल',
  },
  shell: {
    skipToContent: 'मुख्य सामग्री पर जाएँ',
    storeOperations: 'दुकान संचालन',
    demoBadge: 'डेमो दुकान — नमूना डेटा',
    openNavigation: 'मेन्यू खोलें',
    closeNavigation: 'मेन्यू बंद करें',
    searchPlaceholder: 'सामान, बिक्री, ग्राहक खोजें...',
    searchShort: 'खोजें या सीधे जाएँ...',
    aiAssistant: 'AI असिस्टेंट',
    notifications: 'सूचनाएँ',
    yourProfile: 'आपकी प्रोफ़ाइल',
    navigation: 'नेविगेशन',
    profileSummary: 'आपकी प्रोफ़ाइल — {name}, {store} में {role}',
  },
  roles: { owner: 'मालिक', manager: 'मैनेजर', staff: 'स्टाफ़' },
  common: {
    exportCsv: 'CSV एक्सपोर्ट',
    nothingToExportTitle: 'एक्सपोर्ट करने को कुछ नहीं',
    nothingToExportBody: 'मौजूदा फ़िल्टर से कोई {items} मेल नहीं खाता।',
    exportedTitle: '{count} {items} एक्सपोर्ट हुए',
    cancel: 'रद्द करें',
    delete: 'हटाएँ',
    clearAll: 'सब हटाएँ',
    clearFilters: 'फ़िल्टर हटाएँ',
    clearSearch: 'खोज हटाएँ',
    closeDialog: 'बंद करें',
    loading: 'लोड हो रहा है',
    loadingPage: 'पेज की सामग्री लोड हो रही है…',
    previousPage: 'पिछला पेज',
    nextPage: 'अगला पेज',
    rows: 'पंक्तियाँ',
    pageOf: '/ {total}',
    showingRange: 'कुल {total} {items} में से {start}-{end} दिखा रहे हैं',
    notificationsRegion: 'सूचनाएँ',
    dismissNotification: 'सूचना हटाएँ',
    usePhoto: 'यह फ़ोटो इस्तेमाल करें',
    dragToReposition: 'सही जगह लाने के लिए खींचें',
    zoom: 'ज़ूम',
    imageError: 'उस फ़ोटो को प्रोसेस नहीं कर सके।',
    canvasError: 'इस ब्राउज़र में कैनवास उपलब्ध नहीं है।',
    relJustNow: 'अभी',
    relMinutesAgo: '{n} मिनट पहले',
    relHoursAgo: '{n} घंटे पहले',
    relDaysAgo: '{n} दिन पहले',
  },
  expiry: {
    months: ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'],
    expired: 'एक्सपायर हो गया',
    expiringSoon: 'जल्द एक्सपायर होगा',
    expires: 'एक्सपायरी',
    noDate: 'कोई एक्सपायरी तारीख़ नहीं',
    moreLot: '+{n} और लॉट',
    moreLots: '+{n} और लॉट',
    relToday: 'आज',
    relTomorrow: '1 दिन में',
    relYesterday: '1 दिन पहले',
    relInDays: '{n} दिन में',
    relDaysAgo: '{n} दिन पहले',
  },
  sort: {
    ascending: ', आरोही क्रम में। उलटने के लिए दबाएँ।',
    descending: ', अवरोही क्रम में। उलटने के लिए दबाएँ।',
    none: ', क्रमित नहीं। क्रम लगाने के लिए दबाएँ।',
  },
  validation: {
    nameRequired: 'नाम ज़रूरी है।',
    nameTooLong: 'नाम 120 अक्षरों से ज़्यादा नहीं हो सकता।',
    skuTooLong: 'SKU 40 अक्षरों से ज़्यादा नहीं हो सकता।',
    barcodeShape: '8 से 14 अंक, केवल संख्याएँ इस्तेमाल करें।',
    brandTooLong: 'ब्रांड 80 अक्षरों से ज़्यादा नहीं हो सकता।',
    categoryInvalid: 'कोई मान्य श्रेणी चुनें।',
    priceMin: 'शून्य या उससे ज़्यादा होना चाहिए।',
    priceTooLarge: 'यह क़ीमत बहुत बड़ी लगती है।',
    thresholdWhole: 'पूर्ण संख्या, शून्य या उससे ज़्यादा होनी चाहिए।',
    unitRequired: 'यूनिट ज़रूरी है।',
    tooManyLots: 'एक सामान के लिए ज़्यादा से ज़्यादा {n} लॉट।',
    quantityWhole: 'पूर्ण संख्या, शून्य या उससे ज़्यादा होनी चाहिए।',
    useDatePicker: 'तारीख़ चुनने वाला कंट्रोल इस्तेमाल करें।',
    badYear: 'साल जाँच लें \u2014 {year} में कुछ भी एक्सपायर नहीं होता।',
    lotPrefix: 'लॉट {n}: {message}',
  },
  inventory: {
    eyebrow: 'स्टॉक',
    title: 'स्टॉक प्रबंधन',
    subtitle: 'स्टॉक स्तर, श्रेणियाँ और क़ीमतें संभालें।',
    scan: 'स्कैन',
    importCsv: 'CSV इम्पोर्ट',
    addProduct: 'सामान जोड़ें',
    searchAria: 'स्टॉक में खोजें',
    searchPlaceholder: 'नाम, SKU, बारकोड, ब्रांड, श्रेणी या यूनिट खोजें...',
    filterByStatus: 'स्टॉक स्थिति से फ़िल्टर करें',
    allCategories: 'सभी श्रेणियाँ',
    statusAny: 'कोई भी स्थिति',
    statusIn: 'स्टॉक में',
    statusLow: 'कम स्टॉक',
    statusOut: 'स्टॉक ख़त्म',
    badgeIn: 'स्टॉक में',
    badgeLow: 'कम स्टॉक',
    badgeOut: 'स्टॉक ख़त्म',
    totalValue: 'कुल मूल्य',
    lowStock: 'कम स्टॉक',
    outOfStock: 'स्टॉक ख़त्म',
    itemsCount: '{n} सामान',
    exportItems: 'सामान',
    colProduct: 'सामान',
    colSkuCategory: 'SKU / श्रेणी',
    colUnitPrice: 'यूनिट क़ीमत',
    colStock: 'स्टॉक',
    colExpiry: 'एक्सपायरी',
    colStatus: 'स्थिति',
    colActions: 'क्रियाएँ',
    skuPrefix: 'SKU: {v}',
    barcodePrefix: 'बारकोड: {v}',
    minPrefix: 'न्यूनतम: {v}',
    editRow: '{name} संपादित करें',
    deleteRow: '{name} हटाएँ',
    emptyTitle: 'अभी कोई सामान नहीं',
    emptyBody:
      'स्टॉक स्तर, क़ीमत और कम-स्टॉक अलर्ट ट्रैक करना शुरू करने के लिए अपना पहला सामान जोड़ें।',
    noMatchTitle: 'आपके फ़िल्टर से कोई सामान मेल नहीं खाता',
    noMatchBody: 'कोई दूसरा शब्द खोजें, या श्रेणी और स्थिति फ़िल्टर हटा दें।',
    scanTitle: 'बारकोड स्कैन करें',
    scanHelp:
      'कैमरा सामान के बारकोड की ओर करें। अगर वह पहले से आपके स्टॉक में है तो आप उसका स्टॉक अपडेट कर सकते हैं; नहीं तो उसे जोड़ सकते हैं।',
    scanLooking: 'वह बारकोड खोजा जा रहा है\u2026',
    scanFoundTitle: 'सामान मिल गया',
    scanFoundExpiry: '{name} \u2014 {state} {date}, {rel}।',
    scanFoundNoExpiry: '{name} \u2014 कोई एक्सपायरी तारीख़ नहीं। स्टॉक अपडेट करके सेव करें।',
    scanExpiredWord: 'एक्सपायर',
    scanExpiresWord: 'एक्सपायरी',
    scanNoMatchTitle: 'उस बारकोड वाला कोई सामान नहीं',
    scanNoMatchBody: 'अभी जोड़ें \u2014 बारकोड भरा हुआ है।',
    scanCacheHit: '{name} आपकी सेव की गई सूची में है, पर स्टॉक बदलने के लिए कनेक्शन चाहिए।',
    scanCacheMiss:
      'सेव की गई सूची में {code} बारकोड वाला कोई सामान नहीं। पूरी सूची खोजने के लिए दोबारा कनेक्ट करें।',
    scanFailed: 'खोज विफल रही। दोबारा कोशिश करें।',
    deleteTitle: 'सामान हटाएँ?',
    deleteBodyA: 'इससे ',
    deleteBodyB: ' स्टॉक से हमेशा के लिए हट जाएगा।',
    deleteConfirm: 'हटाएँ',
    deleteFailed: 'सामान हटाया नहीं जा सका।',
    deleteFailedToast: 'सामान नहीं हटा',
    deletedToast: 'सामान हटा दिया गया',
    formEdit: 'सामान संपादित करें',
    formAdd: 'सामान जोड़ें',
    saveChanges: 'बदलाव सेव करें',
    fName: 'सामान का नाम',
    fBrand: 'ब्रांड',
    fSku: 'SKU',
    fBarcode: 'बारकोड',
    barcodeHint: 'वैकल्पिक \u00b7 8-14 अंक, केवल संख्याएँ',
    barcodePlaceholder: 'जैसे 8901234567895',
    fCategory: 'श्रेणी',
    manageCategories: 'श्रेणियाँ संभालें',
    fPrice: 'क़ीमत ($)',
    fUnit: 'यूनिट',
    unitPlaceholder: 'ea, lb, gal',
    fThreshold: 'कम स्टॉक सीमा',
    lotsLegend: 'स्टॉक और एक्सपायरी',
    lotsHelp: 'हर डिलीवरी के लिए एक पंक्ति। जो चीज़ें एक्सपायर नहीं होतीं, उनकी तारीख़ ख़ाली छोड़ दें।',
    fQuantity: 'मात्रा',
    fExpiryDate: 'एक्सपायरी तारीख़',
    optional: 'वैकल्पिक',
    removeLot: 'लॉट {n} हटाएँ',
    addLot: 'एक और लॉट जोड़ें',
    totalStock: 'कुल स्टॉक:',
    saveFailed: 'सामान सेव नहीं हो सका।',
    updateFailedToast: 'सामान अपडेट नहीं हुआ',
    addFailedToast: 'सामान जुड़ा नहीं',
    updatedToast: 'सामान अपडेट हुआ',
    addedToast: 'सामान जुड़ गया',
    photoLabel: 'सामान की फ़ोटो',
    photoReplace: 'बदलें',
    photoAdd: 'फ़ोटो जोड़ें',
    photoRemove: 'हटाएँ',
    photoHint: 'JPEG, PNG या WebP. ज़्यादा से ज़्यादा 2 MB.',
    photoChooseAria: 'सामान की फ़ोटो चुनें',
    photoAdjustTitle: 'फ़ोटो सही करें',
    photoUseImage: 'यह तस्वीर इस्तेमाल करें',
    photoTypeError: 'JPEG, PNG या WebP तस्वीर चुनें।',
    photoSizeError: 'वह तस्वीर {mb} MB की है। सीमा 2 MB है।',
    photoBucketError:
      'सामान की तस्वीरों का स्टोरेज अभी तैयार नहीं है। माइग्रेशन 0009 लागू करके दोबारा कोशिश करें।',
    photoUploadError: 'अपलोड विफल: {msg}',
    detailsTitle: 'सामान का विवरण',
    detailsLoading: 'सामान का विवरण लोड हो रहा है',
    openInInventory: 'स्टॉक में खोलें',
    noBrand: 'कोई ब्रांड दर्ज नहीं',
    dSku: 'SKU',
    dBarcode: 'बारकोड',
    dCategory: 'श्रेणी',
    dBrand: 'ब्रांड',
    dPrice: 'क़ीमत',
    dUnit: 'यूनिट',
    dCurrentStock: 'मौजूदा स्टॉक',
    dMinStock: 'न्यूनतम स्टॉक',
    dInventoryValue: 'स्टॉक मूल्य',
    dNextExpiry: 'अगली एक्सपायरी',
    noExpiryDate: 'कोई एक्सपायरी तारीख़ नहीं',
    batchesHeading: 'बैच / लॉट',
    noBatches:
      'कोई बैच दर्ज नहीं। स्टॉक हर डिलीवरी के हिसाब से रखा जाता है, इसलिए इस सामान का कोई स्टॉक नहीं है।',
    lotQuantity: 'मात्रा',
    lotExpiry: 'एक्सपायरी',
    lotReceived: 'मिलने की तारीख़',
    lotNote: 'नोट',
    notFoundTitle: 'सामान नहीं मिला',
    notFoundBody: 'शायद वह हटा दिया गया है, या किसी दूसरी दुकान का है।',
    importTitle: 'CSV से सामान इम्पोर्ट करें',
    importIntroA: '',
    importIntroB: ' कॉलम वाली CSV फ़ाइल अपलोड कीजिए। पंक्तियाँ मौजूदा सामान से ',
    importIntroC:
      ' के आधार पर मिलाई जाती हैं \u2014 SKU मिलने पर वह सामान अपडेट होता है, बाक़ी जोड़ दिया जाता है। पुष्टि करने तक कुछ भी सेव नहीं होता।',
    requiredLabel: 'ज़रूरी:',
    optionalLabel: 'वैकल्पिक:',
    formatNote:
      'तारीख़ें YYYY-MM-DD में (2026-03-31)। संख्याएँ सादी, बिना मुद्रा चिह्न या हज़ार के विभाजक के (1250.50, $1,250.50 नहीं)। जो वैकल्पिक ख़ाना नहीं चाहिए उसे ख़ाली छोड़ दें।',
    newToThis: 'पहली बार कर रहे हैं?',
    sampleBlurb: 'ज़रूरी फ़ॉर्मैट और उदाहरण देखने के लिए नमूना CSV डाउनलोड कीजिए।',
    downloadSample: 'नमूना CSV डाउनलोड',
    chooseFile: 'CSV फ़ाइल चुनें',
    chooseAnother: 'दूसरी फ़ाइल चुनें',
    importRow: '{n} पंक्ति इम्पोर्ट करें',
    importRows: '{n} पंक्तियाँ इम्पोर्ट करें',
    statToAdd: 'जोड़नी हैं',
    statToUpdate: 'अपडेट करनी हैं',
    statProblems: 'समस्याएँ',
    colLine: 'लाइन',
    colImportProduct: 'सामान',
    colAction: 'क्रिया',
    actAdd: 'जोड़ें',
    actUpdate: 'अपडेट',
    actSkip: 'छोड़ें',
    unknownCol: 'अनजान कॉलम अनदेखा किया गया: {cols}',
    unknownCols: 'अनजान कॉलम अनदेखे किए गए: {cols}',
    replacesLots:
      'इस फ़ाइल में स्टॉक कॉलम है, इसलिए मेल खाने वाले हर सामान के मौजूदा स्टॉक लॉट और एक्सपायरी तारीख़ें उसकी पंक्ति में बताए एक ही लॉट से बदल दी जाएँगी।',
    errTooBig: 'वह फ़ाइल 2 MB से बड़ी है। उसे छोटे हिस्सों में बाँट लें।',
    errMissingCol:
      'फ़ाइल में "{cols}" कॉलम चाहिए। अपेक्षित हेडर देखने के लिए अपना स्टॉक CSV में एक्सपोर्ट करें।',
    errNoRows: 'हेडर के नीचे कोई डेटा पंक्ति नहीं मिली।',
    errNotCsv: 'वह फ़ाइल CSV के रूप में नहीं पढ़ी जा सकी।',
    nothingToImport: 'इम्पोर्ट करने को कुछ नहीं',
    nothingToImportBody: 'इस फ़ाइल की हर पंक्ति में कोई समस्या है।',
    importFailed: 'इम्पोर्ट विफल',
    importedProblems: 'समस्याओं के साथ इम्पोर्ट हुआ',
    importComplete: 'इम्पोर्ट पूरा',
    sumAdded: '{n} जुड़े',
    sumUpdated: '{n} अपडेट हुए',
    sumFailed: '{n} विफल',
    actNoPermission: 'स्टॉक बदलने की आपको अनुमति नहीं है।',
    actFixFields: 'चिह्नित ख़ानों को ठीक कीजिए।',
    actSkuExists: 'उस SKU वाला सामान पहले से मौजूद है।',
    actBadBarcode: 'यह मान्य बारकोड नहीं है।',
    actNoImportPermission: 'स्टॉक इम्पोर्ट करने की आपको अनुमति नहीं है।',
    actNothingToImport: 'इम्पोर्ट करने को कुछ नहीं।',
    dupSku: 'इस फ़ाइल में "{v}" SKU पहले भी आ चुका है।',
    dupBarcode: 'इस फ़ाइल में "{v}" बारकोड पहले भी आ चुका है।',
  },
  pos: {
    eyebrow: 'लेन-देन',
    title: 'बिक्री',
    subtitleRevenue: 'इस हफ़्ते: {week} · औसत ऑर्डर {avg}',
    subtitlePlain: 'नई बिक्री दर्ज करें और हाल के लेन-देन देखें।',
    logSale: 'बिक्री दर्ज करें',
    transactions: 'लेन-देन',
    weeklyPerformance: 'साप्ताहिक प्रदर्शन',
    revenue7: 'आमदनी, पिछले 7 दिन',
    popularCategories: 'लोकप्रिय श्रेणियाँ',
    noSalesDataTitle: 'अभी बिक्री का कोई डेटा नहीं',
    noSalesDataBody: 'बिक्री दर्ज होने पर श्रेणीवार ब्योरा यहाँ दिखेगा।',
    recentTransactions: 'हाल के लेन-देन',
    salesHistory: 'बिक्री इतिहास',
    searchPlaceholder: 'तारीख़, ID या स्टाफ़ खोजें...',
    searchAria: 'लेन-देन खोजें',
    filterByMethod: 'भुगतान तरीक़े से फ़िल्टर करें',
    methodAny: 'कोई भी तरीक़ा',
    methodCash: 'नक़द',
    methodCard: 'कार्ड',
    methodNfc: 'NFC',
    labelCash: 'नक़द',
    labelCard: 'कार्ड',
    labelNfc: 'NFC',
    from: 'से',
    to: 'तक',
    colDateTime: 'तारीख़ / समय',
    colOrderId: 'ऑर्डर ID',
    colAmount: 'रक़म',
    colMethod: 'तरीक़ा',
    colSoldBy: 'बेचने वाला',
    noSalesTitle: 'अभी कोई बिक्री दर्ज नहीं',
    noSalesBody: 'लेन-देन का इतिहास और रुझान बनाना शुरू करने के लिए अपनी पहली बिक्री दर्ज कीजिए।',
    noMatchTitle: 'आपके फ़िल्टर से कोई लेन-देन मेल नहीं खाता',
    noMatchBody: 'कोई दूसरा शब्द या दूसरी तारीख़ सीमा आज़माइए।',
    topSelling: 'सबसे ज़्यादा बिकने वाले',
    noTopTitle: 'पिछले 30 दिनों में कोई बिक्री नहीं',
    noTopBody: 'आपके सबसे ज़्यादा बिकने वाले सामान यहाँ दिखेंगे।',
    unitsSold: '{n} यूनिट बिके',
    viewInventory: 'स्टॉक देखें',
    modalTitle: 'बिक्री दर्ज करें',
    total: 'कुल',
    completeSale: 'बिक्री पूरी करें',
    loggingSale: 'दर्ज हो रही है…',
    hideScanner: 'स्कैनर छिपाएँ',
    scanBarcode: 'बारकोड स्कैन करें',
    scanLooking: 'वह बारकोड खोजा जा रहा है…',
    scannedOne: 'इस बिक्री में {n} सामान स्कैन हुआ। अगले के लिए फिर Start camera दबाएँ।',
    scannedMany: 'इस बिक्री में {n} सामान स्कैन हुए। अगले के लिए फिर Start camera दबाएँ।',
    searchProducts: 'जोड़ने के लिए सामान खोजें...',
    inStock: '{n} स्टॉक में',
    emptyCartTitle: 'अभी कोई सामान नहीं',
    emptyCartBody: 'ऊपर खोजकर सामान जोड़िए और यह बिक्री बनाइए।',
    eachPrice: '{price} प्रति नग',
    paymentMethod: 'भुगतान का तरीक़ा',
    scanNoSavedMatch: 'सेव की गई सूची में {code} बारकोड वाला कोई सामान नहीं। कुछ नहीं जोड़ा गया।',
    scanNoMatch: 'इस दुकान में {code} बारकोड वाला कोई सामान नहीं। कुछ नहीं जोड़ा गया।',
    scanOutOfStock: '{name} स्टॉक में नहीं है। कुछ नहीं जोड़ा गया।',
    scanLookupFailed: 'वह स्कैन खोजा नहीं जा सका। दोबारा कोशिश कीजिए, या नाम से खोजिए।',
    addedFromCache: 'सेव की गई सूची से जोड़ा गया',
    addedToSale: 'बिक्री में जोड़ा गया',
    expiredSuffix: 'एक्सपायर {rel}',
    expiresSoonSuffix: 'एक्सपायरी {rel}',
    expiresSuffix: 'एक्सपायरी {date}',
    notSavedTitle: 'बिक्री सेव नहीं हुई',
    notSavedBody: 'यह बिक्री इस डिवाइस पर सेव नहीं हो सकी। ग्राहक के जाने से पहले इसे लिख लीजिए।',
    savedLocally: 'इस डिवाइस पर सेव हुई',
    savedLocallyBodyOne: '{n} लाइन आइटम · {total} — ऑनलाइन आते ही सिंक हो जाएगी।',
    savedLocallyBodyMany: '{n} लाइन आइटम · {total} — ऑनलाइन आते ही सिंक हो जाएगी।',
    couldNotLog: 'बिक्री दर्ज नहीं हुई',
    saleLogged: 'बिक्री दर्ज हुई',
    saleLoggedOne: '{n} लाइन आइटम · {total}',
    saleLoggedMany: '{n} लाइन आइटम · {total}',
    milestoneTitle: 'आज {n} बिक्री',
    milestoneBody: 'आज की कमाई {n} लेन-देन में {total} रही।',
  },
  reports: {
    eyebrow: 'रिपोर्टिंग',
    title: 'रिपोर्ट',
    subtitleCompared: '{range}, {prevFrom} से {prevTo} के मुक़ाबले।',
    subtitlePlain: 'आपकी चुनी हुई तारीख़ सीमा में बिक्री का प्रदर्शन।',
    exportPdf: 'PDF एक्सपोर्ट',
    from: 'से',
    to: 'तक',
    preset7: 'पिछले 7 दिन',
    preset30: 'पिछले 30 दिन',
    preset90: 'पिछले 90 दिन',
    allTime: 'पूरा समय',
    rangeLabel: '{from} से {to}',
    kpiRevenue: 'आमदनी',
    kpiTransactions: 'लेन-देन',
    kpiAvgOrder: 'औसत ऑर्डर',
    kpiUnitsSold: 'बिके यूनिट',
    outsideWindow: 'तुलना सीमा के बाहर',
    noPriorData: 'पिछला डेटा नहीं',
    vsPrevious: 'पिछली अवधि के मुक़ाबले',
    emptyTitle: 'इस सीमा में कोई बिक्री नहीं',
    emptyBody: 'तारीख़ सीमा बढ़ाइए, या कोई बिक्री दर्ज कीजिए ताकि वह यहाँ दिखे।',
    logASale: 'बिक्री दर्ज करें',
    viewAllProducts: 'सभी {n} सामान देखें',
    colProduct: 'सामान',
    colUnits: 'यूनिट',
    colRevenue: 'आमदनी',
    colDate: 'तारीख़',
    colCategory: 'श्रेणी',
    colShare: 'हिस्सा %',
    colMethod: 'तरीक़ा',
    colTransactions: 'लेन-देन',
    itemProducts: 'सामान',
    itemDays: 'दिन',
    itemCategories: 'श्रेणियाँ',
    itemMethods: 'तरीक़े',
    revenueByDay: 'रोज़ की आमदनी',
    categoryMix: 'श्रेणीवार हिस्सा',
    paymentMethods: 'भुगतान के तरीक़े',
    chartRevenueOverTime: 'समय के साथ आमदनी',
    rangeDaysOne: 'चुनी गई अवधि में {n} दिन',
    rangeDaysMany: 'चुनी गई अवधि में {n} दिन',
    chartSalesByCategory: 'श्रेणीवार बिक्री',
    chartCategorySub: 'दुकान की श्रेणियों में आमदनी का हिस्सा',
    chartTopProducts: 'सबसे ऊपर के सामान',
    chartTopSub: 'सबसे ज़्यादा आमदनी, {n} में से पहले पाँच',
    tooltipUnits: '{money} · {n} यूनिट',
    tooltipShare: '{money} · {pct}%',
    nothingToExport: 'एक्सपोर्ट करने को कुछ नहीं',
    nothingToExportBody: 'चुनी हुई तारीख़ सीमा में कोई बिक्री नहीं है।',
    exported: 'रिपोर्ट एक्सपोर्ट हुई',
    exportedBody: 'PDF आपके डाउनलोड में सेव हो गई।',
    exportFailed: 'एक्सपोर्ट विफल',
    exportFailedBody: 'PDF नहीं बन सकी। कृपया दोबारा कोशिश कीजिए।',
    uncategorised: 'बिना श्रेणी',
    payCash: 'नक़द',
    payCard: 'कार्ड',
    payNfc: 'NFC',
  },
  customers: {
    eyebrow: 'संबंध',
    title: 'ग्राहक',
    subtitle: 'ग्राहक प्रोफ़ाइल, ख़रीद इतिहास और लॉयल्टी टियर।',
    addCustomer: 'ग्राहक जोड़ें',
    itemLabel: 'ग्राहक',
    searchAria: 'ग्राहक खोजें',
    searchPlaceholder: 'नाम, ईमेल, फ़ोन या टियर से खोजें...',
    filterByActivity: 'गतिविधि से फ़िल्टर करें',
    activityAny: 'कोई भी गतिविधि',
    activityRecent: '30 दिन में आए',
    activityDormant: '30+ दिन से नहीं आए',
    allTiers: 'सभी टियर',
    statTotal: 'कुल ग्राहक',
    statRevenue: 'कुल आमदनी',
    statRepeat: 'दोबारा आने वाले',
    colCustomer: 'ग्राहक',
    colContact: 'संपर्क',
    colTier: 'टियर',
    colVisits: 'आना-जाना',
    colTotalSpent: 'कुल ख़र्च',
    colLastVisit: 'पिछली बार',
    colActions: 'क्रियाएँ',
    csvName: 'नाम',
    csvEmail: 'ईमेल',
    csvPhone: 'फ़ोन',
    emptyTitle: 'अभी कोई ग्राहक नहीं',
    emptyBody: 'ख़रीद इतिहास और लॉयल्टी टियर ट्रैक करना शुरू करने के लिए एक ग्राहक जोड़िए।',
    noMatchTitle: 'इन फ़िल्टर से कोई ग्राहक मेल नहीं खाता',
    noMatchBody: 'कोई दूसरा शब्द या टियर आज़माइए।',
    editRow: '{name} संपादित करें',
    deleteRow: '{name} हटाएँ',
    formEdit: 'ग्राहक संपादित करें',
    formAdd: 'ग्राहक जोड़ें',
    saveChanges: 'बदलाव सेव करें',
    fFullName: 'पूरा नाम',
    fEmail: 'ईमेल',
    fPhone: 'फ़ोन',
    fTier: 'लॉयल्टी टियर',
    fTotalSpent: 'कुल ख़र्च',
    fVisits: 'आना-जाना',
    fNotes: 'नोट्स',
    emailPlaceholder: 'name@example.com',
    phonePlaceholder: '555-0100',
    notesHint: 'एलर्जी, पसंद, या जो भी याद रखने लायक़ हो',
    saveFailed: 'ग्राहक सेव नहीं हो सका।',
    updateFailedToast: 'ग्राहक अपडेट नहीं हुआ',
    addFailedToast: 'ग्राहक जुड़ा नहीं',
    updatedToast: 'ग्राहक अपडेट हुआ',
    addedToast: 'ग्राहक जुड़ गया',
    deleteTitle: 'ग्राहक हटाएँ?',
    deleteBodyA: '',
    deleteBodyB: ' और उनका ख़रीद इतिहास हटाएँ? यह वापस नहीं होगा।',
    deleteConfirm: 'हटाएँ',
    deleteFailed: 'ग्राहक हटाया नहीं जा सका।',
    deleteFailedToast: 'ग्राहक नहीं हटा',
    deletedToast: 'ग्राहक हटा दिया गया',
    setupTitle: 'एक सेटअप चरण बाक़ी है',
    setupBodyA: '',
    setupBodyB: ' टेबल अभी बनी नहीं है। इस प्रोजेक्ट का Supabase SQL एडिटर खोलिए, ',
    setupBodyC: ' की सामग्री पेस्ट करके चलाइए। उसके बाद यह पेज रीलोड कीजिए, ग्राहक प्रबंधन चालू हो जाएगा।',
    setupStep1: 'अपना Supabase प्रोजेक्ट → SQL Editor → New query खोलिए।',
    setupStep2: 'supabase/schema_phase4.sql की पूरी सामग्री पेस्ट कीजिए।',
    setupStep3: 'Run दबाइए, फिर यह पेज रीलोड कीजिए।',
    goToSettings: 'सेटिंग्स पर जाएँ',
    actNoPermission: 'ग्राहक प्रबंधन की आपको अनुमति नहीं है।',
    actFixFields: 'चिह्नित ख़ानों को ठीक कीजिए।',
    actEmailExists: 'उस ईमेल वाला ग्राहक इस दुकान में पहले से मौजूद है।',
    vNameRequired: 'नाम ज़रूरी है।',
    vNameTooLong: 'नाम 120 अक्षरों से ज़्यादा नहीं हो सकता।',
    vEmailInvalid: 'मान्य ईमेल पता दर्ज कीजिए।',
    vTierInvalid: 'मान्य टियर चुनिए।',
    vSpentMin: 'शून्य या उससे ज़्यादा होना चाहिए।',
    vVisitsWhole: 'पूर्ण संख्या, शून्य या उससे ज़्यादा होनी चाहिए।',
    tierLabels: { bronze: 'कांस्य', silver: 'रजत', gold: 'स्वर्ण', platinum: 'प्लैटिनम' },
  },
  suppliers: {
    eyebrow: 'सप्लाई चेन',
    title: 'सप्लायर प्रबंधन',
    subtitle: 'सप्लायर से रिश्ते संभालिए और आने वाला माल ट्रैक कीजिए।',
    addSupplier: 'सप्लायर जोड़ें',
    itemLabel: 'सप्लायर',
    searchAria: 'सप्लायर खोजें',
    searchPlaceholder: 'नाम, संपर्क, श्रेणी या स्थिति खोजें...',
    filterByStatus: 'स्थिति से फ़िल्टर करें',
    statusAny: 'कोई भी स्थिति',
    catAll: 'सभी',
    arrivingToday: 'आज पहुँच रहा है',
    colName: 'सप्लायर का नाम',
    colContact: 'मुख्य संपर्क',
    colCategory: 'श्रेणी',
    colActiveOrders: 'चालू ऑर्डर',
    colStatus: 'स्थिति',
    colActions: 'क्रियाएँ',
    emptyTitle: 'अभी कोई सप्लायर नहीं',
    emptyBody: 'आने वाला माल और डिलीवरी प्रदर्शन ट्रैक करने के लिए एक सप्लायर जोड़िए।',
    noMatchTitle: 'आपके फ़िल्टर से कोई सप्लायर मेल नहीं खाता',
    noMatchBody: 'कोई दूसरा शब्द या श्रेणी आज़माइए।',
    editRow: '{name} संपादित करें',
    deleteRow: '{name} हटाएँ',
    todaysInbound: 'आज आने वाला माल',
    palletsExpected: 'अपेक्षित पैलेट',
    received: 'मिल गए',
    pending: 'बाक़ी',
    incomingShipments: 'आने वाला माल',
    addShipment: 'माल जोड़ें',
    noShipmentsTitle: 'कोई आने वाला माल नहीं',
    noShipmentsBody: 'डॉक से शेल्फ़ तक ट्रैक करने के लिए माल दर्ज कीजिए।',
    trackOrdered: 'ऑर्डर',
    trackShipped: 'भेजा',
    trackTransit: 'रास्ते में',
    trackDock: 'डॉक',
    recentActivity: 'हाल की सप्लायर गतिविधि',
    noActivity: 'हाल में कोई गतिविधि नहीं।',
    formEdit: 'सप्लायर संपादित करें',
    formAdd: 'सप्लायर जोड़ें',
    saveChanges: 'बदलाव सेव करें',
    fName: 'सप्लायर का नाम',
    fContact: 'मुख्य संपर्क',
    contactPlaceholder: 'जैसे रमेश',
    fCategory: 'श्रेणी',
    fStatus: 'स्थिति',
    saveFailed: 'सप्लायर सेव नहीं हो सका।',
    updateFailedToast: 'सप्लायर अपडेट नहीं हुआ',
    addFailedToast: 'सप्लायर जुड़ा नहीं',
    updatedToast: 'सप्लायर अपडेट हुआ',
    addedToast: 'सप्लायर जुड़ गया',
    deleteTitle: 'सप्लायर हटाएँ?',
    deleteBodyA: '',
    deleteBodyB: ' को हटाएँ? उन पर दर्ज आने वाला माल और गतिविधि सूची में उनकी प्रविष्टियाँ भी हट जाएँगी। यह वापस नहीं होगा।',
    deleteConfirm: 'हटाएँ',
    deleteFailed: 'सप्लायर हटाया नहीं जा सका।',
    deleteFailedToast: 'सप्लायर नहीं हटा',
    deletedToast: 'सप्लायर हटा दिया गया',
    poTitle: 'नया परचेज़ ऑर्डर',
    poCreate: 'PO बनाएँ',
    poSaving: 'सेव हो रहा है…',
    fSupplier: 'सप्लायर',
    fPoNumber: 'PO नंबर',
    poPlaceholder: 'PO-2024-0891',
    fPallets: 'पैलेट',
    fEta: 'पहुँचने का अनुमान',
    addSupplierFirst: 'पहले एक सप्लायर जोड़िए।',
    shipmentSaveFailed: 'माल सेव नहीं हो सका।',
    shipmentFailedToast: 'माल दर्ज नहीं हुआ',
    shipmentLogged: 'माल दर्ज हुआ',
    poPrefix: 'PO {n}',
    actNoPermission: 'सप्लायर प्रबंधन की आपको अनुमति नहीं है।',
    actFixFields: 'चिह्नित ख़ानों को ठीक कीजिए।',
    actShipNoPermission: 'माल प्रबंधन की आपको अनुमति नहीं है।',
    actPoRequired: 'PO नंबर ज़रूरी है।',
    actBadStatus: 'माल की मान्य स्थिति चुनिए।',
    actBadEta: 'पहुँचने की तारीख़ के लिए डेट पिकर इस्तेमाल कीजिए।',
    actBadPallets: 'पैलेट पूर्ण संख्या, शून्य या उससे ज़्यादा होने चाहिए।',
    actSupplierNotHere: 'वह सप्लायर इस दुकान में नहीं है।',
    actSupplierGone: 'वह सप्लायर अब इस दुकान में नहीं है।',
    feedNewSupplier: '{name} नए सप्लायर के रूप में जुड़े',
    notifyNewSupplierTitle: 'नया सप्लायर जुड़ा',
    notifyNewSupplierBody: '{name} अब आपकी सप्लायर सूची में हैं।',
    feedShipment: '{supplier} PO {po} बनाया गया',
    notifyShipmentTitle: 'आने वाला माल दर्ज हुआ',
    notifyShipmentBody: '{supplier} PO {po}।',
    notifyShipmentBodyEta: '{supplier} PO {po}, {eta} तक आना है।',
    vNameRequired: 'सप्लायर का नाम ज़रूरी है।',
    vNameTooLong: 'नाम 120 अक्षरों से ज़्यादा नहीं हो सकता।',
    vContactTooLong: 'संपर्क 120 अक्षरों से ज़्यादा नहीं हो सकता।',
    vCategoryInvalid: 'मान्य श्रेणी चुनिए।',
    vStatusInvalid: 'मान्य स्थिति चुनिए।',
    categoryLabels: { produce: 'सब्ज़ी-फल', dairy: 'डेयरी', dry_goods: 'सूखा सामान', beverages: 'पेय', bakery: 'बेकरी' },
    statusLabels: { active: 'सक्रिय', inactive: 'निष्क्रिय', issue: 'समस्या' },
    shipmentLabels: { ordered: 'ऑर्डर हुआ', shipped: 'भेजा गया', transit: 'रास्ते में', dock: 'डॉक पर' },
  },
  staff: {
    eyebrow: 'टीम',
    title: 'स्टाफ़ शेड्यूल',
    subtitle: 'टीम की शिफ़्ट और कवरेज संभालिए।',
    myScheduleBtn: 'मेरा शेड्यूल',
    recordLeave: 'छुट्टी दर्ज करें',
    assignShift: 'शिफ़्ट सौंपें',
    prevWeek: 'पिछला हफ़्ता',
    nextWeek: 'अगला हफ़्ता',
    weekView: 'साप्ताहिक दृश्य',
    rotaAria: 'साप्ताहिक रोस्टर, आड़ा स्क्रॉल होता है',
    dayMon: 'सोम',
    dayTue: 'मंगल',
    dayWed: 'बुध',
    dayThu: 'गुरु',
    dayFri: 'शुक्र',
    daySat: 'शनि',
    daySun: 'रवि',
    editLeaveAria: 'छुट्टी संपादित करें: {label}',
    leaveLabel: '{who} — {kind}',
    leaveLabelNote: '{who} — {kind}: {note}',
    teamMember: 'टीम सदस्य',
    unassigned: 'किसी को नहीं',
    you: 'आप',
    staffFallback: 'स्टाफ़',
    editShiftAria: '{date} की {role} शिफ़्ट संपादित करें',
    deleteShiftAria: '{date} की {role} शिफ़्ट हटाएँ',
    staffAvailability: 'स्टाफ़ उपलब्धता',
    nobodyYet: 'टीम में अभी कोई नहीं।',
    inviteFirst: 'अपने पहले साथी को न्योता दीजिए',
    ownerCanInvite: 'दुकान के मालिक Team टैब से लोगों को न्योता दे सकते हैं।',
    leaveUntil: '{date} तक {kind}',
    onShiftToday: 'आज शिफ़्ट पर हैं',
    notScheduledToday: 'आज शेड्यूल नहीं',
    onLeaveTodayTip: 'आज {kind} पर हैं',
    onShiftCount: '{m} में से {n} आज शिफ़्ट पर',
    onLeaveCount: ' · {n} छुट्टी पर',
    tabsAria: 'स्टाफ़ अनुभाग',
    tabSchedule: 'शेड्यूल',
    tabTeam: 'टीम',
    shiftEdit: 'शिफ़्ट संपादित करें',
    shiftAdd: 'शिफ़्ट सौंपें',
    saveChanges: 'बदलाव सेव करें',
    fTeamMember: 'टीम सदस्य',
    teamMemberHint: 'खुली शिफ़्ट के लिए किसी को न चुनिए',
    optUnassigned: 'किसी को नहीं',
    fRole: 'भूमिका',
    fDate: 'तारीख़',
    fStart: 'शुरू का समय',
    fEnd: 'ख़त्म का समय',
    clashText: '{who} {from} से {to} तक {kind} पर हैं। यह शिफ़्ट सेव नहीं होगी।',
    thatPerson: 'वह व्यक्ति',
    shiftSaveFailed: 'शिफ़्ट सेव नहीं हो सकी।',
    shiftUpdateFailed: 'शिफ़्ट अपडेट नहीं हुई',
    shiftScheduleFailed: 'शिफ़्ट सौंपी नहीं गई',
    shiftUpdated: 'शिफ़्ट अपडेट हुई',
    shiftScheduled: 'शिफ़्ट सौंपी गई',
    deleteShiftTitle: 'शिफ़्ट हटाएँ?',
    deleteShiftA: '',
    deleteShiftB: ' शिफ़्ट ',
    deleteShiftC: ' के लिए ',
    deleteShiftD: ' को हटाएँ? यह वापस नहीं होगा।',
    unassignedSlot: 'बिना सौंपी गई स्लॉट',
    deleteShiftFailed: 'शिफ़्ट हटाई नहीं जा सकी।',
    deleteShiftFailedToast: 'शिफ़्ट नहीं हटी',
    shiftDeleted: 'शिफ़्ट हटा दी गई',
    leaveEdit: 'छुट्टी संपादित करें',
    leaveAdd: 'छुट्टी दर्ज करें',
    leaveSaveBtn: 'बदलाव सेव करें',
    removeLeaveQ: 'यह छुट्टी हटाएँ?',
    yes: 'हाँ',
    no: 'नहीं',
    remove: 'हटाएँ',
    fWho: 'कौन',
    fFirstDay: 'पहला दिन',
    fLastDay: 'आख़िरी दिन',
    fType: 'प्रकार',
    fNote: 'नोट',
    noteOptional: '(वैकल्पिक)',
    notePlaceholder: 'प्रिया के साथ कवरिंग तय है',
    spanDay: '{n} दिन की छुट्टी, दोनों तारीख़ें मिलाकर।',
    spanDays: '{n} दिन की छुट्टी, दोनों तारीख़ें मिलाकर।',
    leaveRemoveFailed: 'छुट्टी नहीं हटी',
    leaveRemoved: 'छुट्टी हटा दी गई',
    leaveSaveFailed: 'छुट्टी सेव नहीं हुई',
    leaveUpdated: 'छुट्टी अपडेट हुई',
    leaveRecorded: 'छुट्टी दर्ज हुई',
    leaveToastOne: '{who}, {from}',
    leaveToastRange: '{who}, {from} से {to}',
    teamTitle: 'आपकी टीम',
    addStaff: 'स्टाफ़ जोड़ें',
    activeOne: '{n} सक्रिय व्यक्ति',
    activeMany: '{n} सक्रिय लोग',
    pendingSuffix: ', {n} स्वीकृति की प्रतीक्षा में',
    colEmployee: 'कर्मचारी',
    colRole: 'भूमिका',
    colJoined: 'जुड़ने की तारीख़',
    colStatus: 'स्थिति',
    colActions: 'क्रियाएँ',
    storeOwnerBadge: 'दुकान के मालिक',
    badgeInvited: 'न्योता भेजा',
    badgeActive: 'सक्रिय',
    badgeDeactivated: 'निष्क्रिय',
    working: 'काम चल रहा है…',
    edit: 'संपादित करें',
    removeAccessQ: 'पहुँच हटाएँ?',
    restoreAccessQ: 'पहुँच वापस दें?',
    deactivate: 'निष्क्रिय करें',
    reactivate: 'फिर सक्रिय करें',
    editAria: '{name} संपादित करें',
    deactivateAria: '{name} को निष्क्रिय करें',
    reactivateAria: '{name} को फिर सक्रिय करें',
    storeOwnerNote: 'दुकान के मालिक',
    thisIsYou: 'यह आप हैं',
    teamEmptyTitle: 'यहाँ अभी कोई नहीं',
    teamEmptyBody: 'अपनी दुकान में काम करने वालों को न्योता दीजिए। पासवर्ड बनाकर साइन इन करने के लिए उन्हें ईमेल मिलेगा।',
    deactivateFailed: 'निष्क्रिय नहीं कर सके',
    reactivateFailed: 'फिर सक्रिय नहीं कर सके',
    accessRemoved: 'पहुँच हटा दी गई',
    accessRestored: 'पहुँच वापस दी गई',
    canNoLongerSignIn: '{name} अब साइन इन नहीं कर सकते।',
    canSignInAgain: '{name} फिर साइन इन कर सकते हैं।',
    revokeQ: 'रद्द करें?',
    resend: 'दोबारा भेजें',
    revoke: 'रद्द करें',
    revokeAria: '{name} का न्योता रद्द करें',
    resendFailed: 'न्योता दोबारा नहीं भेजा जा सका',
    resent: 'न्योता दोबारा भेजा गया',
    revokeFailed: 'न्योता रद्द नहीं हुआ',
    revoked: 'न्योता रद्द कर दिया गया',
    addStaffTitle: 'स्टाफ़ जोड़ें',
    sendInvite: 'न्योता भेजें',
    sendingInvite: 'न्योता भेजा जा रहा है…',
    done: 'हो गया',
    fFullName: 'पूरा नाम',
    fWorkEmail: 'काम का ईमेल',
    fJobTitle: 'पद',
    jobTitlePlaceholder: 'कैशियर, स्टॉक इंचार्ज...',
    roleHintManager: 'दुकान चलाते हैं: स्टॉक, ग्राहक, सप्लायर, शिफ़्ट और कमाई।',
    roleHintStaff: 'दुकान में काम करते हैं: स्टॉक देखना, बिक्री दर्ज करना, अपनी शिफ़्ट देखना।',
    inviteFailed: 'स्टाफ़ को न्योता नहीं भेजा जा सका',
    invitationSent: 'न्योता भेजा गया',
    invitedBodyA: ' को ',
    invitedBodyB: ' के रूप में न्योता भेजा गया। पासवर्ड बनाकर साइन इन करने के लिए उन्हें ईमेल मिलेगा।',
    editStaffTitle: '{name} संपादित करें',
    emailNote: 'साइन-इन पता यहाँ नहीं बदला जा सकता।',
    editSaveFailed: 'बदलाव सेव नहीं हुए',
    memberUpdated: 'टीम सदस्य अपडेट हुआ',
    vRoleRequired: 'भूमिका ज़रूरी है।',
    vRoleTooLong: 'भूमिका 60 अक्षरों से ज़्यादा नहीं हो सकती।',
    vDateRequired: 'तारीख़ चुनिए।',
    vStartRequired: 'शुरू का समय दर्ज कीजिए।',
    vEndRequired: 'ख़त्म का समय दर्ज कीजिए।',
    vEndAfterStart: 'ख़त्म का समय शुरू के समय के बाद होना चाहिए।',
    vLeaveWho: 'यह छुट्टी किसके लिए है, चुनिए।',
    vLeaveStart: 'शुरू की तारीख़ चुनिए।',
    vLeaveEnd: 'ख़त्म की तारीख़ चुनिए।',
    vLeaveEndBefore: 'ख़त्म की तारीख़ शुरू की तारीख़ से पहले नहीं हो सकती।',
    vLeaveTooLong: 'वह {n} दिन है। एक प्रविष्टि में एक साल या उससे कम दर्ज कीजिए।',
    vLeaveKind: 'छुट्टी का प्रकार चुनिए।',
    vLeaveNote: 'नोट 200 अक्षरों से ज़्यादा नहीं हो सकता।',
    actSchedNoPermission: 'शेड्यूल बदलने की आपको अनुमति नहीं है।',
    actFixFields: 'चिह्नित ख़ानों को ठीक कीजिए।',
    actNotOnTeam: 'वह व्यक्ति इस टीम में नहीं है।',
    actOnLeaveField: 'वह व्यक्ति इस तारीख़ को छुट्टी पर है।',
    actOnLeaveMessage: 'उस दिन वे छुट्टी पर हैं। कोई दूसरी तारीख़ चुनिए, या पहले छुट्टी हटाइए।',
    actLeaveNoPermission: 'छुट्टी दर्ज करने की आपको अनुमति नहीं है।',
    actLeaveNotSetUp: 'छुट्टी अभी सेट नहीं है। Supabase SQL एडिटर में supabase/migrations/0011_staff_leave.sql चलाइए।',
    actOwnRole: 'अपनी ख़ुद की भूमिका या पहुँच यहाँ से नहीं बदल सकते।',
    actNotInStore: 'वह टीम सदस्य इस दुकान में नहीं है।',
    actOwnerAccount: 'दुकान के मालिक का खाता यहाँ से नहीं बदला जा सकता।',
    actNameRequired: 'नाम ज़रूरी है।',
    actBadRole: 'इस टीम सदस्य के लिए मान्य भूमिका चुनिए।',
    actNotAuthenticated: 'प्रमाणित नहीं',
    actOwnerOnly: 'केवल दुकान के मालिक ही टीम संभाल सकते हैं।',
    notifyRoleChanged: 'टीम भूमिका बदली',
    notifyRoleBody: '{name} अब {role} हैं।',
    notifyDeactivatedBody: '{name} अब साइन इन नहीं कर सकते। उनका इतिहास सुरक्षित है।',
    notifyReactivated: 'टीम सदस्य फिर सक्रिय',
    notifyDeactivated: 'टीम सदस्य निष्क्रिय',
    leaveKindLabels: { holiday: 'छुट्टी', sick: 'बीमारी', unpaid: 'बिना वेतन', other: 'अवकाश' },
  },
  settings: {
    eyebrow: 'कॉन्फ़िगरेशन',
    title: 'स्टोर सेटिंग्स',
    subtitle: '{store} के लिए कॉन्फ़िगरेशन और संचालन सेटिंग्स।',
    unsaved: 'बिना सेव किए बदलाव',
    discard: 'रद्द करें',
    saving: 'सेव हो रहा है…',
    savedTick: 'सेव हो गया ✓',
    save: 'बदलाव सेव करें',
    saveFailed: 'सेटिंग्स सेव नहीं हुईं',
    savedToast: 'सेटिंग्स सेव हो गईं',
    saveErrorBanner: 'सेटिंग्स सेव नहीं हुईं: {message}',
    needsMigration:
      'एक्सपायरी चेतावनी की सेटिंग इस डेटाबेस में अभी सेट नहीं है। Supabase SQL ' +
      'एडिटर में supabase/migrations/0017_store_expiry_warning_days.sql चलाएँ।',
    details: 'स्टोर की जानकारी',
    storeName: 'स्टोर का नाम',
    address: 'मुख्य पता',
    phone: 'संपर्क फ़ोन',
    appearance: 'दिखावट',
    theme: 'इंटरफ़ेस थीम',
    themeHint: 'लाइट/डार्क मोड बदलें',
    light: 'लाइट',
    dark: 'डार्क',
    controls: 'संचालन नियंत्रण',
    thresholds: 'स्टॉक की सीमाएँ',
    lowStock: 'कम स्टॉक की चेतावनी',
    unitsValue: '{n} यूनिट',
    lowStockAria: 'कम स्टॉक की चेतावनी, यूनिट में',
    expiryWarning: 'एक्सपायरी चेतावनी',
    dayValue: '{n} दिन',
    daysValue: '{n} दिन',
    expiryAria: 'एक्सपायरी चेतावनी, दिनों में',
    oneDay: '1 दिन',
    maxDays: '{n} दिन',
    notifications: 'सूचनाएँ',
    criticalAlerts: 'ज़रूरी स्टॉक अलर्ट',
    criticalAlertsHint: 'सामान 0 पर पहुँचने पर SMS और ईमेल',
    dailyDigest: 'रोज़ाना सारांश',
    dailyDigestHint: 'दिन के अंत की बिक्री का सारांश',
    supplierUpdates: 'सप्लायर अपडेट',
    supplierUpdatesHint: 'डिलीवरी समय में बदलाव',
    team: 'आपकी टीम',
    teamHint: 'न्यौते, भूमिकाएँ और एक्सेस अब स्टाफ़ में हैं, रोस्टर के साथ।',
    manageTeam: 'टीम संभालें',
    categories: 'उत्पाद श्रेणियाँ',
    categoriesHint: 'आपके उत्पाद जिन श्रेणियों में रखे जाते हैं, उन्हें जोड़ें, नाम बदलें और क्रम बदलें।',
    manageCategories: 'श्रेणियाँ संभालें',
    legal: 'कानूनी',
    legalHint: 'इस स्टोर के खाते पर लागू गोपनीयता नीति और शर्तें।',
    privacy: 'गोपनीयता नीति',
    terms: 'सेवा की शर्तें',
    sample: 'नमूना डेटा',
    sampleHint:
      'अपना कैटलॉग इम्पोर्ट करने के लिए नमूना उत्पाद हटाएँ। आपकी श्रेणियाँ, सप्लायर, ' +
      'स्टाफ़ और सेटिंग्स बनी रहेंगी, और जो उत्पाद किसी बिक्री में आ चुका है वह छूटा नहीं जाएगा।',
    sampleButton: 'नमूना डेटा हटाएँ',
    sampleTitle: 'नमूना डेटा हटाएँ?',
    sampleBody1:
      'सभी नमूना उत्पाद और संबंधित नमूना स्टॉक डेटा हटा दिया जाएगा। यह आपको अपने ' +
      'स्टोर के डेटा से शुरू करने में मदद करता है।',
    sampleBody2:
      'श्रेणियाँ, सप्लायर, स्टाफ़ और स्टोर सेटिंग्स पर कोई असर नहीं पड़ता, और जो नमूना ' +
      'उत्पाद किसी बिक्री में आ चुका है वह रखा जाता है ताकि आपका इतिहास पूरा रहे।',
    sampleKept: 'नमूना डेटा रखा गया',
    sampleRemovedOne: '{n} नमूना उत्पाद हटाया गया',
    sampleRemovedMany: '{n} नमूना उत्पाद हटाए गए',
    sampleWithSales: '{n} रखे गए क्योंकि वे पिछली बिक्रियों में आते हैं।',
    sampleNext: 'अब आप इन्वेंटरी से अपनी CSV इम्पोर्ट कर सकते हैं।',
    vNameRequired: 'आपके स्टोर का नाम ज़रूरी है — यह पूरे ऐप में दिखता है।',
    vNameTooLong: 'नाम {n} अक्षरों तक रखें।',
    vAddressTooLong: 'पता {n} अक्षरों तक रखें।',
    vPhoneTooLong: 'यह फ़ोन नंबर बहुत लंबा है।',
    vPhoneShape: 'केवल अंक, स्पेस और + ( ) - इस्तेमाल करें।',
    vExpiryRange: '{min} से {max} दिन के बीच चुनें।',
    sampleDemoStore:
      'डेमो स्टोर उन सभी के लिए साझा है जो StockPulse आज़माते हैं, इसलिए यहाँ से उसका ' +
      'नमूना डेटा नहीं हटाया जा सकता — ऐसा करने पर वह अगले आगंतुक के लिए खाली हो जाएगा। ' +
      'अपना कैटलॉग इम्पोर्ट करने के लिए अपना मुफ़्त स्टोर बनाएँ।',
    sampleNoPermission: 'नमूना डेटा केवल मालिक या मैनेजर हटा सकता है।',
    sampleReadFailed: 'नमूना उत्पाद पढ़े नहीं जा सके।',
    sampleDeleteFailed: 'नमूना उत्पाद हटाए नहीं जा सके।',
    cat: {
      back: 'स्टोर सेटिंग्स',
      eyebrow: 'कॉन्फ़िगरेशन',
      title: 'उत्पाद श्रेणियाँ',
      subtitle:
        'आपके उत्पाद जिन श्रेणियों में रखे जाते हैं, उसी क्रम में जिसमें वे उत्पाद फ़ॉर्म पर दिखती हैं।',
      notReadyTitle: 'पाँच डिफ़ॉल्ट श्रेणियाँ दिखाई जा रही हैं।',
      notReadyBefore: 'आपकी अपनी सूची डेटाबेस में रखी जाती है, और',
      notReadyAfter:
        'अभी इस प्रोजेक्ट पर नहीं चलाया गया है। तब तक जोड़ना, नाम बदलना और क्रम बदलना ' +
        'बंद रहेगा।',
      listHeading: 'आपकी श्रेणियाँ',
      emptyTitle: 'अभी कोई श्रेणी नहीं',
      emptyBody: 'उत्पाद रखना शुरू करने के लिए पहली श्रेणी जोड़ें।',
      nameLabel: 'श्रेणी का नाम',
      saveName: 'नाम सेव करें',
      removePrefix: '',
      removeSuffix: ' हटाएँ?',
      remove: 'हटाएँ',
      noProducts: 'कोई उत्पाद नहीं',
      oneProduct: '{n} उत्पाद',
      manyProducts: '{n} उत्पाद',
      moveUp: '{name} को ऊपर ले जाएँ',
      moveDown: '{name} को नीचे ले जाएँ',
      renameAria: '{name} का नाम बदलें',
      rename: 'नाम बदलें',
      cannotRemoveOne: '{name} हटा नहीं सकते — {n} उत्पाद अभी भी इसे इस्तेमाल करता है',
      cannotRemoveMany: '{name} हटा नहीं सकते — {n} उत्पाद अभी भी इसे इस्तेमाल करते हैं',
      removeAria: '{name} हटाएँ',
      addHeading: 'श्रेणी जोड़ें',
      nameHint: 'उत्पाद फ़ॉर्म और इन्वेंटरी फ़िल्टर पर दिखता है।',
      namePlaceholder: 'फ्रोज़न फ़ूड',
      addButton: 'श्रेणी जोड़ें',
      footnote:
        'श्रेणी का नाम बदलने से केवल लेबल बदलता है। उत्पाद वहीं रहते हैं, और पिछली बिक्रियाँ ' +
        'उसी श्रेणी में रहती हैं जिसमें वे दर्ज हुई थीं।',
      addFailed: 'श्रेणी जोड़ी नहीं जा सकी',
      added: 'श्रेणी जुड़ गई',
      renameFailed: 'श्रेणी का नाम नहीं बदला जा सका',
      renamed: 'श्रेणी का नाम बदला',
      reorderFailed: 'श्रेणियों का क्रम नहीं बदला जा सका',
      notRemoved: 'श्रेणी नहीं हटाई गई',
      removed: 'श्रेणी हटा दी गई',
      vNameRequired: 'श्रेणी को एक नाम दें।',
      vNameTooLong: 'नाम {n} अक्षरों तक रखें।',
      vNameNoAlnum: 'कम से कम एक अक्षर या अंक इस्तेमाल करें।',
      vNameDuplicate: 'इस नाम की श्रेणी पहले से मौजूद है।',
      needsMigration:
        'इस डेटाबेस में श्रेणियाँ अभी सेट नहीं हैं। SQL एडिटर में ' +
        'supabase/migrations/0013_categories.sql चलाएँ।',
      zeroRows:
        'कुछ नहीं बदला — या तो वह श्रेणी पहले ही हट चुकी है, या आपकी भूमिका यह करने ' +
        'की इज़ाज़त नहीं देती। सूची रिफ्रेश हो रही है।',
      noPermission: 'श्रेणियाँ बदलने की इज़ाज़त आपको नहीं है।',
      slugClash: 'यह आपकी मौजूदा श्रेणी से बहुत मिलता-जुलता है।',
      nameTaken: 'इस नाम की श्रेणी पहले से मौजूद है।',
      nameUnusable: 'यह नाम इस्तेमाल नहीं हो सकता।',
      inUseOne:
        '{n} उत्पाद अभी भी इस श्रेणी में है। पहले उसे किसी और श्रेणी में ले जाएँ, ' +
        'फिर यह हटाएँ।',
      inUseMany:
        '{n} उत्पाद अभी भी इस श्रेणी में हैं। पहले उन्हें किसी और श्रेणी में ले जाएँ, ' +
        'फिर यह हटाएँ।',
      lastCategory: 'यह आपकी इकलौती श्रेणी है। इसे हटाने से पहले एक और जोड़ें।',
      movedIn:
        'अभी-अभी कुछ उत्पाद इस श्रेणी में आ गए, इसलिए अब यह हटाई नहीं जा सकती। ' +
        'रिफ्रेश करके देखें।',
    },
  },
  profile: {
    eyebrow: 'खाता',
    storeOwner: 'स्टोर मालिक',
    memberSince: '{year} से सदस्य',
    editProfile: 'प्रोफ़ाइल बदलें',
    logOut: 'लॉग आउट',
    personalInfo: 'व्यक्तिगत जानकारी',
    fullName: 'पूरा नाम',
    email: 'ईमेल पता',
    phone: 'फ़ोन नंबर',
    location: 'जगह',
    notSet: 'सेट नहीं',
    security: 'खाता सुरक्षा',
    password: 'पासवर्ड',
    passwordHint: 'मज़बूत पासवर्ड से अपना खाता सुरक्षित रखें।',
    update: 'बदलें',
    itemsManaged: 'संभाले गए सामान',
    staffMembers: 'स्टाफ़ सदस्य',
    editTitle: 'प्रोफ़ाइल बदलें',
    saving: 'सेव हो रहा है…',
    saveChanges: 'बदलाव सेव करें',
    vNameRequired: 'आपका नाम ज़रूरी है।',
    vNameTooLong: 'नाम {n} अक्षरों तक रखें।',
    updateFailed: 'प्रोफ़ाइल अपडेट नहीं हुई',
    updated: 'प्रोफ़ाइल अपडेट हो गई',
    phonePlaceholder: '+1 (555) 123-4567',
    locationPlaceholder: 'Portland, OR',
    pwTitle: 'पासवर्ड बदलें',
    pwUpdating: 'बदल रहे हैं…',
    pwUpdate: 'पासवर्ड बदलें',
    pwDone: 'आपका पासवर्ड बदल दिया गया है।',
    pwDoneButton: 'हो गया',
    pwNew: 'नया पासवर्ड',
    pwConfirm: 'पासवर्ड दोबारा',
    pwTooShort: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',
    pwMismatch: 'पासवर्ड मेल नहीं खाते।',
    pwFailed: 'पासवर्ड नहीं बदला जा सका',
    pwUpdated: 'पासवर्ड बदल गया',
    avatarLabel: 'प्रोफ़ाइल फ़ोटो',
    avatarReplace: 'बदलें',
    avatarUpload: 'फ़ोटो अपलोड करें',
    avatarRemove: 'हटाएँ',
    avatarHint: 'JPEG, PNG या WebP। 2 MB तक।',
    avatarAdjust: 'अपनी फ़ोटो सेट करें',
    avatarType: 'JPEG, PNG या WebP चित्र चुनें।',
    avatarTooBig: 'यह चित्र {size} MB का है। सीमा 2 MB है।',
    avatarNoBucket:
      'फ़ोटो स्टोरेज अभी सेट नहीं है। पहले 0008 माइग्रेशन लगाएँ, फिर कोशिश करें।',
    avatarFailed: 'अपलोड नहीं हुआ: {message}',
  },
  audit: {
    eyebrow: 'ज़िम्मेदारी',
    title: 'गतिविधि और ऑडिट लॉग',
    subtitle:
      'उत्पाद, ग्राहक, सप्लायर और बिक्री में हुआ हर बदलाव। सिर्फ़ जोड़ा जाता है — ' +
      'आप समेत कोई भी इन प्रविष्टियों को बदल या हटा नहीं सकता।',
    items: 'प्रविष्टियाँ',
    searchAria: 'गतिविधि खोजें',
    searchPlaceholder: 'व्यक्ति, रिकॉर्ड या फ़ील्ड खोजें...',
    filterType: 'रिकॉर्ड के प्रकार से फ़िल्टर',
    allTypes: 'सभी प्रकार',
    filterAction: 'कार्य से फ़िल्टर',
    allActions: 'सभी कार्य',
    filterPerson: 'व्यक्ति से फ़िल्टर',
    anyone: 'कोई भी',
    from: 'से',
    to: 'तक',
    colWhen: 'कब',
    colWho: 'किसने',
    colAction: 'कार्य',
    colType: 'प्रकार',
    colRecord: 'रिकॉर्ड',
    colChanged: 'बदलाव',
    system: 'सिस्टम',
    emptyTitle: 'अभी कोई गतिविधि दर्ज नहीं',
    emptyBody:
      'उत्पाद, ग्राहक, सप्लायर और बिक्री में बदलाव होते ही यहाँ दिखेंगे।',
    noMatchTitle: 'आपके फ़िल्टर से कोई प्रविष्टि मेल नहीं खाती',
    noMatchBody: 'तारीख़ की सीमा बढ़ाएँ या कोई फ़िल्टर हटाएँ।',
    entityProduct: 'उत्पाद',
    entityCustomer: 'ग्राहक',
    entitySupplier: 'सप्लायर',
    entitySale: 'बिक्री',
    actionInsert: 'बनाया',
    actionUpdate: 'बदला',
    actionDelete: 'हटाया',
    summaryCreated: 'रिकॉर्ड बना',
    summaryDeleted: 'रिकॉर्ड हटा',
    summaryNoChanges: 'कोई दिखने वाला बदलाव नहीं',
    yes: 'हाँ',
    no: 'नहीं',
    fields: {
      name: 'नाम',
      brand: 'ब्रांड',
      sku: 'SKU',
      barcode: 'बारकोड',
      category: 'श्रेणी',
      unit_price: 'यूनिट दाम',
      unit: 'यूनिट',
      stock: 'स्टॉक',
      low_stock_threshold: 'कम स्टॉक सीमा',
      expiry_date: 'एक्सपायरी तारीख़',
      image_url: 'फ़ोटो',
      full_name: 'पूरा नाम',
      email: 'ईमेल',
      phone: 'फ़ोन',
      loyalty_tier: 'लॉयल्टी स्तर',
      total_spent: 'कुल ख़र्च',
      visits: 'विज़िट',
      notes: 'नोट',
      last_visit_at: 'आख़िरी विज़िट',
      primary_contact: 'मुख्य संपर्क',
      status: 'स्थिति',
      logo_url: 'लोगो',
      active_orders: 'सक्रिय ऑर्डर',
      sold_by: 'बेचने वाला',
      total: 'कुल',
      payment_method: 'भुगतान का तरीक़ा',
      client_id: 'क्लाइंट ID',
    },
  },
  notif: {
    panelTitle: 'सूचनाएँ',
    markAllRead: 'सभी पढ़ी हुई मानें',
    loading: 'लोड हो रहा है…',
    caughtUp: 'सब कुछ देख लिया।',
    unread: 'अनपढ़ी',
    bellNone: 'सूचनाएँ, कोई अनपढ़ी नहीं',
    bellOne: 'सूचनाएँ, 1 अनपढ़ी',
    bellMany: 'सूचनाएँ, {n} अनपढ़ी',
    kindGeneral: 'अपडेट',
    kindLowStock: 'कम स्टॉक',
    kindStaff: 'स्टाफ़',
    kindSupplier: 'सप्लायर',
    kindSales: 'बिक्री',
  },
  help: {
    eyebrow: 'सहायता केंद्र',
    title: 'हम आपकी क्या मदद करें?',
    subtitle:
      'गाइड खोजें, या नीचे विषय के हिसाब से देखें। हर लेख वही बताता है जो StockPulse ' +
      'आज सचमुच करता है।',
    searchAria: 'सहायता लेख खोजें',
    searchPlaceholder: 'सहायता लेख खोजें…',
    noMatch: '“{q}” से कोई लेख मेल नहीं खाता',
    oneMatch: '“{q}” से मेल खाता {n} लेख',
    manyMatch: '“{q}” से मेल खाते {n} लेख',
    nothingTitle: 'उसके लिए कुछ नहीं मिला',
    nothingBody: 'कोई और शब्द आज़माएँ, या इनमें से कोई एक:',
    // Each must occur in lib/help/articles.hi.ts, for the same reason.
    suggested: ['कम स्टॉक', 'CSV', 'शिफ़्ट', 'पासवर्ड', 'भूमिका'],
    browse: 'विषय देखें',
    allTopics: 'सभी सहायता विषय',
    moreOnThis: 'इसी पर और',
    articleNotFound: 'लेख नहीं मिला',
    formTitle: 'और मदद चाहिए?',
    formIntro:
      'अगर किसी लेख में ज़िक्र नहीं है, तो बताएँ क्या हो रहा है — हम जवाब देंगे।',
    sentTitle: 'अनुरोध भेज दिया',
    sentBefore: 'धन्यवाद — हमें मिल गया। आपका टिकट रेफ़रेंस है ',
    sentAfter:
      '। आगे बात करनी हो तो यही बताएँ। हम आमतौर पर एक कार्यदिवस में जवाब देते हैं।',
    sendAnother: 'एक और अनुरोध भेजें',
    fName: 'आपका नाम',
    fEmail: 'ईमेल',
    fEmailHint: 'जवाब कहाँ भेजें।',
    fCategory: 'यह किस बारे में है?',
    fMessage: 'संदेश',
    fMessageHint: '{max} में से {n} अक्षर',
    fMessagePlaceholder: 'बताएँ आप क्या करना चाह रहे थे, और इसके बजाय क्या हुआ।',
    sending: 'भेज रहे हैं…',
    send: 'अनुरोध भेजें',
    catGettingStarted: 'शुरुआत',
    catInventory: 'इन्वेंटरी और स्टॉक',
    catSales: 'बिक्री',
    catSuppliers: 'सप्लायर',
    catCustomers: 'ग्राहक',
    catStaff: 'स्टाफ़ और शिफ्ट',
    catSettings: 'सेटिंग्स',
    catAi: 'AI असिस्टेंट',
    catRoles: 'भूमिकाएँ और अनुमतियाँ',
    catBilling: 'बिलिंग',
    catBug: 'कुछ काम नहीं कर रहा',
    catOther: 'कुछ और',
    vName: 'बताएँ कौन लिख रहा है — अपना नाम डालें।',
    vNameTooLong: 'नाम {n} अक्षरों तक होना चाहिए।',
    vEmail: 'जवाब देने के लिए ईमेल पता डालें।',
    vEmailTooLong: 'यह ईमेल पता बहुत लंबा है।',
    vEmailInvalid: 'you@yourshop.com जैसा सही ईमेल पता डालें।',
    vCategory: 'एक श्रेणी चुनें।',
    vMessage: 'बताएँ क्या गलत हो रहा है।',
    vMessageShort: 'थोड़ा और बताएँ — कम से कम {n} अक्षर।',
    vMessageLong: 'इसे {n} अक्षरों के भीतर रखें।',
    fixFields: 'चिह्नित फ़ील्ड ठीक करें।',
    detailsRejected:
      'उनमें से कुछ बातें स्वीकार नहीं हुईं। संदेश की लंबाई देखकर फिर कोशिश करें।',
    noStore: 'आपका खाता किसी स्टोर से जुड़ा नहीं है, इसलिए यह दर्ज नहीं हो सका।',
    savedNoRef:
      'आपका अनुरोध सेव हो गया, पर उसका टिकट नंबर वापस नहीं पढ़ा जा सका।',
    sendFailed: 'आपका अनुरोध भेजा नहीं जा सका: {message}',
  },
  support: {
    eyebrow: 'सहायता',
    title: 'सहायता अनुरोध',
    waitingOne: '{n} अनुरोध जवाब के इंतज़ार में है।',
    waitingMany: '{n} अनुरोध जवाब के इंतज़ार में हैं।',
    allDescription: 'सहायता केंद्र से आए सभी अनुरोध, और जो निपट चुके हैं।',
    filterOpen: 'खुले ({n})',
    filterAll: 'सभी ({n})',
    nothingTitle: 'कुछ बाक़ी नहीं',
    nothingBody: 'हर सहायता अनुरोध निपट चुका है।',
    emptyTitle: 'अभी कोई अनुरोध नहीं',
    emptyBody: 'सहायता केंद्र से आए अनुरोध यहाँ दिखेंगे।',
    statusOpen: 'खुला',
    statusResolved: 'निपटाया',
    markResolved: 'निपटाया मानें',
    reopen: 'फिर खोलें',
    updateFailed: 'अनुरोध अपडेट नहीं हुआ',
    markedResolved: 'निपटाया गया',
    reopened: 'फिर खोला गया',
    noPermission: 'अनुरोध केवल मालिक या मैनेजर बदल सकता है।',
  },
  ai: {
    title: 'स्टोर असिस्टेंट',
    online: 'ऑनलाइन',
    history: 'बातचीत का इतिहास',
    unmute: 'बोलकर जवाब देना चालू करें',
    mute: 'बोलकर जवाब देना बंद करें',
    close: 'असिस्टेंट बंद करें',
    opening: 'बातचीत खुल रही है…',
    emptyTitle: 'आज मैं आपकी क्या मदद करूँ?',
    emptyBody:
      'मैं स्टॉक देख सकता हूँ, बिक्री का विश्लेषण कर सकता हूँ, या स्टाफ़ की शिफ्ट संभालने में मदद कर सकता हूँ।',
    sLowStock: 'किन उत्पादों का स्टॉक कम है?',
    sExpiring: 'किन उत्पादों की एक्सपायरी पास है?',
    sToday: 'आज कितनी बिक्री हुई?',
    sWeek: 'इस हफ़्ते की बिक्री का सारांश दें',
    sValue: 'मेरे स्टॉक की कुल कीमत क्या है?',
    clearCurrent: 'यह चैट खाली करें',
    placeholder: 'स्टॉक, बिक्री या स्टाफ़ के बारे में पूछें',
    sendAria: 'संदेश भेजें',
    disclaimer: 'AI से गलतियाँ हो सकती हैं। ज़रूरी जानकारी पहले जाँच लें।',
    clearTitle: 'यह बातचीत खाली करें?',
    clearButton: 'चैट खाली करें',
    clearBodyOne:
      'इस बातचीत का {n} संदेश हट जाएगा। यह वापस नहीं आएगा।',
    clearBodyMany:
      'इस बातचीत के सभी {n} संदेश हट जाएँगे। यह वापस नहीं आएगा।',
    clearBody2:
      'बातचीत खुली रहेगी, आप आगे पूछते रह सकते हैं — बस वह खाली से शुरू होगी। ' +
      'पूरी तरह हटानी हो तो इतिहास सूची में डिलीट बटन इस्तेमाल करें।',
    prefSaveFailed: 'यह पसंद सेव नहीं हुई।',
    threadStartFailed:
      'सेव होने वाली बातचीत शुरू नहीं हो सकी — यह बातचीत रखी नहीं जाएगी।',
    openFailed: 'वह बातचीत नहीं खुल सकी।',
    deleteFailed: 'वह बातचीत हटाई नहीं जा सकी।',
    clearFailed: 'यह बातचीत खाली नहीं हो सकी।',
    streamError: 'माफ़ कीजिए, कुछ गलत हो गया। फिर कोशिश करें।',
    newChat: 'नई चैट',
    loadingThreads: 'बातचीत लोड हो रही है…',
    noThreads:
      'अभी कोई पुरानी बातचीत नहीं। आप जो भी पूछेंगे वह यहाँ सेव रहेगा।',
    bucketToday: 'आज',
    bucketYesterday: 'कल',
    bucketEarlier: 'उससे पहले',
    untitled: 'नई बातचीत',
    deleteQ: 'यह चैट हटाएँ?',
    deleteAria: 'बातचीत हटाएँ: {name}',
    vAudioCapture:
      'कोई माइक्रोफ़ोन नहीं मिला। देखें कि वह जुड़ा है और किसी और ऐप में इस्तेमाल नहीं हो रहा।',
    vNetwork: 'आवाज़ से पूछने के लिए इंटरनेट चाहिए। फिर से जुड़कर कोशिश करें।',
    vNoSpeech: 'सुनाई नहीं दिया — माइक के थोड़ा पास आकर फिर कोशिश करें।',
    vLangUnsupported: 'यह ब्राउज़र यहाँ बोली नहीं पहचान सकता।',
    vServiceNotAllowed: 'इस ब्राउज़र की सेटिंग में स्पीच पहचान बंद है।',
    vBlocked:
      '{host} के लिए माइक्रोफ़ोन ब्लॉक है। अनुमति हर साइट के लिए अलग होती है, इसलिए ' +
      'कहीं और दी गई अनुमति से काम नहीं चलेगा — एड्रेस बार के बाएँ वाले आइकन ' +
      'पर जाकर माइक्रोफ़ोन को Allow करें, फिर पेज रीलोड करें।',
    vStartFailed: 'आवाज़ से पूछना शुरू नहीं हो सका। फिर कोशिश करें।',
    vInsecure:
      'आवाज़ से पूछने के लिए सुरक्षित कनेक्शन चाहिए। {host} सिर्फ़ http है — https इस्तेमाल ' +
      'करें, या ऐप localhost पर खोलें।',
    vUnknown: 'आवाज़ से पूछना रुक गया ({code})। फिर कोशिश करें।',
    vStop: 'रिकॉर्डिंग रोकें',
    vAsk: 'बोलकर पूछें',
    vRecording: 'रिकॉर्ड हो रहा है। अब बोलें।',
    vProcessing: 'ट्रांसक्रिप्शन पूरा हो रहा है।',
    rMalformed: 'अनुरोध का रूप सही नहीं है।',
    rInvalid: 'संदेश अमान्य या बहुत बड़ा है।',
    rRateLimit: 'बहुत सारे अनुरोध। थोड़ी देर बाद फिर कोशिश करें।',
    rNotConfigured:
      'AI असिस्टेंट अभी सेट नहीं है। इसे चालू करने के लिए GEMINI_API_KEY जोड़ें।',
    rTooManyLookups:
      'मैं इसे पूरा नहीं देख पाया — इसके लिए बहुत सारी जाँच चाहिए थी। ' +
      'एक-एक करके पूछें।',
    rNoAnswer: 'माफ़ कीजिए, इसका जवाब नहीं मिला। क्या आप दूसरे शब्दों में पूछेंगे?',
    rError: 'माफ़ कीजिए, एक गड़बड़ हुई: {message}',
    ownerOnly: 'यह जानकारी केवल मालिक और मैनेजर के लिए है।',
    replyLanguage: 'Always reply in Hindi, using Devanagari script.',
  },
  dash: {
    greetMorning: 'सुप्रभात',
    greetAfternoon: 'नमस्कार',
    greetEvening: 'शुभ संध्या',
    allInOrder: 'सब ठीक है।',
    lowOnStockOne: '{n} सामान का स्टॉक कम',
    lowOnStockMany: '{n} सामानों का स्टॉक कम',
    countersBusy: '{total} में से {busy} काउंटर व्यस्त',
    updated: 'अपडेट',
    liveUpdates: 'लाइव अपडेट चालू',
    agoJustNow: 'अभी',
    agoSeconds: '{n} सेकंड पहले',
    agoOneMin: '1 मिनट पहले',
    agoMins: '{n} मिनट पहले',
    todaySalesOwner: 'आज की बिक्री',
    todayTotalStaff: 'आज का कुल',
    vsYesterday: 'कल के मुकाबले',
    salesTodayOne: 'आज {n} बिक्री',
    salesTodayMany: 'आज {n} बिक्रियाँ',
    sparklineAria: 'पिछले {n} दिन की आमदनी',
    transactionsToday: 'आज के लेनदेन',
    logged: 'दर्ज',
    weekRevenue: '7 दिन की आमदनी',
    transactionsOne: '{n} लेनदेन',
    transactionsMany: '{n} लेनदेन',
    viewAll: 'सभी देखें',
    lowStockTile: 'कम स्टॉक वाले सामान',
    expiringTile: 'जल्द एक्सपायर',
    alreadyExpired: '{n} पहले ही एक्सपायर',
    withinOne: '{n} दिन में',
    withinMany: '{n} दिन में',
    quickActions: 'तुरंत काम',
    qaNewOrder: 'नया ऑर्डर',
    qaCheckout: 'चेकआउट स्थिति',
    qaCheckStock: 'स्टॉक देखें',
    qaReports: 'रिपोर्ट',
    trendTitle: 'रोज़ाना बिक्री का रुझान',
    trendSubtitle: 'पिछले 7 दिन की रोज़ाना आमदनी।',
    chartSeries: 'बिक्री',
    noSalesWeekTitle: 'इस हफ़्ते कोई बिक्री नहीं',
    noSalesWeekBody:
      'बिक्री दर्ज करने पर पिछले सात दिन यहाँ रुझान के रूप में दिखेंगे।',
    logSale: 'बिक्री दर्ज करें',
    recentSales: 'हाल की बिक्री',
    latest: 'आखिरी {n}',
    noSalesTitle: 'अभी कोई बिक्री दर्ज नहीं',
    noSalesBody: 'जैसे-जैसे आपकी टीम दर्ज करेगी, बिक्री यहाँ दिखेगी।',
    staffFallback: 'स्टाफ़',
    completed: 'पूरा हुआ',
    viewHistory: 'पूरा इतिहास देखें',
    recentAlerts: 'हाल के अलर्ट',
    alertsNew: '{n} नए',
    noAlertsTitle: 'कोई सक्रिय अलर्ट नहीं',
    noAlertsBody:
      'कम स्टॉक, चेकआउट समस्याएँ और आने वाली डिलीवरी यहाँ दिखेंगी।',
    lowStockTitle: 'कम स्टॉक अलर्ट',
    colItem: 'सामान का नाम',
    colCategory: 'श्रेणी',
    colStockLevel: 'स्टॉक स्तर',
    colAction: 'कार्य',
    colExpires: 'एक्सपायरी',
    allStockedTitle: 'सभी उत्पाद पर्याप्त स्टॉक में हैं',
    allStockedBody:
      'उत्पाद अपनी कम-स्टॉक सीमा तक पहुँचने पर इस सूची में आते हैं।',
    unitsLeft: '{n} बचे',
    restock: 'फिर भरें',
    expiringTitle: 'जल्द एक्सपायर',
    expiryReadError:
      'एक्सपायरी तारीख़ें अभी पढ़ी नहीं जा सकीं, इसलिए यह सूची अधूरी हो सकती है। ' +
      'रीलोड करके देखें।',
    nothingExpiringTitle: 'जल्द कुछ एक्सपायर नहीं हो रहा',
    nothingExpiringOne:
      'उत्पाद अपनी एक्सपायरी से {n} दिन पहले इस सूची में आते हैं।',
    nothingExpiringMany:
      'उत्पाद अपनी एक्सपायरी से {n} दिन पहले इस सूची में आते हैं।',
    expiredWord: 'एक्सपायर हुआ',
    expiresWord: 'एक्सपायरी',
    unitOne: '{n} यूनिट',
    unitMany: '{n} यूनिट',
    writeOff: 'बट्टे खाते डालें',
    discount: 'छूट दें',
    aExpiredTitleOne: 'एक्सपायर: {n} सामान',
    aExpiredTitleMany: 'एक्सपायर: {n} सामान',
    aExpiredBodyOne: '{name} की एक्सपायरी निकल चुकी है।',
    aExpiredBodyTwo: '{name} और {n} और की एक्सपायरी निकल चुकी है।',
    aExpiredBodyMany: '{name} और {n} और की एक्सपायरी निकल चुकी है।',
    aExpiringTitleOne: '{n} दिन में एक्सपायर',
    aExpiringTitleMany: '{n} दिन में एक्सपायर',
    aExpiringBodyOne: '{n} सामान समय रहते बेचें या हटाएँ।',
    aExpiringBodyMany: '{n} सामान समय रहते बेचें या हटाएँ।',
    aLowStockTitle: 'कम स्टॉक: {category}',
    aLowStockBodyOne: '{n} सामान न्यूनतम सीमा से नीचे।',
    aLowStockBodyMany: '{n} सामान न्यूनतम सीमा से नीचे।',
    aStationTitle: 'स्टेशन 0{n} अलर्ट',
    aWeightMismatch: 'बैगिंग एरिया में वज़न मेल नहीं खा रहा।',
    aAgeCheck: 'प्रतिबंधित सामान के लिए उम्र की जाँच ज़रूरी है।',
    aDeliveryTitle: 'डिलीवरी आ गई',
    aDeliveryBody: '{supplier} की डिलीवरी लेने के लिए तैयार है।',
    supplierFallback: 'सप्लायर',
    timeNow: 'अभी',
  },
  palette: {
    ariaLabel: 'कमांड पैलेट',
    searchPlaceholder: 'पेज और क्रियाएँ खोजें...',
    searchAria: 'पेज और क्रियाएँ खोजें',
    results: 'परिणाम',
    noResultsTitle: 'कोई परिणाम नहीं',
    noResultsBody:
      '“{query}” से कुछ नहीं मिला। कोई पेज नाम आज़माइए, या “सामान जोड़ें” जैसी कोई क्रिया।',
    groupNavigation: 'नेविगेशन',
    groupActions: 'क्रियाएँ',
    groupProducts: 'सामान',
    openAssistant: 'AI असिस्टेंट खोलें',
    viewProfile: 'प्रोफ़ाइल देखें',
    signOut: 'साइन आउट',
  },
  tabs: { dashboard: 'डैशबोर्ड', inventory: 'स्टॉक', monitoring: 'निगरानी', settings: 'सेटिंग्स' },
}

export const APP_COPY: Record<Locale, AppCopy> = { en, te, hi }

export function appCopy(locale: Locale): AppCopy {
  return APP_COPY[locale]
}

/* ---------------------------------------------------------------
   EXTENDING THIS TO A SCREEN.

   1. Add the screen's strings as a new top-level key on AppCopy and fill all
      three languages. TypeScript refuses a locale missing any of them, which
      is the whole point of one interface and three objects.
   2. In a Server Component, call getLocale() from ./server and appCopy() here.
      In a Client Component, call useAppCopy() from ./client — the dashboard
      layout already provides it, so nothing has to be threaded through props.
   3. Keep the shop's own data out: product names, categories, store names and
      figures come from the database and must never be translated.
   --------------------------------------------------------------- */
