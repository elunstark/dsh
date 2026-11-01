/**
 * Host half of the message clock: publishes the current local time as runtime
 * context so every model step (every message the model answers) is stamped.
 */

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function two(value) {
  return String(value).padStart(2, '0')
}

/** "2026-11-01 周日 09:33:11 UTC+08:00 [Asia/Shanghai] (epoch 1762…)" */
export function formatLocalTime(date = new Date()) {
  const minutes = -date.getTimezoneOffset()
  const sign = minutes >= 0 ? '+' : '-'
  const absolute = Math.abs(minutes)
  const zone = typeof Intl === 'object' && Intl.DateTimeFormat
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'local'
  const offset = `UTC${sign}${two(Math.floor(absolute / 60))}:${two(absolute % 60)}`
  const day = `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
  const clock = `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`
  return `${day} ${WEEKDAYS[date.getDay()]} ${clock} ${offset} [${zone}] (epoch ${Math.floor(date.getTime() / 1000)})`
}

export const inject = ['systemPrompt']

export function apply(ctx) {
  ctx.systemPrompt.context({
    name: 'message-clock',
    order: 60,
    text: () => [
      `当前时间：${formatLocalTime()}`,
      '这是本条消息（本次模型请求）发起时的本地时间，每一步都会重新采样；用户消息与助手消息在会话日志中的时间戳也以此为准。',
    ].join('\n'),
  })
}
