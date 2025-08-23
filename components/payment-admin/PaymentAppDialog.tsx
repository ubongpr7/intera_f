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
import { useCreatePaymentAppMutation, useUpdatePaymentAppMutation } from "@/redux/features/payment/paymentAPISlice"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(1, "App name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

interface PaymentAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app?: any
  onSuccess: () => void
}

export function PaymentAppDialog({ open, onOpenChange, app, onSuccess }: PaymentAppDialogProps) {
  const [createApp, { isLoading: isCreating }] = useCreatePaymentAppMutation()
  const [updateApp, { isLoading: isUpdating }] = useUpdatePaymentAppMutation()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      is_active: true,
    },
  })

  useEffect(() => {
    if (app) {
      form.reset({
        name: app.name,
        slug: app.slug,
        description: app.description || "",
        is_active: app.is_active,
      })
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        is_active: true,
      })
    }
  }, [app, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (app) {
        await updateApp({ id: app.id, ...values }).unwrap()
        toast({
          title: "Success",
          description: "Payment app updated successfully",
        })
      } else {
        await createApp(values).unwrap()
        toast({
          title: "Success",
          description: "Payment app created successfully",
        })
      }
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${app ? "update" : "create"} payment app`,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{app ? "Edit Payment App" : "Add Payment App"}</DialogTitle>
          <DialogDescription>Configure an application to use your payment system.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Inventory System" {...field} />
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
                      <Input placeholder="e.g., inventory-system" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the application" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>Enable this application for payments</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : app ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
