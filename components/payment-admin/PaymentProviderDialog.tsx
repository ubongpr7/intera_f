"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import Select from "react-select"
import {
  useCreatePaymentProviderMutation,
  useUpdatePaymentProviderMutation,
} from "@/redux/features/payment/paymentAPISlice"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  slug: z.string().min(1, "Slug is required"),
  is_active: z.boolean().default(true),
  webhook_secret: z.string().min(1, "Webhook secret is required"),
  api_config: z.string().min(1, "API configuration is required"),
})

const providerOptions = [
  { value: "flutterwave", label: "Flutterwave" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "paystack", label: "Paystack" },
  { value: "razorpay", label: "Razorpay" },
]

interface PaymentProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: any
  onSuccess: () => void
}

export function PaymentProviderDialog({ open, onOpenChange, provider, onSuccess }: PaymentProviderDialogProps) {
  const [createProvider, { isLoading: isCreating }] = useCreatePaymentProviderMutation()
  const [updateProvider, { isLoading: isUpdating }] = useUpdatePaymentProviderMutation()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      is_active: true,
      webhook_secret: "",
      api_config: "",
    },
  })

  useEffect(() => {
    if (provider) {
      form.reset({
        name: provider.name,
        slug: provider.slug,
        is_active: provider.is_active,
        webhook_secret: provider.webhook_secret || "",
        api_config: provider.api_config || "",
      })
    } else {
      form.reset({
        name: "",
        slug: "",
        is_active: true,
        webhook_secret: "",
        api_config: "",
      })
    }
  }, [provider, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (provider) {
        await updateProvider({ id: provider.id, ...values }).unwrap()
        toast({
          title: "Success",
          description: "Payment provider updated successfully",
        })
      } else {
        await createProvider(values).unwrap()
        toast({
          title: "Success",
          description: "Payment provider created successfully",
        })
      }
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${provider ? "update" : "create"} payment provider`,
        variant: "destructive",
      })
    }
  }

  const handleProviderSelect = (selectedOption) => {
    if (selectedOption) {
      form.setValue("name", selectedOption.label)
      form.setValue("slug", selectedOption.value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{provider ? "Edit Payment Provider" : "Add Payment Provider"}</DialogTitle>
          <DialogDescription>Configure a payment provider with API credentials and webhook settings.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider Type</label>
                <Select
                  options={providerOptions}
                  onChange={handleProviderSelect}
                  placeholder="Select a provider..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>Enable this payment provider</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Flutterwave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., flutterwave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="webhook_secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Secret</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter webhook secret key" {...field} />
                  </FormControl>
                  <FormDescription>Secret key used to verify webhook signatures</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="api_config"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Configuration</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"api_key": "your_api_key", "secret_key": "your_secret_key", "base_url": "https://api.provider.com"}'
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>JSON configuration for API credentials and settings</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : provider ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
