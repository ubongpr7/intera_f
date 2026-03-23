"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { Layers3, MapPin, ScanLine, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"
import {
  useListStockBalancesQuery,
  useListStockLotsQuery,
  useListStockMovementsQuery,
  useListStockSerialsQuery,
} from "@/redux/features/stock/stockAPISlice"

type NamedOption = {
  id: string | number
  name: string
}

type InventoryOperationalInsightsProps = {
  inventoryOptions: NamedOption[]
  locationOptions: NamedOption[]
}

const getStatusTone = (value?: string | null) => {
  const normalized = String(value || "").toLowerCase()
  if (["active", "available", "open", "completed"].includes(normalized)) {
    return "border-green-200 bg-green-50 text-green-800"
  }
  if (["reserved", "quarantined", "attention_needed", "expiring"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }
  if (["damaged", "destroyed", "rejected", "lost", "depleted", "archived"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-800"
  }
  return "border-gray-200 bg-gray-50 text-gray-700"
}

const renderEmpty = (message: string) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">
    {message}
  </div>
)

export default function InventoryOperationalInsights({
  inventoryOptions,
  locationOptions,
}: InventoryOperationalInsightsProps) {
  const [search, setSearch] = useState("")
  const [inventoryItemId, setInventoryItemId] = useState("all")
  const [locationId, setLocationId] = useState("all")
  const deferredSearch = useDeferredValue(search.trim())

  const sharedInventoryFilter = inventoryItemId === "all" ? undefined : inventoryItemId
  const sharedLocationFilter = locationId === "all" ? undefined : locationId

  const balanceQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
      ordering: "stock_location__name",
    }),
    [deferredSearch, sharedInventoryFilter, sharedLocationFilter],
  )

  const lotQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      ordering: "expiry_date",
    }),
    [deferredSearch, sharedInventoryFilter],
  )

  const serialQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      stock_location: sharedLocationFilter,
      ordering: "serial_number",
    }),
    [deferredSearch, sharedInventoryFilter, sharedLocationFilter],
  )

  const movementQuery = useMemo(
    () => ({
      search: deferredSearch || undefined,
      inventory_item: sharedInventoryFilter,
      ordering: "-occurred_at",
    }),
    [deferredSearch, sharedInventoryFilter],
  )

  const { data: balances = [], isLoading: loadingBalances } = useListStockBalancesQuery(balanceQuery)
  const { data: lots = [], isLoading: loadingLots } = useListStockLotsQuery(lotQuery)
  const { data: serials = [], isLoading: loadingSerials } = useListStockSerialsQuery(serialQuery)
  const { data: movements = [], isLoading: loadingMovements } = useListStockMovementsQuery(movementQuery)

  const activeBalanceCount = balances.filter((row) => Number(row.quantity_available ?? 0) > 0).length
  const trackedLotCount = lots.length
  const activeSerialCount = serials.filter((row) => row.status === "available").length

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100 p-6 text-left text-inherit">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle className="text-xl">Operational stock insight</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Browse balances, tracked lots, tracked serials, and movement history from one place. This is the frontend view of the
              normalized stock-state layer that powers inventory reasoning.
            </CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Live balances</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingBalances ? "..." : activeBalanceCount}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracked lots</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingLots ? "..." : trackedLotCount}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Available serials</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{loadingSerials ? "..." : activeSerialCount}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="space-y-2">
            <Label htmlFor="inventory-operational-search">Search stock-state records</Label>
            <Input
              id="inventory-operational-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, location, lot, serial, or reference"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventory-operational-item">Inventory item</Label>
            <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
              <SelectTrigger id="inventory-operational-item" className="h-11">
                <SelectValue placeholder="All inventory items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All inventory items</SelectItem>
                {inventoryOptions.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventory-operational-location">Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger id="inventory-operational-location" className="h-11">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationOptions.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="balances" className="w-full">
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-gray-100 p-2">
            <TabsTrigger value="balances" className="rounded-xl bg-white px-4 py-2.5">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Balances
            </TabsTrigger>
            <TabsTrigger value="lots" className="rounded-xl bg-white px-4 py-2.5">
              <Layers3 className="mr-2 h-4 w-4" />
              Lots
            </TabsTrigger>
            <TabsTrigger value="serials" className="rounded-xl bg-white px-4 py-2.5">
              <ScanLine className="mr-2 h-4 w-4" />
              Serials
            </TabsTrigger>
            <TabsTrigger value="movements" className="rounded-xl bg-white px-4 py-2.5">
              <MapPin className="mr-2 h-4 w-4" />
              Movements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balances" className="rounded-2xl border border-gray-200">
            {loadingBalances ? (
              renderEmpty("Loading stock balances...")
            ) : balances.length === 0 ? (
              renderEmpty("No balance rows match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.stock_location_name || "Unknown location"}</TableCell>
                      <TableCell>{row.lot_number || "No lot"}</TableCell>
                      <TableCell className="text-right">{row.quantity_on_hand ?? 0}</TableCell>
                      <TableCell className="text-right">{row.quantity_reserved ?? 0}</TableCell>
                      <TableCell className="text-right">{row.quantity_available ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="lots" className="rounded-2xl border border-gray-200">
            {loadingLots ? (
              renderEmpty("Loading tracked lots...")
            ) : lots.length === 0 ? (
              renderEmpty("No tracked lots match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Lot number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.lot_number}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(row.status)}`}>
                          {row.status || "unknown"}
                        </span>
                      </TableCell>
                      <TableCell>{row.expiry_date ? formatDate(row.expiry_date) : "No expiry"}</TableCell>
                      <TableCell className="text-right">{row.remaining_quantity ?? 0}</TableCell>
                      <TableCell className="text-right">{row.received_quantity ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="serials" className="rounded-2xl border border-gray-200">
            {loadingSerials ? (
              renderEmpty("Loading tracked serials...")
            ) : serials.length === 0 ? (
              renderEmpty("No tracked serials match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Serial number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Lot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serials.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.serial_number}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(row.status)}`}>
                          {row.status || "unknown"}
                        </span>
                      </TableCell>
                      <TableCell>{row.stock_location_name || "Not assigned"}</TableCell>
                      <TableCell>{row.lot_number || "No lot"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="movements" className="rounded-2xl border border-gray-200">
            {loadingMovements ? (
              renderEmpty("Loading movement ledger...")
            ) : movements.length === 0 ? (
              renderEmpty("No stock movements match the current filters.")
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory item</TableHead>
                    <TableHead>Movement</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Lot / serial</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">{row.inventory_item_name || "Unknown item"}</TableCell>
                      <TableCell>{row.movement_type_display || row.movement_type}</TableCell>
                      <TableCell>{row.reference_id ? `${row.reference_type || "ref"}:${row.reference_id}` : row.reference_type || "No reference"}</TableCell>
                      <TableCell>
                        {(row.from_location_name || "Unknown source")} to {(row.to_location_name || "Unknown destination")}
                      </TableCell>
                      <TableCell>
                        {row.lot_number || "No lot"}
                        {row.serial_number ? ` • ${row.serial_number}` : ""}
                      </TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell>{row.occurred_at ? formatDate(row.occurred_at, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No timestamp"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
