Music =
  intro:  "0_0:1,0_3:1,0_4_1"
  baby:   "4_2:1,2_4:1,2_3:2"


DEFAULT = 0
UP      = 1
RIGHT   = 2
DOWN    = 3
LEFT    = 4

SIZE = 9
SPEED = 225

sounds = []
blocks = []
isRunning = no
timeouts = []

class Note
  constructor: (@name) ->
    @sound = off
  play: (volume) ->
    @sound.play(volume: volume) if @sound
    @
  echo: (volume) ->
    timeouts.push($.after(SPEED*2,  => @play(Math.floor(volume/2 ))))
    timeouts.push($.after(SPEED*8,  => @play(Math.floor(volume/4 ))))
    timeouts.push($.after(SPEED*16, => @play(Math.floor(volume/6 ))))
    timeouts.push($.after(SPEED*32, => @play(Math.floor(volume/10))))

sounds = (new Note(String(note)) for note in [0..8])

class Block
  constructor: (@x, @y, @state) ->
    @id = _.guid()
    blocks.push(@)
  toString: ->
    switch @state
      when DEFAULT then 'default'
      when RIGHT then 'right'
      when LEFT then 'left'
      when UP then 'up'
      when DOWN then 'down'
  rotate: ->
    @state = switch @state
      when DEFAULT then DEFAULT
      when RIGHT then LEFT
      when LEFT then RIGHT
      when UP then DOWN
      when DOWN then UP
  play: (c) ->
    volume = 80
    sounds[c]
      .play(volume)
      .echo(volume)
    _.log("--== #{note.name} at #{volume} ==--")
  move: ->
    switch @state
      when RIGHT
        if @x == (SIZE-1)
          @play(@x)
          @state = LEFT
          @x--
        else @x++
      when DOWN
        if @.y == (SIZE-1)
          @play(@y)
          @state = UP
          @y--
        else @y++
      when LEFT
        if @x == 0
          @play(@x)
          @state = RIGHT
          @x++
        else @x--
      when UP
        if @y == 0
          @play(@y)
          @state = DOWN
          @y++
        else @y--

$ ->
  load(Music.intro)

load = (data) ->
  for block in data.split(',')
    [x, y, state] = block.split(/[:_]/)
    new Block(Number(x), Number(y), Number(state))

stop = ->
  clearInterval(isRunning)
  isRunning = null
  clearTimeout(timeout) for timeout in timeouts

start = ->
  isRunning = setInterval(run, 225)

run = ->
  #move
  block.move() for block in blocks

  #check to rotate
  for block1 in blocks
    for block2 in blocks
      if block1 isnt block2 and block1.id is block2.id
        block1.rotate()
        _.log("collision: #{block1} grid: #{block1.id}")

# setup the soundManager object
soundManager.debugMode = false
soundManager.useFlashBlock = false
soundManager.flashVersion = 9
#soundManager.useHTML5Audio = true

soundManager.onready ->
  for note in sounds
    id = Number(_i)
    url = "mp3s/piccata/picat00#{ id }.mp3"
    note.sound = soundManager.createSound(id: note.name,  url: url)
  # start()

soundManager.ontimeout -> _.log('No music, shitty!')

42
