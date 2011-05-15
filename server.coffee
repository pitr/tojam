connect = require 'connect'
io = require 'socket.io'

app = connect.createServer(
  connect.logger(),
  connect.static("#{__dirname}/public")
)

socket = io.listen(app)
app.listen(8080)

socket.on 'connection', (client) ->
  client.send( hello: 'world' )
