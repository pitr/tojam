((glob) ->

  glob._ =

    DEBUG: off
    log: (msg) -> console.log(msg) if _.DEBUG

    throttle: (ms, fn) ->
      last = (new Date()).getTime()
      ->
        now = (new Date()).getTime()
        if now - last > ms
          last = now
          fn.apply(@, arguments)

    guid: ->
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
        r = Math.random()*16|0
        v = if c is 'x' then r else (r&0x3|0x8)
        v.toString(16)
      ).toUpperCase()

)(this)
