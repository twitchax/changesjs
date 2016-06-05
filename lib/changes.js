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

    // More scales.
    // Player (chain chords or tones together and play in order).

;'use strict';

;(function() {

    ///////////////////////////////////////
    // Audio helper.
    ///////////////////////////////////////
    
    var _audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);
    function _beep(duration, frequency, volume, type, callback) {
        var oscillator = _audioCtx.createOscillator();
        var gainNode = _audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(_audioCtx.destination);

        if (volume){gainNode.gain.value = volume;};
        if (frequency){oscillator.frequency.value = frequency;}
        if (type){oscillator.type = type;}
        if (callback){oscillator.onended = callback;}

        oscillator.start();
        setTimeout(function(){oscillator.stop()}, (duration ? duration : 500));
    };

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
            else if (this instanceof _Scale_Base)
                return this._root;
            else 
                _notImplemented();
        }

        _getModifiers() {
            if(this instanceof _Note_Base)
                return [];
            else if (this instanceof _Scale_Base)
                return this._modifiers;
            else 
                _notImplemented();
        }

        _createScale(root, newModifier) {
            var modifiers = this._getModifiers();

            if(newModifier)
                modifiers.push(newModifier);
            
            if(modifiers.find(m => m instanceof _Scale_Modifier_Minor_Third) && modifiers.find(m => m instanceof _Scale_Modifier_Major_Seven)) 
                return new _Scale_Minor_Major_Seven(root, modifiers);
            if(modifiers.find(m => m instanceof _Scale_Modifier_Minor_Third) && modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven)) 
                return new _Scale_Minor_Seven(root, modifiers);
            if(modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven)) 
                return new _Scale_Dominant_Seven(root, modifiers);
            if(modifiers.find(m => m instanceof _Scale_Modifier_Major_Seven)) 
                return new _Scale_Major_Seven(root, modifiers);
            if(modifiers.find(m => m instanceof _Scale_Modifier_Minor_Third))
                return new _Scale_Minor(root, modifiers);
            if(modifiers.find(m => m instanceof _Scale_Modifier_Major_Third) || modifiers.length === 0) {
                return new _Scale_Major(root, modifiers);
            }
             
            throw Error('No valid scale with set modifiers.')
        }

        // Public methods.

        get name() { return this._name; }

        // Conversion methods.

        // Thirds
        
        major() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Major_Third());
        }
        scale() { return this.major(); }

        minor() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Minor_Third());
        }

        // Sevens

        majorSeven() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Major_Seven());
        }
        major7() { return this.majorSeven(); }

        seven() {
            if(this._modifiers && this._modifiers.find(m => m instanceof _Scale_Modifier_Major_Third))
                return this._createScale(this._getRoot(), new _Scale_Modifier_Major_Seven());
            return this._createScale(this._getRoot(), new _Scale_Modifier_Dominant_Seven());
        }

        // Third and seven
        minorSeven() {
            return this.minor().seven();
        }
        minor7() { return this.minorSeven(); }

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

    function _nextLetter(letter, count) {
        if(!count)
            count = 1;
        
        return _Note_Letters[ (_Note_Letters.indexOf(letter) + count) % 7 ];
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
                current = current._next();
            }

            return current;
        }

        _bestEnharmonic(startLetter, count) {
            var letter = _nextLetter(startLetter, count)

            for(var enharmonic of this.enharmonics())
                if(enharmonic.name[0] == letter)
                    return enharmonic;
        }

        // Public methods.

        minorSecond() { return this._halfSteps(1)._bestEnharmonic(this.name[0], 1); }
        majorSecond() { return this._halfSteps(2)._bestEnharmonic(this.name[0], 1); }
        minorThird() { return this._halfSteps(3)._bestEnharmonic(this.name[0], 2); }
        majorThird() { return this._halfSteps(4)._bestEnharmonic(this.name[0], 2); }
        perfectFourth() { return this._halfSteps(5)._bestEnharmonic(this.name[0], 3); }
        triTone() { return this._halfSteps(6)._bestEnharmonic(this.name[0], 3); }
        perfectFifth() { return this._halfSteps(7)._bestEnharmonic(this.name[0], 4); }
        minorSixth() { return this._halfSteps(8)._bestEnharmonic(this.name[0], 5); }
        majorSixth() { return this._halfSteps(9)._bestEnharmonic(this.name[0], 5); }
        minorSeventh() { return this._halfSteps(10)._bestEnharmonic(this.name[0], 6); }
        majorSeventh() { return this._halfSteps(11)._bestEnharmonic(this.name[0], 6); }
        perfectOctave() { return this._halfSteps(12)._bestEnharmonic(this.name[0], 7); }

        get tone() { return this._tone; }
        get octave() { return this._octave; }

        enharmonics() {
            var result = [];

            for(var k in _Notes)
                if(_Notes[k] instanceof this.__proto__.__proto__.constructor)
                    result.push(_Notes[k]);

            return result;
        }

        play(length) {
            if(!length)
                length = 1000;
            
            return new Promise(resolve => {
                _beep(length, this._tone, .1, 'sine', () => {
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
                if(_Notes[k] instanceof _Note_Base_C_Sharp)
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
                if(_Notes[k] instanceof _Note_Base_D)
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
                if(_Notes[k] instanceof _Note_Base_D_Sharp)
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
                if(_Notes[k] instanceof _Note_Base_E)
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
                if(_Notes[k] instanceof _Note_Base_F)
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
                if(_Notes[k] instanceof _Note_Base_F_Sharp)
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
                if(_Notes[k] instanceof _Note_Base_G)
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
                if(_Notes[k] instanceof _Note_Base_G_Sharp)
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
                if(_Notes[k] instanceof _Note_Base_A)
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
                if(_Notes[k] instanceof _Note_Base_A_Sharp)
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
                if(_Notes[k] instanceof _Note_Base_B)
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
                if(_Notes[k] instanceof _Note_Base_C)
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
            this._name = 'B#';
        }
    }
    class _Note_D_Flat_Flat extends _Note_Base_C {
        constructor() {
            super();
            this._name = 'Dbb';
        }
    }

    // C#
    class _Note_C_Sharp extends _Note_Base_C_Sharp {
        constructor() {
            super();
            this._name = 'C#';
        }
    }
    class _Note_D_Flat extends _Note_Base_C_Sharp {
        constructor() {
            super();
            this._name = 'D#';
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
            this._name = 'C##';
        }
    }
    class _Note_E_Flat_Flat extends _Note_Base_D {
        constructor() {
            super();
            this._name = 'Ebb';
        }
    }

    // D#
    class _Note_D_Sharp extends _Note_Base_D_Sharp {
        constructor() {
            super();
            this._name = 'D#';
        }
    }
    class _Note_E_Flat extends _Note_Base_D_Sharp {
        constructor() {
            super();
            this._name = 'Eb';
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
            this._name = 'D##';
        }
    }
    class _Note_F_Flat extends _Note_Base_E {
        constructor() {
            super();
            this._name = 'Fb';
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
            this._name = 'E#';
        }
    }
    class _Note_G_Flat_Flat extends _Note_Base_F {
        constructor() {
            super();
            this._name = 'Gbb';
        }
    }

    // F#
    class _Note_F_Sharp extends _Note_Base_F_Sharp {
        constructor() {
            super();
            this._name = 'F#';
        }
    }
    class _Note_G_Flat extends _Note_Base_F_Sharp {
        constructor() {
            super();
            this._name = 'Gb';
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
            this._name = 'F##';
        }
    }
    class _Note_A_Flat_Flat extends _Note_Base_G {
        constructor() {
            super();
            this._name = 'Abb';
        }
    }

    // G#
    class _Note_G_Sharp extends _Note_Base_G_Sharp {
        constructor() {
            super();
            this._name = 'G#';
        }
    }
    class _Note_A_Flat extends _Note_Base_G_Sharp {
        constructor() {
            super();
            this._name = 'Ab';
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
            this._name = 'G##';
        }
    }
    class _Note_B_Flat_Flat extends _Note_Base_A {
        constructor() {
            super();
            this._name = 'Bbb';
        }
    }

    // A#
    class _Note_A_Sharp extends _Note_Base_A_Sharp {
        constructor() {
            super();
            this._name = 'A#';
        }
    }
    class _Note_B_Flat extends _Note_Base_A_Sharp {
        constructor() {
            super();
            this._name = 'Bb';
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
            this._name = 'A##';
        }
    }
    class _Note_C_Flat extends _Note_Base_B {
        constructor() {
            super();
            this._name = 'Cb';
        }
    }

    ///////////////////////////////////////
    // Note helpers.
    ///////////////////////////////////////

    var _Notes = {

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

    ///////////////////////////////////////
    // Scales modifiers.
    ///////////////////////////////////////

    class _Scale_Modifier_Base {
        constructor() {
            this._name = '';
            this._noteNumber = 0;
        }

        get name() { return this._name; }
     }

    class _Scale_Modifier_Base_Third extends _Scale_Modifier_Base {
        constructor() {
            super();
            this._noteNumber = 3;
        }
    }
    class _Scale_Modifier_Major_Third extends _Scale_Modifier_Base_Third {
        constructor() {
            super();
            this._name = '';
        }
    }
    class _Scale_Modifier_Minor_Third extends _Scale_Modifier_Base_Third {
        constructor() {
            super();
            this._name = '-';
        }
    }

    class _Scale_Modifier_Base_Seven extends _Scale_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 7;
        }
    }
    class _Scale_Modifier_Dominant_Seven extends _Scale_Modifier_Base_Seven {
        constructor() {
            super();
            this._name = '7';
        }
    }
    class _Scale_Modifier_Major_Seven extends _Scale_Modifier_Base_Seven {
        constructor() {
            super();
            this._name = '\u0394';
        }
    }

    ///////////////////////////////////////
    // Scales.
    ///////////////////////////////////////

    class _Scale_Base extends _Changes_Base {
        constructor(root, modifiers) {
            super();

            if(!root)
                throw Error('Root is required.');
            if(modifiers === undefined)
                throw Error('Modifiers are required.');

            this._root = root;
            this._modifiers = _Scale_Base._sortModifiers(_Scale_Base._checkModifiers(modifiers));
            this._descriptions = [];
            this._notes = [];
            this._chord = [];
        }

        // Static methods.

        static _sortModifiers(modifiers) {
            return modifiers.sort((a, b) => a._noteNumber - b._noteNumber);
        }

        static _checkModifiers(modifiers) {
            if(modifiers.filter(m => m instanceof _Scale_Modifier_Base_Third).length > 1)
                throw Error('More than one modifier specified for the third.')

            return modifiers;
        }

        // Public methods.

        get root() { return this._root; }

        get descriptions() { return this._descriptions; }

        get name() {
            var result = this.root.name;
            for(var modifier of this._modifiers)
                result += modifier.name;
            return result;
        }

        notes() {
            return this._notes;
        }

        chord() {
            return this._chord;
        }

        playScale() {
            this._notImplemented();
        }

        playChord() {
            for(var note of this.chord())
                note.play();
        }
    }

    class _Scale_Major extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'major'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth() 
            ];
        }
    }

    class _Scale_Minor extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'minor'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.minorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.minorThird(), 
                this._root.perfectFifth() 
            ];
        }
    }

    class _Scale_Major_Seven extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'ionian', 
                'first mode of major scale'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.majorSeventh()
            ];
        }
    }

    class _Scale_Dominant_Seven extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'myxolydian', 
                'fourth mode of a major scale', 
                'major with flat seven'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh()
            ];
        }
    }

    class _Scale_Minor_Major_Seven extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'melodic minor', 
                'major with flat third'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.minorThird(), 
                this._root.perfectFifth(), 
                this._root.majorSeventh()
            ];
        }
    }

    class _Scale_Minor_Seven extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'dorian', 
                'second mode of a major scale', 
                'major with flat third and flat seven'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.minorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh()
            ];
        }
    }

    ///////////////////////////////////////
    // Exports.
    ///////////////////////////////////////

    var N = window.N = _Notes;
    
})();