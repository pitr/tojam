window._ = {}

_.throttle = (ms, fn) ->
  last = (new Date()).getTime()
  ->
    now = (new Date()).getTime()
    if now - last > ms
      last = now
      fn.apply(@, arguments)