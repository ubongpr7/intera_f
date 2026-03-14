"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCookie } from "cookies-next";
import { Building2, Loader2, PlusCircle, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  CompanyProfileContext,
  useGetUserCompaniesQuery,
  useSwitchCompanyMutation,
} from "@/redux/features/authApiSlice";
import InventoryOverview from "@/components/dashboard/inventory";
import SalesPerformance from "@/components/dashboard/salesPerformance";
import RecentOrders from "@/components/dashboard/RecentOrders";
import StockAlerts from "@/components/dashboard/StockAlerts";
import SupplierPerformance from "../../SupplierPerformance";
import OrderFulfillment from "@/components/dashboard/OrderFulfillment";
import InventoryTurnover from "@/components/dashboard/InventoryTurnover";
import ShippingStatus from "@/components/dashboard/ShippingStatus";
import CategoryStock from "@/components/dashboard/CategoryStock";
import RecentPurchases from "@/components/dashboard/RecentPurchases";
import StockAging from "@/components/dashboard/StockAging";
import ExpirationTracker from "@/components/dashboard/ExpirationTracker";
import ReturnsOverview from "@/components/dashboard/ReturnsOverview";
import ABCAnalysis from "@/components/dashboard/ABCAnalysis";
import CycleCountStatus from "@/components/dashboard/CycleCountStatus";
import InventoryMovement from "@/components/dashboard/InventoryMovement";
import SupplierLeadTime from "@/components/dashboard/SupplierLeadTime";
import InventoryMovementChart from "@/components/dashboard/InventoryMovementChart";
import SupplierCard from "@/components/dashboard/SupplierCard";
import RealTimeUpdates from "@/components/dashboard/RealTimeUpdates";
import { readCookieValue } from "@/lib/authCookies";

const DashboardGrid = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
    <InventoryOverview />
    <InventoryMovementChart />
    <RealTimeUpdates />
    <SalesPerformance />
    <RecentOrders />
    <StockAlerts />
    <SupplierPerformance />
    <OrderFulfillment />
    <InventoryTurnover />
    <ShippingStatus />
    <CategoryStock />
    <RecentPurchases />
    <StockAging />
    <ExpirationTracker />
    <ReturnsOverview />
    <ABCAnalysis />
    <CycleCountStatus />
    <InventoryMovement />
    <SupplierCard />
    <SupplierLeadTime />
  </div>
);

const DashboardLoadingState = () => (
  <div className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={`dashboard-loading-${index}`} className="h-36 animate-pulse rounded-xl border border-gray-200 bg-white" />
    ))}
  </div>
);

const NoProfileState = ({
  profiles,
  switchingProfileId,
  onSwitchCompany,
}: {
  profiles: CompanyProfileContext[];
  switchingProfileId: string | null;
  onSwitchCompany: (profile: CompanyProfileContext) => Promise<void>;
}) => {
  if (!profiles.length) {
    return (
      <div className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-50 p-3 text-blue-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Create your first company profile</h2>
            <p className="mt-2 text-sm text-gray-600">
              You’re signed in, but no company workspace is attached yet. Create a profile to start managing inventory.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/profile/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create company profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-full bg-blue-50 p-3 text-blue-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Choose a company workspace</h2>
          <p className="mt-2 text-sm text-gray-600">
            Select the company you want to work with. Dashboard data loads after you switch context.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-blue-300"
          >
            <div className="mb-3">
              <p className="text-base font-semibold text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500">
                Code: <span className="font-medium text-gray-700">{profile.company_code}</span>
              </p>
              {profile.role ? (
                <p className="mt-1 text-xs uppercase tracking-wide text-blue-700">Role: {profile.role}</p>
              ) : null}
            </div>
            <Button
              onClick={() => void onSwitchCompany(profile)}
              disabled={switchingProfileId === profile.id}
              className="w-full"
            >
              {switchingProfileId === profile.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                "Open dashboard"
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/profile/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create another company profile
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const { data: companyMemberships, isLoading, isError, refetch } = useGetUserCompaniesQuery();
  const [switchCompany] = useSwitchCompanyMutation();

  const activeProfileId = companyMemberships?.active_profile_id ?? null;
  const profiles = companyMemberships?.profiles ?? [];
  const cookieProfileId = readCookieValue("profileId", getCookie) ?? readCookieValue("profile", getCookie);

  const handleSwitchCompany = async (profile: CompanyProfileContext) => {
    try {
      setSwitchingProfileId(profile.id);
      await switchCompany({ profile_id: profile.id }).unwrap();
      await refetch();
      toast.success(`Switched to ${profile.name}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to switch company context.");
    } finally {
      setSwitchingProfileId(null);
    }
  };

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (isError && !cookieProfileId) {
    return (
      <div className="mx-auto mt-10 w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-xl font-semibold text-red-800">Unable to load company workspaces</h2>
        <p className="mt-2 text-sm text-red-700">
          We could not fetch your company context. Try again, then create/select a company profile.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => void refetch()} variant="outline">
            Retry
          </Button>
          <Button asChild>
            <Link href="/profile/create">Create company profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!activeProfileId) {
    return (
      <NoProfileState
        profiles={profiles}
        switchingProfileId={switchingProfileId}
        onSwitchCompany={handleSwitchCompany}
      />
    );
  }

  return <DashboardGrid />;
}
