"use client"

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { getCookie } from "cookies-next"
import { readCookieValue } from "@/lib/authCookies"
import { getOrCreatePosDeviceId } from "@/lib/deviceIdentity"
import { hasPermission } from "@/lib/permissionsGuard"
import { supportsPosTables } from "@/lib/posExperience"
import { extractErrorMessage } from "@/lib/utils"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import type {
  POSConfiguration,
  POSCustomer,
  POSHoldOrder,
  POSOrder,
  POSOrderInventorySummary,
  POSOrderInventorySummaryItem,
  POSOrderItem,
  POSPaymentInput,
  POSSession,
  POSSessionCloseoutSummary,
  POSSessionOpeningDefaults,
  POSTable,
  POSTerminalDeviceBinding,
  POSTerminal,
} from "@/redux/features/pos/posTypes"
import type { Product, ProductVariant } from "@/redux/features/product/productTypes"
import POSCartPanel from "@/components/pos/POSCartPanel"
import POSCashierHeader from "@/components/pos/POSCashierHeader"
import POSCatalogPanel from "@/components/pos/POSCatalogPanel"
import POSCustomerDialog from "@/components/pos/POSCustomerDialog"
import POSHeldOrdersDialog from "@/components/pos/POSHeldOrdersDialog"
import POSInventorySheet from "@/components/pos/POSInventorySheet"
import POSPaymentDialog from "@/components/pos/POSPaymentDialog"
import POSSessionCloseoutSheet from "@/components/pos/POSSessionCloseoutSheet"
import POSSessionDialog from "@/components/pos/POSSessionDialog"
import POSTableDialog from "@/components/pos/POSTableDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "react-toastify"

type PaymentSubmission = {
  payments: POSPaymentInput[]
  emailAddress?: string
  printReceipt: boolean
}

type CashierCatalogVariant = {
  id: string
  display_name?: string
  variant_name?: string
  barcode?: string
  sku?: string
  display_image?: string
  selling_price?: string | number
  stock_quantity?: string | number
  inventory_item_id?: string | null
}

type CashierCatalogProduct = {
  id: string
  name: string
  category?: string
  quick_sale?: boolean
  tax_rate?: string | number
  display_image?: string
  from_price?: string | number
  stock_quantity?: string | number
  total_stock?: string | number
  variant_count?: number
  variants?: CashierCatalogVariant[]
}

type CashierCatalogSnapshot = {
  count: number
  results: CashierCatalogProduct[]
}

type CashierBootstrap = {
  configuration?: POSConfiguration | null
  device_binding?: POSTerminalDeviceBinding | null
  session?: POSSession | null
  sessions?: POSSession[]
  terminals?: POSTerminal[]
  customers?: POSCustomer[]
  tables?: POSTable[]
  held_orders?: POSHoldOrder[]
  catalog?: CashierCatalogSnapshot
  current_order?: POSOrder | null
  inventory_summary?: {
    order_id: string
    items: POSOrderInventorySummaryItem[]
  } | null
  pos_unavailable?: boolean
  catalog_unavailable?: boolean
}

type CashierEnvelope<T = unknown> = {
  type?: string
  payload?: T
  request_id?: string
}

type PermissionNotice = {
  resource: string
  requiredPermission: string
  message: string
}

type BusyAction =
  | "openingSession"
  | "closingSession"
  | "creatingDraft"
  | "addingItem"
  | "removingItem"
  | "applyingDiscount"
  | "addingTip"
  | "holdingOrder"
  | "retrievingHeldOrder"
  | "requestingReservation"
  | "confirmingReservation"
  | "releasingReservation"
  | "confirmingFulfillment"
  | "markingInventoryFailed"
  | "processingPayment"
  | "cancellingOrder"

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const buildLookup = <T extends { id: string; sync_identifier?: string }>(items: T[]) =>
  items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item
    if (item.sync_identifier) {
      acc[item.sync_identifier] = item
    }
    return acc
  }, {})

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const normalizeLocalLoopback = (value: string) => value.replace("://localhost", "://127.0.0.1")

const getPosHttpBaseUrl = () => {
  const rawBase =
    typeof window === "undefined"
      ? (process.env.POS_INTERNAL_URL || process.env.NEXT_PUBLIC_POS_BACKEND_URL || "http://localhost:7004").trim()
      : (process.env.NEXT_PUBLIC_POS_BACKEND_URL || "http://localhost:7004").trim()
  return normalizeLocalLoopback(stripTrailingSlash(rawBase))
}

const getProductHttpBaseUrl = () => {
  const rawBase =
    typeof window === "undefined"
      ? (process.env.PRODUCT_INTERNAL_URL || process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL || "http://localhost:7003").trim()
      : (process.env.NEXT_PUBLIC_PRODUCT_BACKEND_URL || "http://localhost:7003").trim()
  return normalizeLocalLoopback(stripTrailingSlash(rawBase))
}

const isAlreadyPaidError = (error: unknown) =>
  error instanceof Error && error.message.toLowerCase().includes("already fully paid")

const buildPermissionNotice = (
  resource: string,
  requiredPermission: string,
  message?: string,
): PermissionNotice => ({
  resource,
  requiredPermission,
  message: message || `You do not have permission to access ${resource.toLowerCase()}.`,
})

const defaultProduct = (product: CashierCatalogProduct, variants: ProductVariant[]): Product => {
  const representativeVariant = variants[0]
  return {
    id: product.id,
    profile: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: product.name,
    description: "",
    base_price: asNumber(product.from_price),
    barcode: representativeVariant?.variant_barcode || "",
    sku: representativeVariant?.variant_sku || "",
    quick_sale: !!product.quick_sale,
    tax_rate: asNumber(product.tax_rate),
    tax_inclusive: false,
    allow_discount: true,
    max_discount_percent: 0,
    is_template: false,
    is_active: true,
    is_featured: false,
    category: product.category || "",
    track_stock: true,
    allow_backorder: false,
    low_stock_threshold: 0,
    display_image: product.display_image || representativeVariant?.main_image,
    variant_count: product.variant_count ?? variants.length,
    total_stock: asNumber(product.total_stock ?? product.stock_quantity),
    attribute_links: [],
    quick_sale_variants: variants.map((variant) => ({
      id: variant.id,
      display_name: variant.display_name || variant.pos_display_name || variant.product_details?.name || "Variant",
      price: asNumber(variant.selling_price),
      barcode: variant.variant_barcode,
      sku: variant.variant_sku || "",
    })),
  }
}

const defaultVariant = (product: CashierCatalogProduct, variant: CashierCatalogVariant, index: number): ProductVariant => {
  const quantity = asNumber(variant.stock_quantity)
  return {
    id: variant.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: product.id,
    display_name: variant.display_name || variant.variant_name || product.name,
    pos_display_name: variant.display_name || variant.variant_name || product.name,
    product_details: {
      id: product.id,
      name: product.name,
      category: product.category || "",
      base_price: asNumber(product.from_price),
      tax_rate: asNumber(product.tax_rate),
      allow_discount: true,
      max_discount_percent: 0,
    },
    variant_barcode: variant.barcode || "",
    variant_sku: variant.sku || "",
    active: true,
    is_featured: false,
    pos_visible: true,
    variant_number: index + 1,
    attachments: [],
    main_image: variant.display_image || product.display_image || undefined,
    stock_details: {
      quantity,
      reserved: 0,
      available: quantity,
      low_stock: quantity <= 0,
    },
    attribute_details: [],
    selling_price: asNumber(variant.selling_price),
  }
}

const normalizeCatalog = (snapshot?: CashierCatalogSnapshot | null) => {
  const products: Product[] = []
  const variants: ProductVariant[] = []

  for (const product of snapshot?.results || []) {
    const normalizedVariants = (product.variants || []).map((variant, index) =>
      defaultVariant(product, variant, index),
    )
    products.push(defaultProduct(product, normalizedVariants))
    variants.push(...normalizedVariants)
  }

  return { products, variants }
}

const buildCatalogSnapshotFromDjango = (
  productsPayload: unknown,
  variantsPayload: unknown,
): CashierCatalogSnapshot => {
  const products = Array.isArray(productsPayload)
    ? productsPayload
    : ((productsPayload as { results?: unknown[]; count?: number } | undefined)?.results || [])
  const variants = Array.isArray(variantsPayload)
    ? variantsPayload
    : ((variantsPayload as { results?: unknown[] } | undefined)?.results || [])

  const variantsByProduct = (variants as Record<string, unknown>[]).reduce<Record<string, CashierCatalogVariant[]>>(
    (acc, rawVariant) => {
      const productId = String(rawVariant.product || "")
      if (!productId) {
        return acc
      }
      const stockInfo = rawVariant.stock_info as Record<string, unknown> | undefined
      const normalized: CashierCatalogVariant = {
        id: String(rawVariant.id),
        display_name: String(rawVariant.pos_display_name || rawVariant.display_name || ""),
        variant_name: String(rawVariant.pos_display_name || rawVariant.display_name || ""),
        barcode: String(rawVariant.effective_barcode || rawVariant.variant_barcode || ""),
        sku: String(rawVariant.variant_sku || ""),
        display_image: typeof rawVariant.main_image === "string" ? rawVariant.main_image : undefined,
        selling_price:
          (rawVariant.pos_price as string | number | undefined) ??
          (rawVariant.selling_price as string | number | undefined),
        stock_quantity: stockInfo?.available as string | number | undefined,
        inventory_item_id: (stockInfo?.inventory_item_id as string | undefined) || null,
      }
      acc[productId] = [...(acc[productId] || []), normalized]
      return acc
    },
    {},
  )

  return {
    count:
      ((productsPayload as { count?: number } | undefined)?.count as number | undefined) ??
      (products as unknown[]).length,
    results: (products as Record<string, unknown>[]).map((rawProduct) => ({
      id: String(rawProduct.id),
      name: String(rawProduct.name || ""),
      category:
        typeof rawProduct.pos_category === "string"
          ? rawProduct.pos_category
          : typeof rawProduct.category === "string"
            ? rawProduct.category
            : String((rawProduct.category_info as Record<string, unknown> | undefined)?.name || ""),
      quick_sale: Boolean(rawProduct.quick_sale),
      tax_rate: rawProduct.tax_rate as string | number | undefined,
      display_image:
        typeof rawProduct.main_image === "string"
          ? rawProduct.main_image
          : typeof rawProduct.display_image === "string"
            ? rawProduct.display_image
            : undefined,
      from_price:
        (rawProduct.pos_price as string | number | undefined) ??
        ((rawProduct.price_range as Record<string, unknown> | undefined)?.min as string | number | undefined) ??
        (rawProduct.base_price as string | number | undefined),
      stock_quantity:
        (rawProduct.stock_quantity as string | number | undefined) ??
        (rawProduct.total_stock as string | number | undefined),
      total_stock:
        (rawProduct.stock_quantity as string | number | undefined) ??
        (rawProduct.total_stock as string | number | undefined),
      variant_count:
        Number(rawProduct.variant_count || (variantsByProduct[String(rawProduct.id)] || []).length || 0),
      variants:
        (rawProduct.quick_sale_variants as CashierCatalogVariant[] | undefined) && Array.isArray(rawProduct.quick_sale_variants)
          ? [
              ...(variantsByProduct[String(rawProduct.id)] || []),
              ...((rawProduct.quick_sale_variants as Record<string, unknown>[]).filter(
                (quickVariant) =>
                  !(variantsByProduct[String(rawProduct.id)] || []).some(
                    (existingVariant) => existingVariant.id === String(quickVariant.id),
                  ),
              ).map((quickVariant) => ({
                id: String(quickVariant.id),
                display_name: String(quickVariant.display_name || ""),
                variant_name: String(quickVariant.display_name || ""),
                barcode: String(quickVariant.barcode || ""),
                sku: String(quickVariant.sku || ""),
                display_image: typeof quickVariant.display_image === "string" ? quickVariant.display_image : undefined,
                selling_price: quickVariant.price as string | number | undefined,
                stock_quantity:
                  ((quickVariant.stock_details as Record<string, unknown> | undefined)?.available as string | number | undefined) ??
                  ((quickVariant.stock_details as Record<string, unknown> | undefined)?.quantity as string | number | undefined),
                inventory_item_id:
                  ((quickVariant.stock_details as Record<string, unknown> | undefined)?.inventory_item_id as string | undefined) || null,
              }))),
            ]
          : variantsByProduct[String(rawProduct.id)] || [],
    })),
  }
}

const mergeSessionIntoList = (sessions: POSSession[], nextSession: POSSession) => {
  const withoutCurrent = sessions.filter((session) => session.id !== nextSession.id)
  return [nextSession, ...withoutCurrent].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )
}

const normalizeSession = (
  session?: POSSession | (POSSession & { terminal_id?: string | null }) | null,
): POSSession | undefined => {
  if (!session) {
    return undefined
  }

  const terminalId = "terminal_id" in session ? session.terminal_id : undefined

  return {
    ...session,
    terminal: session.terminal || terminalId || "",
  }
}

const resolveSessionForeignKey = (session?: POSSession | null) => session?.sync_identifier || session?.id || ""

export default function POSExecutionWorkspace() {
  const [terminalId, setTerminalId] = useState("")
  const [openingBalance, setOpeningBalance] = useState("0")
  const [openingVarianceReason, setOpeningVarianceReason] = useState("")
  const [closingBalance, setClosingBalance] = useState("0")
  const [customerId, setCustomerId] = useState("")
  const [tableId, setTableId] = useState("")
  const [catalogQuery, setCatalogQuery] = useState("")
  const [variantQuantities, setVariantQuantities] = useState<Record<string, string>>({})
  const [pendingAddVariantIds, setPendingAddVariantIds] = useState<Record<string, boolean>>({})
  const [removingItemIds, setRemovingItemIds] = useState<Record<string, boolean>>({})
  const [restoringHoldOrderIds, setRestoringHoldOrderIds] = useState<Record<string, boolean>>({})
  const [pendingInventoryActionKeys, setPendingInventoryActionKeys] = useState<Record<string, boolean>>({})
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({})
  const [discountPercent, setDiscountPercent] = useState("")
  const [discountAmount, setDiscountAmount] = useState("")
  const [tipAmount, setTipAmount] = useState("")
  const [tipPercent, setTipPercent] = useState("")
  const [holdReason, setHoldReason] = useState("")
  const [failureReason, setFailureReason] = useState("Inventory verification failed")
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [closeoutSheetOpen, setCloseoutSheetOpen] = useState(false)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [heldOrdersDialogOpen, setHeldOrdersDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [inventorySheetOpen, setInventorySheetOpen] = useState(false)
  const [pendingZeroQuantityItem, setPendingZeroQuantityItem] = useState<POSOrderItem | null>(null)
  const [syncingItemIds, setSyncingItemIds] = useState<Record<string, boolean>>({})
  const [socketReady, setSocketReady] = useState(false)
  const [bootstrapLoading, setBootstrapLoading] = useState(true)
  const [bootstrapUnavailable, setBootstrapUnavailable] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogUnavailable, setCatalogUnavailable] = useState(false)
  const [currentConfiguration, setCurrentConfiguration] = useState<POSConfiguration>()
  const [openingDefaults, setOpeningDefaults] = useState<POSSessionOpeningDefaults>()
  const [terminals, setTerminals] = useState<POSTerminal[]>([])
  const [customers, setCustomers] = useState<POSCustomer[]>([])
  const [tables, setTables] = useState<POSTable[]>([])
  const [deviceBinding, setDeviceBinding] = useState<POSTerminalDeviceBinding>()
  const [currentSession, setCurrentSession] = useState<POSSession>()
  const [sessions, setSessions] = useState<POSSession[]>([])
  const [currentOrder, setCurrentOrder] = useState<POSOrder>()
  const [heldOrders, setHeldOrders] = useState<POSHoldOrder[]>([])
  const [inventorySummary, setInventorySummary] = useState<
    | {
        order_id: string
        items: POSOrderInventorySummaryItem[]
      }
    | undefined
  >()
  const [closeoutSummary, setCloseoutSummary] = useState<POSSessionCloseoutSummary>()
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogVariants, setCatalogVariants] = useState<ProductVariant[]>([])
  const [busyActions, setBusyActions] = useState<Record<string, boolean>>({})
  const quantitySyncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const quantitySyncInFlightRef = useRef<Record<string, boolean>>({})
  const quantityPendingValuesRef = useRef<Record<string, string>>({})
  const currentOrderRef = useRef<POSOrder | undefined>(undefined)
  const sessionOpenInFlightRef = useRef(false)

  const deferredCatalogQuery = useDeferredValue(catalogQuery.trim())
  const { profile } = useCompanyProfile()
  const tablesEnabled = supportsPosTables(profile?.industry)
  const canReadPos = hasPermission("read_pos")
  const canOperatePos = hasPermission("operate_pos")
  const currencyCode = readCookieValue("currency", getCookie) || "NGN"
  const sessionReadNotice = !canReadPos
    ? buildPermissionNotice("POS session data", "read_pos", "You do not have permission to load POS session data.")
    : undefined
  const sessionOperateNotice = !canOperatePos
    ? buildPermissionNotice(
        "POS session actions",
        "operate_pos",
        "You do not have permission to open or close POS sessions.",
      )
    : undefined
  const cartOperateNotice = !canOperatePos
    ? buildPermissionNotice(
        "POS cart actions",
        "operate_pos",
        "You do not have permission to create drafts, edit the cart, or check out.",
      )
    : undefined
  const customerNotice = !canReadPos
    ? buildPermissionNotice("POS customers", "read_pos", "You do not have permission to load POS customers.")
    : undefined
  const tableNotice = tablesEnabled && !canReadPos
    ? buildPermissionNotice("POS tables", "read_pos", "You do not have permission to load POS tables.")
    : undefined
  const heldOrdersNotice = !canReadPos
    ? buildPermissionNotice("held carts", "read_pos", "You do not have permission to load held carts.")
    : undefined
  const catalogActionNotice = !canOperatePos
    ? buildPermissionNotice(
        "POS selling actions",
        "operate_pos",
        "You can browse products, but you do not have permission to add items to the cart.",
      )
    : undefined
  const terminalMap = useMemo(() => buildLookup<POSTerminal>(terminals), [terminals])
  const customerMap = useMemo(() => buildLookup<POSCustomer>(customers), [customers])
  const tableMap = useMemo(() => buildLookup<POSTable>(tables), [tables])
  const boundTerminalId = deviceBinding?.terminal || ""
  const boundTerminal = boundTerminalId ? terminalMap[boundTerminalId] : undefined
  const availableTerminals = useMemo(() => {
    const occupiedTerminalIds = new Set(
      sessions
        .filter((session) => session.status === "open")
        .map((session) => session.terminal)
        .filter(Boolean),
    )

    return terminals.filter((terminal) => {
      const terminalKeys = [terminal.sync_identifier, terminal.id].filter((key): key is string => Boolean(key))
      const isAvailable = terminalKeys.every((key) => !occupiedTerminalIds.has(key))
      if (!isAvailable) {
        return false
      }
      if (!boundTerminalId) {
        return true
      }
      return terminalKeys.includes(boundTerminalId)
    })
  }, [boundTerminalId, sessions, terminals])
  const deviceBindingNotice =
    !bootstrapLoading && canReadPos && !deviceBinding
      ? {
          title: "Terminal setup required",
          message:
            "This browser is not assigned to any POS terminal yet. An administrator must bind this device to a terminal before cashiers can sell from it.",
        }
      : undefined
  const inactiveBindingNotice =
    !bootstrapLoading && canReadPos && deviceBinding && boundTerminal && !boundTerminal.is_active
      ? {
          title: "Assigned terminal is inactive",
          message: `${boundTerminal.name} is bound to this browser, but it is inactive. Ask an administrator to reactivate or reassign it before opening a session.`,
        }
      : undefined
  const resolveTerminalForeignKey = useCallback(
    (terminalRef?: string | null) => {
      if (!terminalRef) {
        return ""
      }
      return terminalMap[terminalRef]?.sync_identifier || terminalMap[terminalRef]?.id || terminalRef
    },
    [terminalMap],
  )

  useEffect(() => {
    currentOrderRef.current = currentOrder
  }, [currentOrder])

  const updateBusy = (key: BusyAction, value: boolean) => {
    setBusyActions((current) => {
      const next = { ...current }
      if (value) {
        next[key] = true
      } else {
        delete next[key]
      }
      return next
    })
  }

  const runBusy = async <T,>(key: BusyAction, action: () => Promise<T>) => {
    updateBusy(key, true)
    try {
      return await action()
    } finally {
      updateBusy(key, false)
    }
  }

  const updatePendingKey = (
    setter: (updater: (current: Record<string, boolean>) => Record<string, boolean>) => void,
    key: string,
    value: boolean,
  ) => {
    setter((current) => {
      const next = { ...current }
      if (value) {
        next[key] = true
      } else {
        delete next[key]
      }
      return next
    })
  }

  const applyBootstrap = useCallback((bootstrap: CashierBootstrap) => {
    const nextSession = normalizeSession(bootstrap.session)
    const nextSessions = (bootstrap.sessions || [])
      .map((session) => normalizeSession(session))
      .filter((session): session is POSSession => Boolean(session))
    const nextDeviceBinding = bootstrap.device_binding !== undefined ? bootstrap.device_binding || undefined : deviceBinding
    const nextTerminals = bootstrap.terminals !== undefined ? bootstrap.terminals : terminals
    const occupiedTerminalIds = new Set(
      nextSessions
        .filter((session) => session.status === "open")
        .map((session) => session.terminal)
        .filter(Boolean),
    )
    const nextBoundTerminalId = nextDeviceBinding?.terminal || ""
    const nextAvailableTerminals = nextTerminals.filter((terminal) => {
      const terminalKeys = [terminal.sync_identifier, terminal.id].filter((key): key is string => Boolean(key))
      const isAvailable = terminalKeys.every((key) => !occupiedTerminalIds.has(key))
      if (!isAvailable) {
        return false
      }
      if (!nextBoundTerminalId) {
        return true
      }
      return terminalKeys.includes(nextBoundTerminalId)
    })

    setCurrentConfiguration((current) =>
      bootstrap.configuration !== undefined ? bootstrap.configuration || undefined : current,
    )
    setDeviceBinding((current) => (bootstrap.device_binding !== undefined ? bootstrap.device_binding || undefined : current))
    setTerminals((current) => (bootstrap.terminals !== undefined ? bootstrap.terminals : current))
    setCustomers((current) => (bootstrap.customers !== undefined ? bootstrap.customers : current))
    setTables((current) => (bootstrap.tables !== undefined ? bootstrap.tables : current))
    setCurrentSession((current) => (bootstrap.session !== undefined ? nextSession : current))
    setSessions((current) => (bootstrap.sessions !== undefined ? nextSessions : current))
    setHeldOrders((current) => (bootstrap.held_orders !== undefined ? bootstrap.held_orders : current))
    setCurrentOrder((current) =>
      bootstrap.current_order !== undefined ? bootstrap.current_order || undefined : current,
    )
    setInventorySummary((current) =>
      bootstrap.inventory_summary !== undefined ? bootstrap.inventory_summary || undefined : current,
    )
    setCloseoutSummary((current) => {
      if (!nextSession?.id) {
        return undefined
      }
      if (current?.session_id === nextSession.id) {
        return current
      }
      return undefined
    })

    if (bootstrap.catalog !== undefined) {
      const normalizedCatalog = normalizeCatalog(bootstrap.catalog)
      setCatalogProducts(normalizedCatalog.products)
      setCatalogVariants(normalizedCatalog.variants)
    }

    setTerminalId((current) => {
      if (nextSession?.terminal) {
        return nextSession.terminal
      }
      if (nextBoundTerminalId) {
        return nextBoundTerminalId
      }
      const currentStillAvailable = current
        ? nextAvailableTerminals.some((terminal) => terminal.sync_identifier === current || terminal.id === current)
        : false
      if (currentStillAvailable) {
        return current
      }
      const firstTerminal = nextAvailableTerminals[0]
      return firstTerminal?.sync_identifier || firstTerminal?.id || ""
    })
  }, [deviceBinding, terminals])

  const fetchJson = useCallback(
    async <T,>(
      baseUrl: string,
      path: string,
      init?: {
        method?: "GET" | "POST" | "PATCH"
        body?: Record<string, unknown>
        params?: Record<string, string | number | boolean | undefined | null>
      },
    ): Promise<T> => {
      const accessToken = readCookieValue("accessToken", getCookie)
      if (!accessToken) {
        throw new Error("You are no longer authenticated.")
      }

      const query = new URLSearchParams()
      Object.entries(init?.params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.set(key, String(value))
        }
      })
      const suffix = query.size ? `${path.includes("?") ? "&" : "?"}${query.toString()}` : ""

      const response = await fetch(`${baseUrl}${path}${suffix}`, {
        method: init?.method || "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(getOrCreatePosDeviceId() ? { "X-Device-ID": getOrCreatePosDeviceId() as string } : {}),
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
        },
        ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          typeof payload?.detail === "string" && payload.detail ? payload.detail : "POS verification request failed.",
        )
      }
      return payload as T
    },
    [],
  )

  const fetchPosJson = useCallback(
    async <T,>(
      path: string,
      init?: {
        method?: "GET" | "POST" | "PATCH"
        body?: Record<string, unknown>
        params?: Record<string, string | number | boolean | undefined | null>
      },
    ): Promise<T> => fetchJson<T>(getPosHttpBaseUrl(), path, init),
    [fetchJson],
  )

  const fetchProductJson = useCallback(
    async <T,>(
      path: string,
      init?: {
        method?: "GET" | "POST" | "PATCH"
        body?: Record<string, unknown>
        params?: Record<string, string | number | boolean | undefined | null>
      },
    ): Promise<T> => fetchJson<T>(getProductHttpBaseUrl(), path, init),
    [fetchJson],
  )

  const fetchOptionalPosJson = useCallback(
    async <T,>(
      path: string,
      init?: {
        method?: "GET" | "POST" | "PATCH"
        body?: Record<string, unknown>
        params?: Record<string, string | number | boolean | undefined | null>
      },
    ): Promise<T | undefined> => {
      try {
        return await fetchPosJson<T>(path, init)
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ""
        if (message.includes("not found") || message.includes("404")) {
          return undefined
        }
        throw error
      }
    },
    [fetchPosJson],
  )

  const sendHttpCommandFallback = useCallback(
    async (type: string, payload: Record<string, unknown>): Promise<CashierEnvelope> => {
      switch (type) {
        case "bootstrap": {
          const settle = async <T,>(task: Promise<T>) => {
            try {
              return { ok: true as const, value: await task }
            } catch (error) {
              return { ok: false as const, error }
            }
          }

          const [
            configurationResult,
            deviceBindingResult,
            currentSessionResult,
            sessionsResult,
            terminalsResult,
            customersResult,
            tablesResult,
            heldOrdersResult,
            productsResult,
            variantsResult,
          ] = await Promise.all([
            settle(fetchPosJson<POSConfiguration>("/pos_api/configurations/current/")),
            settle(fetchOptionalPosJson<POSTerminalDeviceBinding>("/pos_api/terminals/device_binding/")),
            settle(fetchOptionalPosJson<POSSession>("/pos_api/sessions/current/")),
            settle(fetchPosJson<POSSession[]>("/pos_api/sessions/")),
            settle(fetchPosJson<POSTerminal[]>("/pos_api/terminals/")),
            settle(fetchPosJson<POSCustomer[]>("/pos_api/customers/")),
            settle(tablesEnabled ? fetchPosJson<POSTable[]>("/pos_api/tables/") : Promise.resolve([])),
            settle(fetchPosJson<POSHoldOrder[]>("/pos_api/orders/held_orders/")),
            settle(
              fetchProductJson<Record<string, unknown>[]>("/product_api/pos/products/", {
                params: { page_size: 200 },
              }),
            ),
            settle(fetchProductJson<Record<string, unknown>[]>("/product_api/pos/variants/")),
          ])

          const sessionsData = sessionsResult.ok ? sessionsResult.value : []
          const fallbackOpenSession =
            sessionsData.find((session) => session.status === "open") ||
            [...sessionsData].sort(
              (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
            )[0]
          const session = currentSessionResult.ok ? currentSessionResult.value || fallbackOpenSession || null : fallbackOpenSession || null

          const activeSessionId = resolveSessionForeignKey(session)

          const currentOrderResult = activeSessionId
            ? await settle(
                (async () =>
                  (await fetchOptionalPosJson<POSOrder>("/pos_api/orders/current_active/", {
                    params: { session_id: activeSessionId },
                  })) ||
                  (await fetchOptionalPosJson<POSOrder>("/pos_api/orders/current_draft/", {
                    params: { session_id: activeSessionId },
                  })) ||
                  null)(),
              )
            : null

          const currentOrder =
            currentOrderResult && currentOrderResult.ok ? currentOrderResult.value || null : undefined

          const inventorySummaryResult =
            currentOrder?.id
              ? await settle(
                  fetchOptionalPosJson<{ order_id: string; items: POSOrderInventorySummaryItem[] }>(
                    `/pos_api/orders/${currentOrder.id}/inventory_summary/`,
                  ),
                )
              : null

          const inventorySummary =
            inventorySummaryResult && inventorySummaryResult.ok
              ? inventorySummaryResult.value || null
              : undefined

          const posUnavailable =
            !configurationResult.ok &&
            !currentSessionResult.ok &&
            !sessionsResult.ok &&
            !terminalsResult.ok &&
            !customersResult.ok &&
            (!tablesEnabled ? false : !tablesResult.ok) &&
            !heldOrdersResult.ok

          const catalogUnavailable = !productsResult.ok

          return {
            type: "bootstrap.ready",
            payload: {
              configuration: configurationResult.ok ? configurationResult.value : undefined,
              device_binding: deviceBindingResult.ok ? deviceBindingResult.value || undefined : undefined,
              session,
              sessions: sessionsResult.ok ? sessionsData : undefined,
              terminals: terminalsResult.ok ? terminalsResult.value : undefined,
              customers: customersResult.ok ? customersResult.value : undefined,
              tables: tablesEnabled ? (tablesResult.ok ? tablesResult.value : undefined) : [],
              held_orders: heldOrdersResult.ok ? heldOrdersResult.value : undefined,
              catalog: productsResult.ok
                ? buildCatalogSnapshotFromDjango(
                    productsResult.value,
                    variantsResult.ok ? variantsResult.value : [],
                  )
                : undefined,
              current_order: currentOrder,
              inventory_summary: inventorySummary,
              pos_unavailable: posUnavailable,
              catalog_unavailable: catalogUnavailable,
            } satisfies CashierBootstrap,
          }
        }
        case "session.opening_defaults": {
          const terminalRecordId = resolveTerminalForeignKey(
            typeof payload.terminal === "string" ? payload.terminal : String(payload.terminal || ""),
          )
          const terminalQuery = terminalRecordId ? `?terminal=${encodeURIComponent(terminalRecordId)}` : ""
          return { type: "session.opening_defaults", payload: await fetchPosJson(`/pos_api/sessions/opening_defaults/${terminalQuery}`) }
        }
        case "session.closeout_summary": {
          if (!payload.session_id) {
            throw new Error("Session ID is required")
          }
          const query = new URLSearchParams()
          if (payload.closing_balance) {
            query.set("closing_balance", String(payload.closing_balance))
          }
          const suffix = query.size ? `?${query.toString()}` : ""
          return {
            type: "closeout.updated",
            payload: await fetchPosJson(`/pos_api/sessions/${payload.session_id}/closeout_summary/${suffix}`),
          }
        }
        case "session.open":
          return {
            type: "session.updated",
            payload: await fetchPosJson("/pos_api/sessions/open_session/", {
              method: "POST",
              body: {
                terminal: payload.terminal,
                opening_balance: payload.opening_balance,
                opening_variance_reason: payload.opening_variance_reason,
              },
            }),
          }
        case "session.close":
          if (!payload.session_id) {
            throw new Error("Session ID is required")
          }
          return {
            type: "session.updated",
            payload: await fetchPosJson(`/pos_api/sessions/${payload.session_id}/close_session/`, {
              method: "POST",
              body: {
                closing_balance: payload.closing_balance,
                force: payload.force,
              },
            }),
          }
        case "order.ensure_draft":
          return {
            type: "order.updated",
            payload: await fetchPosJson("/pos_api/orders/create_or_get_draft/", {
              method: "POST",
              body: {
                session_id: payload.session_id,
                customer_id: payload.customer_id,
                table_id: payload.table_id,
              },
            }),
          }
        case "order.patch":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/`, {
              method: "PATCH",
              body: (payload.data as Record<string, unknown>) || {},
            }),
          }
        case "order.item.add": {
          await fetchPosJson(`/pos_api/orders/${payload.order_id}/add_item/`, {
            method: "POST",
            body: {
              variant_id: payload.variant_id,
              quantity: payload.quantity,
              customizations: payload.customizations,
              special_instructions: payload.special_instructions,
            },
          })
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/`),
          }
        }
        case "order.item.update": {
          await fetchPosJson(`/pos_api/orders/${payload.order_id}/update_item/`, {
            method: "POST",
            body: {
              item_id: payload.item_id,
              quantity: payload.quantity,
            },
          })
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/`),
          }
        }
        case "order.item.remove": {
          await fetchPosJson(`/pos_api/orders/${payload.order_id}/remove_item/`, {
            method: "POST",
            body: {
              item_id: payload.item_id,
            },
          })
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/`),
          }
        }
        case "order.discount.apply":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/apply_discount/`, {
              method: "POST",
              body: {
                discount_percent: payload.discount_percent,
                discount_amount: payload.discount_amount,
              },
            }),
          }
        case "order.tip.apply":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/add_tip/`, {
              method: "POST",
              body: {
                tip_percent: payload.tip_percent,
                tip_amount: payload.tip_amount,
              },
            }),
          }
        case "order.inventory_summary":
          return {
            type: "inventory.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/inventory_summary/`),
          }
        case "order.inventory.request":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/request_reservation/`, {
              method: "POST",
              body: {
                items: payload.items,
                notes: payload.notes,
              },
            }),
          }
        case "order.inventory.confirm":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/confirm_reservation/`, {
              method: "POST",
              body: {
                items: payload.items,
                notes: payload.notes,
              },
            }),
          }
        case "order.inventory.release":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/release_reservation/`, {
              method: "POST",
              body: {
                items: payload.items,
                notes: payload.notes,
              },
            }),
          }
        case "order.inventory.fulfill":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/confirm_fulfillment/`, {
              method: "POST",
              body: {
                items: payload.items,
                notes: payload.notes,
              },
            }),
          }
        case "order.inventory.fail":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/mark_inventory_failed/`, {
              method: "POST",
              body: {
                items: payload.items,
                notes: payload.notes,
              },
            }),
          }
        case "order.pay":
          try {
            return {
              type: "order.updated",
              payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/process_payment/`, {
                method: "POST",
                body: {
                  payments: payload.payments,
                  create_receipt: payload.create_receipt,
                  print_receipt: payload.print_receipt,
                  email_receipt: payload.email_receipt,
                  email_address: payload.email_address,
                },
              }),
            }
          } catch (error) {
            if (!isAlreadyPaidError(error)) {
              throw error
            }
            return {
              type: "order.updated",
              payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/`),
            }
          }
        case "order.hold":
          return {
            type: "held_orders.updated",
            payload: {
              held_orders: await fetchPosJson("/pos_api/orders/held_orders/"),
            },
          }
        case "order.retrieve":
          return {
            type: "order.updated",
            payload: await fetchPosJson("/pos_api/orders/retrieve_held_order/", {
              method: "POST",
              body: {
                hold_order_id: payload.hold_order_id,
                session_id: payload.session_id,
              },
            }),
          }
        case "order.cancel":
          return {
            type: "order.updated",
            payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/cancel_order/`, {
              method: "POST",
              body: {},
            }),
          }
        case "held_orders.list":
          return {
            type: "held_orders.updated",
            payload: {
              held_orders: await fetchPosJson("/pos_api/orders/held_orders/"),
            },
          }
        case "catalog.snapshot": {
          const query = String(payload.query || "").trim()
          const [productsData, variantsData] = await Promise.all([
            fetchProductJson<Record<string, unknown>[]>(
              query ? "/product_api/pos/products/search/" : "/product_api/pos/products/",
              {
                params: query ? { q: query } : { page_size: 200 },
              },
            ),
            fetchProductJson<Record<string, unknown>[]>(
              query ? "/product_api/pos/variants/search/" : "/product_api/pos/variants/",
              {
                params: query ? { q: query } : undefined,
              },
            ),
          ])
          return {
            type: "catalog.updated",
            payload: buildCatalogSnapshotFromDjango(productsData, variantsData),
          }
        }
        default:
          throw new Error(`No HTTP fallback is configured for ${type}.`)
      }
    },
    [fetchOptionalPosJson, fetchPosJson, fetchProductJson, resolveTerminalForeignKey, tablesEnabled],
  )

  const sendCommand = useCallback(async (type: string, payload: Record<string, unknown> = {}) => {
    try {
      if (type === "order.pay") {
        try {
          return await sendHttpCommandFallback(type, payload)
        } catch (error) {
          if (isAlreadyPaidError(error) && payload.order_id) {
            return {
              type: "order.updated",
              payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/`),
            }
          }
          throw error
        }
      }
      return await sendHttpCommandFallback(type, payload)
    } catch (error) {
      if (type === "order.pay" && isAlreadyPaidError(error) && payload.order_id) {
        return {
          type: "order.updated",
          payload: await fetchPosJson(`/pos_api/orders/${payload.order_id}/`),
        }
      }
      throw error
    }
  }, [fetchPosJson, sendHttpCommandFallback])

  const refreshBootstrap = useCallback(async () => {
    try {
      if (!canReadPos) {
        const [productsResult, variantsResult] = await Promise.allSettled([
          fetchProductJson<Record<string, unknown>[]>("/product_api/pos/products/", {
            params: { page_size: 200 },
          }),
          fetchProductJson<Record<string, unknown>[]>("/product_api/pos/variants/"),
        ])

        const productsOk = productsResult.status === "fulfilled"
        const variantsOk = variantsResult.status === "fulfilled"

        applyBootstrap({
          configuration: null,
          session: null,
          sessions: [],
          terminals: [],
          customers: [],
          tables: [],
          held_orders: [],
          current_order: null,
          inventory_summary: null,
          catalog: productsOk
            ? buildCatalogSnapshotFromDjango(
                productsResult.value,
                variantsOk ? variantsResult.value : [],
              )
            : undefined,
          pos_unavailable: false,
          catalog_unavailable: !productsOk,
        })
        setSocketReady(true)
        setBootstrapUnavailable(false)
        setCatalogUnavailable(!productsOk)
        return
      }

      const response = await sendCommand("bootstrap")
      if (response.payload) {
        const bootstrap = response.payload as CashierBootstrap
        applyBootstrap(bootstrap)
        setSocketReady(true)
        setBootstrapUnavailable(!!bootstrap.pos_unavailable)
        setCatalogUnavailable(!!bootstrap.catalog_unavailable)
      }
    } finally {
      setBootstrapLoading(false)
      setCatalogLoading(false)
    }
  }, [applyBootstrap, canReadPos, fetchProductJson, sendCommand])

  const refreshOpeningDefaults = useCallback(async (nextTerminalId: string) => {
    if (!nextTerminalId || !canReadPos) {
      return
    }
    const response = await sendCommand("session.opening_defaults", {
      terminal: nextTerminalId,
    })
    const nextDefaults = response.payload as POSSessionOpeningDefaults
    setOpeningDefaults(nextDefaults)
    setOpeningVarianceReason("")
    if (nextDefaults?.recommended_opening_balance !== undefined && nextDefaults?.recommended_opening_balance !== null) {
      setOpeningBalance(String(nextDefaults.recommended_opening_balance))
    }
  }, [canReadPos, sendCommand])

  const refreshCloseoutSummary = useCallback(async (sessionId: string, nextClosingBalance?: string) => {
    if (!sessionId || !canReadPos) {
      return
    }
    const response = await sendCommand("session.closeout_summary", {
      session_id: sessionId,
      closing_balance: nextClosingBalance || undefined,
    })
    setCloseoutSummary(response.payload as POSSessionCloseoutSummary)
  }, [canReadPos, sendCommand])

  const handleMutationError = useCallback((error: unknown, fallback: string) => {
    toast.error(extractErrorMessage(error, ["detail"]) || fallback)
  }, [])

  const clearCurrentSale = useCallback(() => {
    setCurrentOrder(undefined)
    setInventorySummary(undefined)
    setPaymentDialogOpen(false)
    setItemQuantities({})
    setDiscountPercent("")
    setDiscountAmount("")
    setTipPercent("")
    setTipAmount("")
    setHoldReason("")
  }, [])

  const recoverTimedOutPayment = useCallback(
    async (orderId: string) => {
      const verifiedOrder = await fetchPosJson<POSOrder>(`/pos_api/orders/${orderId}/`)
      if (verifiedOrder.payment_status !== "paid") {
        throw new Error("Payment confirmation is still pending.")
      }

      toast.success(
        verifiedOrder.requires_inventory_processing
          ? "Payment went through. Finish the inventory step."
          : "Payment went through.",
      )
      clearCurrentSale()
      void refreshBootstrap().catch(() => undefined)
    },
    [clearCurrentSale, fetchPosJson, refreshBootstrap],
  )

  const clearQuantitySyncState = useCallback((itemId: string) => {
    delete quantityPendingValuesRef.current[itemId]
    setSyncingItemIds((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
  }, [])

  const flushItemQuantitySync = useCallback(
    async (itemId: string) => {
      if (quantitySyncInFlightRef.current[itemId]) {
        return
      }

      const order = currentOrderRef.current
      if (!order || order.payment_status === "paid") {
        clearQuantitySyncState(itemId)
        return
      }

      const desiredQuantity = quantityPendingValuesRef.current[itemId]
      if (desiredQuantity === undefined) {
        clearQuantitySyncState(itemId)
        return
      }

      const draftItem = order.items?.find((item) => item.id === itemId)
      if (!draftItem) {
        clearQuantitySyncState(itemId)
        return
      }

      if (String(draftItem.quantity) === desiredQuantity) {
        clearQuantitySyncState(itemId)
        return
      }

      quantitySyncInFlightRef.current[itemId] = true
      try {
        await sendCommand("order.item.update", {
          order_id: order.id,
          item_id: itemId,
          quantity: desiredQuantity,
        })
      } catch (error) {
        handleMutationError(error, "Unable to update the order item.")
      } finally {
        quantitySyncInFlightRef.current[itemId] = false
        const latestDesiredQuantity = quantityPendingValuesRef.current[itemId]
        if (latestDesiredQuantity && latestDesiredQuantity !== desiredQuantity) {
          void flushItemQuantitySync(itemId)
          return
        }
        clearQuantitySyncState(itemId)
      }
    },
    [clearQuantitySyncState, handleMutationError, sendCommand],
  )

  const queueItemQuantitySync = useCallback(
    (itemId: string, delayMs = 1000) => {
      if (quantitySyncTimers.current[itemId]) {
        clearTimeout(quantitySyncTimers.current[itemId])
      }
      quantitySyncTimers.current[itemId] = setTimeout(async () => {
        try {
          await flushItemQuantitySync(itemId)
        } finally {
          delete quantitySyncTimers.current[itemId]
        }
      }, delayMs)
    },
    [flushItemQuantitySync],
  )

  const handleOpenSession = async () => {
    if (sessionBlockingNotice) {
      toast.error(sessionBlockingNotice.message)
      return
    }
    if (!terminalId) {
      toast.error(boundTerminalId ? "This browser does not have a usable POS terminal right now." : "Select a terminal before opening a session.")
      return
    }
    if (!canOperatePos) {
      toast.error(sessionOperateNotice?.message || "You do not have permission to open POS sessions.")
      return
    }

    if (requiresOpeningVarianceReason && !openingVarianceReason.trim()) {
      toast.error("Explain the opening cash mismatch before opening the session.")
      return
    }

    if (sessionOpenInFlightRef.current || busyActions.openingSession) {
      return
    }

    sessionOpenInFlightRef.current = true
    try {
      await runBusy("openingSession", async () => {
        await sendCommand("session.open", {
          terminal: resolveTerminalForeignKey(boundTerminalId || terminalId),
          opening_balance: openingBalance || "0",
          opening_variance_reason: openingVarianceReason || undefined,
        })
      })
      await refreshBootstrap()
      toast.success("POS session opened")
      setSessionDialogOpen(false)
    } catch (error) {
      handleMutationError(error, "Unable to open POS session.")
      throw error
    } finally {
      sessionOpenInFlightRef.current = false
    }
  }

  const handleCloseSession = async (force = false) => {
    if (!currentSession?.id) {
      toast.error("Open a session before trying to close it.")
      return
    }

    try {
      await runBusy("closingSession", async () => {
        await sendCommand("session.close", {
          session_id: currentSession.id,
          closing_balance: closingBalance || "0",
          force,
        })
      })
      clearCurrentSale()
      await refreshBootstrap()
      toast.success("POS session closed")
      setCloseoutSheetOpen(false)
    } catch (error) {
      handleMutationError(error, "Unable to close POS session.")
    }
  }

  const ensureDraftOrder = async () => {
    if (currentOrder?.id) {
      return currentOrder
    }

    if (currentOrder && !currentOrder.id) {
      setCurrentOrder(undefined)
    }

    if (!currentSession) {
      toast.error("Open a session before adding items.")
      return null
    }
    if (!canOperatePos) {
      toast.error(cartOperateNotice?.message || "You do not have permission to create POS draft orders.")
      return null
    }

    const response = await sendCommand("order.ensure_draft", {
      session_id: resolveSessionForeignKey(currentSession),
      customer_id: customerId || undefined,
      table_id: tableId || undefined,
    })
    const nextOrder = response.payload as POSOrder
    if (!nextOrder?.id) {
      throw new Error("Draft order could not be created.")
    }
    setCurrentOrder(nextOrder)
    return nextOrder
  }

  const handleStartDraft = async () => {
    try {
      await runBusy("creatingDraft", async () => {
        await ensureDraftOrder()
      })
      toast.success("Draft order ready")
    } catch (error) {
      void refreshBootstrap().catch(() => undefined)
      handleMutationError(error, "Unable to start a draft order.")
      throw error
    }
  }

  const handleAssignCustomer = async (nextCustomerId: string | null) => {
    if (!canReadPos) {
      toast.error(customerNotice?.message || "You do not have permission to access POS customers.")
      return
    }
    if (!currentOrder) {
      setCustomerId(nextCustomerId || "")
      toast.success(nextCustomerId ? "Customer saved for the next draft order." : "Walk-in sale selected.")
      return
    }

    try {
      const response = await sendCommand("order.patch", {
        order_id: currentOrder.id,
        data: { customer: nextCustomerId },
      })
      setCurrentOrder(response.payload as POSOrder)
      toast.success(nextCustomerId ? "Customer assigned to the current sale." : "Customer cleared from the sale.")
    } catch (error) {
      handleMutationError(error, "Unable to update the order customer.")
      throw error
    }
  }

  const handleAssignTable = async (nextTableId: string | null) => {
    if (!canReadPos) {
      toast.error(tableNotice?.message || "You do not have permission to access POS tables.")
      return
    }
    if (!currentOrder) {
      setTableId(nextTableId || "")
      toast.success(nextTableId ? "Table saved for the next draft order." : "Counter service selected.")
      return
    }

    try {
      const response = await sendCommand("order.patch", {
        order_id: currentOrder.id,
        data: { table: nextTableId },
      })
      setCurrentOrder(response.payload as POSOrder)
      toast.success(nextTableId ? "Table assigned to the current sale." : "Table cleared from the sale.")
    } catch (error) {
      handleMutationError(error, "Unable to update the table assignment.")
      throw error
    }
  }

  const handleRetrieveHeldOrder = async (heldOrder: POSHoldOrder) => {
    if (!canReadPos) {
      toast.error(heldOrdersNotice?.message || "You do not have permission to access held carts.")
      return
    }
    if (!currentSession) {
      toast.error("Open a session before retrieving a held order.")
      return
    }

    try {
      updatePendingKey(setRestoringHoldOrderIds, heldOrder.id, true)
      await runBusy("retrievingHeldOrder", async () => {
        const response = await sendCommand("order.retrieve", {
          hold_order_id: heldOrder.id,
          session_id: resolveSessionForeignKey(currentSession),
        })
        setCurrentOrder(response.payload as POSOrder)
        const restoredOrder = response.payload as POSOrder
        if (restoredOrder?.id) {
          const inventoryResponse = await sendCommand("order.inventory_summary", { order_id: restoredOrder.id })
          setInventorySummary(inventoryResponse.payload as { order_id: string; items: POSOrderInventorySummaryItem[] })
        } else {
          setInventorySummary(undefined)
        }
      })
      await refreshBootstrap()
      toast.success("Held order restored into the current session")
      setHeldOrdersDialogOpen(false)
    } catch (error) {
      handleMutationError(error, "Unable to retrieve the held order.")
      throw error
    } finally {
      updatePendingKey(setRestoringHoldOrderIds, heldOrder.id, false)
    }
  }

  const productVariants = useMemo(
    () =>
      catalogVariants.reduce<Record<string, ProductVariant[]>>((acc, variant) => {
        acc[variant.product] = [...(acc[variant.product] || []), variant]
        return acc
      }, {}),
    [catalogVariants],
  )

  const variantProductMap = useMemo(
    () =>
      catalogVariants.reduce<Record<string, string>>((acc, variant) => {
        acc[variant.id] = variant.product
        return acc
      }, {}),
    [catalogVariants],
  )

  const productStockMap = useMemo(
    () =>
      catalogProducts.reduce<Record<string, number>>((acc, product) => {
        acc[product.id] = Number(product.total_stock ?? 0)
        return acc
      }, {}),
    [catalogProducts],
  )

  const filteredProducts = useMemo(() => {
    if (deferredCatalogQuery.length < 2) {
      return catalogProducts
    }

    const lowerQuery = deferredCatalogQuery.toLowerCase()
    return catalogProducts.filter((product) => {
      const variants = productVariants[product.id] || []
      const searchableValues = [
        product.name,
        product.category || "",
        product.sku || "",
        product.barcode || "",
        ...variants.flatMap((variant) => [
          variant.display_name || "",
          variant.variant_sku || "",
          variant.variant_barcode || "",
        ]),
      ]
      return searchableValues.some((value) => value.toLowerCase().includes(lowerQuery))
    })
  }, [catalogProducts, deferredCatalogQuery, productVariants])

  const handleAddVariant = async (variantId: string) => {
    try {
      if (!canOperatePos) {
        toast.error(catalogActionNotice?.message || "You do not have permission to add POS items.")
        return
      }
      if (currentOrder?.payment_status === "paid") {
        toast.error("This sale is already paid and is being finalized.")
        return
      }

      const selectedVariant = catalogVariants.find((variant) => variant.id === variantId)
      const selectedProductId = selectedVariant?.product || variantProductMap[variantId]
      const requestedQuantity = Number(
        variantQuantities[variantId] ||
          (selectedProductId ? variantQuantities[selectedProductId] : undefined) ||
          "1",
      )
      const available = Number(
        selectedVariant?.stock_details?.available ??
          (selectedProductId ? productStockMap[selectedProductId] : undefined) ??
          0,
      )

      if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
        toast.error("Enter a valid quantity before adding this item.")
        return
      }
      if (requestedQuantity > available) {
        toast.error(`Only ${available} units are available for this variant.`)
        return
      }

      if (!selectedVariant || !currentSession) {
        toast.error("This variant is not ready for sale yet.")
        return
      }
      setPendingAddVariantIds((current) => ({ ...current, [variantId]: true }))

      const draftOrder = await ensureDraftOrder()
      if (!draftOrder?.id) {
        void refreshBootstrap().catch(() => undefined)
        toast.error("The draft order is still being prepared. Try again.")
        return
      }

      await runBusy("addingItem", async () => {
        const response = await sendCommand("order.item.add", {
          order_id: draftOrder.id,
          variant_id: variantId,
          quantity:
            variantQuantities[variantId] ||
            (selectedProductId ? variantQuantities[selectedProductId] : undefined) ||
            "1",
        })
        const nextOrder = response.payload as POSOrder
        setCurrentOrder(nextOrder)
      })
      toast.success("Variant added to the current sale")
    } catch (error) {
      void refreshBootstrap().catch(() => undefined)
      handleMutationError(error, "Unable to add the variant to the order.")
      throw error
    } finally {
      setPendingAddVariantIds((current) => {
        const next = { ...current }
        delete next[variantId]
        return next
      })
    }
  }

  const handleRemoveItem = async (item: POSOrderItem) => {
    if (!currentOrder) {
      return
    }

    try {
      if (currentOrder.payment_status === "paid") {
        toast.error("Paid sales can no longer be edited.")
        return
      }
      if (quantitySyncTimers.current[item.id]) {
        clearTimeout(quantitySyncTimers.current[item.id])
        delete quantitySyncTimers.current[item.id]
      }
      updatePendingKey(setRemovingItemIds, item.id, true)

      await runBusy("removingItem", async () => {
        const response = await sendCommand("order.item.remove", {
          order_id: currentOrder.id,
          item_id: item.id,
        })
        setCurrentOrder(response.payload as POSOrder)
      })
      setItemQuantities((current) => {
        const next = { ...current }
        delete next[item.id]
        return next
      })
      toast.success("Order item removed")
    } catch (error) {
      handleMutationError(error, "Unable to remove the order item.")
      throw error
    } finally {
      updatePendingKey(setRemovingItemIds, item.id, false)
    }
  }

  const handleConfirmZeroQuantityRemoval = async () => {
    const pendingItem = pendingZeroQuantityItem
    if (!pendingItem) {
      return
    }

    setPendingZeroQuantityItem(null)
    quantityPendingValuesRef.current[pendingItem.id] = "0"
    try {
      await handleRemoveItem(pendingItem)
    } finally {
      delete quantityPendingValuesRef.current[pendingItem.id]
      setItemQuantities((current) => {
        const next = { ...current }
        delete next[pendingItem.id]
        return next
      })
    }
  }

  const handleCancelZeroQuantityRemoval = () => {
    const pendingItem = pendingZeroQuantityItem
    if (!pendingItem) {
      return
    }

    delete quantityPendingValuesRef.current[pendingItem.id]
    setPendingZeroQuantityItem(null)
    setItemQuantities((current) => ({
      ...current,
      [pendingItem.id]: String(pendingItem.quantity),
    }))
    clearQuantitySyncState(pendingItem.id)
  }

  const handleApplyDiscount = async () => {
    if (!currentOrder) {
      return
    }

    try {
      if (currentOrder.payment_status === "paid") {
        toast.error("Paid sales can no longer be repriced.")
        return
      }
      await runBusy("applyingDiscount", async () => {
        const response = await sendCommand("order.discount.apply", {
          order_id: currentOrder.id,
          discount_percent: discountPercent || undefined,
          discount_amount: discountAmount || undefined,
        })
        setCurrentOrder(response.payload as POSOrder)
      })
      toast.success("Discount applied")
    } catch (error) {
      handleMutationError(error, "Unable to apply the discount.")
      throw error
    }
  }

  const handleAddTip = async () => {
    if (!currentOrder) {
      return
    }

    try {
      if (currentOrder.payment_status === "paid") {
        toast.error("Paid sales can no longer be repriced.")
        return
      }
      await runBusy("addingTip", async () => {
        const response = await sendCommand("order.tip.apply", {
          order_id: currentOrder.id,
          tip_amount: tipAmount || undefined,
          tip_percent: tipPercent || undefined,
        })
        setCurrentOrder(response.payload as POSOrder)
      })
      toast.success("Tip updated")
    } catch (error) {
      handleMutationError(error, "Unable to update tip.")
      throw error
    }
  }

  const handleHoldOrder = async () => {
    if (!currentOrder) {
      return
    }

    try {
      if (currentOrder.payment_status === "paid") {
        toast.error("Paid sales cannot be moved to held carts.")
        return
      }
      await runBusy("holdingOrder", async () => {
        await sendCommand("order.hold", {
          order_id: currentOrder.id,
          hold_reason: holdReason,
        })
      })
      clearCurrentSale()
      void refreshBootstrap().catch(() => undefined)
      toast.success("Order moved to held carts")
    } catch (error) {
      handleMutationError(error, "Unable to hold the order.")
      throw error
    }
  }

  const handleCancelOrder = async () => {
    if (!currentOrder) {
      return
    }

    try {
      if (currentOrder.payment_status === "paid") {
        toast.error("Paid sales cannot be cancelled from the cashier workspace.")
        return
      }
      await runBusy("cancellingOrder", async () => {
        await sendCommand("order.cancel", { order_id: currentOrder.id })
      })
      clearCurrentSale()
      void refreshBootstrap().catch(() => undefined)
      toast.success("Order cancelled")
    } catch (error) {
      handleMutationError(error, "Unable to cancel the order.")
      throw error
    }
  }

  const resolveDraftItem = (itemId: string) => currentOrder?.items?.find((item) => item.id === itemId)

  const handleInventoryAction = async (
    action: "request" | "confirm" | "release" | "fulfill" | "fail",
    item: POSOrderInventorySummaryItem,
  ) => {
    if (!currentOrder) {
      return
    }

    const draftItem = resolveDraftItem(item.item_id)
    if (!draftItem) {
      toast.error("Order item details are not available yet.")
      return
    }

    const remainingToReserve = asNumber(draftItem.remaining_to_reserve)
    const remainingToFulfill = asNumber(draftItem.remaining_to_fulfill)
    const reservedQuantity = asNumber(draftItem.reserved_quantity)

    const payload = {
      order_id: currentOrder.id,
      items: [
        {
          item_id: item.item_id,
          quantity:
            action === "release"
              ? String(reservedQuantity)
              : action === "fulfill"
                ? String(remainingToFulfill)
                : String(remainingToReserve),
          failure_reason: failureReason,
          shipment_reference: currentOrder.order_number,
        },
      ],
      notes: failureReason,
    }

    const actionKey: Record<typeof action, BusyAction> = {
      request: "requestingReservation",
      confirm: "confirmingReservation",
      release: "releasingReservation",
      fulfill: "confirmingFulfillment",
      fail: "markingInventoryFailed",
    }
    const pendingActionKey = `${action}:${item.item_id}`

    try {
      updatePendingKey(setPendingInventoryActionKeys, pendingActionKey, true)
      await runBusy(actionKey[action], async () => {
        const response = await sendCommand(`order.inventory.${action}`, payload)
        setCurrentOrder(response.payload as POSOrder)
        const inventoryResponse = await sendCommand("order.inventory_summary", { order_id: currentOrder.id })
        setInventorySummary(inventoryResponse.payload as { order_id: string; items: POSOrderInventorySummaryItem[] })
      })
      toast.success("Inventory workflow updated")
    } catch (error) {
      void refreshBootstrap().catch(() => undefined)
      handleMutationError(error, "Unable to update inventory workflow.")
      throw error
    } finally {
      updatePendingKey(setPendingInventoryActionKeys, pendingActionKey, false)
    }
  }

  const handleProcessPayment = async ({ payments, emailAddress, printReceipt }: PaymentSubmission) => {
    if (!currentOrder) {
      return
    }
    if (isCheckoutBlocked) {
      toast.error("Wait for cart changes to finish saving before checkout.")
      return
    }
    if (currentOrder.payment_status === "paid" || Number(currentOrder.remaining_balance ?? 0) <= 0) {
      await recoverTimedOutPayment(currentOrder.id)
      return
    }

    try {
      await runBusy("processingPayment", async () => {
        await sendCommand("order.pay", {
          order_id: currentOrder.id,
          payments,
          create_receipt: true,
          print_receipt: printReceipt,
          email_receipt: !!emailAddress,
          email_address: emailAddress || undefined,
        })
      })
      clearCurrentSale()
      void refreshBootstrap().catch(() => undefined)
      toast.success(
        currentOrder.requires_inventory_processing
          ? "Payment processed. Inventory is being finalized automatically."
          : "Payment processed",
      )
    } catch (error) {
      if (isAlreadyPaidError(error)) {
        try {
          await recoverTimedOutPayment(currentOrder.id)
          return
        } catch {
          // fall through to normal rollback if verification cannot confirm success
        }
      }
      void refreshBootstrap().catch(() => undefined)
      handleMutationError(error, "Unable to process payment.")
      throw error
    }
  }

  const hasCurrentSession = Boolean(currentSession?.id && currentSession?.status === "open")
  const occupiedBindingNotice =
    !bootstrapLoading && canReadPos && deviceBinding && boundTerminal && !hasCurrentSession && availableTerminals.length === 0
      ? {
          title: "Assigned terminal is busy",
          message: `${boundTerminal.name} is already running another open session. Close that session before starting a new one on this browser.`,
        }
      : undefined
  const sessionBlockingNotice = deviceBindingNotice || inactiveBindingNotice || occupiedBindingNotice
  const expectedOpeningBalance = Number(
    openingDefaults?.expected_opening_balance ?? openingDefaults?.recommended_opening_balance ?? 0,
  )
  const resolvedOpeningBalance = Number(openingBalance || 0)
  const requiresOpeningVarianceReason =
    Boolean(openingDefaults?.last_closed_session_id) &&
    Number.isFinite(expectedOpeningBalance) &&
    Number.isFinite(resolvedOpeningBalance) &&
    Math.abs(resolvedOpeningBalance - expectedOpeningBalance) > 0.0001
  const activeTerminalId = (hasCurrentSession ? currentSession?.terminal : undefined) || boundTerminalId || terminalId
  const activeCustomerId = currentOrder?.customer || customerId
  const activeTableId = tablesEnabled ? currentOrder?.table || tableId : ""
  const sessionId = hasCurrentSession ? currentSession?.id : undefined
  const sessionDialogVisible =
    !bootstrapLoading &&
    canReadPos &&
    !sessionBlockingNotice &&
    (sessionDialogOpen || (!hasCurrentSession && availableTerminals.length > 0))

  const liveSessionCount = sessions.filter((session) => session.status === "open").length
  const orderHasInventory = inventorySummary?.items?.some((item) => !!item.inventory_item_id) ?? false
  const hasUnsavedQuantityInputs =
    (currentOrder?.items || []).some((item) => {
      const draftQuantity = itemQuantities[item.id]
      if (draftQuantity === undefined || draftQuantity.trim() === "") {
        return false
      }
      const parsedQuantity = Number(draftQuantity)
      return Number.isFinite(parsedQuantity) && parsedQuantity !== asNumber(item.quantity)
    }) ||
    Object.keys(quantityPendingValuesRef.current).length > 0
  const isCheckoutBlocked =
    hasUnsavedQuantityInputs ||
    Object.keys(pendingAddVariantIds).length > 0 ||
    Object.keys(syncingItemIds).length > 0 ||
    Object.keys(removingItemIds).length > 0 ||
    !!busyActions.creatingDraft ||
    !!busyActions.processingPayment
  const customerLabel =
    currentOrder?.customer_name ||
    (activeCustomerId ? customerMap[activeCustomerId]?.name || "Saved customer" : "Walk-in")

  const tableLookup = activeTableId ? tableMap[activeTableId] : undefined
  const tableLabel = tablesEnabled
    ? currentOrder?.table_number
      ? `Table ${currentOrder.table_number}`
      : tableLookup?.name || (tableLookup?.number ? `Table ${tableLookup.number}` : "Counter")
    : "Counter"

  const terminalName = hasCurrentSession && currentSession?.terminal
    ? terminalMap[currentSession.terminal]?.name || currentSession.terminal
    : terminalMap[terminalId]?.name
  const isCloseoutSummaryLoading = hasCurrentSession && !closeoutSummary

  useEffect(() => {
    const timers = quantitySyncTimers.current
    return () => {
      Object.values(timers).forEach((timerId) => clearTimeout(timerId))
      quantitySyncInFlightRef.current = {}
      quantityPendingValuesRef.current = {}
    }
  }, [])

  useEffect(() => {
    if (hasCurrentSession || !activeTerminalId || !socketReady) {
      return
    }
    void refreshOpeningDefaults(activeTerminalId)
  }, [activeTerminalId, hasCurrentSession, refreshOpeningDefaults, socketReady])

  useEffect(() => {
    setItemQuantities((current) => {
      if (!currentOrder?.items?.length) {
        return {}
      }
      const next = { ...current }
      const validIds = new Set(currentOrder.items.map((item) => item.id))
      let changed = false
      Object.keys(next).forEach((itemId) => {
        if (!validIds.has(itemId)) {
          delete next[itemId]
          changed = true
        }
      })
      return changed ? next : current
    })
  }, [currentOrder])

  useEffect(() => {
    if (!closeoutSheetOpen || !sessionId || !socketReady) {
      return
    }
    void refreshCloseoutSummary(sessionId, closingBalance || undefined)
  }, [closeoutSheetOpen, sessionId, closingBalance, refreshCloseoutSummary, socketReady])

  useEffect(() => {
    if (!sessionId || !socketReady || closeoutSheetOpen) {
      return
    }
    void refreshCloseoutSummary(sessionId)
  }, [
    closeoutSheetOpen,
    currentOrder?.inventory_status,
    currentOrder?.payment_status,
    currentOrder?.status,
    currentOrder?.updated_at,
    currentSession?.updated_at,
    refreshCloseoutSummary,
    sessionId,
    socketReady,
  ])

  useEffect(() => {
    if (!currentOrder) {
      return
    }

    const finalizedStatuses = new Set(["completed", "cancelled", "refunded"])
    const settledInventoryStatuses = new Set([
      "fulfilled",
      "released",
      "failed",
      "not_required",
    ])

    if (
      finalizedStatuses.has(currentOrder.status) &&
      settledInventoryStatuses.has(currentOrder.inventory_status)
    ) {
      setPaymentDialogOpen(false)
      setInventorySheetOpen(false)
      setCurrentOrder(undefined)
      setInventorySummary(undefined)
    }
  }, [currentOrder])

  useEffect(() => {
    void refreshBootstrap().catch(() => {
      setSocketReady(false)
      setBootstrapUnavailable(true)
      setCatalogUnavailable(true)
      setBootstrapLoading(false)
      setCatalogLoading(false)
    })
  }, [refreshBootstrap])

  const scheduleItemQuantitySync = (itemId: string, value: string) => {
    const order = currentOrderRef.current
    if (!order || order.payment_status === "paid") {
      return
    }

    const draftItem = order.items?.find((item) => item.id === itemId)
    if (!draftItem) {
      return
    }

    const normalizedValue = value.trim()
    if (!normalizedValue) {
      return
    }

    const nextQuantity = Number(normalizedValue)
    if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
      return
    }

    if (pendingZeroQuantityItem?.id === itemId && nextQuantity > 0) {
      setPendingZeroQuantityItem(null)
    }

    const availableQuantity = Number(draftItem.available_quantity_snapshot ?? 0)
    if (availableQuantity > 0 && nextQuantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} units are available for ${draftItem.variant_name || draftItem.product_name}.`)
      setItemQuantities((current) => ({ ...current, [itemId]: String(draftItem.quantity) }))
      return
    }

    quantityPendingValuesRef.current[itemId] = normalizedValue

    if (quantitySyncTimers.current[itemId]) {
      clearTimeout(quantitySyncTimers.current[itemId])
    }

    if (nextQuantity === 0) {
      clearQuantitySyncState(itemId)
      quantitySyncTimers.current[itemId] = setTimeout(() => {
        const liveOrder = currentOrderRef.current
        const liveItem = liveOrder?.items?.find((item) => item.id === itemId)
        delete quantitySyncTimers.current[itemId]
        if (!liveItem || quantityPendingValuesRef.current[itemId] !== "0") {
          return
        }
        setPendingZeroQuantityItem(liveItem)
      }, 1000)
      return
    }

    if (String(draftItem.quantity) === normalizedValue) {
      clearQuantitySyncState(itemId)
      return
    }

    setSyncingItemIds((current) => ({ ...current, [itemId]: true }))
    queueItemQuantitySync(itemId, 1000)
  }

  return (
    <>
      <div className="space-y-5">
        <POSCashierHeader
          isLoading={bootstrapLoading}
          isCloseoutSummaryLoading={isCloseoutSummaryLoading}
          sessionConstraintNotice={sessionBlockingNotice}
          hasCurrentSession={hasCurrentSession}
          currentSession={currentSession}
          currentOrder={currentOrder}
          terminalName={terminalName}
          currencyCode={currentConfiguration?.currency || currencyCode}
          heldOrderCount={heldOrders.length}
          liveSessionCount={liveSessionCount}
          closeoutSummary={closeoutSummary}
          sessionReadNotice={sessionReadNotice}
          sessionOperateNotice={sessionOperateNotice}
          heldOrdersNotice={heldOrdersNotice}
          onOpenSession={() => setSessionDialogOpen(true)}
          onOpenHeldOrders={() => setHeldOrdersDialogOpen(true)}
          onOpenCloseout={() => {
            if (!currentSession?.id) {
              toast.error("Open a session before trying to close it.")
              return
            }
            if (!closingBalance && closeoutSummary?.expected_balance !== undefined) {
              setClosingBalance(String(closeoutSummary.expected_balance))
            }
            setCloseoutSheetOpen(true)
          }}
          isClosingSession={!!busyActions.closingSession}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <POSCatalogPanel
              currencyCode={currentConfiguration?.currency || currencyCode}
              catalogQuery={catalogQuery}
              onCatalogQueryChange={setCatalogQuery}
              deferredCatalogQuery={deferredCatalogQuery}
              products={filteredProducts}
              productVariants={productVariants}
              searchingCatalog={catalogLoading}
              catalogUnavailable={catalogUnavailable}
              addToOrderNotice={catalogActionNotice}
              variantQuantities={variantQuantities}
              onVariantQuantityChange={(variantId, value) =>
                setVariantQuantities((current) => ({ ...current, [variantId]: value }))
              }
              onAddVariant={handleAddVariant}
              canAddToOrder={hasCurrentSession && canOperatePos && !bootstrapLoading && !catalogLoading && !bootstrapUnavailable}
              pendingAddVariantIds={pendingAddVariantIds}
            />
          </div>

          <div className="min-w-0">
            <POSCartPanel
              currentOrder={currentOrder}
              currencyCode={currentConfiguration?.currency || currencyCode}
              supportsTables={tablesEnabled}
              isHydrating={bootstrapLoading}
              cartUnavailable={bootstrapUnavailable}
              sessionReadNotice={sessionReadNotice}
              cartOperateNotice={cartOperateNotice}
              customerAccessNotice={customerNotice}
              tableAccessNotice={tableNotice}
              heldOrdersAccessNotice={heldOrdersNotice}
              customerLabel={customerLabel}
              tableLabel={tableLabel}
              heldOrderCount={heldOrders.length}
              itemQuantities={itemQuantities}
              onItemQuantityChange={(itemId, value) => {
                setItemQuantities((current) => ({ ...current, [itemId]: value }))
                scheduleItemQuantitySync(itemId, value)
              }}
              onRemoveItem={handleRemoveItem}
              onOpenCustomer={() => setCustomerDialogOpen(true)}
              onOpenTable={() => setTableDialogOpen(true)}
              onOpenHeldOrders={() => setHeldOrdersDialogOpen(true)}
              onOpenPayment={() => {
                if (isCheckoutBlocked) {
                  toast.error("Wait for cart changes to finish saving before checkout.")
                  return
                }
                setPaymentDialogOpen(true)
              }}
              onOpenInventory={() => setInventorySheetOpen(true)}
              onStartDraft={handleStartDraft}
              discountPercent={discountPercent}
              discountAmount={discountAmount}
              onDiscountPercentChange={setDiscountPercent}
              onDiscountAmountChange={setDiscountAmount}
              onApplyDiscount={handleApplyDiscount}
              tipPercent={tipPercent}
              tipAmount={tipAmount}
              onTipPercentChange={setTipPercent}
              onTipAmountChange={setTipAmount}
              onApplyTip={handleAddTip}
              holdReason={holdReason}
              onHoldReasonChange={setHoldReason}
              onHoldOrder={handleHoldOrder}
              onCancelOrder={handleCancelOrder}
              hasInventoryControls={orderHasInventory}
              canStartDraft={hasCurrentSession && canOperatePos && !bootstrapLoading && !bootstrapUnavailable}
              isCreatingDraft={!!busyActions.creatingDraft}
              syncingItemIds={syncingItemIds}
              removingItemIds={removingItemIds}
              isApplyingDiscount={!!busyActions.applyingDiscount}
              isAddingTip={!!busyActions.addingTip}
              isHoldingOrder={!!busyActions.holdingOrder}
              isCancellingOrder={!!busyActions.cancellingOrder}
              isCheckoutBlocked={isCheckoutBlocked}
            />
          </div>
        </div>
      </div>

      <POSSessionDialog
        open={sessionDialogVisible}
        onOpenChange={setSessionDialogOpen}
        terminals={availableTerminals}
        terminalLocked={!!boundTerminalId}
        currentConfiguration={currentConfiguration}
        openingDefaults={openingDefaults}
        currencyCode={currencyCode}
        terminalId={activeTerminalId}
        openingBalance={openingBalance}
        openingVarianceReason={openingVarianceReason}
        requiresVarianceReason={requiresOpeningVarianceReason}
        blockingNotice={sessionBlockingNotice}
        onTerminalChange={setTerminalId}
        onOpeningBalanceChange={setOpeningBalance}
        onOpeningVarianceReasonChange={setOpeningVarianceReason}
        onOpenSession={() => void handleOpenSession()}
        isOpening={!!busyActions.openingSession}
        accessNotice={sessionOperateNotice || sessionReadNotice}
      />

      <POSCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customers={customers}
        isLoading={bootstrapLoading}
        onAssignCustomer={handleAssignCustomer}
        accessNotice={customerNotice}
      />

      {tablesEnabled ? (
        <POSTableDialog
          open={tableDialogOpen}
          onOpenChange={setTableDialogOpen}
          tables={tables}
          onAssignTable={handleAssignTable}
          accessNotice={tableNotice}
        />
      ) : null}

      <POSHeldOrdersDialog
        open={heldOrdersDialogOpen}
        onOpenChange={setHeldOrdersDialogOpen}
        heldOrders={heldOrders}
        isLoading={bootstrapLoading}
        onRestore={handleRetrieveHeldOrder}
        restoringHoldOrderIds={restoringHoldOrderIds}
        accessNotice={heldOrdersNotice}
      />

      <POSPaymentDialog
        key={`${currentOrder?.id ?? "no-order"}-${currentOrder?.remaining_balance ?? "0"}-${currentOrder?.total_amount ?? "0"}-${paymentDialogOpen ? "open" : "closed"}`}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        order={currentOrder}
        currencyCode={currentConfiguration?.currency || currencyCode}
        defaultPrintReceipt={!!currentConfiguration?.auto_print_receipt}
        allowSplitPayment={!!currentConfiguration?.allow_split_payment}
        isProcessing={!!busyActions.processingPayment}
        onSubmit={handleProcessPayment}
      />

      <POSSessionCloseoutSheet
        open={closeoutSheetOpen}
        onOpenChange={setCloseoutSheetOpen}
        summary={closeoutSummary}
        currencyCode={currentConfiguration?.currency || currencyCode}
        closingBalance={closingBalance}
        onClosingBalanceChange={setClosingBalance}
        onSubmit={(force) => void handleCloseSession(force)}
        isSubmitting={!!busyActions.closingSession}
      />

      <POSInventorySheet
        open={inventorySheetOpen}
        onOpenChange={setInventorySheetOpen}
        currentOrder={currentOrder}
        inventorySummary={inventorySummary as POSOrderInventorySummary | undefined}
        getDraftItem={resolveDraftItem}
        failureReason={failureReason}
        onFailureReasonChange={setFailureReason}
        onAction={(action, item) => handleInventoryAction(action, item)}
        pendingActionKeys={pendingInventoryActionKeys}
      />

      <AlertDialog open={!!pendingZeroQuantityItem} onOpenChange={(open) => !open && handleCancelZeroQuantityRemoval()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item from cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Setting the quantity of{" "}
              <span className="font-medium text-foreground">
                {pendingZeroQuantityItem?.variant_name || pendingZeroQuantityItem?.product_name || "this item"}
              </span>{" "}
              to 0 will remove it from the current sale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep item</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmZeroQuantityRemoval()}>Remove item</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
