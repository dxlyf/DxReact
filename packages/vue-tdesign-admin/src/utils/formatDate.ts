import dayjs from 'dayjs'

export function formatDate(
  datetime: string | null | undefined,
  format: string = 'YYYY-MM-DD HH:mm:ss',
  defaultValue: string = '-'
): string {
  if (datetime == null) return defaultValue
  const d = dayjs(datetime)
  return d.isValid() ? d.format(format) : defaultValue
}
