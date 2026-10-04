"use client"

import { useMemo, useState } from "react"
import { Calculator, CheckCircle2, FileText, RotateCcw, Scale } from "lucide-react"
import { toast } from "react-toastify"
import { hasPermission } from "@/lib/permissionsGuard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCaptureValuationMutation,
  useCompleteCustomerReturnMutation,
  useCreateCustomerReturnMutation,
  useGetSalesMarginQuery,
  useListCustomerReturnsQuery,
  useListJournalEntriesQuery,
  useListValuationSnapshotsQuery,
} from "@/redux/features/accounting/accountingApiSlice"
import type { MarginRow } from "@/redux/features/accounting/accountingTypes"

const money = (value: string | number | null | undefined, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0))

const errorMessage = (error: unknown) => {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { detail?: string; error?: string } }).data
    return data?.detail || data?.error || "The accounting request could not be completed."
  }
  return "The accounting service is unavailable. Try again shortly."
}

export default function AccountingWorkspace() {
  const canReadInventory = hasPermission("read_inventory")
  const canManageInventory = hasPermission("manage_inventory") || hasPermission("manage_inventory_settings")
  const [returnLineId, setReturnLineId] = useState("")
  const [returnQuantity, setReturnQuantity] = useState("")
  const [returnLocationId, setReturnLocationId] = useState("")
  const [selectedReturnId, setSelectedReturnId] = useState<string | number | null>(null)
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().slice(0, 10))

  const margin = useGetSalesMarginQuery(undefined, { skip: !canReadInventory })
  const returns = useListCustomerReturnsQuery(undefined, { skip: !canReadInventory })
  const journals = useListJournalEntriesQuery(undefined, { skip: !canReadInventory })
  const valuations = useListValuationSnapshotsQuery(undefined, { skip: !canReadInventory })
  const [createReturn, createReturnState] = useCreateCustomerReturnMutation()
  const [completeReturn, completeReturnState] = useCompleteCustomerReturnMutation()
  const [captureValuation, captureValuationState] = useCaptureValuationMutation()

  const marginTotals = useMemo(() => (margin.data?.products || []).reduce(
    (totals, row) => ({
      revenue: totals.revenue + Number(row.revenue || 0),
      cogs: totals.cogs + Number(row.cogs || 0),
      grossMargin: totals.grossMargin + Number(row.gross_margin || 0),
    }),
    { revenue: 0, cogs: 0, grossMargin: 0 },
  ), [margin.data])

  if (!canReadInventory) {
    return <div className="mx-auto w-full max-w-5xl px-4 py-10"><Card><CardHeader><CardTitle>Accounting access is restricted</CardTitle><CardDescription>Your current workspace permissions do not include inventory reporting.</CardDescription></CardHeader></Card></div>
  }

  const submitReturn = async () => {
    if (!returnLineId || !returnQuantity) {
      toast.error("Enter the shipped line ID and quantity to return.")
      return
    }
    try {
      await createReturn({ return_items: [{ shipment_line_id: returnLineId, quantity: returnQuantity }] }).unwrap()
      setReturnLineId("")
      setReturnQuantity("")
      toast.success("Customer return recorded.")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const receiveReturn = async () => {
    if (!selectedReturnId || !returnLocationId) {
      toast.error("Choose a return and enter the receiving stock location ID.")
      return
    }
    try {
      await completeReturn({ id: selectedReturnId, location_id: returnLocationId }).unwrap()
      setSelectedReturnId(null)
      toast.success("Return received into stock and accounting reversed.")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const captureSnapshot = async () => {
    try {
      await captureValuation({ snapshot_date: snapshotDate, costing_method: "actual" }).unwrap()
      toast.success("Inventory valuation snapshot captured.")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="settings-hub-workspace mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 lg:px-8 2xl:px-10">
      <Card className="settings-hub-hero">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Financial control</p>
              <CardTitle className="mt-3 text-3xl tracking-tight">Accounting and profitability</CardTitle>
              <CardDescription className="mt-3 max-w-3xl">Review shipped gross margin, receive customer returns with COGS reversal, inspect immutable journal entries, and capture period-end inventory valuation.</CardDescription>
            </div>
            <Calculator className="h-9 w-9 text-teal-700" />
          </div>
        </CardHeader>
        <CardContent>
          {margin.isLoading ? <p className="text-sm text-gray-500">Loading accounting metrics...</p> : margin.isError ? <p className="text-sm text-red-600">{errorMessage(margin.error)}</p> : <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Revenue" value={money(marginTotals.revenue)} />
            <Metric label="COGS" value={money(marginTotals.cogs)} />
            <Metric label="Gross margin" value={money(marginTotals.grossMargin)} />
          </div>}
        </CardContent>
      </Card>

      <Tabs defaultValue="margin" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 border border-gray-200 bg-white p-2">
          <TabsTrigger value="margin"><Scale className="mr-2 h-4 w-4" />Margin</TabsTrigger>
          <TabsTrigger value="returns"><RotateCcw className="mr-2 h-4 w-4" />Customer returns</TabsTrigger>
          <TabsTrigger value="journals"><FileText className="mr-2 h-4 w-4" />Journals</TabsTrigger>
          <TabsTrigger value="valuation"><Calculator className="mr-2 h-4 w-4" />Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="margin"><Card><CardHeader><CardTitle>Gross margin by item</CardTitle><CardDescription>Margin is based on immutable shipped-line revenue and stock-unit COGS snapshots.</CardDescription></CardHeader><CardContent><Rows loading={margin.isLoading} error={margin.error} rows={margin.data?.products || []} /></CardContent></Card></TabsContent>

        <TabsContent value="returns" className="space-y-4">
          {canManageInventory ? <Card><CardHeader><CardTitle>Record customer return</CardTitle><CardDescription>Enter a shipped-line ID and quantity. Stock is restored only when the return is received.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-3"><Field label="Shipment line ID" value={returnLineId} onChange={setReturnLineId} /><Field label="Quantity returned" value={returnQuantity} onChange={setReturnQuantity} /><div className="flex items-end"><Button onClick={submitReturn} disabled={createReturnState.isLoading}>{createReturnState.isLoading ? "Recording..." : "Record return"}</Button></div></CardContent></Card> : null}
          <Card><CardHeader><CardTitle>Return queue</CardTitle><CardDescription>Pending returns can be received into a stock location once inspected.</CardDescription></CardHeader><CardContent className="space-y-3">{returns.isLoading ? <p className="text-sm text-gray-500">Loading returns...</p> : returns.isError ? <p className="text-sm text-red-600">{errorMessage(returns.error)}</p> : (returns.data || []).length ? (returns.data || []).map((item) => <div key={String(item.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4"><div><p className="font-semibold text-gray-900">{item.reference}</p><p className="text-sm text-gray-500">{item.status} · {item.lines?.map((line) => line.inventory_name || "Inventory item").join(", ")}</p></div><div className="flex items-center gap-2"><Button variant={selectedReturnId === item.id ? "default" : "outline"} size="sm" onClick={() => setSelectedReturnId(item.id)}>{selectedReturnId === item.id ? "Selected" : "Receive"}</Button></div></div>) : <p className="text-sm text-gray-500">No customer returns recorded.</p>}{selectedReturnId ? <div className="flex flex-wrap items-end gap-3 border-t border-gray-200 pt-4"><Field label="Receiving location ID" value={returnLocationId} onChange={setReturnLocationId} /><Button onClick={receiveReturn} disabled={completeReturnState.isLoading}>{completeReturnState.isLoading ? "Receiving..." : "Receive return"}</Button></div> : null}</CardContent></Card>
        </TabsContent>

        <TabsContent value="journals"><Card><CardHeader><CardTitle>Journal entries</CardTitle><CardDescription>Double-entry records created by sales and customer-return workflows.</CardDescription></CardHeader><CardContent>{journals.isLoading ? <p className="text-sm text-gray-500">Loading journal entries...</p> : journals.isError ? <p className="text-sm text-red-600">{errorMessage(journals.error)}</p> : <div className="space-y-3">{(journals.data || []).map((entry) => <div key={String(entry.id)} className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-gray-900">{entry.entry_type} · {entry.reference_type}</p><span className="text-sm text-gray-500">{entry.entry_date}</span></div><p className="mt-1 text-sm text-gray-600">{entry.memo || "No memo"}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{entry.lines.map((line) => <div key={String(line.id)} className="flex justify-between rounded-xl bg-white px-3 py-2 text-sm"><span>{line.account_code}</span><span>{Number(line.debit) ? `Dr ${money(line.debit, entry.currency_code)}` : `Cr ${money(line.credit, entry.currency_code)}`}</span></div>)}</div></div>)}{!journals.data?.length ? <p className="text-sm text-gray-500">No journal entries recorded yet.</p> : null}</div>}</CardContent></Card></TabsContent>

        <TabsContent value="valuation"><Card><CardHeader><CardTitle>Inventory valuation snapshots</CardTitle><CardDescription>Capture a repeat-safe period-end snapshot using the selected costing method.</CardDescription></CardHeader><CardContent><div className="mb-5 flex flex-wrap items-end gap-3"><Field label="Snapshot date" value={snapshotDate} onChange={setSnapshotDate} type="date" /><Button onClick={captureSnapshot} disabled={captureValuationState.isLoading}>{captureValuationState.isLoading ? "Capturing..." : "Capture snapshot"}</Button></div>{valuations.isLoading ? <p className="text-sm text-gray-500">Loading valuation snapshots...</p> : valuations.isError ? <p className="text-sm text-red-600">{errorMessage(valuations.error)}</p> : <div className="overflow-x-auto"><table className="app-table w-full text-left text-sm"><thead><tr><th className="px-3 py-3">Item</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Method</th><th className="px-3 py-3 text-right">Quantity</th><th className="px-3 py-3 text-right">Value</th></tr></thead><tbody>{(valuations.data || []).map((snapshot) => <tr key={String(snapshot.id)}><td className="px-3 py-3">{snapshot.inventory_item_name || snapshot.inventory_item}</td><td className="px-3 py-3">{snapshot.stock_location_name || snapshot.stock_location}</td><td className="px-3 py-3">{snapshot.costing_method}</td><td className="px-3 py-3 text-right">{snapshot.quantity_on_hand}</td><td className="px-3 py-3 text-right">{money(snapshot.total_value, snapshot.currency_code)}</td></tr>)}</tbody></table>{!valuations.data?.length ? <p className="py-4 text-sm text-gray-500">No valuation snapshots captured yet.</p> : null}</div>}</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-gray-200 bg-white/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p></div> }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="min-w-[220px] flex-1"><Label>{label}</Label><Input className="mt-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div> }
function Rows({ loading, error, rows }: { loading: boolean; error: unknown; rows: MarginRow[] }) { if (loading) return <p className="text-sm text-gray-500">Loading margin rows...</p>; if (error) return <p className="text-sm text-red-600">{errorMessage(error)}</p>; return <div className="space-y-3">{rows.map((row, index) => <div key={`${String(row.inventory_item_name || "item")}-${index}`} className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-4"><div className="font-semibold text-gray-900">{row.inventory_item_name || "Inventory item"}</div><div><span className="text-xs text-gray-500">Revenue</span><p>{money(row.revenue)}</p></div><div><span className="text-xs text-gray-500">COGS</span><p>{money(row.cogs)}</p></div><div><span className="text-xs text-gray-500">Gross margin</span><p className="font-semibold text-emerald-700">{money(row.gross_margin)}</p></div></div>)}{!rows.length ? <p className="text-sm text-gray-500">No shipped sales are available for margin reporting yet.</p> : null}</div> }
