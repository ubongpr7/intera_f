import InventoryOverview from "@/components/dashboard/inventory"
import SalesPerformance from "@/components/dashboard/salesPerformance"
import RecentOrders from "@/components/dashboard/RecentOrders"
import StockAlerts from "@/components/dashboard/StockAlerts"
import SupplierPerformance from "../../SupplierPerformance"
import OrderFulfillment from "@/components/dashboard/OrderFulfillment"
import InventoryTurnover from "@/components/dashboard/InventoryTurnover"
import QuickStats from "@/components/dashboard/QuickStats"
import ShippingStatus from "@/components/dashboard/ShippingStatus"
import CategoryStock from "@/components/dashboard/CategoryStock"
import RecentPurchases from "@/components/dashboard/RecentPurchases"
import StockAging from "@/components/dashboard/StockAging"
import ExpirationTracker from "@/components/dashboard/ExpirationTracker"
import ReturnsOverview from "@/components/dashboard/ReturnsOverview"
import ABCAnalysis from "@/components/dashboard/ABCAnalysis"
import CycleCountStatus from "@/components/dashboard/CycleCountStatus"
import InventoryMovement from "@/components/dashboard/InventoryMovement"
import SupplierLeadTime from "@/components/dashboard/SupplierLeadTime"
import InventoryMovementChart from "@/components/dashboard/InventoryMovementChart"
import SupplierCard from "@/components/dashboard/SupplierCard"
import RealTimeUpdates from "@/components/dashboard/RealTimeUpdates"
export default function Inventory() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
    <InventoryOverview/>
    <InventoryMovementChart/>
    <RealTimeUpdates/>
    <SalesPerformance />
    <RecentOrders />
    <StockAlerts />
    <SupplierPerformance />
    <OrderFulfillment />
    <InventoryTurnover />
    <QuickStats />
    <ShippingStatus />
    <CategoryStock />
    <RecentPurchases />
    <StockAging />
    <ExpirationTracker/>
    <ReturnsOverview/>
    <ABCAnalysis/>
    <CycleCountStatus/>
    <InventoryMovement/>
    <SupplierCard/>
    <SupplierLeadTime/>

  </div>
  )
}
