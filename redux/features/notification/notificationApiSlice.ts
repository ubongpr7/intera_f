import { apiSlice } from "../../services/apiSlice"
import type {
  NotificationListResponse,
  NotificationRecord,
  NotificationUnreadCountResponse,
} from "./notificationTypes"

const service = "notification" as const

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<NotificationListResponse, { unread_only?: boolean; limit?: number; offset?: number } | void>({
      query: (params) => ({
        url: "/api/v1/notifications/",
        params: params ?? { limit: 50, offset: 0 },
        service,
      }),
    }),

    getNotificationUnreadCount: builder.query<NotificationUnreadCountResponse, void>({
      query: () => ({
        url: "/api/v1/notifications/unread-count",
        service,
      }),
    }),

    markNotificationRead: builder.mutation<NotificationRecord, string>({
      query: (notificationId) => ({
        url: `/api/v1/notifications/${notificationId}/mark-read`,
        method: "POST",
        service,
      }),
    }),

    markAllNotificationsRead: builder.mutation<{ marked: number }, void>({
      query: () => ({
        url: "/api/v1/notifications/mark-all-read",
        method: "POST",
        service,
      }),
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApiSlice
