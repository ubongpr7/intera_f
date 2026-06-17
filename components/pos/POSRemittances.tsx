"use client"

import { useMemo, useState } from "react"
import { ArrowRightLeft, Landmark, ShieldAlert, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/currency-utils"
import {
  useDepositRemittanceMutation,
  useDisputeRemittanceMutation,
  useGetRemittancesQuery,
  useHandoverRemittanceMutation,
  useReceiveRemittanceMutation,
  useReconcileRemittanceMutation,
} from "@/redux/features/pos/posAPISlice"
import type {
  POSRemittance,
  POSRemittanceDestinationType,
  POSRemittanceStatus,
} from "@/redux/features/pos/posTypes"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-toastify"

type RemittanceAction = "handover" | "receive" | "deposit" | "reconcile" | "dispute"

const statusOptions: SelectOption[] = [
  { value: "all", label: "All statuses" },
  { value: "pending_handover", label: "Pending handover" },
  { value: "handed_over", label: "Handed over" },
  { value: "received", label: "Received" },
  { value: "deposited", label: "Deposited" },
  { value: "reconciled", label: "Reconciled" },
  { value: "disputed", label: "Disputed" },
]

const destinationOptions: SelectOption[] = [
  { value: "branch_safe", label: "Branch safe" },
  { value: "central_vault", label: "Central vault" },
  { value: "bank", label: "Bank" },
  { value: "owner", label: "Owner" },
  { value: "other", label: "Other" },
]

const statusTone = (status: POSRemittanceStatus) => {
  switch (status) {
    case "reconciled":
      return "bg-green-100 text-green-800"
    case "deposited":
      return "bg-blue-100 text-blue-800"
    case "disputed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-amber-100 text-amber-800"
  }
}

const titleForAction = (action: RemittanceAction) => {
  if (action === "handover") return "Record handover"
  if (action === "receive") return "Mark received"
  if (action === "deposit") return "Mark deposited"
  if (action === "reconcile") return "Reconcile remittance"
  return "Dispute remittance"
}

export default function POSRemittances({ currencyCode }: { currencyCode: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRemittance, setSelectedRemittance] = useState<POSRemittance | null>(null)
  const [action, setAction] = useState<RemittanceAction | null>(null)
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [reason, setReason] = useState("")
  const [destinationType, setDestinationType] = useState<POSRemittanceDestinationType>("branch_safe")
  const [destinationReference, setDestinationReference] = useState("")

  const params = statusFilter === "all" ? undefined : { status: statusFilter }
  const { data: remittances = [], refetch } = useGetRemittancesQuery(params)
  const [handoverRemittance, { isLoading: handingOver }] = useHandoverRemittanceMutation()
  const [receiveRemittance, { isLoading: receiving }] = useReceiveRemittanceMutation()
  const [depositRemittance, { isLoading: depositing }] = useDepositRemittanceMutation()
  const [reconcileRemittance, { isLoading: reconciling }] = useReconcileRemittanceMutation()
  const [disputeRemittance, { isLoading: disputing }] = useDisputeRemittanceMutation()

  const busy = handingOver || receiving || depositing || reconciling || disputing
  const openItems = remittances.filter((item) => item.status !== "reconciled").length
  const expectedTotal = remittances.reduce((sum, item) => sum + Number(item.expected_amount ?? 0), 0)
  const depositedTotal = remittances.reduce((sum, item) => sum + Number(item.deposited_amount ?? 0), 0)
  const openingMismatchCount = remittances.filter(
    (item) => Math.abs(Number(item.next_session_opening_variance_amount ?? 0)) > 0.0001,
  ).length

  const resetForm = () => {
    setAmount("")
    setNotes("")
    setReason("")
    setDestinationType("branch_safe")
    setDestinationReference("")
  }

  const openAction = (remittance: POSRemittance, nextAction: RemittanceAction) => {
    setSelectedRemittance(remittance)
    setAction(nextAction)
    setAmount("")
    setNotes("")
    setReason("")
    setDestinationType(remittance.destination_type || "branch_safe")
    setDestinationReference(remittance.destination_reference || "")
  }

  const summaryCards = useMemo(
    () => [
      { label: "Open remittances", value: openItems, icon: Wallet },
      { label: "Expected cash", value: formatCurrency(currencyCode, expectedTotal), icon: ArrowRightLeft },
      { label: "Deposited", value: formatCurrency(currencyCode, depositedTotal), icon: Landmark },
      { label: "Opening mismatches", value: openingMismatchCount, icon: ShieldAlert },
    ],
    [currencyCode, depositedTotal, expectedTotal, openItems, openingMismatchCount],
  )

  const submitAction = async () => {
    if (!selectedRemittance || !action) {
      return
    }
    const payload = {
      id: selectedRemittance.id,
      amount: amount || undefined,
      notes: notes || undefined,
      reason: reason || undefined,
      destination_type: destinationType,
      destination_reference: destinationReference || undefined,
    }

    try {
      if (action === "handover") {
        await handoverRemittance(payload).unwrap()
      } else if (action === "receive") {
        await receiveRemittance(payload).unwrap()
      } else if (action === "deposit") {
        await depositRemittance(payload).unwrap()
      } else if (action === "reconcile") {
        await reconcileRemittance(payload).unwrap()
      } else {
        await disputeRemittance(payload).unwrap()
      }
      toast.success("Remittance updated")
      setSelectedRemittance(null)
      setAction(null)
      resetForm()
      await refetch()
    } catch (error) {
      toast.error("Unable to update remittance")
    }
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl tracking-tight">Cash control and remittance</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                Track session cash from drawer close to handover, receipt, deposit, and final reconciliation.
              </CardDescription>
            </div>
            <div className="w-full max-w-xs">
              <ReactSelectField
                inputId="remittance-status-filter"
                value={statusOptions.find((option) => option.value === statusFilter) ?? null}
                onChange={(option) => setStatusFilter(String((option as SelectOption | null)?.value ?? "all"))}
                options={statusOptions}
                isClearable={false}
                label="Filter by status"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{item.label}</div>
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-gray-900">{item.value}</div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {remittances.map((remittance) => (
              <div key={remittance.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{remittance.terminal_name || "Terminal remittance"}</div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                      Session {remittance.session.slice(0, 8)} • destination {remittance.destination_type.replaceAll("_", " ")}
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(remittance.status)}`}>
                    {remittance.status.replaceAll("_", " ")}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Expected</div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(currencyCode, Number(remittance.expected_amount ?? 0))}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Counted</div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(currencyCode, Number(remittance.counted_amount ?? 0))}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Deposited</div>
                    <div className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(currencyCode, Number(remittance.deposited_amount ?? 0))}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Variance</div>
                    <div className={`mt-2 text-lg font-semibold ${Number(remittance.variance_amount ?? 0) === 0 ? "text-gray-900" : "text-amber-700"}`}>
                      {formatCurrency(currencyCode, Number(remittance.variance_amount ?? 0))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {remittance.status === "pending_handover" ? (
                    <Button size="sm" onClick={() => openAction(remittance, "handover")}>Record handover</Button>
                  ) : null}
                  {remittance.status === "handed_over" ? (
                    <Button size="sm" onClick={() => openAction(remittance, "receive")}>Mark received</Button>
                  ) : null}
                  {remittance.status === "received" ? (
                    <Button size="sm" onClick={() => openAction(remittance, "deposit")}>Mark deposited</Button>
                  ) : null}
                  {remittance.status === "deposited" ? (
                    <Button size="sm" onClick={() => openAction(remittance, "reconcile")}>Reconcile</Button>
                  ) : null}
                  {remittance.status !== "reconciled" ? (
                    <Button size="sm" variant="outline" onClick={() => openAction(remittance, "dispute")}>
                      <ShieldAlert className="h-4 w-4" />
                      Dispute
                    </Button>
                  ) : null}
                </div>

                {remittance.next_session_id ? (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 ${
                      Math.abs(Number(remittance.next_session_opening_variance_amount ?? 0)) > 0.0001
                        ? "border-amber-200 bg-amber-50"
                        : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Next session verification</div>
                    <div className="mt-2 text-sm text-gray-900">
                      Cashier {remittance.next_session_user_id ?? "Unknown"} opened the next session with{" "}
                      {formatCurrency(currencyCode, Number(remittance.next_session_opening_balance ?? 0))}.
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Expected</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">
                          {formatCurrency(currencyCode, Number(remittance.next_session_expected_opening_balance ?? 0))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Counted</div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">
                          {formatCurrency(currencyCode, Number(remittance.next_session_opening_balance ?? 0))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Variance</div>
                        <div
                          className={`mt-1 text-sm font-semibold ${
                            Math.abs(Number(remittance.next_session_opening_variance_amount ?? 0)) > 0.0001
                              ? "text-amber-800"
                              : "text-green-800"
                          }`}
                        >
                          {formatCurrency(currencyCode, Number(remittance.next_session_opening_variance_amount ?? 0))}
                        </div>
                      </div>
                    </div>
                    {remittance.next_session_opening_variance_reason ? (
                      <div className="mt-3 text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {remittance.next_session_opening_variance_reason}
                      </div>
                    ) : Math.abs(Number(remittance.next_session_opening_variance_amount ?? 0)) <= 0.0001 ? (
                      <div className="mt-3 text-sm text-green-800">The next cashier confirmed the opening cash matched the prior close or handover.</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    No next-session opening verification has been recorded for this terminal yet.
                  </div>
                )}
              </div>
            ))}

            {remittances.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600 xl:col-span-2">
                No remittance records match this filter yet. Closing a POS session with cash will create one automatically.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedRemittance && !!action} onOpenChange={(open) => !open && (setSelectedRemittance(null), setAction(null), resetForm())}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="pr-8">
            <SheetTitle>{action ? titleForAction(action) : "Update remittance"}</SheetTitle>
            <SheetDescription>
              Keep the cash trail complete from terminal handover to final deposit.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {action === "handover" || action === "receive" || action === "deposit" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" step="0.01" placeholder="Leave blank to use the session amount" />
              </div>
            ) : null}

            {action === "handover" || action === "deposit" ? (
              <>
                <ReactSelectField
                  inputId="remittance-destination-type"
                  label="Destination"
                  value={destinationOptions.find((option) => option.value === destinationType) ?? null}
                  onChange={(option) => setDestinationType(String((option as SelectOption | null)?.value ?? "branch_safe") as POSRemittanceDestinationType)}
                  options={destinationOptions}
                  isClearable={false}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination reference</label>
                  <Input value={destinationReference} onChange={(event) => setDestinationReference(event.target.value)} placeholder="Bank slip, vault ticket, or handover code" />
                </div>
              </>
            ) : null}

            {action === "dispute" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dispute reason</label>
                <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain the shortfall, mismatch, or issue" />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add any operational note for the audit trail" />
            </div>
          </div>

          <SheetFooter className="mt-6 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => { setSelectedRemittance(null); setAction(null); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={() => void submitAction()} disabled={busy || (action === "dispute" && !reason.trim())}>
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
