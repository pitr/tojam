class State
  constructor: (@state = State.BABY) ->
  next: -> @state = Math.min(++@state, State.DEAD)
  is: (state) -> @state is state
  baby: -> @is(State.BABY)
  teen: -> @is(State.TEEN)
  adult: -> @is(State.ADULT)
  old: -> @is(State.OLD)
  dead: -> @is(State.DEAD)
  BASE_SPEED: [off, 0.4, 0.9, 1.9, 0.9, 0]
  ANIMATION: [off, 5, 5, 5, 5, 80]
  NAMES: [off, "baby", "teen", "adult", "old", "dead"]
  toString: -> @NAMES[@state]
  base_speed: -> @BASE_SPEED[@state]
  animation: -> @ANIMATION[@state]

State.BABY   = 1
State.TEEN   = 2
State.ADULT  = 3
State.OLD    = 4
State.DEAD   = 5

io.setPath('/js/socket/')

socket = new io.Socket('me', port: 8080)

if socket.connect()
  remote_players = {}
  socket.on 'message', (data) ->
    switch data.hello
      when 'join'
        remote_players[data.id] = Crafty.e("2D, DOM, player")
          .attr(x: data.x, y: data.y, rotation: data.rotation, z: 1)
      when 'left'   then remote_players[data.id].destroy()
      when 'grow'   then remote_players[data.id].grow()
      when 'move'
        remote_player = remote_players[data.id]
        remote_player.x = data.x
        remote_player.y = data.y
        remote_player.rotation = data.rotation
      when 'shoot'  then shoot(data.x, data.y, data.rotation)
else
  alert("Can't connect, playing offline mode")

shoot = (x, y, rotation) ->
  Crafty.e("2D, DOM, Color, bullet")
    .attr
      x: x
      y: y
      z: 2
      w: 2
      h: 2
      age: 5
      rotation: rotation
      xspeed: 20 * Math.sin(rotation / 57.3)
      yspeed: 20 * Math.cos(rotation / 57.3)
    .color("brown")
    .bind "enterframe", ->
      @x += @xspeed
      @y -= @yspeed
      # destroy if it goes out of bounds
      @destroy() if 0 > @_x > Crafty.viewport.width or 0 > @_y > Crafty.viewport.height
      @destroy() if @age-- < 0

generateWorld = ->
  # Generate the grass along the x-axis
  for i in [0..25]
    # Generate the grass along the y-axis
    for j in [0..20]
      Crafty.e("2D, DOM, grass#{Crafty.randRange(1, 4)}")
        .attr(x: i * 16, y: j * 16)

      # 1/50 chance of drawing a flower and only within the bushes
      if 0 < i < 25 and 0 < j < 20 and Crafty.randRange(0, 50) > 49
        Crafty.e("2D, DOM, flower, animate")
          .attr(x: i * 16, y: j * 16)
          .animate("wind", 0, 1, 3)
          .bind "enterframe", -> @animate("wind", 80) unless @isPlaying()

  # Create the bushes along the x-axis which will form the boundaries
  for i in [0..25]
    Crafty.e("2D, DOM, wall_top, bush"+Crafty.randRange(1,2))
      .attr(x: i * 16, y: 0, z: 3)
    Crafty.e("2D, DOM, wall_bottom, bush"+Crafty.randRange(1,2))
      .attr(x: i * 16, y: 20*16, z: 3)

  # Create the bushes along the y-axis
  # We need to start one more and one less to not overlap the previous bushes
  for i in [0..19]
    Crafty.e("2D, DOM, wall_left, bush" + Crafty.randRange(1,2))
      .attr(x: 0, y: i * 16, z: 3)
    Crafty.e("2D, DOM, wall_right, bush" + Crafty.randRange(1,2))
      .attr(x: 25*16, y: i * 16, z: 3)

$ ->

  Crafty.init(420, 340)

  Crafty.sprite 16, "sprite.png",
    grass1: [0,0]
    grass2: [1,0]
    grass3: [2,0]
    grass4: [3,0]
    bush1:  [0,2]
    bush2:  [1,2]
    flower: [0,1]

    baby:   [0,2]
    teen:   [3,3]
    adult:  [3,3]
    old:    [3,3]
    dead:   [0,1]
    monster:[0,2]

  Crafty.scene "loading", ->
    Crafty.load ["sprite.png"], ->
      Crafty.scene("main")

  Crafty.scene 'main', ->
    $('#loader').hide()
    generateWorld()

    window.Player = Crafty.e("2D, DOM, baby, Animate, Collision, Controls")
      .attr
        state: new State
        x: Crafty.viewport.width / 2
        y: Crafty.viewport.height / 2
        z: 2
        xspeed: 0
        yspeed: 0
        vx: -> Math.sin(@rotation * Math.PI / 180) * @state.base_speed()
        vy: -> Math.cos(@rotation * Math.PI / 180) * @state.base_speed()
        walk: ->
          animation = "#{@state}_walk"
          @stop().animate(animation, @state.animation()) unless @isPlaying(animation)
        cooldown: false
        grow_timer: $.every(20, "seconds", -> Player.grow())
        grow: ->
          old_state = @state.toString()
          @state.next()
          @removeComponent(old_state) if @has(old_state)
          @addComponent(@state.toString())
          if @state.dead() then @rotation = 0
      .animate("baby_walk", 0, 2, 1)
      .animate("teen_walk", 0, 3, 2)
      .animate("adult_walk", 3, 3, 5)
      .animate("old_walk", 0, 3, 2)
      .animate("dead_walk", 0, 1, 3)
      .origin("center")
      .bind "enterframe", (e) ->
        if @isDown("LEFT_ARROW")
          @rotation -= 5 unless @state.dead()
        if @isDown("RIGHT_ARROW")
          @rotation += 5 unless @state.dead()
        if @isDown("UP_ARROW")
          @x += @vx()
          @y -= @vy()
          @walk()
        if @isDown("DOWN_ARROW")
          @x -= @vx()
          @y += @vy()
          @walk()
        if @isDown("SPACE") and not @cooldown
          switch @state.state
            when State.TEEN
              @cooldown = true
              $.after 500, => @cooldown = false
              shoot(@x, @y, @rotation)
            when State.ADULT
              # kick
              42
            when State.OLD
              # ???
              42

      .bind("keyup", (e) -> @stop().cooldown = false)
      .collision()
      .onHit "wall_left", ->
        @stop()
      .onHit "wall_right", ->
        @stop()
      .onHit "wall_bottom", ->
        @stop()
      .onHit "wall_top", ->
        @stop()

  Crafty.scene("loading")
