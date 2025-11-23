import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/ThemeContext'

interface CalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  events?: { [key: string]: any[] }
  month?: Date
  showHeader?: boolean
}

export function Calendar({ selectedDate, onDateSelect, events = {}, month, showHeader = false }: CalendarProps) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const [internalMonth, setInternalMonth] = React.useState(new Date())
  const currentMonth = month ?? internalMonth
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  
  const goToPreviousMonth = () => {
    setInternalMonth(subMonths(currentMonth, 1))
  }
  
  const goToNextMonth = () => {
    setInternalMonth(addMonths(currentMonth, 1))
  }
  
  const goToToday = () => {
    setInternalMonth(new Date())
    onDateSelect(new Date())
  }
  
  const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd')
  
  const renderDay = (day: Date) => {
    const dateKey = getDateKey(day)
    const hasEvents = events[dateKey] && events[dateKey].length > 0
    const isSelected = isSameDay(day, selectedDate)
    const isToday = isSameDay(day, new Date())
    const isCurrentMonth = isSameMonth(day, currentMonth)
    
    return (
      <TouchableOpacity
        key={day.toString()}
        style={[
          styles.dayContainer,
          !isCurrentMonth && styles.dayOutsideMonth
        ]}
        onPress={() => onDateSelect(day)}
      >
        <View
          style={[
            styles.dayInner,
            isSelected && styles.dayInnerSelected,
            !isSelected && isToday && styles.dayInnerToday
          ]}
        >
          <Text
            style={[
              styles.dayText,
              !isCurrentMonth && styles.dayTextOutside,
              isSelected && styles.dayTextSelected,
              !isSelected && isToday && styles.dayTextToday
            ]}
          >
            {format(day, 'd')}
          </Text>
        </View>
        {hasEvents && <View style={styles.eventDot} />}
      </TouchableOpacity>
    )
  }
  
  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday}>
            <Text style={styles.monthTitle}>
              {format(currentMonth, 'LLLL yyyy', { locale: ptBR })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.weekDays}>
        {weekDays.map((day, idx) => (
          <Text key={`wd-${idx}`} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>
      
      <View style={styles.daysGrid}>
        {monthDays.map(renderDay)}
      </View>
    </View>
  )
}

function getStyles(c: { bg: string; surface: string; border: string; textPrimary: string; textSecondary: string; link: string; warning: string }) {
  return StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    navButton: {
      padding: 8,
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
    },
    weekDays: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 0,
    },
    weekDay: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
      textAlign: 'center',
      width: '14.28%',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayContainer: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 6,
    },
    dayOutsideMonth: {
      opacity: 0.4,
    },
    dayInner: {
      minWidth: 32,
      minHeight: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayInnerSelected: {
      backgroundColor: c.link,
    },
    dayInnerToday: {
      borderWidth: 2,
      borderColor: c.link,
    },
    dayText: {
      fontSize: 14,
      color: c.textPrimary,
      fontWeight: '500',
    },
    dayTextOutside: {
      color: c.textSecondary,
    },
    dayTextSelected: {
      color: '#ffffff',
      fontWeight: '700',
    },
    dayTextToday: {
      color: c.link,
      fontWeight: '700',
    },
    eventDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.warning,
      marginTop: 8,
    },
  })
}