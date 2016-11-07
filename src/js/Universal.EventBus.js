define('Universal.EventBus', function() {

    'use strict';

    var singleton,
        createEventBus = function() {

            var queue = [];

            return {

                next: function() {
                    return queue.shift();
                },

                add: function(evt) {
                    var ids = [];
                    if (!evt || !evt.id) {
                        return;
                    }
                    if (evt.targets && evt.targets.length) {
                        evt.targets = evt.targets.map(function(entity) {
                            return entity.getId();
                        });
                    }
                    ids = [].concat(evt.id);
                    if (ids.length > 1) {
                        ids.forEach(function(id) {
                            var event = Object.create(evt);
                            event.id = id;
                            queue.push(event);
                        });
                    } else {
                        queue.push(evt);
                    }
                },

                remove: function() {
                    for (var i = queue.length - 1; i >= 0; i -= 1) {
                        if (queue[i].uid === event.uid) {
                            queue.slice(i, 1);
                            return;
                        }
                    }
                },

                reset: function() {
                    queue.splice(0, queue, length);
                }
            }

        };

    return {

        getInstance: function() {
            if (!singleton) {
                singleton = createEventBus();
            }
            return singleton;
        }
    };

});