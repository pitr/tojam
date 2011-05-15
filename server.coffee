connect = require 'connect'
io = require 'socket.io'
VALID_COMMANDS = ["new", "left", "grow", "move", "shoot"]

app = connect.createServer(
  # connect.logger(),
  connect.static("#{__dirname}/public")
)

socket = io.listen(app)
app.listen(8080)

socket.on 'connection', (client) ->
  client.on 'message', (data) ->
    if data?.command in VALID_COMMANDS
      new_data = { id: client.sessionId, command: data.command }
      new_data.x        = parseFloat(data.x)      if parseFloat(data.x)
      new_data.y        = parseFloat(data.y)      if parseFloat(data.y)
      new_data.rotation = parseInt(data.rotation) if parseInt(data.rotation)
      new_data.state    = parseInt(data.state)    if parseInt(data.state)

      client.broadcast new_data

  client.on 'disconnect', ->
    client.broadcast(id: client.sessionId, command: 'left')

42
