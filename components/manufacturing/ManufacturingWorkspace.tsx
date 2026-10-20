"use client"

import { useMemo, useState } from "react"
import { Factory, PackageOpen, RefreshCw, ShieldAlert, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { hasPermission } from "@/lib/permissionsGuard"
import {
  useCloseCostingPeriodMutation,
  useCreateManufacturingRecipeMutation,
  useCreateProductionOrderMutation,
  useGetProductionCostSummaryQuery,
  useGetProductionRequirementsQuery,
  useCreateQualityInspectionMutation,
  useListCostingPeriodsQuery,
  useListManufacturingRecipesQuery,
  useListProductionOrdersQuery,
  useListWorkCentersQuery,
  useCreateWorkCenterMutation,
  useListWorkCenterBlocksQuery,
  useCreateWorkCenterBlockMutation,
  useGetWorkCenterCapacityQuery,
  useListNonconformancesQuery,
  useCreateNonconformanceMutation,
  useTransitionNonconformanceMutation,
  useRecordProductionWasteMutation,
  useRecordProductionOutputMutation,
  useReleaseProductionOrderMutation,
  useReserveProductionMaterialsMutation,
} from "@/redux/features/manufacturing/manufacturingApiSlice"
import type { ProductionCostSummary, ProductionOrder } from "@/redux/features/manufacturing/manufacturingTypes"

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())

function OrderDetail({ order }: { order: ProductionOrder }) {
  const { data: requirements = [], isLoading } = useGetProductionRequirementsQuery(order.id)
  const { data: costs } = useGetProductionCostSummaryQuery(order.id) as { data?: ProductionCostSummary }
  const [release, { isLoading: releasing }] = useReleaseProductionOrderMutation()
  const [reserve, { isLoading: reserving }] = useReserveProductionMaterialsMutation()
  const [recordWaste, { isLoading: recordingWaste }] = useRecordProductionWasteMutation()
  const [recordOutput, { isLoading: recordingOutput }] = useRecordProductionOutputMutation()
  const [createInspection, { isLoading: creatingInspection }] = useCreateQualityInspectionMutation()
  const [quantity, setQuantity] = useState("")
  const [item, setItem] = useState("")
  const [reason, setReason] = useState("")
  const [inspectionQuantity, setInspectionQuantity] = useState("")
  const [outputItem, setOutputItem] = useState("")
  const [outputQuantity, setOutputQuantity] = useState("")
  const [outputAllocation, setOutputAllocation] = useState("")

  const action = async (fn: () => Promise<unknown>, message: string) => {
    try { await fn(); toast.success(message) } catch { toast.error("The manufacturing action could not be completed.") }
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{order.order_number}</CardTitle>
            <CardDescription>{order.finished_good_name || "Finished good"} · {label(order.status)}</CardDescription>
          </div>
          <div className="flex gap-2">
            {order.status === "draft" && <Button size="sm" disabled={releasing} onClick={() => action(() => release(order.id).unwrap(), "Production order released")}>Release</Button>}
            {(order.status === "released" || order.status === "in_progress") && <Button size="sm" variant="outline" disabled={reserving} onClick={() => action(() => reserve(order.id).unwrap(), "Materials reserved")}>Reserve materials</Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Planned</p><p className="mt-1 font-semibold">{order.planned_quantity}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Produced</p><p className="mt-1 font-semibold">{order.actual_quantity}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Selected cost</p><p className="mt-1 font-semibold">{String(costs?.total_cost ?? "0")}</p><p className="text-xs text-muted-foreground">{label(costs?.costing_method || "actual")}</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Actual cost</p><p className="mt-1 font-semibold">{String(costs?.actual_cost ?? "0")}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Standard cost</p><p className="mt-1 font-semibold">{String(costs?.standard_cost ?? "0")}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Variance</p><p className="mt-1 font-semibold">{String(costs?.variance ?? "0")}</p></div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Material requirements</h3>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading requirements...</p> : <div className="space-y-2">{requirements.map((requirement) => <div key={requirement.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"><span>{String(requirement.component)}</span><span>{requirement.issued_quantity} / {requirement.required_quantity} {requirement.quantity_uom_code} · {label(requirement.status)}</span></div>)}</div>}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center gap-2"><Trash2 className="h-4 w-4" /><h3 className="text-sm font-semibold">Record waste or process loss</h3></div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label htmlFor={`waste-item-${order.id}`}>Inventory item ID</Label><Input id={`waste-item-${order.id}`} value={item} onChange={(event) => setItem(event.target.value)} placeholder="Source item" /></div>
            <div><Label htmlFor={`waste-quantity-${order.id}`}>Quantity</Label><Input id={`waste-quantity-${order.id}`} value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" /></div>
            <div><Label htmlFor={`waste-reason-${order.id}`}>Reason</Label><Input id={`waste-reason-${order.id}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Scrap, spoilage..." /></div>
          </div>
          <Button className="mt-3" size="sm" variant="outline" disabled={recordingWaste || !item || !quantity} onClick={() => action(() => recordWaste({ orderId: order.id, data: { inventory_item: item, quantity, reason_code: reason, waste_type: "scrap", disposition: "discarded" } }).unwrap(), "Waste recorded")}>Record waste</Button>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="mb-3 flex items-center gap-2"><PackageOpen className="h-4 w-4" /><h3 className="text-sm font-semibold">Record co-product or by-product</h3></div>
          <div className="grid gap-3 md:grid-cols-4"><Input placeholder="Output item ID" value={outputItem} onChange={(event) => setOutputItem(event.target.value)} /><Input placeholder="Quantity" value={outputQuantity} onChange={(event) => setOutputQuantity(event.target.value)} /><Input type="number" min="0" max="100" placeholder="Cost allocation %" value={outputAllocation} onChange={(event) => setOutputAllocation(event.target.value)} /><Button variant="outline" disabled={recordingOutput || !outputItem || !outputQuantity || !outputAllocation} onClick={() => action(() => recordOutput({ orderId: order.id, data: { output_item: outputItem, quantity: outputQuantity, output_kind: "by_product", cost_allocation_percent: Number(outputAllocation), idempotency_key: `output-${order.id}-${outputItem}-${outputQuantity}` } }).unwrap(), "Output recorded")}>Record output</Button></div>
          <p className="mt-2 text-xs text-muted-foreground">Allocations are capped at 100% across all outputs and are included in the production cost report.</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
          <div className="mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /><h3 className="text-sm font-semibold">Quality inspection</h3></div>
          <div className="flex flex-wrap items-end gap-3"><div><Label htmlFor={`inspection-quantity-${order.id}`}>Inspected quantity</Label><Input id={`inspection-quantity-${order.id}`} value={inspectionQuantity} onChange={(event) => setInspectionQuantity(event.target.value)} placeholder={String(order.actual_quantity || order.planned_quantity)} /></div><Button size="sm" variant="outline" disabled={creatingInspection || !inspectionQuantity} onClick={() => action(() => createInspection({ orderId: order.id, data: { inspected_quantity: inspectionQuantity, defect_quantity: 0, measurements: {} } }).unwrap(), "Inspection created")}>Create inspection</Button></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ManufacturingWorkspace() {
  const { data: recipes = [], isLoading: recipesLoading } = useListManufacturingRecipesQuery()
  const { data: orders = [], isLoading: ordersLoading, refetch } = useListProductionOrdersQuery()
  const { data: periods = [], isLoading: periodsLoading } = useListCostingPeriodsQuery()
  const { data: workCenters = [], isLoading: workCentersLoading } = useListWorkCentersQuery()
  const { data: nonconformances = [], isLoading: nonconformancesLoading } = useListNonconformancesQuery()
  const [closePeriod] = useCloseCostingPeriodMutation()
  const [createRecipe, { isLoading: creatingRecipe }] = useCreateManufacturingRecipeMutation()
  const [createOrder, { isLoading: creatingOrder }] = useCreateProductionOrderMutation()
  const [createWorkCenter, { isLoading: creatingWorkCenter }] = useCreateWorkCenterMutation()
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState<string | number | null>(null)
  const { data: workCenterBlocks = [], isLoading: workCenterBlocksLoading } = useListWorkCenterBlocksQuery(selectedWorkCenterId ?? "", { skip: selectedWorkCenterId == null })
  const [createWorkCenterBlock, { isLoading: creatingWorkCenterBlock }] = useCreateWorkCenterBlockMutation()
  const [createNonconformance, { isLoading: creatingNonconformance }] = useCreateNonconformanceMutation()
  const [transitionNonconformance] = useTransitionNonconformanceMutation()
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [recipeName, setRecipeName] = useState("")
  const [recipeFinishedGood, setRecipeFinishedGood] = useState("")
  const [recipeOutputQuantity, setRecipeOutputQuantity] = useState("")
  const [orderRecipe, setOrderRecipe] = useState("")
  const [orderLocation, setOrderLocation] = useState("")
  const [orderQuantity, setOrderQuantity] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [workCenterCode, setWorkCenterCode] = useState("")
  const [workCenterName, setWorkCenterName] = useState("")
  const [workCenterCapacityInput, setWorkCenterCapacityInput] = useState("")
  const [workCenterLabor, setWorkCenterLabor] = useState("0")
  const [workCenterOverhead, setWorkCenterOverhead] = useState("0")
  const [blockStartsAt, setBlockStartsAt] = useState("")
  const [blockEndsAt, setBlockEndsAt] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [capacityDateFrom, setCapacityDateFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [capacityDateTo, setCapacityDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [ncNumber, setNcNumber] = useState("")
  const [ncOrder, setNcOrder] = useState("")
  const [ncDescription, setNcDescription] = useState("")
  const activeOrders = useMemo(() => orders.filter((order) => !["completed", "cancelled"].includes(order.status)), [orders])
  const canManage = hasPermission("manage_manufacturing") || hasPermission("manage_work_centers") || hasPermission("manage_inventory_settings")
  const { data: workCenterCapacity, isLoading: workCenterCapacityLoading } = useGetWorkCenterCapacityQuery(
    { id: selectedWorkCenterId ?? "", dateFrom: capacityDateFrom, dateTo: capacityDateTo },
    { skip: selectedWorkCenterId == null },
  )

  const submitRecipe = async () => {
    try {
      await createRecipe({ name: recipeName, finished_good: recipeFinishedGood, version: 1, status: "draft", output_quantity: recipeOutputQuantity, output_uom_code: "unit", lines: [] }).unwrap()
      toast.success("Recipe created")
      setRecipeName("")
      setRecipeFinishedGood("")
      setRecipeOutputQuantity("")
    } catch { toast.error("Recipe creation failed") }
  }

  const submitOrder = async () => {
    try {
      await createOrder({ recipe: orderRecipe, stock_location: orderLocation, planned_quantity: orderQuantity, order_number: orderNumber }).unwrap()
      toast.success("Production order created")
      setOrderRecipe("")
      setOrderLocation("")
      setOrderQuantity("")
      setOrderNumber("")
    } catch { toast.error("Production order creation failed") }
  }

  const submitWorkCenter = async () => {
    try {
      await createWorkCenter({ code: workCenterCode, name: workCenterName, capacity_minutes_per_day: Number(workCenterCapacityInput || 0), hourly_labor_rate: workCenterLabor, hourly_overhead_rate: workCenterOverhead, active: true }).unwrap()
      setWorkCenterCode(""); setWorkCenterName(""); setWorkCenterCapacityInput(""); setWorkCenterLabor("0"); setWorkCenterOverhead("0")
      toast.success("Work center created")
    } catch { toast.error("Work center creation failed") }
  }

  const submitWorkCenterBlock = async () => {
    if (selectedWorkCenterId == null || !blockStartsAt || !blockEndsAt || !blockReason) return
    try {
      await createWorkCenterBlock({ workCenterId: selectedWorkCenterId, data: { starts_at: new Date(blockStartsAt).toISOString(), ends_at: new Date(blockEndsAt).toISOString(), reason: blockReason, active: true } }).unwrap()
      setBlockStartsAt(""); setBlockEndsAt(""); setBlockReason(""); toast.success("Work-center block created")
    } catch { toast.error("The work-center block could not be created") }
  }

  const submitNonconformance = async () => {
    try {
      await createNonconformance({ number: ncNumber, production_order: ncOrder, severity: "medium", description: ncDescription }).unwrap()
      setNcNumber(""); setNcOrder(""); setNcDescription(""); toast.success("Nonconformance created")
    } catch { toast.error("Nonconformance creation failed") }
  }

  return (
    <main className="manufacturing-workspace mx-auto w-full max-w-[1800px] space-y-6 p-4 md:p-6">
      <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:border-blue-900/50 dark:from-blue-950/40 dark:via-slate-950 dark:to-emerald-950/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"><Factory className="h-4 w-4" /> Manufacturing control room</div><h1 className="text-2xl font-bold tracking-tight">Recipes, production, materials, and waste</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Track production orders from planned materials through finished output, costing, quality, and loss recording.</p></div>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </CardContent>
      </Card>
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList><TabsTrigger value="orders">Production orders ({activeOrders.length})</TabsTrigger><TabsTrigger value="recipes">Recipes ({recipes.length})</TabsTrigger><TabsTrigger value="work-centers">Work centers ({workCenters.length})</TabsTrigger><TabsTrigger value="quality">Quality ({nonconformances.length})</TabsTrigger><TabsTrigger value="periods">Costing periods ({periods.length})</TabsTrigger></TabsList>
        <TabsContent value="orders" className="space-y-4">
          {canManage && <Card><CardHeader><CardTitle>Create production order</CardTitle><CardDescription>Use IDs from the recipe and stock-location records.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-5"><Input placeholder="Recipe ID" value={orderRecipe} onChange={(event) => setOrderRecipe(event.target.value)} /><Input placeholder="Stock location ID" value={orderLocation} onChange={(event) => setOrderLocation(event.target.value)} /><Input placeholder="Planned quantity" value={orderQuantity} onChange={(event) => setOrderQuantity(event.target.value)} /><Input placeholder="Order number" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} /><Button disabled={creatingOrder || !orderRecipe || !orderLocation || !orderQuantity || !orderNumber} onClick={submitOrder}>Create order</Button></CardContent></Card>}
          {ordersLoading ? <Card><CardContent className="p-6">Loading production orders...</CardContent></Card> : orders.length === 0 ? <Card><CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><PackageOpen className="h-5 w-5" />No production orders yet.</CardContent></Card> : <>{orders.map((order) => <div key={order.id} onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)} className="cursor-pointer">{selectedOrder?.id === order.id ? <OrderDetail order={order} /> : <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{order.order_number}</p><p className="text-sm text-muted-foreground">{order.finished_good_name || "Finished good"} · Planned {order.planned_quantity}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{label(order.status)}</span></CardContent></Card>}</div>)}</>}
        </TabsContent>
        <TabsContent value="recipes" className="space-y-4">
          {canManage && <Card><CardHeader><CardTitle>Create recipe</CardTitle><CardDescription>Start a versioned recipe; add component lines through the recipe API as the formula is defined.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-4"><Input placeholder="Recipe name" value={recipeName} onChange={(event) => setRecipeName(event.target.value)} /><Input placeholder="Finished good ID" value={recipeFinishedGood} onChange={(event) => setRecipeFinishedGood(event.target.value)} /><Input placeholder="Output quantity" value={recipeOutputQuantity} onChange={(event) => setRecipeOutputQuantity(event.target.value)} /><Button disabled={creatingRecipe || !recipeName || !recipeFinishedGood || !recipeOutputQuantity} onClick={submitRecipe}>Create recipe</Button></CardContent></Card>}
          <Card><CardHeader><CardTitle>Recipe library</CardTitle><CardDescription>Versioned recipes and their costing methods.</CardDescription></CardHeader><CardContent>{recipesLoading ? "Loading recipes..." : recipes.length === 0 ? "No recipes yet." : <div className="space-y-2">{recipes.map((recipe) => <div key={recipe.id} className="flex items-center justify-between rounded-lg border px-3 py-3"><div><p className="font-medium">{recipe.name} v{recipe.version}</p><p className="text-sm text-muted-foreground">Output {recipe.output_quantity} {recipe.output_uom_code} · {label(recipe.status)}</p></div><span className="text-sm text-muted-foreground">{label(recipe.costing_method)}</span></div>)}</div>}</CardContent></Card>
        </TabsContent>
        <TabsContent value="work-centers" className="space-y-4">
          {canManage && <Card><CardHeader><CardTitle>Configure work center</CardTitle><CardDescription>Set capacity and labor/overhead rates for production scheduling and costing.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-5"><Input placeholder="Code" value={workCenterCode} onChange={(event) => setWorkCenterCode(event.target.value)} /><Input placeholder="Name" value={workCenterName} onChange={(event) => setWorkCenterName(event.target.value)} /><Input type="number" placeholder="Minutes/day" value={workCenterCapacityInput} onChange={(event) => setWorkCenterCapacityInput(event.target.value)} /><Input type="number" placeholder="Labor rate" value={workCenterLabor} onChange={(event) => setWorkCenterLabor(event.target.value)} /><Button disabled={creatingWorkCenter || !workCenterCode || !workCenterName} onClick={submitWorkCenter}>Create work center</Button></CardContent></Card>}
          {workCentersLoading ? <Card><CardContent className="p-6">Loading work centers...</CardContent></Card> : workCenters.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">No work centers configured.</CardContent></Card> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{workCenters.map((center) => <Card key={center.id} className={selectedWorkCenterId === center.id ? "border-blue-500" : ""} onClick={() => setSelectedWorkCenterId(center.id)}><CardContent className="cursor-pointer p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{center.name}</p><p className="text-sm text-muted-foreground">{center.code}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{center.active ? "Active" : "Inactive"}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-muted-foreground">Capacity</p><p className="font-medium">{center.capacity_minutes_per_day} min/day</p></div><div><p className="text-muted-foreground">Labor rate</p><p className="font-medium">{center.hourly_labor_rate}</p></div><div><p className="text-muted-foreground">Overhead rate</p><p className="font-medium">{center.hourly_overhead_rate}</p></div></div></CardContent></Card>)}</div>}
          {selectedWorkCenterId != null && <><Card><CardHeader><CardTitle>Capacity and utilization</CardTitle><CardDescription>Compare planned operation time with available minutes after maintenance and unavailable blocks.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><div><Label htmlFor="capacity-from">From</Label><Input id="capacity-from" type="date" value={capacityDateFrom} onChange={(event) => setCapacityDateFrom(event.target.value)} /></div><div><Label htmlFor="capacity-to">To</Label><Input id="capacity-to" type="date" value={capacityDateTo} onChange={(event) => setCapacityDateTo(event.target.value)} /></div></div>{workCenterCapacityLoading ? <p className="text-sm text-muted-foreground">Calculating capacity...</p> : workCenterCapacity && <div className="grid gap-3 sm:grid-cols-4"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Capacity</p><p className="font-semibold">{workCenterCapacity.capacity_minutes} min</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Blocked</p><p className="font-semibold">{workCenterCapacity.blocked_minutes} min</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Planned</p><p className="font-semibold">{workCenterCapacity.planned_minutes} min</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Utilization</p><p className="font-semibold">{workCenterCapacity.utilization_percent}%</p></div></div>}</CardContent></Card><Card><CardHeader><CardTitle>Availability blocks</CardTitle><CardDescription>Mark maintenance or unavailable periods so production planning can avoid them.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-4"><Input type="datetime-local" value={blockStartsAt} onChange={(event) => setBlockStartsAt(event.target.value)} aria-label="Block starts" /><Input type="datetime-local" value={blockEndsAt} onChange={(event) => setBlockEndsAt(event.target.value)} aria-label="Block ends" /><Input placeholder="Reason" value={blockReason} onChange={(event) => setBlockReason(event.target.value)} /><Button disabled={creatingWorkCenterBlock || !blockStartsAt || !blockEndsAt || !blockReason} onClick={submitWorkCenterBlock}>Block capacity</Button></div>{workCenterBlocksLoading ? <p className="text-sm text-muted-foreground">Loading availability...</p> : workCenterBlocks.length ? <div className="space-y-2">{workCenterBlocks.map((block) => <div key={block.id} className="flex flex-wrap justify-between gap-2 rounded-xl border p-3 text-sm"><span>{block.reason}</span><span className="text-muted-foreground">{new Date(block.starts_at).toLocaleString()} to {new Date(block.ends_at).toLocaleString()}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No active blocks for this work center.</p>}</CardContent></Card></>}
        </TabsContent>
        <TabsContent value="quality" className="space-y-4">
          {canManage && <Card><CardHeader><CardTitle>Open nonconformance</CardTitle><CardDescription>Track a quality issue against a production order and move it through containment and closure.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-4"><Input placeholder="Case number" value={ncNumber} onChange={(event) => setNcNumber(event.target.value)} /><Input placeholder="Production order ID" value={ncOrder} onChange={(event) => setNcOrder(event.target.value)} /><Input placeholder="Description" value={ncDescription} onChange={(event) => setNcDescription(event.target.value)} /><Button disabled={creatingNonconformance || !ncNumber || !ncOrder} onClick={submitNonconformance}>Open case</Button></CardContent></Card>}
          {nonconformancesLoading ? <Card><CardContent className="p-6">Loading quality cases...</CardContent></Card> : <div className="space-y-3">{nonconformances.map((item) => <Card key={item.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{item.number} · {label(item.severity)}</p><p className="text-sm text-muted-foreground">{item.description || "No description"} · {label(item.status)}</p></div><div className="flex gap-2">{item.status === "open" && <Button size="sm" variant="outline" onClick={() => void transitionNonconformance({ id: item.id, action: "contain" })}>Contain</Button>}{item.status !== "closed" && item.status !== "open" && <Button size="sm" onClick={() => void transitionNonconformance({ id: item.id, action: "close" })}>Close</Button>}</div></CardContent></Card>)}{!nonconformances.length && <Card><CardContent className="p-6 text-sm text-muted-foreground">No nonconformance cases recorded.</CardContent></Card>}</div>}
        </TabsContent>
        <TabsContent value="periods" className="space-y-3">{periodsLoading ? <Card><CardContent className="p-6">Loading costing periods...</CardContent></Card> : periods.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground"><ShieldAlert className="mb-2 h-5 w-5" />No costing periods configured. New orders may use open periods when available.</CardContent></Card> : periods.map((period) => <Card key={period.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{period.name}</p><p className="text-sm text-muted-foreground">{period.period_start} to {period.period_end} · {label(period.status)}</p></div>{period.status === "open" && <Button size="sm" variant="outline" onClick={async () => { try { await closePeriod(period.id).unwrap(); toast.success("Costing period closed") } catch { toast.error("The period cannot be closed while production remains open.") } }}>Close period</Button>}</CardContent></Card>)}</TabsContent>
      </Tabs>
    </main>
  )
}
