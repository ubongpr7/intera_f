"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecallPolicyManagement } from "./RecallPolicyManagement"
import { ReorderStrategyManagement } from "./ReorderStrategyManagement"
import { InventoryPolicyManagement } from "./InventoryPolicyManagement"

interface PolicyManagementProps {
  profileId: number
}

export function PolicyManagement({profileId}:PolicyManagementProps) {
  const [activeTab, setActiveTab] = useState("recall")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Policy Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recall">Recall Policies</TabsTrigger>
              <TabsTrigger value="reorder">Reorder Strategies</TabsTrigger>
              <TabsTrigger value="inventory">Inventory Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="recall" className="mt-6">
              <RecallPolicyManagement profileId={profileId} />
            </TabsContent>

            <TabsContent value="reorder" className="mt-6">
              <ReorderStrategyManagement profileId={profileId} />
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <InventoryPolicyManagement profileId={profileId}  />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
