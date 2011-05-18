(function() {
  var Block, DEFAULT, DOWN, LEFT, Music, Note, RIGHT, SIZE, SPEED, UP, blocks, isRunning, load, note, run, sounds, start, stop, timeouts;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Music = {
    intro: "0_0:1,0_3:1,0_4_1",
    baby: "4_2:1,2_4:1,2_3:2"
  };
  DEFAULT = 0;
  UP = 1;
  RIGHT = 2;
  DOWN = 3;
  LEFT = 4;
  SIZE = 9;
  SPEED = 225;
  sounds = [];
  blocks = [];
  isRunning = false;
  timeouts = [];
  Note = (function() {
    function Note(name) {
      this.name = name;
      this.sound = false;
    }
    Note.prototype.play = function(volume) {
      if (this.sound) {
        this.sound.play({
          volume: volume
        });
      }
      return this;
    };
    Note.prototype.echo = function(volume) {
      timeouts.push($.after(SPEED * 2, __bind(function() {
        return this.play(Math.floor(volume / 2));
      }, this)));
      timeouts.push($.after(SPEED * 8, __bind(function() {
        return this.play(Math.floor(volume / 4));
      }, this)));
      timeouts.push($.after(SPEED * 16, __bind(function() {
        return this.play(Math.floor(volume / 6));
      }, this)));
      return timeouts.push($.after(SPEED * 32, __bind(function() {
        return this.play(Math.floor(volume / 10));
      }, this)));
    };
    return Note;
  })();
  sounds = (function() {
    var _results;
    _results = [];
    for (note = 0; note <= 8; note++) {
      _results.push(new Note(String(note)));
    }
    return _results;
  })();
  Block = (function() {
    function Block(x, y, state) {
      this.x = x;
      this.y = y;
      this.state = state;
      this.id = _.guid();
      blocks.push(this);
    }
    Block.prototype.toString = function() {
      switch (this.state) {
        case DEFAULT:
          return 'default';
        case RIGHT:
          return 'right';
        case LEFT:
          return 'left';
        case UP:
          return 'up';
        case DOWN:
          return 'down';
      }
    };
    Block.prototype.rotate = function() {
      return this.state = (function() {
        switch (this.state) {
          case DEFAULT:
            return DEFAULT;
          case RIGHT:
            return LEFT;
          case LEFT:
            return RIGHT;
          case UP:
            return DOWN;
          case DOWN:
            return UP;
        }
      }).call(this);
    };
    Block.prototype.play = function(c) {
      var volume;
      volume = 80;
      sounds[c].play(volume).echo(volume);
      return _.log("--== " + note.name + " at " + volume + " ==--");
    };
    Block.prototype.move = function() {
      switch (this.state) {
        case RIGHT:
          if (this.x === (SIZE - 1)) {
            this.play(this.x);
            this.state = LEFT;
            return this.x--;
          } else {
            return this.x++;
          }
          break;
        case DOWN:
          if (this.y === (SIZE - 1)) {
            this.play(this.y);
            this.state = UP;
            return this.y--;
          } else {
            return this.y++;
          }
          break;
        case LEFT:
          if (this.x === 0) {
            this.play(this.x);
            this.state = RIGHT;
            return this.x++;
          } else {
            return this.x--;
          }
          break;
        case UP:
          if (this.y === 0) {
            this.play(this.y);
            this.state = DOWN;
            return this.y++;
          } else {
            return this.y--;
          }
      }
    };
    return Block;
  })();
  $(function() {
    return load(Music.intro);
  });
  load = function(data) {
    var block, state, x, y, _i, _len, _ref, _ref2, _results;
    _ref = data.split(',');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      block = _ref[_i];
      _ref2 = block.split(/[:_]/), x = _ref2[0], y = _ref2[1], state = _ref2[2];
      _results.push(new Block(Number(x), Number(y), Number(state)));
    }
    return _results;
  };
  stop = function() {
    var timeout, _i, _len, _results;
    clearInterval(isRunning);
    isRunning = null;
    _results = [];
    for (_i = 0, _len = timeouts.length; _i < _len; _i++) {
      timeout = timeouts[_i];
      _results.push(clearTimeout(timeout));
    }
    return _results;
  };
  start = function() {
    return isRunning = setInterval(run, 225);
  };
  run = function() {
    var block, block1, block2, _i, _j, _len, _len2, _results;
    for (_i = 0, _len = blocks.length; _i < _len; _i++) {
      block = blocks[_i];
      block.move();
    }
    _results = [];
    for (_j = 0, _len2 = blocks.length; _j < _len2; _j++) {
      block1 = blocks[_j];
      _results.push((function() {
        var _k, _len3, _results2;
        _results2 = [];
        for (_k = 0, _len3 = blocks.length; _k < _len3; _k++) {
          block2 = blocks[_k];
          _results2.push(block1 !== block2 && block1.id === block2.id ? (block1.rotate(), _.log("collision: " + block1 + " grid: " + block1.id)) : void 0);
        }
        return _results2;
      })());
    }
    return _results;
  };
  soundManager.debugMode = false;
  soundManager.useFlashBlock = false;
  soundManager.flashVersion = 9;
  soundManager.onready(function() {
    var id, note, url, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = sounds.length; _i < _len; _i++) {
      note = sounds[_i];
      id = Number(_i);
      url = "mp3s/piccata/picat00" + id + ".mp3";
      _results.push(note.sound = soundManager.createSound({
        id: note.name,
        url: url
      }));
    }
    return _results;
  });
  soundManager.ontimeout(function() {
    return _.log('No music, shitty!');
  });
  42;
}).call(this);
