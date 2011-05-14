connect = require 'connect'

console.log("#{__dirname}/../fe")

connect.createServer(
  connect.logger(),
  connect.static("#{__dirname}/../fe")
).listen 8080
