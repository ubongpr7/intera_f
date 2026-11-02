import SupportPortalWorkspace from "@/components/support/SupportPortalWorkspace"

// Staff and superusers use the same real-time support inbox as the dedicated
// support host, but it must also be reachable from the admin portal.
export default function AdminChatPage() {
  return <SupportPortalWorkspace />
}
