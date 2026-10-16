"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useCreateWarehouseConfigurationMutation,
  useCreateWarehouseZoneMutation,
  useCreateCycleCountScheduleMutation,
  useListCycleCountSchedulesQuery,
  useCreateStockCountSessionMutation,
  useListStockCountSessionsQuery,
  useRecordStockCountLinesMutation,
  useSubmitStockCountMutation,
  useApproveStockCountMutation,
  useGetWarehouseConfigurationQuery,
  useGetWarehouseReportQuery,
  useListWarehouseZonesQuery,
  useUpdateWarehouseConfigurationMutation,
} from "@/redux/features/stock/stockAPISlice"
import type { StockLocation } from "@/redux/features/stock/stockTypes"

export default function WarehouseConfigurationPanel({ locationId, operationalLocations }: { locationId: string; operationalLocations: StockLocation[] }) {
  const { data: config, refetch: refetchConfig } = useGetWarehouseConfigurationQuery(locationId)
  const { data: report } = useGetWarehouseReportQuery(locationId)
  const { data: zones = [], refetch: refetchZones } = useListWarehouseZonesQuery(locationId)
  const { data: countSchedules = [], refetch: refetchSchedules } = useListCycleCountSchedulesQuery(locationId)
  const { data: countSessions = [], refetch: refetchSessions } = useListStockCountSessionsQuery(locationId)
  const [createConfig, { isLoading: savingConfig }] = useCreateWarehouseConfigurationMutation()
  const [updateConfig, { isLoading: updatingConfig }] = useUpdateWarehouseConfigurationMutation()
  const [createZone, { isLoading: savingZone }] = useCreateWarehouseZoneMutation()
  const [createSchedule, { isLoading: savingSchedule }] = useCreateCycleCountScheduleMutation()
  const [createSession, { isLoading: creatingSession }] = useCreateStockCountSessionMutation()
  const [recordCountLines, { isLoading: recordingCounts }] = useRecordStockCountLinesMutation()
  const [submitCount, { isLoading: submittingCount }] = useSubmitStockCountMutation()
  const [approveCount, { isLoading: approvingCount }] = useApproveStockCountMutation()
  const [form, setForm] = useState({ receiving_strategy: "standard", picking_strategy: "fifo", putaway_strategy: "manual", capacity: "0", cycle_count_frequency_days: "30", default_transfer_mode: "manual" })
  const [zone, setZone] = useState({ name: "", code: "", kind: "zone", capacity: "0" })
  const [countDays, setCountDays] = useState("30")
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [countValues, setCountValues] = useState<Record<string, string>>({})
  const [varianceLocationId, setVarianceLocationId] = useState(operationalLocations[0]?.id ? String(operationalLocations[0].id) : "")

  useEffect(() => {
    if (!config) return
    setForm({
      receiving_strategy: config.receiving_strategy || "standard",
      picking_strategy: config.picking_strategy || "fifo",
      putaway_strategy: config.putaway_strategy || "manual",
      capacity: String(config.capacity ?? "0"),
      cycle_count_frequency_days: String(config.cycle_count_frequency_days ?? 30),
      default_transfer_mode: config.default_transfer_mode || "manual",
    })
  }, [config])

  const saveConfig = async () => {
    try {
      const payload = { ...form, capacity: form.capacity, cycle_count_frequency_days: Number(form.cycle_count_frequency_days) }
      if (config) await updateConfig({ id: config.id, data: payload }).unwrap()
      else await createConfig({ location: locationId, ...payload }).unwrap()
      toast.success("Warehouse policy saved.")
      await refetchConfig()
    } catch { toast.error("Unable to save warehouse policy.") }
  }
  const saveZone = async () => {
    if (!zone.name.trim() || !zone.code.trim()) return toast.error("Zone name and code are required.")
    try {
      await createZone({ location: locationId, ...zone, capacity: zone.capacity }).unwrap()
      setZone({ name: "", code: "", kind: "zone", capacity: "0" })
      toast.success("Warehouse zone added.")
      await refetchZones()
    } catch { toast.error("Unable to add warehouse zone.") }
  }
  const saveSchedule = async () => {
    try {
      await createSchedule({ location: locationId, frequency_days: Number(countDays), variance_tolerance: 0, active: true }).unwrap()
      toast.success("Cycle-count schedule added.")
      await refetchSchedules()
    } catch { toast.error("Unable to add cycle-count schedule.") }
  }
  const startCount = async () => {
    try { const session = await createSession({ location: locationId }).unwrap(); setSelectedSessionId(session.id); toast.success("Count session opened."); await refetchSessions() }
    catch { toast.error("Unable to open count session.") }
  }
  const selectedSession = countSessions.find((session) => session.id === selectedSessionId)
  const saveCounts = async () => {
    if (!selectedSession) return
    try {
      await recordCountLines({
        id: selectedSession.id,
        lines: selectedSession.lines.map((line) => ({ id: line.id, counted_quantity: countValues[line.id] ?? String(line.counted_quantity ?? "") })),
      }).unwrap()
      toast.success("Count quantities saved.")
      await refetchSessions()
    } catch { toast.error("Unable to save count quantities.") }
  }
  const submitSelectedCount = async () => {
    if (!selectedSession) return
    try { await submitCount(selectedSession.id).unwrap(); toast.success("Count submitted for approval."); await refetchSessions() }
    catch { toast.error("Record every line before submitting the count.") }
  }
  const approveSelectedCount = async () => {
    if (!selectedSession || !varianceLocationId) return toast.error("Choose an operational location for the variance.")
    try { await approveCount({ id: selectedSession.id, stock_location_id: varianceLocationId }).unwrap(); toast.success("Count variance approved."); await refetchSessions() }
    catch { toast.error("Unable to approve this count variance.") }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6"><CardTitle className="text-lg">Warehouse configuration</CardTitle><CardDescription>Set warehouse policies, capacity, and physical zones without leaving the location view.</CardDescription></CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border bg-muted/20 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Stock quantity</div><div className="mt-1 text-xl font-semibold">{String(report?.stock_summary?.total_quantity ?? "0")}</div></div>
          <div className="rounded-xl border bg-muted/20 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Inventory items</div><div className="mt-1 text-xl font-semibold">{String(report?.stock_summary?.inventory_item_count ?? "0")}</div></div>
          <div className="rounded-xl border bg-muted/20 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Expiring soon</div><div className="mt-1 text-xl font-semibold">{String(report?.stock_summary?.expiring_soon_count ?? "0")}</div></div>
          <div className="rounded-xl border bg-muted/20 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</div><div className="mt-1 text-xl font-semibold">{String(report?.capacity ?? config?.capacity ?? "0")}</div></div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.receiving_strategy} onChange={(e) => setForm({ ...form, receiving_strategy: e.target.value })}><option value="standard">Standard receiving</option><option value="blind">Blind receiving</option><option value="dock_to_stock">Dock to stock</option></select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.picking_strategy} onChange={(e) => setForm({ ...form, picking_strategy: e.target.value })}><option value="fifo">FIFO picking</option><option value="fefo">FEFO picking</option><option value="lifo">LIFO picking</option></select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.putaway_strategy} onChange={(e) => setForm({ ...form, putaway_strategy: e.target.value })}><option value="manual">Manual put-away</option><option value="nearest">Nearest available</option><option value="fixed">Fixed location</option></select>
          <Input type="number" min="0" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <Input type="number" min="0" placeholder="Cycle count frequency (days)" value={form.cycle_count_frequency_days} onChange={(e) => setForm({ ...form, cycle_count_frequency_days: e.target.value })} />
          <Button type="button" onClick={saveConfig} disabled={savingConfig || updatingConfig}>{config ? "Update policy" : "Save policy"}</Button>
        </div>
        <div className="border-t pt-5"><h3 className="font-semibold">Zones, racks, and bins</h3><p className="mb-3 text-sm text-muted-foreground">Use the location hierarchy for physical warehouse areas and track capacity per area.</p>
          <div className="grid gap-3 md:grid-cols-4"><Input placeholder="Name" value={zone.name} onChange={(e) => setZone({ ...zone, name: e.target.value })} /><Input placeholder="Code" value={zone.code} onChange={(e) => setZone({ ...zone, code: e.target.value })} /><select className="h-10 rounded-md border bg-background px-3 text-sm" value={zone.kind} onChange={(e) => setZone({ ...zone, kind: e.target.value })}><option value="zone">Zone</option><option value="rack">Rack</option><option value="bin">Bin</option></select><Button type="button" onClick={saveZone} disabled={savingZone}>Add area</Button></div>
          {zones.length ? <div className="mt-3 grid gap-2 md:grid-cols-3">{zones.map((entry) => <div key={entry.id} className="rounded-xl border bg-muted/20 p-3"><div className="font-medium">{entry.name}</div><div className="text-xs text-muted-foreground">{entry.kind} · {entry.code} · capacity {entry.capacity}</div></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No zones or bins configured.</p>}
        </div>
        <div className="border-t pt-5"><h3 className="font-semibold">Cycle counts</h3><p className="mb-3 text-sm text-muted-foreground">Schedule recurring counts for this warehouse. Item-specific assignments can be added from the count service.</p><div className="flex gap-3"><Input type="number" min="1" value={countDays} onChange={(e) => setCountDays(e.target.value)} /><Button type="button" onClick={saveSchedule} disabled={savingSchedule}>Add schedule</Button></div>{countSchedules.length ? <div className="mt-3 space-y-2">{countSchedules.map((schedule) => <div key={schedule.id} className="rounded-xl border bg-muted/20 p-3 text-sm">Every {schedule.frequency_days} days · tolerance {schedule.variance_tolerance} · {schedule.active ? "Active" : "Paused"}</div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No cycle-count schedules configured.</p>}</div>
        <div className="border-t pt-5">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Count execution</h3><p className="text-sm text-muted-foreground">Open a count with an expected snapshot, record quantities, submit, and approve variances.</p></div><Button type="button" onClick={startCount} disabled={creatingSession}>Open count</Button></div>
          {countSessions.length ? <div className="mt-3 space-y-2">{countSessions.map((session) => <div key={session.id} className="rounded-xl border bg-muted/20 p-3 text-sm">
            <button type="button" className="w-full text-left" onClick={() => setSelectedSessionId(session.id)}><span className="font-semibold capitalize">{session.status}</span> · {session.lines.length} lines · {session.lines.filter((line) => line.variance != null && Number(line.variance) !== 0).length} variances</button>
            {selectedSessionId === session.id ? <div className="mt-3 space-y-3 border-t pt-3">
              {session.lines.map((line) => <div key={line.id} className="grid gap-2 md:grid-cols-[1fr_9rem] md:items-center"><div><div className="font-medium">{line.inventory_item_name || line.inventory_item}</div><div className="text-xs text-muted-foreground">Expected {line.expected_quantity} · variance {line.variance ?? "pending"}</div></div><Input type="number" min="0" placeholder="Counted quantity" value={countValues[line.id] ?? String(line.counted_quantity ?? "")} disabled={session.status !== "open"} onChange={(event) => setCountValues({ ...countValues, [line.id]: event.target.value })} /></div>)}
              <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={saveCounts} disabled={recordingCounts || session.status !== "open"}>Save counts</Button><Button type="button" onClick={submitSelectedCount} disabled={submittingCount || session.status !== "open"}>Submit</Button>{session.status === "submitted" ? <><select className="h-10 rounded-md border bg-background px-3 text-sm" value={varianceLocationId} onChange={(event) => setVarianceLocationId(event.target.value)}><option value="">Variance posting location</option>{operationalLocations.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select><Button type="button" onClick={approveSelectedCount} disabled={approvingCount}>Approve variance</Button></> : null}</div>
            </div> : null}
          </div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No count sessions started.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
