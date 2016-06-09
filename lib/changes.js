// Metadata:

    // ChangesJs v1.0.
    // Author: Aaron Roney.

// License:

    // The MIT License (MIT)

    // Copyright (c) 2016 Aaron Roney

    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:

    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.

    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    // SOFTWARE.

// TODO:

    //

'use strict';

(function() {

    ///////////////////////////////////////
    // Helpers.
    ///////////////////////////////////////

    var _sharpSign = '\u266F';
    var _flatSign = '\u266D';
    var _doubleSharpSign = `${_sharpSign}${_sharpSign}`;
    var _doubleFlatSign = `${_flatSign}${_flatSign}`;
    var _majorSign = '\u03947';
    var _diminishedSign = '\u00b0';
    var _halfDiminishedSign = '\u00d8';

    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };

    ///////////////////////////////////////
    // Audio helper.
    ///////////////////////////////////////
    
    var _audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);
    function _beep(duration, frequency, volume, type, callback) {
        var oscillator = _audioCtx.createOscillator();
        var gainNode = _audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(_audioCtx.destination);

        if (volume) { gainNode.gain.value = volume; }
        if (frequency) { oscillator.frequency.value = frequency; }
        if (type) { oscillator.type = type; }
        if (callback) { oscillator.onended = callback; }

        oscillator.start();
        setTimeout(function() { oscillator.stop(); }, duration ? duration : 500);
    }

    ///////////////////////////////////////
    // Tones.
    ///////////////////////////////////////

    var _tones = {
        'C': 261.6, 
        'C#': 277.2, 
        'D': 293.7, 
        'D#': 311.1, 
        'E': 329.6, 
        'F': 349.2, 
        'F#': 370.0, 
        'G': 392.0, 
        'G#': 415.3, 
        'A': 440.0, 
        'A#': 466.2, 
        'B': 493.9
    };

    ///////////////////////////////////////
    // Base class.
    ///////////////////////////////////////

    class _Changes_Base {
        constructor() {
            this._name = '';
        }

        // Private methods.

        _notImplemented() {
            throw Error('Not implemented!');
        }
        
        _getRoot() {
            if(this instanceof _Note_Base)
                return this;
            else if (this instanceof _Chord_Base)
                return this._root;
            else 
                _notImplemented();
        }

        _getModifiers() {
            if(this instanceof _Note_Base)
                return [];
            else if (this instanceof _Chord_Base)
                return this._modifiers;
            else 
                _notImplemented();
        }

        _createChord(root, ...newModifiers) {
            var modifiers = this._getModifiers();

            if(newModifiers)
                for(var m of newModifiers)
                    modifiers.push(m);

            if(modifiers.length === 3) {
                if(modifiers.find(m => m instanceof _Chord_Modifier_Minor_Third) && 
                    modifiers.find(m => m instanceof _Chord_Modifier_Flat_Five) && 
                    modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven))
                    return new _Chord_Half_Diminished(root, [ new _Chord_Modifier_Half_Diminished() ]);
            }

            if(modifiers.length === 2) {
                if(modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven) && modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Nine))
                    return new _Chord_Seven_Sharp_Nine(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven) && modifiers.find(m => m instanceof _Chord_Modifier_Flat_Nine))
                    return new _Chord_Seven_Flat_Nine(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Five) && modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven))
                    return new _Chord_Plus_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Five) && modifiers.find(m => m instanceof _Chord_Modifier_Major_Seven))
                    return new _Chord_Plus_Major_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven) && modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Eleven))
                    return new _Chord_Seven_Sharp_Eleven(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Minor_Third) && modifiers.find(m => m instanceof _Chord_Modifier_Major_Seven)) 
                    return new _Chord_Minor_Major_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Minor_Third) && modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven)) 
                    return new _Chord_Minor_Seven(root, modifiers);
            }

            if(modifiers.length === 1) {
                if(modifiers.find(m => m instanceof _Chord_Modifier_Half_Diminished))
                    return new _Chord_Half_Diminished(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Diminished))
                    return new _Chord_Diminished(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Five)) 
                    return new _Chord_Plus(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven)) 
                    return new _Chord_Dominant_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Major_Seven)) 
                    return new _Chord_Major_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Minor_Third))
                    return new _Chord_Minor(root, modifiers);
                if(modifiers.find(m => m instanceof _Chord_Modifier_Major_Third))
                    return new _Chord_Major(root, modifiers);
            }
            
            if(modifiers.length === 0)
                return new _Chord_Major(root, modifiers);
            
            return new _Chord_Other(root, modifiers);
        }

        // Public methods.

        name() { 
            return this._name; 
        }

        simpleName() { 
            return this._name
                .replaceAll(`${_doubleSharpSign}`, '##')
                .replaceAll(`${_doubleFlatSign}`, 'bb')
                .replaceAll(`${_sharpSign}`, '#')
                .replaceAll(`${_flatSign}`, 'b'); 
        }

        typeName() {
            if(this instanceof _Note_Base)
                return 'note';
            else if(this instanceof _Chord_Base)
                return 'chord';
            else
                throw Error('Unknown super class type.');
        }

        isNote() {
            return this.typeName() === 'note';
        }

        isChord() {
            return this.typeName() === 'chord';
        }

        // Conversion methods.

        // Third.
        
        major() {
            return this._createChord(this._getRoot());
        }

        minor() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Minor_Third());
        }

        // Five.

        sharpFive() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Sharp_Five());
        }
        sharp5() { return this.sharpFive(); }
        plus() { return this.sharpFive(); }
        augmented() { return this.sharpFive(); }

        flatFive() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Flat_Five());
        }
        flat5() { return this.flatFive(); }

        // Seven.

        majorSeven() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Major_Seven());
        }
        major7() { return this.majorSeven(); }

        seven() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Dominant_Seven());
        }

        // Nine.

        flatNine() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Flat_Nine());
        }
        flat9() { return this.flatNine(); }

        sharpNine() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Sharp_Nine());
        }
        sharp9() { return this.sharpNine(); }

        // Eleven.

        sharpEleven() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Sharp_Eleven());
        }
        sharp11() { return this.sharpEleven(); }
        sharpFour() { return this.sharpEleven(); }
        sharp4() { return this.sharpEleven(); }
        plusFour() { return this.sharpEleven(); }
        plus4() { return this.sharpEleven(); }

        // Other.

        halfDiminished() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Half_Diminished());
        }

        diminished() {
            return this._createChord(this._getRoot(), new _Chord_Modifier_Diminished());
        }
        fullyDiminished() { return this.diminished(); }
    }
    
    ///////////////////////////////////////
    // Note classes.
    ///////////////////////////////////////

    var _Note_Letters = [
        'C', 
        'D', 
        'E', 
        'F', 
        'G', 
        'A', 
        'B'
    ];

    function _letterIndex(letter) {
        return _Note_Letters.indexOf(letter);
    }

    function _nextLetter(letter, count) {
        if(!count)
            count = 1;
        return _Note_Letters[ (_letterIndex(letter) + count) % 7 ];
    }

    function _distance(letter1, letter2) {
        throw Error('Not implemented.');
    }

    class _Note_Base extends _Changes_Base {
        constructor() {
            super();

            this._name = '';
            this._tone = 0;
            this._octave = 0;
        }

        // Private methods.

        _next() { this._notImplemented(); }

        _halfSteps(num) {
            if(num < 1 || num > 12)
                throw Error('Invalid number of half steps.');
            
            var current = this;
            for(var k = 0; k < num; k++) {
                current = current._next().clone();
            }

            return current;
        }

        _bestEnharmonic(startLetter, letterDistanceFromRoot) {
            var letter = _nextLetter(startLetter, letterDistanceFromRoot);

            for(var enharmonic of this.enharmonics())
                if(enharmonic.name()[0] === letter)
                    return enharmonic;

            return this;
        }

        // Public static methods.

        static equals(a, b) {
            return a.type() === b.type();
        }

        static toneEquals(a, b) {
            return a.toneType() === b.toneType();
        }

        static distanceBetween(a, b) {
            var count = 0;
            var current = a;
            while(!current.toneEquals(b)) {
                current = current._next();
                count++;
            }
            return count;
        }

        // Public methods.

        // Tone distance methods.

        minorSecond() { return this._halfSteps(1)._bestEnharmonic(this.name()[0], 1); }
        majorSecond() { return this._halfSteps(2)._bestEnharmonic(this.name()[0], 1); }
        sharpSecond() { return this._halfSteps(3)._bestEnharmonic(this.name()[0], 1); }

        minorThird() { return this._halfSteps(3)._bestEnharmonic(this.name()[0], 2); }
        majorThird() { return this._halfSteps(4)._bestEnharmonic(this.name()[0], 2); }

        perfectFourth() { return this._halfSteps(5)._bestEnharmonic(this.name()[0], 3); }
        triTone() { return this._halfSteps(6)._bestEnharmonic(this.name()[0], 3); }

        flatFifth() { return this._halfSteps(6)._bestEnharmonic(this.name()[0], 4); }
        perfectFifth() { return this._halfSteps(7)._bestEnharmonic(this.name()[0], 4); }
        sharpFifth() { return this._halfSteps(8)._bestEnharmonic(this.name()[0], 4); }

        minorSixth() { return this._halfSteps(8)._bestEnharmonic(this.name()[0], 5); }
        majorSixth() { return this._halfSteps(9)._bestEnharmonic(this.name()[0], 5); }

        flatflatSeventh() { return this._halfSteps(9)._bestEnharmonic(this.name()[0], 6); }
        minorSeventh() { return this._halfSteps(10)._bestEnharmonic(this.name()[0], 6); }
        majorSeventh() { return this._halfSteps(11)._bestEnharmonic(this.name()[0], 6); }

        perfectOctave() { return this._halfSteps(12)._bestEnharmonic(this.name()[0], 7); }

        tone() { return this._tone; }
        octave() { return this._octave; }
        designation() { return this.octave() + 4/* octave 0 is C4 */; }

        addOctave(num) { 
            if(num === undefined)
                num = 1;

            var clone = this.clone();
            clone._octave += num;
            
            return clone;
        }

        // Other tone methods.

        enharmonics() {
            var result = [];

            for(var k in _Notes)
                if(_Notes[k].toneType() === this.toneType()) {
                    var clone = _Notes[k];
                    clone._octave = this._octave;
                    result.push(clone);
                }

            return result;
        }

        legibleEnharmonic() {
            var best = this;

            for(var e of this.enharmonics()) {
                if(e.name().length < best.name().length)
                    best = e;
            }

            return best;
        }

        // Type and helper methods.

        type() {
            return Object.getPrototypeOf(this).constructor;
        }

        toneType() {
            return Object.getPrototypeOf(Object.getPrototypeOf(this)).constructor;
        }

        equals(b) {
            return _Note_Base.equals(this, b);
        }

        toneEquals(b) {
            return _Note_Base.toneEquals(this, b);
        }

        isTone(toneType) {
            return this.toneType() === toneType;
        }

        distanceTo(b) {
            return _Note_Base.distanceBetween(this, b);
        }

        clone() {
            var n = new this.constructor();
            n._name = this._name;
            n._tone = this._tone;
            n._octave = this._octave;
            return n;
        }

        toString() {
            return this.name();
        }

        play(length, octave) {
            if(!length)
                length = 1000;
            
            if(!octave)
                octave = this._octave;

            var tone = this.tone() * Math.pow(2, octave);

            return new Promise(resolve => {
                _beep(length, tone, .1, 'sine', () => {
                    resolve();
                });
            });
        }
    }
    
    // Enharmonic base classes.
    class _Note_Base_C extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['C'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_C_Sharp))
                    return _Notes[k];
        }
    }
    class _Note_Base_C_Sharp extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['C#'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_D))
                    return _Notes[k];
        }
    }
    class _Note_Base_D extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['D'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_D_Sharp))
                    return _Notes[k];
        }
    }
    class _Note_Base_D_Sharp extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['D#'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_E))
                    return _Notes[k];
        }
    }
    class _Note_Base_E extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['E'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_F))
                    return _Notes[k];
        }
    }
    class _Note_Base_F extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['F'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_F_Sharp))
                    return _Notes[k];
        }
    }
    class _Note_Base_F_Sharp extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['F#'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_G))
                    return _Notes[k];
        }
    }
    class _Note_Base_G extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['G'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_G_Sharp))
                    return _Notes[k];
        }
    }
    class _Note_Base_G_Sharp extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['G#'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_A))
                    return _Notes[k];
        }
    }
    class _Note_Base_A extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['A'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_A_Sharp))
                    return _Notes[k];
        }
    }
    class _Note_Base_A_Sharp extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['A#'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_B))
                    return _Notes[k];
        }
    }
    class _Note_Base_B extends _Note_Base {
        constructor() {
            super();
            this._tone = _tones['B'];
        }

        _next() { 
            for(var k in _Notes)
                if(_Notes[k].isTone(_Note_Base_C))
                    return _Notes[k];
        }
    }

    // C
    class _Note_C extends _Note_Base_C {
        constructor() {
            super();
            this._name = 'C';
        }
    }
    class _Note_B_Sharp extends _Note_Base_C {
        constructor() {
            super();
            this._name = `B${_sharpSign}`;
            // Need to fake the tone here since we wrap from B -> C.
            this._tone = this._tone * 2;
        }
    }
    class _Note_D_Flat_Flat extends _Note_Base_C {
        constructor() {
            super();
            this._name = `D${_doubleFlatSign}`;
        }
    }

    // C#
    class _Note_C_Sharp extends _Note_Base_C_Sharp {
        constructor() {
            super();
            this._name = `C${_sharpSign}`;
        }
    }
    class _Note_D_Flat extends _Note_Base_C_Sharp {
        constructor() {
            super();
            this._name = `D${_flatSign}`;
        }
    }

    // D
    class _Note_D extends _Note_Base_D {
        constructor() {
            super();
            this._name = 'D';
        }
    }
    class _Note_C_Sharp_Sharp extends _Note_Base_D {
        constructor() {
            super();
            this._name = `C${_doubleSharpSign}`;
        }
    }
    class _Note_E_Flat_Flat extends _Note_Base_D {
        constructor() {
            super();
            this._name = `E${_doubleFlatSign}`;
        }
    }

    // D#
    class _Note_D_Sharp extends _Note_Base_D_Sharp {
        constructor() {
            super();
            this._name = `D${_sharpSign}`;
        }
    }
    class _Note_E_Flat extends _Note_Base_D_Sharp {
        constructor() {
            super();
            this._name = `E${_flatSign}`;
        }
    }

    // E
    class _Note_E extends _Note_Base_E {
        constructor() {
            super();
            this._name = 'E';
        }
    }
    class _Note_D_Sharp_Sharp extends _Note_Base_E {
        constructor() {
            super();
            this._name = `D${_doubleSharpSign}`;
        }
    }
    class _Note_F_Flat extends _Note_Base_E {
        constructor() {
            super();
            this._name = `F${_flatSign}`;
        }
    }

    // F
    class _Note_F extends _Note_Base_F {
        constructor() {
            super();
            this._name = 'F';
        }
    }
    class _Note_E_Sharp extends _Note_Base_F {
        constructor() {
            super();
            this._name = `E${_sharpSign}`;
        }
    }
    class _Note_G_Flat_Flat extends _Note_Base_F {
        constructor() {
            super();
            this._name = `G${_doubleFlatSign}`;
        }
    }

    // F#
    class _Note_F_Sharp extends _Note_Base_F_Sharp {
        constructor() {
            super();
            this._name = `F${_sharpSign}`;
        }
    }
    class _Note_G_Flat extends _Note_Base_F_Sharp {
        constructor() {
            super();
            this._name = `G${_flatSign}`;
        }
    }

    // G
    class _Note_G extends _Note_Base_G {
        constructor() {
            super();
            this._name = 'G';
        }
    }
    class _Note_F_Sharp_Sharp extends _Note_Base_G {
        constructor() {
            super();
            this._name = `F${_doubleSharpSign}`;
        }
    }
    class _Note_A_Flat_Flat extends _Note_Base_G {
        constructor() {
            super();
            this._name = `A${_doubleFlatSign}`;
        }
    }

    // G#
    class _Note_G_Sharp extends _Note_Base_G_Sharp {
        constructor() {
            super();
            this._name = `G${_sharpSign}`;
        }
    }
    class _Note_A_Flat extends _Note_Base_G_Sharp {
        constructor() {
            super();
            this._name = `A${_flatSign}`;
        }
    }

    // A
    class _Note_A extends _Note_Base_A {
        constructor() {
            super();
            this._name = 'A';
        }
    }
    class _Note_G_Sharp_Sharp extends _Note_Base_A {
        constructor() {
            super();
            this._name = `G${_doubleSharpSign}`;
        }
    }
    class _Note_B_Flat_Flat extends _Note_Base_A {
        constructor() {
            super();
            this._name = `B${_doubleFlatSign}`;
        }
    }

    // A#
    class _Note_A_Sharp extends _Note_Base_A_Sharp {
        constructor() {
            super();
            this._name = `A${_sharpSign}`;
        }
    }
    class _Note_B_Flat extends _Note_Base_A_Sharp {
        constructor() {
            super();
            this._name = `B${_flatSign}`;
        }
    }

    // B
    class _Note_B extends _Note_Base_B {
        constructor() {
            super();
            this._name = 'B';
        }
    }
    class _Note_A_Sharp_Sharp extends _Note_Base_B {
        constructor() {
            super();
            this._name = `A${_doubleSharpSign}`;
        }
    }
    class _Note_C_Flat extends _Note_Base_B {
        constructor() {
            super();
            this._name = `C${_flatSign}`;
            // Need to fake the tone here since we wrap from B -> C.
            this._tone = this._tone / 2;
        }
    }

    ///////////////////////////////////////
    // Note helpers.
    ///////////////////////////////////////

    function _chordParser(str) {
        try {
            str = str.replaceAll('\\(', '').replaceAll('\\)', '');
            var matches = /^\s*([A-G](?:b|#)?)\s*((?:\-|\+|M|b5|#5|7|maj7|b9|#9|#11|dim)*)\s*$/.exec(str);

            if(!matches) {
                throw Error('Bad chord symbol.');
            }

            var chord = _Notes[matches[1]];
            var modifiers = matches[2];

            while(modifiers.length > 0) {
                var next = modifiers.substring(0, 4);
                if(next.startsWith('dim')) {
                    chord = chord.diminished();
                    modifiers = modifiers.substring(3);
                } else if(next.startsWith('M')) {
                    chord = chord.major();
                    modifiers = modifiers.substring(1);
                } else if(next.startsWith('-')) {
                    chord = chord.minor();
                    modifiers = modifiers.substring(1);
                } else if(next.startsWith('+')) {
                    chord = chord.sharpFive();
                    modifiers = modifiers.substring(1);
                } else if(next.startsWith('7')) {
                    chord = chord.seven();
                    modifiers = modifiers.substring(1);
                } else if(next.startsWith('maj7')) {
                    chord = chord.majorSeven();
                    modifiers = modifiers.substring(4);
                } else if(next.startsWith('b5')) {
                    chord = chord.flatFive();
                    modifiers = modifiers.substring(2);
                } else if(next.startsWith('#5')) {
                    chord = chord.sharpFive();
                    modifiers = modifiers.substring(2);
                } else if(next.startsWith('b9')) {
                    chord = chord.flatNine();
                    modifiers = modifiers.substring(2);
                } else if(next.startsWith('#9')) {
                    chord = chord.sharpNine();
                    modifiers = modifiers.substring(2);
                } else if(next.startsWith('#11')) {
                    chord = chord.sharpEleven();
                    modifiers = modifiers.substring(3);
                } else {
                    throw Error('Could not parse modifier.');
                }
            }
            
            return chord;
        } catch(e) {
            console.error(`Could not parse chord symbol (${str}): ${e}`);
            return undefined;
        }
    }

    var _Notes_Generator_Handler = {
        get: function(target, name) {
            if(target[name])
                return target[name].clone();
            return _chordParser(name);
        }, 
        set: function(target, name, value) {
            throw Error('No setter.');
        }, 
        ownKeys(target, key) {
            return Object.keys(target);
        }
    };

    var _Notes_Generator_Object = {
        'C': new _Note_C(), 
        'B#': new _Note_B_Sharp(), 
        'Dbb': new _Note_D_Flat_Flat(), 

        'C#': new _Note_C_Sharp(), 
        'Db': new _Note_D_Flat(), 

        'D': new _Note_D(), 
        'C##': new _Note_C_Sharp_Sharp(), 
        'Ebb': new _Note_E_Flat_Flat(), 

        'D#': new _Note_D_Sharp(), 
        'Eb': new _Note_E_Flat(), 

        'E': new _Note_E(), 
        'D##': new _Note_D_Sharp_Sharp(), 
        'Fb': new _Note_F_Flat(), 

        'F': new _Note_F(), 
        'E#': new _Note_E_Sharp(), 
        'Gbb': new _Note_G_Flat_Flat(), 

        'F#': new _Note_F_Sharp(), 
        'Gb': new _Note_G_Flat(), 

        'G': new _Note_G(), 
        'F##': new _Note_F_Sharp_Sharp(), 
        'Abb': new _Note_A_Flat_Flat(), 

        'G#': new _Note_G_Sharp(), 
        'Ab': new _Note_A_Flat(), 

        'A': new _Note_A(), 
        'G##': new _Note_G_Sharp_Sharp(), 
        'Bbb': new _Note_B_Flat_Flat(), 

        'A#': new _Note_A_Sharp(), 
        'Bb': new _Note_B_Flat(), 

        'B': new _Note_B(), 
        'A##': new _Note_A_Sharp_Sharp(), 
        'Cb': new _Note_C_Flat()
    };

    var _Notes = new Proxy(_Notes_Generator_Object, _Notes_Generator_Handler);

    ///////////////////////////////////////
    // Chord modifiers.
    ///////////////////////////////////////

    class _Chord_Modifier_Base {
        constructor() {
            this._name = '';
            this._noteNumber = 0;
        }

        name() { return this._name; }
    }

    class _Chord_Modifier_Base_Third extends _Chord_Modifier_Base {
        constructor() {
            super();
            this._noteNumber = 3;
        }
    }
    class _Chord_Modifier_Major_Third extends _Chord_Modifier_Base_Third {
        constructor() {
            super();
            this._name = '';
        }
    }
    class _Chord_Modifier_Minor_Third extends _Chord_Modifier_Base_Third {
        constructor() {
            super();
            this._name = '-';
        }
    }

    class _Chord_Modifier_Base_Five extends _Chord_Modifier_Base {
        constructor() {
            super();
            this._noteNumber = 5;
        }
    }
    class _Chord_Modifier_Flat_Five extends _Chord_Modifier_Base_Five {
        constructor() {
            super();
            this._noteNumber = 7; // Flat five is weird and goes out of order.
            this._name = `(${_flatSign}5)`;
        }
    }
    class _Chord_Modifier_Sharp_Five extends _Chord_Modifier_Base_Five {
        constructor() {
            super();
            this._name = '+';
        }
    }

    class _Chord_Modifier_Base_Seven extends _Chord_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 7;
        }
    }
    class _Chord_Modifier_Dominant_Seven extends _Chord_Modifier_Base_Seven {
        constructor() {
            super();
            this._name = '7';
        }
    }
    class _Chord_Modifier_Major_Seven extends _Chord_Modifier_Base_Seven {
        constructor() {
            super();
            this._name = _majorSign;
        }
    }

    class _Chord_Modifier_Base_Nine extends _Chord_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 9;
        }
    }
    class _Chord_Modifier_Flat_Nine extends _Chord_Modifier_Base_Nine {
        constructor() {
            super();
            this._name = `(${_flatSign}9)`;
        }
    }
    class _Chord_Modifier_Sharp_Nine extends _Chord_Modifier_Base_Nine {
        constructor() {
            super();
            this._name = `(${_sharpSign}9)`;
        }
    }

    class _Chord_Modifier_Base_Eleven extends _Chord_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 11;
        }
    }
    class _Chord_Modifier_Sharp_Eleven extends _Chord_Modifier_Base_Eleven {
        constructor() {
            super();
            this._name = `(${_sharpSign}11)`;
        }
    }

    class _Chord_Modifier_Base_Other extends _Chord_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 0;
        }
    }
    class _Chord_Modifier_Diminished extends _Chord_Modifier_Base_Other {
        constructor() {
            super();
            this._name = _diminishedSign;
        }
    }
    class _Chord_Modifier_Half_Diminished extends _Chord_Modifier_Base_Other {
        constructor() {
            super();
            this._name = _halfDiminishedSign;
        }
    }

    ///////////////////////////////////////
    // Chords.
    ///////////////////////////////////////

    class _Chord_Base extends _Changes_Base {
        constructor(root, modifiers) {
            super();

            if(!root)
                throw Error('Root is required.');
            if(!modifiers)
                throw Error('Modifiers are required.');

            this._root = root;
            this._modifiers = _Chord_Base._sortModifiers(_Chord_Base._checkModifiers(modifiers));
            this._descriptions = [];
            this._chordStructure = [];

            this._scale = [];
            this._chord = [];
            this._chordNotes = undefined;
            this._legibleScale = undefined;
            this._legibleChord = undefined;
        }

        // Private methods.

        _init() {
            this._createChordNotes();
            this._createLegibleScale();
            this._createLegibleChord();

            this._scale = _Chord_Base._fixOctaves(this._scale);
            this._chordNotes = _Chord_Base._fixOctaves(this._chordNotes);
            this._legibleScale = _Chord_Base._fixOctaves(this._legibleScale);
            this._legibleChord = _Chord_Base._fixOctaves(this._legibleChord);
        }

        _createChordNotes() {
            if(!this._chordNotes) {
                this._chordNotes = [];
                for(var pos of this._chord) {
                    this._chordNotes.push(this._scale[pos - 1]);
                }
            }
        }

        _createLegibleScale() {
            if(!this._legibleScale) {
                // First, let's just convert all of the notes in the scale to their "most legible".
                this._legibleScale = [];
                for(var n of this._scale)
                    this._legibleScale.push(n.legibleEnharmonic());

                // Now, let's analyze the letters chosen to choose the most legible enharmonic with the best letter.
                for(var k = 1; k < this._legibleScale.length; k++) {
                    var previousNote = this._legibleScale[k - 1];
                    var note = this._legibleScale[k];

                    if(note.name()[0] === previousNote.name()[0]) {
                        var nextLetter = _nextLetter(note.name()[0]);
                        for(var e of note.enharmonics())
                            if(e.name()[0] === nextLetter && e.name().length <= note.name().length)
                                this._legibleScale[k] = e;
                    }
                }
            }
        }

        _createLegibleChord() {
            if(!this._legibleChord) {
                this._legibleChord = [];
                var legibleScale = this.legibleScale();

                for(var note of this._chordNotes) {
                    var legibleNote = legibleScale.find(n => n.toneEquals(note));
                    if(legibleNote)
                        this._legibleChord.push(legibleNote);
                    else
                        this._legibleChord.push(note.legibleEnharmonic());
                }
            }
        }

        // Static methods.

        static _sortModifiers(modifiers) {
            return modifiers.sort((a, b) => a._noteNumber - b._noteNumber);
        }

        static _checkModifiers(modifiers) {
            if(modifiers.filter(m => m instanceof _Chord_Modifier_Base_Third).length > 1)
                throw Error('More than one modifier specified for the third.');
            if(modifiers.filter(m => m instanceof _Chord_Modifier_Base_Five).length > 1)
                throw Error('More than one modifier specified for the five.');
            if(modifiers.filter(m => m instanceof _Chord_Modifier_Base_Seven).length > 1)
                throw Error('More than one modifier specified for the seven.');
            if(modifiers.filter(m => m instanceof _Chord_Modifier_Base_Nine).length > 1)
                throw Error('More than one modifier specified for the nin.');
            if(modifiers.filter(m => m instanceof _Chord_Modifier_Base_Eleven).length > 1)
                throw Error('More than one modifier specified for the eleven.');
            if(modifiers.filter(m => m instanceof _Chord_Modifier_Base_Other).length > 1)
                throw Error('More than one modifier specified for other.');

            return modifiers;
        }

        static _fixOctaves(notes) {
            var newNotes = [];
            var lastLetterIndex = _letterIndex(notes[0].name()[0]);
            var add = 0;

            newNotes.push(notes[0]);
            for(var k = 1; k < notes.length; k++) {
                var note = notes[k];
                var letterIndex = _letterIndex(note.name()[0]);

                if(letterIndex - lastLetterIndex < 0)
                    add++;

                newNotes.push(note.addOctave(add));
                lastLetterIndex = letterIndex;
            }

            return newNotes;
        }

        // Public static methods.

        static compare(a, b) {
            var aChord = a.chord();
            var bChord = b.chord();

            var results = [];
            for(var an of aChord)
                for(var bn of bChord) {
                    var dist = _Note_Base.distanceBetween(an, bn);
                    if(dist >= 10)
                        dist = 12 - dist;
                    
                    if(dist <= 2)
                        results.push({ from: an, to: bn, step: dist });
                }

            return results.sort((l, r) => l.step - r.step);
        }

        static equals(a, b) {
            return a.type() === b.type() && a.root().toneEquals(b.root());
        }

        // Public methods.

        root() { return this._root; }

        descriptions() { return this._descriptions; }

        name() {
            var result = this.root().name();
            for(var modifier of this._modifiers)
                result += modifier.name();
            return result;
        }

        chordStructure() {
            return this._chordStructure;
        }

        scale() {
            return this._scale;
        }

        chord() {
            return this._chordNotes;
        }

        legibleScale() {
            return this._legibleScale;
        }

        legibleChord() {
            return this._legibleChord;
        }

        // Public helper merhods.

        type() {
            return Object.getPrototypeOf(this).constructor;
        }

        equals(b) {
            return _Chord_Base.equals(this, b);
        }

        compareTo(b) {
            return _Chord_Base.compare(this, b);
        }

        toString() {
            var result = '';
            result += `${this.name()}:\n`;
            result += `    Description: ${this.descriptions()}\n`;
            result += `    Chord Structure: ${this.chordStructure()}\n`;
            result += `    Scale: ${this.scale().map(n => n.name())}\n`;
            result += `    Chord: ${this.chord().map(n => n.name())}\n`;
            result += `    Legible Scale: ${this.legibleScale().map(n => n.name())}\n`;
            result += `    Legible Chord: ${this.legibleChord().map(n => n.name())}\n`;
            return result.replaceAll(',', ', ');
        }

        playScale() {
            this._notImplemented();
        }

        playChord(length) {
            for(var note of this.chord())
                note.play(length);
        }
    }

    class _Chord_Other extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'other'
            ];

            this._scale = [];
            this._scale.push(this._root);
            if(this._modifiers.find(m => m instanceof _Chord_Modifier_Flat_Nine) || 
                this._modifiers.find(m => m instanceof _Chord_Modifier_Half_Diminished))
                this._scale.push(this._root.minorSecond());
            else if (this._modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Nine))
                this._scale.push(this._root.sharpSecond());
            else
                this._scale.push(this._root.majorSecond());
            if(this._modifiers.find(m => m instanceof _Chord_Modifier_Minor_Third) || 
                this._modifiers.find(m => m instanceof _Chord_Modifier_Half_Diminished) || 
                this._modifiers.find(m => m instanceof _Chord_Modifier_Diminished))
                this._scale.push(this._root.minorThird());
            else
                this._scale.push(this._root.majorThird());
            if(this._modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Eleven))
                this._scale.push(this._root.triTone());
            else
                this._scale.push(this._root.perfectFourth());
            if(this._modifiers.find(m => m instanceof _Chord_Modifier_Flat_Five) || 
                this._modifiers.find(m => m instanceof _Chord_Modifier_Half_Diminished) || 
                this._modifiers.find(m => m instanceof _Chord_Modifier_Diminished))
                this._scale.push(this._root.flatFifth());
            else if (this._modifiers.find(m => m instanceof _Chord_Modifier_Sharp_Five))
                this._scale.push(this._root.sharpFifth());
            else
                this._scale.push(this._root.perfectFifth());
            if(this._modifiers.find(m => m instanceof _Chord_Modifier_Half_Diminished) || 
                this._modifiers.find(m => m instanceof _Chord_Modifier_Diminished))
                this._scale.push(this._root.minorSixth());
            else
                this._scale.push(this._root.majorSixth());
            if(this._modifiers.find(m => m instanceof _Chord_Modifier_Dominant_Seven) || 
                this._modifiers.find(m => m instanceof _Chord_Modifier_Half_Diminished))
                this._scale.push(this._root.minorSeventh());
            else if(this._modifiers.find(m => m instanceof _Chord_Modifier_Diminished))
                this._scale.push(this._root.flatflatSeventh());
            else
                this._scale.push(this._root.majorSeventh());

            this._chord = [1, 3, 5, 7];

            this._chordStructure = ['1', '3', '5', '7'];

            this._init();
        }
    }

    class _Chord_Major extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'major'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [1, 3, 5];

            this._chordStructure = ['1', '3', '5'];

            this._init();
        }
    }

    class _Chord_Minor extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'minor'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.minorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3 /*b3*/, 5];

            this._chordStructure = ['1', `${_flatSign}3`, '5'];

            this._init();
        }
    }

    class _Chord_Major_Seven extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'ionian', 
                'first mode of major scale'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [1, 3, 5, 7];

            this._chordStructure = ['1', '3', '5', '7'];

            this._init();
        }
    }

    class _Chord_Dominant_Seven extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'myxolydian', 
                'fourth mode of a major scale', 
                'major with flat seven'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3, 5, 7 /*b7*/];

            this._chordStructure = ['1', '3', '5', `${_flatSign}7`];

            this._init();
        }
    }

    class _Chord_Minor_Major_Seven extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'melodic minor', 
                'major with flat third'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [1, 3 /*b3*/, 5, 7];

            this._chordStructure = ['1', `${_flatSign}3`, '5', '7'];

            this._init();
        }
    }

    class _Chord_Minor_Seven extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'dorian', 
                'second mode of a major scale', 
                'major with flat third and flat seven'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3 /*b3*/, 5, 7 /*b7*/];

            this._chordStructure = ['1', `${_flatSign}3`, '5', `${_flatSign}7`];

            this._init();
        }
    }

    class _Chord_Seven_Sharp_Eleven extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'lydian dominant', 
                'lyxian', 
                'major with sharp four and flat seven'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3, 5, 7 /*b7*/, 11 /*#11*/];
            this._chordNotes = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh(), 
                this._root.triTone().addOctave()
            ];

            this._chordStructure = ['1', '3', '5', `${_flatSign}7`, `${_sharpSign}11`];

            this._init();
        }
    }

    class _Chord_Plus extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'augmented', 
                'major with sharp five'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.sharpFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [1, 3, 5 /*#5*/];

            this._chordStructure = ['1', '3', `${_sharpSign}5`];

            this._init();
        }
    }

    class _Chord_Plus_Major_Seven extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'augmented major seven', 
                'lyxian', 
                'major with sharp five'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.sharpFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [1, 3, 5 /*#5*/, 7];

            this._chordStructure = ['1', '3', `${_sharpSign}5`, '7'];

            this._init();
        }
    }

    class _Chord_Plus_Seven extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'augmented seven', 
                'whole tone'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.sharpFifth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3, 5 /*#5*/, 6 /*b7*/];

            this._chordStructure = ['1', '3', `${_sharpSign}5`, `${_flatSign}7`];

            this._init();
        }
    }

    class _Chord_Half_Diminished extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'half diminished', 
                'locrian', 
                'seventh mode of major scale', 
                'major scale one half step up'
            ];

            this._scale = [
                this._root, 
                this._root.minorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.flatFifth(), 
                this._root.minorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3 /*b3*/, 5 /*b5*/, 7 /*b7*/];

            this._chordStructure = ['1', `${_flatSign}3`, `${_flatSign}5`, `${_flatSign}7`];

            this._init();
        }
    }

    class _Chord_Diminished extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'fully diminished', 
                'whole/half/whole'
            ];

            this._scale = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.flatFifth(), 
                this._root.minorSixth(), 
                this._root.flatflatSeventh(), 
                this._root.majorSeventh()
            ];

            this._chord = [1, 3 /*b3*/, 5 /*b5*/, 7 /*bb7*/];

            this._chordStructure = ['1', `${_flatSign}3`, `${_flatSign}3`, `${_doubleFlatSign}7`];

            this._init();
        }
    }

    class _Chord_Seven_Flat_Nine extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'fully diminished (half step first)', 
                'half/whole/half'
            ];

            this._scale = [
                this._root, 
                this._root.minorSecond(), 
                this._root.minorThird(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3 /*3*/, 5 /*5*/, 7 /*b7*/, 9 /*b9*/];
            this._chordNotes = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh(), 
                this._root.minorSecond()
            ];

            this._chordStructure = ['1', '3', '5', `${_flatSign}7`, `${_flatSign}9`];

            this._init();
        }
    }

    class _Chord_Seven_Sharp_Nine extends _Chord_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'diminished whole tone', 
                'seventh mode of a melodic minor scale', 
                'melodic minor up a half step'
            ];

            this._scale = [
                this._root, 
                this._root.minorSecond(), 
                this._root.sharpSecond(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.sharpFifth(), 
                this._root.minorSeventh()
            ];

            this._chord = [1, 3 /*3*/, 5 /* 5 */, 7 /*b7*/, 9 /*#9*/];
            this._chordNotes = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh(), 
                this._root.sharpSecond()
            ];

            this._chordStructure = ['1', '3', '5', `${_flatSign}7`, `${_sharpSign}9`];

            this._init();
        }
    }

    ///////////////////////////////////////
    // Player.
    ///////////////////////////////////////

    class _Player {
        constructor(notes) {
            if(!notes)
                notes = [];

            this._notes = notes;
        }

        add(notes) {
            var newNotes = Object.assign([], this._notes);

            if(notes instanceof Array) 
                newNotes = newNotes.concat(notes);
            else
                newNotes.push(notes);
            
            return new _Player(newNotes);
        }

        play(noteLength) {
            for(var k = 0; k < this._notes.length; k++) {
                let note = this._notes[k];
                let func = undefined;

                if(note instanceof _Note_Base) {
                    func = note.play;
                } else if (note instanceof _Chord_Base) {
                    func = note.playChord;
                }

                setTimeout(() => {
                    console.log(`Playing...`);
                    console.log(note.toString());
                    func.call(note, noteLength);
                }, noteLength * k);
            }
        }
    }

    ///////////////////////////////////////
    // Exports.
    ///////////////////////////////////////

    var C = window.C = _Notes;
    var P = window.P = new _Player();
    
})();