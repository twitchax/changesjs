; 'use strict';
(function () {
    class Stream {
        constructor() {
            this._callbacks = [];
        }

        // Public static methods.

        static empty() {
            return new Stream();
        }

        static timer(millis) {
            var stream = new Stream();

            window.setTimeout(() => {
                stream._push(new Date());
            }, 0);

            window.setInterval(() => {
                stream._push(new Date());
            }, millis);

            return stream;
        }

        static dom(elementId, eventName) {
            var element = document.querySelector(`#${elementId}`);
            var stream = new Stream();

            element.addEventListener(eventName, (e) => {
                stream._push(e);
            });

            return stream;
        }

        static wikiget(search) {
            var stream = new Stream();

            WIKIPEDIAGET(search, (d) => {
                stream._push(d);
            });

            return stream;
        }

        static zip(streams, zipper) {
            return new ZipStream(zipper, ...streams);
        }

        // Public methods.

        subscribe(callback) {
            this._callbacks.push(callback)
        }

        first() {
            return new FirstStream(this);
        }

        map(map) {
            return new MapStream(map, this);
        }

        filter(filter) {
            return new FilterStream(filter, this);
        }

        flatten() {
            return new FlattenStream(this);
        }

        join(other) {
            return new JoinStream(other, this);
        }

        combine() {
            return new CombineStream(this);
        }

        zip(other, zipper) {
            return new ZipStream(zipper, this, other);
        }

        throttle(millis) {
            return new ThrottleStream(millis, this);
        }

        latest() {
            return new LatestStream(this);
        }

        unique(hashFunction) {
            return new UniqueStream(hashFunction, this);
        }

        tally() {
            return new TallyStream(this);
        }

        // Private methods.

        _push(data) {
            for (var c of this._callbacks)
                c(data);
        }

        _push_many(datas) {
            if (!(datas[Symbol.iterator] instanceof Function))
                throw Error('"datas" must be iterable.');

            for (var d of datas)
                this._push(d);
        }
    }

    class FirstStream extends Stream {
        constructor(parent) {
            super();

            this._hasPushedOnce = false;

            this._parent = parent;
            this._parent.subscribe(d => this._push(d));
        }

        _push(data) {
            if (!this._hasPushedOnce) {
                super._push(data);
                this._hasPushedOnce = true;
            }
        }
    }

    class MapStream extends Stream {
        constructor(map, parent) {
            super();

            this._map = map;

            this._parent = parent;
            this._parent.subscribe(d => this._push(d));
        }

        _push(data) {
            super._push(this._map(data));
        }
    }

    class FilterStream extends Stream {
        constructor(filter, parent) {
            super();

            this._filter = filter;

            this._parent = parent;
            this._parent.subscribe(d => this._push(d));
        }

        _push(data) {
            if (this._filter(data))
                super._push(data);
        }

        filter(filter) {
            var newFilter = d => {
                return this._filter(d) && filter(d);
            };

            return new FilterStream(newFilter, this._parent);
        }
    }

    class FlattenStream extends Stream {
        constructor(parent) {
            super();

            this._parent = parent;
            this._parent.subscribe(d => this._push(d));
        }

        _push(data) {
            if (data[Symbol.iterator] instanceof Function)
                for (var d of data)
                    super._push(d);
            else
                super._push(data);
        }
    }

    class JoinStream extends Stream {
        constructor(...parents) {
            super();

            this._parents = parents;
            for (var p of this._parents)
                p.subscribe(d => super._push(d));
        }

        _push(data) {
            throw Error('JoinStreams cannot be pushed to directly.');
        }
    }

    class CombineStream extends Stream {
        constructor(parent) {
            super();

            this._streams = [];

            this._parent = parent;
            this._parent.subscribe(s => this._push(s));
        }

        _push(stream) {
            if (!(stream instanceof Stream))
                throw Error('Only streams can be pushed to CombineStreams.');

            this._streams.push(stream);
            stream.subscribe(d => {
                for (var c of this._callbacks)
                    c(d);
            });
        }
    }

    class ZipStream extends Stream {
        constructor(zipper, ...parents) {
            super();

            this._lasts = [];
            this._zipper = zipper;

            this._parents = parents;
            for (let k in this._parents) {
                this._lasts.push(undefined);
                this._parents[k].subscribe(d => this._pushFrom(k, d));
            }
        }

        _pushFrom(k, data) {
            this._lasts[k] = data;
            if (this._lasts.every(d => d !== undefined))
                super._push(this._zipper(...this._lasts));
        }

        _push(data) {
            throw Error('ZipStreams cannot be pushed to directly.');
        }
    }

    class ThrottleStream extends Stream {
        constructor(millis, parent) {
            super();

            this._millis = millis;
            this._data = undefined;
            this._dataChanged = false;
            this._throttled = false;

            this._parent = parent;
            this._parent.subscribe(s => this._push(s));
        }

        _push(data) {
            this._data = data;
            this._dataChanged = true;

            if (!this._throttled)
                this._internalPush(data);
        }

        _internalPush(data) {
            this._throttled = true;
            this._dataChanged = false;
            super._push(data);
            this._createTimeout();
        }

        _createTimeout() {
            setTimeout(() => {
                if (this._dataChanged)
                    this._internalPush(this._data);
                else
                    this._throttled = false;

            }, this._millis);
        }
    }

    class LatestStream extends Stream {
        constructor(parent) {
            super();

            this._latest = undefined;

            this._parent = parent;
            this._parent.subscribe(s => this._push(s));
        }

        _push(stream) {
            if (!(stream instanceof Stream))
                throw Error('Only streams can be pushed to LatestStreams.');

            this._latest = stream;
            stream.subscribe(d => {
                this._latestPush(stream, d);
            });
        }

        _latestPush(stream, data) {
            if (stream === this._latest)
                for (var c of this._callbacks)
                    c(data);
        }
    }

    class UniqueStream extends Stream {
        constructor(hashFunction, parent) {
            super();

            this._hashFunction = hashFunction;
            this._hashes = [];

            this._parent = parent;
            this._parent.subscribe(s => this._push(s));
        }

        _push(data) {
            var hash = this._hashFunction(data);

            if (!this._hashes.includes(hash)) {
                this._hashes.push(hash);
                super._push(data);
            }
        }
    }

    class TallyStream extends Stream {
        constructor(parent) {
            super();

            this._tally = [];

            this._parent = parent;
            this._parent.subscribe(s => this._push(s));
        }

        _push(data) {
            this._tally.push(data);
            super._push(this._tally);
        }
    }

    window.Stream = Stream;
})();