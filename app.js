(function() {
  var State, generateWorld, playerAttr, send, sendThrottled, shoot, socket;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  State = (function() {
    function State(state) {
      this.state = state != null ? state : State.BABY;
    }
    State.prototype.next = function(new_state) {
      return this.state = new_state || Math.min(++this.state, State.DEAD);
    };
    State.prototype.is = function(state) {
      return this.state === state;
    };
    State.prototype.baby = function() {
      return this.is(State.BABY);
    };
    State.prototype.teen = function() {
      return this.is(State.TEEN);
    };
    State.prototype.adult = function() {
      return this.is(State.ADULT);
    };
    State.prototype.old = function() {
      return this.is(State.OLD);
    };
    State.prototype.dead = function() {
      return this.is(State.DEAD);
    };
    State.prototype.BASE_SPEED = [false, 0.4, 0.9, 1.9, 0.4, 0];
    State.prototype.ANIMATION = [false, 6, 13, 5, 14, 80];
    State.prototype.NAMES = [false, "baby", "teen", "adult", "old", "dead"];
    State.prototype.toString = function() {
      return this.NAMES[this.state];
    };
    State.prototype.base_speed = function() {
      return this.BASE_SPEED[this.state];
    };
    State.prototype.animation = function() {
      return this.ANIMATION[this.state];
    };
    return State;
  })();
  State.BABY = 1;
  State.TEEN = 2;
  State.ADULT = 3;
  State.OLD = 4;
  State.DEAD = 5;
  window.WEB_SOCKET_SWF_LOCATION = '/js/socket/lib/vendor/web-socket-js/WebSocketMain.swf';
  socket = typeof io !== "undefined" && io !== null ? new io.Socket('me', {
    port: 8080
  }) : void 0;
  window.rand = function(max) {
    return Math.floor(Math.random() * max * 2) - max;
  };
  window.arand = function(max) {
    return Math.floor(Math.random() * max);
  };
  window.Monster = {
    all: {},
    makeLocal: function() {
      return Monster.make(false, false, false, _.guid(), true);
    },
    makeRemote: function(x, y, vx, vy, state, g) {
      var monster;
      if (g in Monster.all) {
        monster = Monster.all[g];
        if (monster.is_local) {
          return;
        }
        monster.x = x;
        monster.y = y;
        monster.vx = vx;
        monster.vy = vy;
        return monster.state = state;
      } else {
        return Monster.make(x, y, state, g, false).attr({
          vx: vx,
          vy: vy
        });
      }
    },
    make: function(x, y, state, g, is_local) {
      return Monster.all[g] = Crafty.e("2D, DOM, monster, Animate, Collision").attr({
        state: state || 6,
        x: x || (arand(5) + 5),
        y: y || (arand(5) + 5),
        z: 3,
        vx: 1,
        vy: 0,
        step_max: 40,
        step: -1,
        g: g,
        is_local: is_local,
        kill: function() {
          this.destroy();
          if (this["in"] in Monster.all) {
            return delete Monster.all[this.g];
          }
        }
      }).animate("monster_walk", 6, 0, 7).bind("enterframe", function() {
        if (!this.isPlaying('monster_walk')) {
          this.animate('monster_walk', 10);
        }
        if (--this.step < 0) {
          this.step = this.step_max;
          this.vx = rand(1);
          this.vy = rand(1);
        }
        this.x += this.vx;
        this.y += this.vy;
        if (this.is_local) {
          return sendThrottled({
            command: 'monster',
            g: this.g,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            state: this.state
          });
        }
      }).collision().onHit("wall_left", function() {
        this.x += 5;
        return this.vx = 1;
      }).onHit("wall_right", function() {
        this.vx = -1;
        return this.x -= 5;
      }).onHit("wall_bottom", function() {
        this.vy = -1;
        return this.y -= 5;
      }).onHit("wall_top", function() {
        this.vy = 1;
        return this.y += 5;
      }).onHit('adult', function(e) {
        this.vx = -this.vx;
        return this.vy = -this.vy;
      }).onHit('player_local', function(e) {
        var player;
        player = e[0].obj;
        if (!player.state.adult()) {
          return player.die();
        }
      }).onHit('bullet', function(e) {
        var bullet, len;
        if (!this.is_local) {
          return;
        }
        bullet = e[0].obj;
        bullet.destroy();
        if (--this.state < 1) {
          this.kill();
          if (this.is_local) {
            send({
              command: 'monsterDie',
              g: this.g
            });
          }
          return Monster.makeLocal();
        } else {
          len = Math.sqrt((bullet.xspeed * bullet.xspeed) + (bullet.yspeed * bullet.yspeed));
          this.vx = 2 * -bullet.xspeed / len;
          this.vy = 2 * -bullet.yspeed / len;
          return this.step = this.step_max * 2;
        }
      });
    }
  };
  playerAttr = function(attr) {
    return {
      state: new State,
      x: attr.x || (Crafty.viewport.width / 2),
      y: attr.y || (Crafty.viewport.height / 2),
      z: attr.z || 1,
      xspeed: 0,
      yspeed: 0,
      vx: function() {
        return Math.sin(this.rotation * Math.PI / 180) * this.state.base_speed();
      },
      vy: function() {
        return Math.cos(this.rotation * Math.PI / 180) * this.state.base_speed();
      },
      walk: function() {
        var animation;
        animation = "" + this.state + "_walk";
        if (!this.isPlaying(animation)) {
          this.stop().animate(animation, this.state.animation());
        }
        if (attr.local != null) {
          return sendThrottled({
            command: 'move',
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            state: this.state.state
          });
        }
      },
      cooldown: false,
      rotation: attr.rotation || 0,
      grow_timer: attr.local != null ? $.every(60, "seconds", function() {
        if (Player.grow().state.dead()) {
          return clearTimeout(Player.grow_timer);
        }
      }) : void 0,
      grow: function(new_state) {
        var old_state;
        old_state = this.state.toString();
        this.state.next(new_state);
        if (this.has(old_state)) {
          this.removeComponent(old_state);
        }
        this.addComponent(this.state.toString());
        if (this.state.dead()) {
          this.rotation = 0;
        }
        if (attr.local != null) {
          send({
            command: 'grow',
            state: this.state.state
          });
        }
        return this;
      },
      die: function() {
        if (!this.state.dead()) {
          return this.grow(State.DEAD);
        }
      }
    };
  };
  send = function(data) {
    _.log("send: " + data.command + ", " + data.x + ", " + data.y + ", " + data.rotation + ", " + data.state);
    if (socket != null ? socket.connected : void 0) {
      return socket.send(data);
    }
  };
  sendThrottled = _.throttle(40, send);
  shoot = function(x, y, rotation, long) {
    return Crafty.e("2D, DOM, Color, bullet").attr({
      x: x,
      y: y,
      z: 2,
      w: 3,
      h: long ? 3 : 16,
      age: long ? 5 : 1,
      rotation: rotation,
      xspeed: 16 * Math.sin(rotation / 57.3),
      yspeed: 16 * Math.cos(rotation / 57.3)
    }).color("black").bind("enterframe", function() {
      var _ref, _ref2;
      if (this.age-- < 0) {
        this.destroy();
      }
      this.x += this.xspeed;
      this.y -= this.yspeed;
      if ((0 > (_ref = this._x) && _ref > Crafty.viewport.width) || (0 > (_ref2 = this._y) && _ref2 > Crafty.viewport.height)) {
        return this.destroy();
      }
    });
  };
  generateWorld = function() {
    var i, j, _results;
    for (i = 0; i <= 25; i++) {
      for (j = 0; j <= 20; j++) {
        Crafty.e("2D, DOM, grass" + (Crafty.randRange(1, 4))).attr({
          x: i * 16,
          y: j * 16
        });
        if ((0 < i && i < 25) && (0 < j && j < 20) && Crafty.randRange(0, 50) > 49) {
          Crafty.e("2D, DOM, flower, animate").attr({
            x: i * 16,
            y: j * 16
          }).animate("wind", 0, 1, 3).bind("enterframe", function() {
            if (!this.isPlaying()) {
              return this.animate("wind", 80);
            }
          });
        }
      }
    }
    for (i = 0; i <= 25; i++) {
      Crafty.e("2D, DOM, wall_top, bush" + Crafty.randRange(1, 2)).attr({
        x: i * 16,
        y: 0,
        z: 3
      });
      Crafty.e("2D, DOM, wall_bottom, bush" + Crafty.randRange(1, 2)).attr({
        x: i * 16,
        y: 20 * 16,
        z: 3
      });
    }
    _results = [];
    for (i = 0; i <= 19; i++) {
      Crafty.e("2D, DOM, wall_left, bush" + Crafty.randRange(1, 2)).attr({
        x: 0,
        y: i * 16,
        z: 3
      });
      _results.push(Crafty.e("2D, DOM, wall_right, bush" + Crafty.randRange(1, 2)).attr({
        x: 25 * 16,
        y: i * 16,
        z: 3
      }));
    }
    return _results;
  };
  $(function() {
    Crafty.init(420, 340);
    Crafty.sprite(16, "sprite.png", {
      grass1: [0, 0],
      grass2: [1, 0],
      grass3: [2, 0],
      grass4: [3, 0],
      bush1: [4, 0],
      bush2: [5, 0],
      flower: [0, 1],
      baby: [0, 3],
      teen: [5, 3],
      adult: [6, 3],
      old: [11, 3],
      dead: [4, 2],
      monster: [6, 0]
    });
    Crafty.scene("loading", function() {
      return Crafty.load(["sprite.png"], function() {
        $('#loader h1').text('Click anywhere!!!');
        $('#loader h2').text('Um, use arrow keys!');
        return $('#loader').click(function() {
          return Crafty.scene("main");
        });
      });
    });
    Crafty.scene('main', function() {
      var remote_players;
      $('#loader').hide();
      generateWorld();
      socket = null; // offline mode only on github pages
      if (socket != null ? socket.connect() : void 0) {
        remote_players = {};
        Monster.makeLocal();
        socket.on('message', function(data) {
          var remote_player, _ref;
          _.log("got: " + data.command + ", " + data.x + ", " + data.y + ", " + data.rotation + ", " + data.state);
          remote_player = remote_players[data.id];
          switch (data.command) {
            case 'move':
              if (remote_player) {
                remote_player.x = data.x;
                remote_player.y = data.y;
                return remote_player.rotation = data.rotation;
              } else {
                return remote_players[data.id] = Crafty.e("2D, DOM").attr(playerAttr({
                  x: data.x,
                  y: data.y,
                  rotation: data.rotation,
                  z: 1
                })).grow(data.state).origin("center");
              }
              break;
            case 'left':
              return remote_player != null ? remote_player.destroy() : void 0;
            case 'grow':
              return remote_player != null ? remote_player.grow(data.state) : void 0;
            case 'shoot':
              return shoot(data.x, data.y, data.rotation, data.state === State.TEEN);
            case 'monster':
              return Monster.makeRemote(data.x, data.y, data.vx, data.vy, data.state, data.g);
            case 'monsterDie':
              return (_ref = Monster.all[data.g]) != null ? _ref.kill() : void 0;
          }
        });
      } else {
        _.log("Can't connect, playing offline mode. Shitty!");
        Monster.makeLocal();
      }
      window.Player = Crafty.e("2D, DOM, baby, player_local, Animate, Collision, Controls").attr(playerAttr({
        local: true,
        z: 2,
        state: false
      })).animate("baby_walk", 0, 3, 2).animate("teen_walk", 3, 3, 5).animate("adult_walk", 6, 3, 8).animate("old_walk", 9, 3, 11).animate("dead_walk", 2, 2, 2).origin("center").bind("enterframe", function(e) {
        var x, y, _ref;
        if (this.isDown("LEFT_ARROW")) {
          if (!this.state.dead()) {
            this.rotation -= 5;
          }
        }
        if (this.isDown("RIGHT_ARROW")) {
          if (!this.state.dead()) {
            this.rotation += 5;
          }
        }
        if (this.isDown("UP_ARROW")) {
          this.x += this.vx();
          this.y -= this.vy();
          this.walk();
        }
        if (this.isDown("DOWN_ARROW")) {
          this.x -= this.vx();
          this.y += this.vy();
          this.walk();
        }
        if (this.isDown("SPACE") && !this.cooldown) {
          if (this.state.teen() || this.state.old()) {
            this.cooldown = true;
            $.after(1, 'second', __bind(function() {
              return this.cooldown = false;
            }, this));
            _ref = [this.x + 8, this.y + 8], x = _ref[0], y = _ref[1];
            send({
              command: 'shoot',
              x: x,
              y: y,
              rotation: this.rotation
            });
            return shoot(x, y, this.rotation, this.state.teen());
          }
        }
      }).bind("keyup", function(e) {
        return this.stop();
      }).collision().onHit("wall_left", function() {
        this.x += 5;
        return this.stop();
      }).onHit("wall_right", function() {
        this.x -= 5;
        return this.stop();
      }).onHit("wall_bottom", function() {
        this.y -= 5;
        return this.stop();
      }).onHit("wall_top", function() {
        this.y += 5;
        return this.stop();
      }).onHit('monster', function() {
        if (!this.state.adult()) {
          return this.die();
        }
      });
      return send({
        command: 'move',
        x: Player.x,
        y: Player.y,
        rotation: Player.rotation,
        state: Player.state.state
      });
    });
    return Crafty.scene("loading");
  });
}).call(this);
