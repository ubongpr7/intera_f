"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useListStockLocationsQuery } from "@/redux/features/stock/stockAPISlice"
import {
  useCreateInventoryItemUnitMutation,
  useDeleteInventoryItemUnitMutation,
  useGetInventoryReorderPolicyQuery,
  useListInventoryItemUnitsQuery,
  useUpdateInventoryItemUnitMutation,
  useUpdateInventoryReorderPolicyMutation,
} from "@/redux/features/inventory/inventoryAPiSlice"
import type { InventoryData, InventoryItemUnit } from "@/redux/features/inventory/inventoryTypes"

type UnitDraft = {
  code: string
  label: string
  conversion_to_stock: string
  is_purchase_unit: boolean
  is_sale_unit: boolean
  allows_partial: boolean
  decimal_places: string
  selling_price: string
}

const emptyDraft: UnitDraft = {
  code: "",
  label: "",
  conversion_to_stock: "1",
  is_purchase_unit: false,
  is_sale_unit: true,
  allows_partial: false,
  decimal_places: "0",
  selling_price: "",
}

const toDraft = (unit: InventoryItemUnit): UnitDraft => ({
  code: unit.code,
  label: unit.label,
  conversion_to_stock: String(unit.conversion_to_stock),
  is_purchase_unit: unit.is_purchase_unit,
  is_sale_unit: unit.is_sale_unit,
  allows_partial: unit.allows_partial,
  decimal_places: String(unit.decimal_places),
  selling_price: unit.selling_price == null ? "" : String(unit.selling_price),
})

export default function InventoryWarehouseSettingsCard({ inventory }: { inventory: InventoryData }) {
  const { data: units = [], refetch: refetchUnits } = useListInventoryItemUnitsQuery({ inventory_item: inventory.id })
  const [createUnit, { isLoading: creatingUnit }] = useCreateInventoryItemUnitMutation()
  const [updateUnit, { isLoading: updatingUnit }] = useUpdateInventoryItemUnitMutation()
  const [deleteUnit, { isLoading: deletingUnit }] = useDeleteInventoryItemUnitMutation()
  const [draft, setDraft] = useState<UnitDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [policyDraft, setPolicyDraft] = useState({ automate_reorder_override: "", reorder_point_override: "", reorder_quantity_override: "" })
  const { data: locations = [] } = useListStockLocationsQuery({ structural: true })
  const { data: policy, refetch: refetchPolicy } = useGetInventoryReorderPolicyQuery(
    { id: inventory.id, structural_location_id: selectedLocationId },
    { skip: !selectedLocationId },
  )
  const [updatePolicy, { isLoading: updatingPolicy }] = useUpdateInventoryReorderPolicyMutation()

  useEffect(() => {
    if (!policy) return
    setPolicyDraft({
      automate_reorder_override: policy.automate_reorder == null ? "inherit" : String(policy.automate_reorder),
      reorder_point_override: policy.reorder_point == null ? "" : String(policy.reorder_point),
      reorder_quantity_override: policy.reorder_quantity == null ? "" : String(policy.reorder_quantity),
    })
  }, [policy])

  const resetUnit = () => {
    setDraft(emptyDraft)
    setEditingId(null)
  }

  const saveUnit = async () => {
    if (!draft.code.trim() || !draft.label.trim() || Number(draft.conversion_to_stock) <= 0) {
      toast.error("Enter a unit code, label, and a conversion greater than zero.")
      return
    }
    const payload = {
      inventory_item: inventory.id,
      code: draft.code.trim(),
      label: draft.label.trim(),
      conversion_to_stock: draft.conversion_to_stock,
      is_purchase_unit: draft.is_purchase_unit,
      is_sale_unit: draft.is_sale_unit,
      allows_partial: draft.allows_partial,
      decimal_places: Number(draft.decimal_places || 0),
      selling_price: draft.selling_price || null,
    }
    try {
      if (editingId) await updateUnit({ id: editingId, data: payload }).unwrap()
      else await createUnit(payload).unwrap()
      toast.success(editingId ? "Unit updated." : "Unit added.")
      resetUnit()
      await refetchUnits()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save this unit.")
    }
  }

  const savePolicy = async () => {
    if (!selectedLocationId) return
    const automate = policyDraft.automate_reorder_override
    try {
      await updatePolicy({
        id: inventory.id,
        data: {
          ...(automate === "inherit" ? { automate_reorder_override: null } : { automate_reorder_override: automate === "true" }),
          reorder_point_override: policyDraft.reorder_point_override === "" ? null : policyDraft.reorder_point_override,
          reorder_quantity_override: policyDraft.reorder_quantity_override === "" ? null : policyDraft.reorder_quantity_override,
        },
      }).unwrap()
      toast.success("Location reorder policy updated.")
      await refetchPolicy()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the location policy.")
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="p-6">
        <CardTitle className="text-lg">Warehouse settings</CardTitle>
        <CardDescription>Configure product-specific UOM conversions and structural-location replenishment rules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 p-6 pt-0">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Units of measure</h3>
              <p className="text-sm text-muted-foreground">Stock is stored in {inventory.stock_uom_code || "the stock UOM"}. Purchase and sale units can convert into it.</p>
            </div>
            {editingId ? <Button type="button" variant="ghost" onClick={resetUnit}><X className="mr-2 h-4 w-4" />Cancel</Button> : null}
          </div>
          {units.length ? (
            <div className="space-y-2">
              {units.map((unit) => (
                <div key={unit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="min-w-0">
                    <div className="font-medium">{unit.label} <span className="text-muted-foreground">({unit.code})</span></div>
                    <div className="text-sm text-muted-foreground">1 {unit.code} = {unit.conversion_to_stock} {inventory.stock_uom_code || "stock units"} · {unit.is_purchase_unit ? "Purchase" : ""}{unit.is_purchase_unit && unit.is_sale_unit ? " / " : ""}{unit.is_sale_unit ? "Sale" : ""}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setEditingId(unit.id); setDraft(toDraft(unit)) }}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                    <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={deletingUnit} onClick={async () => { if (!window.confirm(`Delete ${unit.label}?`)) return; await deleteUnit(unit.id).unwrap(); await refetchUnits(); }}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No product-specific units configured yet.</div>}
          <div className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Code (e.g. carton)" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            <Input placeholder="Label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <Input type="number" min="0.00001" step="0.00001" placeholder="Conversion to stock" value={draft.conversion_to_stock} onChange={(e) => setDraft({ ...draft, conversion_to_stock: e.target.value })} />
            <Input type="number" min="0" max="5" step="1" placeholder="Decimal places" value={draft.decimal_places} onChange={(e) => setDraft({ ...draft, decimal_places: e.target.value })} />
            <Input type="number" min="0" step="0.01" placeholder="Selling price (optional)" value={draft.selling_price} onChange={(e) => setDraft({ ...draft, selling_price: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_purchase_unit} onChange={(e) => setDraft({ ...draft, is_purchase_unit: e.target.checked })} /> Purchase unit</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_sale_unit} onChange={(e) => setDraft({ ...draft, is_sale_unit: e.target.checked })} /> Sale unit</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.allows_partial} onChange={(e) => setDraft({ ...draft, allows_partial: e.target.checked })} /> Allows partial</label>
            <Button type="button" onClick={saveUnit} disabled={creatingUnit || updatingUnit} className="lg:col-span-4"><Plus className="mr-2 h-4 w-4" />{editingId ? "Save unit" : "Add unit"}</Button>
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div>
            <h3 className="font-semibold">Location-specific reorder policy</h3>
            <p className="text-sm text-muted-foreground">Overrides apply to one structural location; blank values inherit the item policy.</p>
          </div>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)}>
            <option value="">Select a structural location</option>
            {locations.map((location) => <option key={String(location.id)} value={String(location.id)}>{location.name}</option>)}
          </select>
          {selectedLocationId && policy ? (
            <div className="grid gap-3 md:grid-cols-3">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={policyDraft.automate_reorder_override} onChange={(e) => setPolicyDraft({ ...policyDraft, automate_reorder_override: e.target.value })}>
                <option value="inherit">Automatic reorder: inherit</option><option value="true">Automatic reorder: enabled</option><option value="false">Automatic reorder: disabled</option>
              </select>
              <Input type="number" min="0" step="0.00001" placeholder="Reorder point override" value={policyDraft.reorder_point_override} onChange={(e) => setPolicyDraft({ ...policyDraft, reorder_point_override: e.target.value })} />
              <Input type="number" min="0" step="0.00001" placeholder="Reorder quantity override" value={policyDraft.reorder_quantity_override} onChange={(e) => setPolicyDraft({ ...policyDraft, reorder_quantity_override: e.target.value })} />
              <Button type="button" onClick={savePolicy} disabled={updatingPolicy} className="md:col-span-3"><Save className="mr-2 h-4 w-4" />Save location policy</Button>
            </div>
          ) : selectedLocationId ? <p className="text-sm text-muted-foreground">This item has no placement at the selected structural location.</p> : null}
        </section>
      </CardContent>
    </Card>
  )
}
