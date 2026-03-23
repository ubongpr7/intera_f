
import { InventoryData } from "@/redux/features/inventory/inventoryTypes";

export const InventoryKeyInfo = {
  name_snapshot: "Human-readable name for the inventory item.",
  description: "Short operational description for warehouse and purchasing teams.",
  inventory_type: "Operational stock type such as raw material, finished good, or consumable.",
  inventory_category: "Operational category used for storage and replenishment policy.",
  default_uom_code: "Default unit of measure code used when this item is referenced.",
  stock_uom_code: "Unit of measure used when stock is counted on hand.",
  status: "Lifecycle state for this inventory item.",
  minimum_stock_level: "Lowest quantity that should remain available before the item is considered low stock.",
  reorder_point: "Threshold that should trigger replenishment planning.",
  reorder_quantity: "Suggested replenishment quantity once the reorder point is reached.",
  safety_stock_level: "Buffer stock to absorb unexpected demand or lead-time variance.",
  track_stock: "Enable stock accounting for this inventory item.",
  track_lot: "Enable lot or batch tracking for received stock.",
  track_serial: "Enable serial tracking for individual units.",
  track_expiry: "Enable expiry-date tracking for lots.",
  allow_negative_stock: "Allow transactions that temporarily push stock below zero.",
};

export const InventoryInterfaceKeys: (keyof InventoryData)[] = [
  "name_snapshot",
  "description",
  "inventory_category",
  "inventory_type",
  "status",
  "default_uom_code",
  "stock_uom_code",
  "minimum_stock_level",
  "reorder_point",
  "reorder_quantity",
  "safety_stock_level",
  "track_stock",
  "track_lot",
  "track_serial",
  "track_expiry",
  "allow_negative_stock",
];

export const defaultValues: Partial<InventoryData> = {
  inventory_type: "finished_good",
  status: "active",
  track_stock: true,
  track_lot: false,
  track_serial: false,
  track_expiry: false,
  allow_negative_stock: false,
  minimum_stock_level: 0,
  reorder_point: 0,
  reorder_quantity: 0,
  safety_stock_level: 0,
};
