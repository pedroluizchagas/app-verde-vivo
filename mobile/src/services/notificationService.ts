import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

export interface NotificationSchedule {
  id?: string
  title: string
  body: string
  date: Date
  data?: any
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    return finalStatus === "granted"
  }

  static async scheduleNotification(schedule: NotificationSchedule): Promise<string | null> {
    const hasPermission = await this.requestPermissions()
    
    if (!hasPermission) {
      console.warn("Notification permission not granted")
      return null
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: schedule.title,
          body: schedule.body,
          data: schedule.data,
          sound: true,
          priority: 'max',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: schedule.date,
        },
      })

      return notificationId
    } catch (error) {
      console.error("Error scheduling notification:", error)
      return null
    }
  }

  static async scheduleAppointmentReminder(
    appointment: any,
    reminderMinutes: number = 30
  ): Promise<string | null> {
    const appointmentDate = new Date(appointment.scheduled_date)
    const reminderDate = new Date(appointmentDate.getTime() - reminderMinutes * 60000)
    
    // Don't schedule if the reminder time is in the past
    if (reminderDate <= new Date()) {
      return null
    }

    return this.scheduleNotification({
      title: "Lembrete de Agendamento",
      body: `${appointment.title} - ${appointment.client?.name || "Cliente"} às ${appointmentDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      date: reminderDate,
      data: {
        type: "appointment_reminder",
        appointmentId: appointment.id,
      },
    })
  }

  static async schedulePendingPaymentReminder(
    transaction: any,
    reminderDays: number = 3
  ): Promise<string | null> {
    if (!transaction.due_date || transaction.status === "paid") {
      return null
    }

    const dueDate = new Date(transaction.due_date)
    const reminderDate = new Date(dueDate.getTime() - reminderDays * 24 * 60 * 60 * 1000)
    
    // Don't schedule if the reminder time is in the past
    if (reminderDate <= new Date()) {
      return null
    }

    return this.scheduleNotification({
      title: "Lembrete de Pagamento Pendente",
      body: `${transaction.description || "Pagamento"} - ${transaction.type === "income" ? "Receber" : "Pagar"} ${transaction.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      date: reminderDate,
      data: {
        type: "payment_reminder",
        transactionId: transaction.id,
      },
    })
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId)
    } catch (error) {
      console.error("Error canceling notification:", error)
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
    } catch (error) {
      console.error("Error canceling all notifications:", error)
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync()
    } catch (error) {
      console.error("Error getting scheduled notifications:", error)
      return []
    }
  }

  static setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })

    // Handle notifications when app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received:", notification)
    })

    // Handle notification responses (when user taps on notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification response received:", response)
      const { data } = response.notification.request.content
      
      if (data?.type === "appointment_reminder") {
        // Navigate to appointment details or schedule
        console.log("Navigate to appointment:", data.appointmentId)
      } else if (data?.type === "payment_reminder") {
        // Navigate to finance screen
        console.log("Navigate to transaction:", data.transactionId)
      }
    })
  }
}