connect = require 'connect'
io = require 'socket.io'
_ = require('./public/utils.js')._
VALID_COMMANDS = ["left", "grow", "move", "shoot", "monster", "monsterDie"]

p2m = {}

app = connect.createServer(
  # connect.logger(),
  connect.static("#{__dirname}/public")
)

socket = io.listen(app)
app.listen(80)

socket.on 'connection', (client) ->
  client.on 'connect', ->

  client.on 'message', (data) ->
    if data?.command in VALID_COMMANDS
      switch data.command
        when "monsterDie" then delete p2m[client.sessionId]
        when "monster"
          unless client.sessionId of p2m
            console.log "New goat: #{data.g} for #{client.sessionId}"
          p2m[client.sessionId] = data.g

      new_data = { id: client.sessionId, command: data.command }
      new_data.x        = parseFloat(data.x)      if parseFloat(data.x)
      new_data.y        = parseFloat(data.y)      if parseFloat(data.y)
      new_data.vx       = parseFloat(data.vx)     if parseFloat(data.vx)
      new_data.vy       = parseFloat(data.vy)     if parseFloat(data.vy)
      new_data.rotation = parseInt(data.rotation) if parseInt(data.rotation)
      new_data.state    = parseInt(data.state)    if parseInt(data.state)
      new_data.len      = parseInt(data.len)      if parseInt(data.len)
      new_data.g        = data.g                  if data.g

      client.broadcast new_data

  client.on 'disconnect', ->
    delete p2m[client.sessionId]
    client.broadcast(id: client.sessionId, command: 'left')

42
