window.__ModuleLoader__.load({
  id: 'dsh-message-clock',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useState } = React

    const two = (value) => String(value).padStart(2, '0')
    const clock = (date) =>
      `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`
    const stamp = (date) =>
      `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${clock(date)}`

    const chip = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontVariantNumeric: 'tabular-nums',
      fontFamily: 'inherit',
      fontSize: '11px',
      lineHeight: '16px',
      color: 'var(--dsw-alias-label-secondary)',
      userSelect: 'none',
      whiteSpace: 'nowrap',
    }

    const glyph = { opacity: 0.65 }

    /** Accepts epoch (s or ms), Date, or an ISO string; returns a valid Date. */
    function toDate(value) {
      if (value === null || value === undefined) return undefined
      if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
      if (typeof value === 'number' && Number.isFinite(value)) {
        const date = new Date(value > 1e12 ? value : value * 1000)
        return Number.isNaN(date.getTime()) ? undefined : date
      }
      if (typeof value === 'string') {
        const parsed = Date.parse(value)
        return Number.isNaN(parsed) ? undefined : new Date(parsed)
      }
      return undefined
    }

    const START_KEYS = [
      'startedAt', 'startAt', 'started_at', 'started', 'start', 'begin', 'beganAt',
      'createdAt', 'created_at', 'at', 'time', 'ts', 'timestamp',
    ]
    const END_KEYS = [
      'endedAt', 'endAt', 'ended_at', 'ended', 'end', 'finishedAt', 'finished_at',
      'completedAt', 'completed_at', 'closedAt', 'updatedAt', 'timestamp',
    ]

    /** Reads recorded Turn times when the owner exposes them; never invents one. */
    function readTurnTimes(turn) {
      if (!turn || typeof turn !== 'object') return {}
      const sources = [turn]
      for (const key of ['timestamps', 'times', 'time', 'range', 'lifecycle', 'record']) {
        const nested = turn[key]
        if (nested && typeof nested === 'object') sources.push(nested)
      }
      let start
      let end
      for (const source of sources) {
        if (!start) {
          for (const key of START_KEYS) {
            const date = toDate(source[key])
            if (date) { start = date; break }
          }
        }
        if (!end) {
          for (const key of END_KEYS) {
            const date = toDate(source[key])
            if (date) { end = date; break }
          }
        }
      }
      return { start, end }
    }

    /** Live clock beneath the composer: the "now" the reader sees on the page. */
    function LiveClock() {
      const [now, setNow] = useState(() => new Date())
      useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
      }, [])
      return h(
        'span',
        { style: chip, title: stamp(now), 'data-message-clock': 'live' },
        h('span', { style: glyph, 'aria-hidden': true }, '⏱'),
        clock(now),
      )
    }

    /** Timestamp row for a completed Turn, from the Turn's own recorded times. */
    function TurnStamp(props) {
      const { start, end } = readTurnTimes(props && props.turn)
      if (!start && !end) return null
      const from = start || end
      const to = end || start
      const sameDay =
        from.getFullYear() === to.getFullYear() &&
        from.getMonth() === to.getMonth() &&
        from.getDate() === to.getDate()
      const text = from === to
        ? stamp(to)
        : sameDay
          ? `${clock(from)} → ${clock(to)}`
          : `${stamp(from)} → ${stamp(to)}`
      return h(
        'div',
        {
          style: { ...chip, marginTop: '6px' },
          title: `${stamp(from)} → ${stamp(to)}`,
          'data-message-clock': 'turn',
        },
        h('span', { style: glyph, 'aria-hidden': true }, '🕒'),
        text,
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            { name: 'conversation.composer.dock', id: 'message-clock-live', order: 5 },
            LiveClock,
          ),
        )
        ctx.slots.inject('conversation.chat.turnTail', () =>
          ctx.slots.register(
            { name: 'conversation.chat.turnTail', id: 'message-clock-turn', order: 30 },
            TurnStamp,
          ),
        )
      },
    }
  },
})
