"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from  "components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import { CompanyBasicInfoForm } from "./CompanyBasicInfoForm"
import { CompanyAddressForm } from "./CompanyAddressForm"
import { CompanySocialLinksForm } from "./CompanySocialLinksForm"
import { PolicyManagement } from "./PolicyManagement"
// import { ActivityLogView } from "./ActivityLogView"
import type { CompanyProfile } from "@/types/company-profile"

interface CompanyProfileContainerProps {
  profileId: string
  userId: string
}

export default function CompanyProfileContainer() {
  const { profile, isLoading, refetch:updateProfile } = useCompanyProfile()
  const [activeTab, setActiveTab] = useState("basic-info")

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-4 sm:p-8">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Company Profile Management</CardTitle>
          {profile && (
            <p className="text-center text-muted-foreground">Managing profile for {(profile as CompanyProfile).name}</p>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="social">Social Links</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info" className="mt-6">
              <CompanyBasicInfoForm
                profile={profile as CompanyProfile}
                onSuccess={updateProfile}
                
              />
            </TabsContent>

            <TabsContent value="address" className="mt-6">
              <CompanyAddressForm
                profile={profile as CompanyProfile}
                onUpdate={updateProfile}
                
              />
            </TabsContent>

            <TabsContent value="social" className="mt-6">
              <CompanySocialLinksForm
                profile={profile as CompanyProfile}
                onUpdate={updateProfile}
                
              />
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
              <PolicyManagement profileId={Number(profile?.id)}  />
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
