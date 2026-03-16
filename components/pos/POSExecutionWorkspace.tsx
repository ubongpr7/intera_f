"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { getCookie } from "cookies-next"
import { readCookieValue } from "@/lib/authCookies"
import { extractErrorMessage } from "@/lib/utils"
import {
  useAddItemToOrderMutation,
  useAddTipToOrderMutation,
  useApplyDiscountToOrderMutation,
  useCancelOrderMutation,
  useCloseSessionMutation,
  useConfirmOrderFulfillmentMutation,
  useConfirmOrderReservationMutation,
  useCreateOrGetDraftOrderMutation,
  useGetCurrentConfigurationQuery,
  useGetCurrentDraftOrderQuery,
  useGetCurrentSessionQuery,
  useGetCustomersQuery,
  useGetHeldOrdersQuery,
  useGetOrderInventorySummaryQuery,
  useGetSessionsQuery,
  useGetTablesQuery,
  useGetTerminalsQuery,
  useHoldOrderMutation,
  useMarkOrderInventoryFailedMutation,
  useOpenSessionMutation,
  usePartialUpdateOrderMutation,
  useProcessPaymentMutation,
  useReleaseOrderReservationMutation,
  useRequestOrderReservationMutation,
  useRetrieveHeldOrderMutation,
  useRemoveOrderItemMutation,
  useUpdateOrderItemMutation,
} from "@/redux/features/pos/posAPISlice"
import type {
  POSCustomer,
  POSHoldOrder,
  POSOrder,
  POSOrderInventorySummaryItem,
  POSOrderItem,
  POSSession,
  POSTable,
  POSTerminal,
} from "@/redux/features/pos/posTypes"
import { useGetPosFeaturedProductsQuery, useSearchPosVariantsQuery } from "@/redux/features/product/productAPISlice"
import type { Product, ProductVariant } from "@/redux/features/product/productTypes"
import POSCartPanel from "@/components/pos/POSCartPanel"
import POSCashierHeader from "@/components/pos/POSCashierHeader"
import POSCatalogPanel from "@/components/pos/POSCatalogPanel"
import POSCustomerDialog from "@/components/pos/POSCustomerDialog"
import POSHeldOrdersDialog from "@/components/pos/POSHeldOrdersDialog"
import POSInventorySheet from "@/components/pos/POSInventorySheet"
import POSPaymentDialog from "@/components/pos/POSPaymentDialog"
import POSSessionDialog from "@/components/pos/POSSessionDialog"
import POSTableDialog from "@/components/pos/POSTableDialog"
import { toast } from "react-toastify"

type FeaturedVariantChip = {
  id: string
  name: string
  price: number
  sku: string
  barcode?: string
  productName: string
}

type PaymentSubmission = {
  paymentMethod: "cash" | "card" | "mobile" | "qr" | "loyalty" | "gift_card"
  amount: string
  cashReceived?: string
  referenceNumber?: string
  emailAddress?: string
  printReceipt: boolean
}

const statusFromError = (error: unknown) => {
  if (error && typeof error === "object" && "status" in error) {
    return Number((error as { status: number | string }).status)
  }

  return undefined
}

const asNumber = (value: string | number | undefined | null) => Number(value ?? 0)

const featuredVariantChips = (products: Product[]): FeaturedVariantChip[] =>
  products.flatMap((product) =>
    (product.quick_sale_variants || []).map((variant) => ({
      id: variant.id,
      name: variant.display_name || product.name,
      price: Number(variant.price ?? 0),
      sku: variant.sku || "",
      barcode: variant.barcode,
      productName: product.name,
    })),
  )

const buildLookup = <T extends { id: string; sync_identifier?: string }>(items: T[]) =>
  items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item
    if (item.sync_identifier) {
      acc[item.sync_identifier] = item
    }
    return acc
  }, {})

export default function POSExecutionWorkspace() {
  const [terminalId, setTerminalId] = useState("")
  const [openingBalance, setOpeningBalance] = useState("0")
  const [closingBalance, setClosingBalance] = useState("0")
  const [customerId, setCustomerId] = useState("")
  const [tableId, setTableId] = useState("")
  const [catalogQuery, setCatalogQuery] = useState("")
  const [variantQuantities, setVariantQuantities] = useState<Record<string, string>>({})
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({})
  const [discountPercent, setDiscountPercent] = useState("")
  const [discountAmount, setDiscountAmount] = useState("")
  const [tipAmount, setTipAmount] = useState("")
  const [tipPercent, setTipPercent] = useState("")
  const [holdReason, setHoldReason] = useState("")
  const [failureReason, setFailureReason] = useState("Inventory verification failed")
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [heldOrdersDialogOpen, setHeldOrdersDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [inventorySheetOpen, setInventorySheetOpen] = useState(false)

  const deferredCatalogQuery = useDeferredValue(catalogQuery.trim())
  const currencyCode = readCookieValue("currency", getCookie) || "NGN"

  const { data: currentConfiguration } = useGetCurrentConfigurationQuery()
  const { data: terminals = [] } = useGetTerminalsQuery()
  const { data: customers = [] } = useGetCustomersQuery()
  const { data: tables = [] } = useGetTablesQuery()
  const {
    data: currentSession,
    error: currentSessionError,
    refetch: refetchCurrentSession,
  } = useGetCurrentSessionQuery()
  const { data: sessions = [], refetch: refetchSessions } = useGetSessionsQuery()
  const hasCurrentSession = !!currentSession && statusFromError(currentSessionError) !== 404
  const sessionId = hasCurrentSession ? currentSession.id : undefined
  const {
    data: currentDraftOrder,
    error: currentDraftError,
    refetch: refetchCurrentDraft,
  } = useGetCurrentDraftOrderQuery(sessionId ?? "", { skip: !sessionId })
  const draftMissing = statusFromError(currentDraftError) === 404
  const currentOrder = !draftMissing ? currentDraftOrder : undefined
  const orderId = currentOrder?.id
  const { data: heldOrders = [], refetch: refetchHeldOrders } = useGetHeldOrdersQuery()
  const { data: inventorySummary, refetch: refetchInventorySummary } = useGetOrderInventorySummaryQuery(orderId ?? "", {
    skip: !orderId,
  })
  const { data: featuredProducts = [] } = useGetPosFeaturedProductsQuery()
  const { data: searchResults = [], isFetching: searchingCatalog } = useSearchPosVariantsQuery(deferredCatalogQuery, {
    skip: deferredCatalogQuery.length < 2,
  })

  const [openSession, { isLoading: openingSession }] = useOpenSessionMutation()
  const [closeSession, { isLoading: closingSession }] = useCloseSessionMutation()
  const [createOrGetDraftOrder, { isLoading: creatingDraft }] = useCreateOrGetDraftOrderMutation()
  const [partialUpdateOrder] = usePartialUpdateOrderMutation()
  const [addItemToOrder, { isLoading: addingItem }] = useAddItemToOrderMutation()
  const [updateOrderItem, { isLoading: updatingItem }] = useUpdateOrderItemMutation()
  const [removeOrderItem, { isLoading: removingItem }] = useRemoveOrderItemMutation()
  const [applyDiscountToOrder, { isLoading: applyingDiscount }] = useApplyDiscountToOrderMutation()
  const [addTipToOrder, { isLoading: addingTip }] = useAddTipToOrderMutation()
  const [holdOrder, { isLoading: holdingOrder }] = useHoldOrderMutation()
  const [retrieveHeldOrder, { isLoading: retrievingHeldOrder }] = useRetrieveHeldOrderMutation()
  const [requestOrderReservation, { isLoading: requestingReservation }] = useRequestOrderReservationMutation()
  const [confirmOrderReservation, { isLoading: confirmingReservation }] = useConfirmOrderReservationMutation()
  const [releaseOrderReservation, { isLoading: releasingReservation }] = useReleaseOrderReservationMutation()
  const [confirmOrderFulfillment, { isLoading: confirmingFulfillment }] = useConfirmOrderFulfillmentMutation()
  const [markOrderInventoryFailed, { isLoading: markingInventoryFailed }] = useMarkOrderInventoryFailedMutation()
  const [processPayment, { isLoading: processingPayment }] = useProcessPaymentMutation()
  const [cancelOrder, { isLoading: cancellingOrder }] = useCancelOrderMutation()

  useEffect(() => {
    if (currentSession?.terminal) {
      setTerminalId(currentSession.terminal)
    }
  }, [currentSession?.terminal])

  useEffect(() => {
    if (!hasCurrentSession && terminals.length > 0) {
      setSessionDialogOpen(true)
    }
  }, [hasCurrentSession, terminals.length])

  useEffect(() => {
    if (currentOrder?.customer !== undefined) {
      setCustomerId(currentOrder.customer || "")
    }
  }, [currentOrder?.customer])

  useEffect(() => {
    if (currentOrder?.table !== undefined) {
      setTableId(currentOrder.table || "")
    }
  }, [currentOrder?.table])

  const terminalMap = useMemo(() => buildLookup<POSTerminal>(terminals), [terminals])
  const customerMap = useMemo(() => buildLookup<POSCustomer>(customers), [customers])
  const tableMap = useMemo(() => buildLookup<POSTable>(tables), [tables])
  const featuredVariantResults = useMemo(() => featuredVariantChips(featuredProducts), [featuredProducts])

  const refreshSessionScope = async () => {
    await Promise.all([refetchCurrentSession(), refetchSessions()])
  }

  const refreshOrderScope = async () => {
    await Promise.all([
      refetchCurrentDraft(),
      refetchHeldOrders(),
      orderId ? refetchInventorySummary() : Promise.resolve(),
    ])
  }

  const handleMutationError = (error: unknown, fallback: string) => {
    toast.error(extractErrorMessage(error, ["detail"]) || fallback)
  }

  const handleOpenSession = async () => {
    if (!terminalId) {
      toast.error("Select a terminal before opening a session.")
      return
    }

    try {
      await openSession({
        terminal: terminalId,
        opening_balance: openingBalance || "0",
      }).unwrap()
      toast.success("POS session opened")
      setSessionDialogOpen(false)
      await refreshSessionScope()
    } catch (error) {
      handleMutationError(error, "Unable to open POS session.")
      throw error
    }
  }

  const handleCloseSession = async () => {
    if (!currentSession) {
      return
    }

    try {
      await closeSession({
        sessionId: currentSession.id,
        closingBalance: closingBalance || "0",
      }).unwrap()
      toast.success("POS session closed")
      await Promise.all([refreshSessionScope(), refetchHeldOrders()])
    } catch (error) {
      handleMutationError(error, "Unable to close POS session.")
    }
  }

  const handleStartDraft = async () => {
    if (!currentSession) {
      toast.error("Open a session before creating a draft order.")
      return
    }

    try {
      await createOrGetDraftOrder({
        session_id: currentSession.id,
        customer_id: customerId || undefined,
        table_id: tableId || undefined,
      }).unwrap()
      toast.success("Draft order ready")
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to start a draft order.")
      throw error
    }
  }

  const handleAssignCustomer = async (nextCustomerId: string | null) => {
    setCustomerId(nextCustomerId || "")

    if (!currentOrder) {
      toast.success(nextCustomerId ? "Customer saved for the next draft order." : "Walk-in sale selected.")
      return
    }

    try {
      await partialUpdateOrder({
        id: currentOrder.id,
        data: { customer: nextCustomerId },
      }).unwrap()
      toast.success(nextCustomerId ? "Customer assigned to the current sale." : "Customer cleared from the sale.")
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to update the order customer.")
      throw error
    }
  }

  const handleAssignTable = async (nextTableId: string | null) => {
    setTableId(nextTableId || "")

    if (!currentOrder) {
      toast.success(nextTableId ? "Table saved for the next draft order." : "Counter service selected.")
      return
    }

    try {
      await partialUpdateOrder({
        id: currentOrder.id,
        data: { table: nextTableId },
      }).unwrap()
      toast.success(nextTableId ? "Table assigned to the current sale." : "Table cleared from the sale.")
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to update the table assignment.")
      throw error
    }
  }

  const handleRetrieveHeldOrder = async (heldOrder: POSHoldOrder) => {
    if (!currentSession) {
      toast.error("Open a session before retrieving a held order.")
      return
    }

    try {
      await retrieveHeldOrder({
        hold_order_id: heldOrder.id,
        session_id: currentSession.id,
      }).unwrap()
      toast.success("Held order restored into the current session")
      setHeldOrdersDialogOpen(false)
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to retrieve the held order.")
      throw error
    }
  }

  const handleAddVariant = async (variantId: string) => {
    if (!currentOrder) {
      toast.error("Create or resume a draft order before adding items.")
      return
    }

    try {
      await addItemToOrder({
        orderId: currentOrder.id,
        variant_id: variantId,
        quantity: variantQuantities[variantId] || "1",
      }).unwrap()
      toast.success("Variant added to the current sale")
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to add the variant to the order.")
      throw error
    }
  }

  const handleUpdateItemQuantity = async (item: POSOrderItem) => {
    if (!currentOrder) {
      return
    }

    try {
      await updateOrderItem({
        orderId: currentOrder.id,
        item_id: item.id,
        quantity: itemQuantities[item.id] || String(item.quantity),
      }).unwrap()
      toast.success("Order quantity updated")
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to update the order item.")
      throw error
    }
  }

  const handleRemoveItem = async (item: POSOrderItem) => {
    if (!currentOrder) {
      return
    }

    try {
      await removeOrderItem({
        orderId: currentOrder.id,
        itemId: item.id,
      }).unwrap()
      toast.success("Order item removed")
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to remove the order item.")
      throw error
    }
  }

  const handleApplyDiscount = async () => {
    if (!currentOrder) {
      return
    }

    try {
      await applyDiscountToOrder({
        id: currentOrder.id,
        discount_percent: discountPercent || undefined,
        discount_amount: discountAmount || undefined,
      }).unwrap()
      toast.success("Discount applied")
      await refreshOrderScope()
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
      await addTipToOrder({
        id: currentOrder.id,
        tip_amount: tipAmount || undefined,
        tip_percent: tipPercent || undefined,
      }).unwrap()
      toast.success("Tip updated")
      await refreshOrderScope()
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
      await holdOrder({
        orderId: currentOrder.id,
        hold_reason: holdReason,
      }).unwrap()
      toast.success("Order moved to held carts")
      await refreshOrderScope()
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
      await cancelOrder(currentOrder.id).unwrap()
      toast.success("Order cancelled")
      await refreshOrderScope()
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
      id: currentOrder.id,
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

    try {
      if (action === "request") {
        await requestOrderReservation(payload).unwrap()
      } else if (action === "confirm") {
        await confirmOrderReservation(payload).unwrap()
      } else if (action === "release") {
        await releaseOrderReservation(payload).unwrap()
      } else if (action === "fulfill") {
        await confirmOrderFulfillment(payload).unwrap()
      } else {
        await markOrderInventoryFailed(payload).unwrap()
      }
      toast.success("Inventory workflow updated")
      await refreshOrderScope()
    } catch (error) {
      handleMutationError(error, "Unable to update inventory workflow.")
      throw error
    }
  }

  const handleProcessPayment = async ({
    paymentMethod,
    amount,
    cashReceived,
    referenceNumber,
    emailAddress,
    printReceipt,
  }: PaymentSubmission) => {
    if (!currentOrder) {
      return
    }

    try {
      await processPayment({
        orderId: currentOrder.id,
        payments: [
          {
            payment_method: paymentMethod,
            amount,
            cash_received: paymentMethod === "cash" && cashReceived ? cashReceived : undefined,
            reference_number: referenceNumber || undefined,
          },
        ],
        create_receipt: true,
        print_receipt: printReceipt,
        email_receipt: !!emailAddress,
        email_address: emailAddress || undefined,
      }).unwrap()
      toast.success("Payment processed")
      await Promise.all([refreshOrderScope(), refreshSessionScope()])
    } catch (error) {
      handleMutationError(error, "Unable to process payment.")
      throw error
    }
  }

  const liveSessionCount = sessions.filter((session: POSSession) => session.status === "open").length
  const orderHasInventory = inventorySummary?.items?.some((item) => !!item.inventory_item_id) ?? false
  const inventoryBusy =
    requestingReservation ||
    confirmingReservation ||
    releasingReservation ||
    confirmingFulfillment ||
    markingInventoryFailed

  const customerLabel =
    currentOrder?.customer_name ||
    (customerId ? customerMap[customerId]?.name || "Saved customer" : "Walk-in")

  const tableLookup = tableId ? tableMap[tableId] : undefined
  const tableLabel = currentOrder?.table_number
    ? `Table ${currentOrder.table_number}`
    : tableLookup?.name || (tableLookup?.number ? `Table ${tableLookup.number}` : "Counter")

  const terminalName = currentSession?.terminal
    ? terminalMap[currentSession.terminal]?.name || currentSession.terminal
    : terminalMap[terminalId]?.name

  return (
    <>
      <div className="space-y-5">
        <POSCashierHeader
          hasCurrentSession={hasCurrentSession}
          currentSession={currentSession}
          currentOrder={currentOrder}
          terminalName={terminalName}
          currencyCode={currentConfiguration?.currency || currencyCode}
          heldOrderCount={heldOrders.length}
          liveSessionCount={liveSessionCount}
          closingBalance={closingBalance}
          onClosingBalanceChange={setClosingBalance}
          onOpenSession={() => setSessionDialogOpen(true)}
          onOpenHeldOrders={() => setHeldOrdersDialogOpen(true)}
          onCloseSession={() => void handleCloseSession()}
          isClosingSession={closingSession}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <POSCatalogPanel
              currencyCode={currentConfiguration?.currency || currencyCode}
              catalogQuery={catalogQuery}
              onCatalogQueryChange={setCatalogQuery}
              deferredCatalogQuery={deferredCatalogQuery}
              searchResults={searchResults as ProductVariant[]}
              featuredResults={featuredVariantResults}
              searchingCatalog={searchingCatalog}
              variantQuantities={variantQuantities}
              onVariantQuantityChange={(variantId, value) =>
                setVariantQuantities((current) => ({ ...current, [variantId]: value }))
              }
              onAddVariant={handleAddVariant}
              canAddToOrder={!!currentOrder}
              isAdding={addingItem}
            />
          </div>

          <div className="min-w-0">
            <POSCartPanel
              currentOrder={currentOrder}
              currencyCode={currentConfiguration?.currency || currencyCode}
              customerLabel={customerLabel}
              tableLabel={tableLabel}
              heldOrderCount={heldOrders.length}
              itemQuantities={itemQuantities}
              onItemQuantityChange={(itemId, value) =>
                setItemQuantities((current) => ({ ...current, [itemId]: value }))
              }
              onUpdateItem={handleUpdateItemQuantity}
              onRemoveItem={handleRemoveItem}
              onOpenCustomer={() => setCustomerDialogOpen(true)}
              onOpenTable={() => setTableDialogOpen(true)}
              onOpenHeldOrders={() => setHeldOrdersDialogOpen(true)}
              onOpenPayment={() => setPaymentDialogOpen(true)}
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
              canStartDraft={hasCurrentSession}
              isCreatingDraft={creatingDraft}
              isUpdatingItem={updatingItem}
              isRemovingItem={removingItem}
              isApplyingDiscount={applyingDiscount}
              isAddingTip={addingTip}
              isHoldingOrder={holdingOrder}
              isCancellingOrder={cancellingOrder}
            />
          </div>
        </div>
      </div>

      <POSSessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        terminals={terminals}
        currentConfiguration={currentConfiguration}
        currencyCode={currencyCode}
        terminalId={terminalId}
        openingBalance={openingBalance}
        onTerminalChange={setTerminalId}
        onOpeningBalanceChange={setOpeningBalance}
        onOpenSession={() => void handleOpenSession()}
        isOpening={openingSession}
      />

      <POSCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customers={customers}
        onAssignCustomer={handleAssignCustomer}
      />

      <POSTableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        tables={tables}
        onAssignTable={handleAssignTable}
      />

      <POSHeldOrdersDialog
        open={heldOrdersDialogOpen}
        onOpenChange={setHeldOrdersDialogOpen}
        heldOrders={heldOrders}
        onRestore={handleRetrieveHeldOrder}
        isRestoring={retrievingHeldOrder}
      />

      <POSPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        order={currentOrder}
        currencyCode={currentConfiguration?.currency || currencyCode}
        defaultPrintReceipt={!!currentConfiguration?.auto_print_receipt}
        isProcessing={processingPayment}
        onSubmit={handleProcessPayment}
      />

      <POSInventorySheet
        open={inventorySheetOpen}
        onOpenChange={setInventorySheetOpen}
        currentOrder={currentOrder}
        inventorySummary={inventorySummary}
        getDraftItem={resolveDraftItem}
        failureReason={failureReason}
        onFailureReasonChange={setFailureReason}
        onAction={handleInventoryAction}
        isBusy={inventoryBusy}
      />
    </>
  )
}
