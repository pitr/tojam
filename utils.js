(function() {
  (function(glob) {
    return glob._ = {
      DEBUG: false,
      log: function(msg) {
        if (_.DEBUG) {
          return console.log(msg);
        }
      },
      throttle: function(ms, fn) {
        var last;
        last = (new Date()).getTime();
        return function() {
          var now;
          now = (new Date()).getTime();
          if (now - last > ms) {
            last = now;
            return fn.apply(this, arguments);
          }
        };
      },
      guid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r, v;
          r = Math.random() * 16 | 0;
          v = c === 'x' ? r : r & 0x3 | 0x8;
          return v.toString(16);
        }).toUpperCase();
      }
    };
  })(this);
}).call(this);
