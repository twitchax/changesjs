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

    // Write documentation.
    // Add "legible" function to scales that anlyzes the best notes to display (see B7(#9)).
    // Email professor and TAs.

;'use strict';

;(function() {

    ///////////////////////////////////////
    // Helpers.
    ///////////////////////////////////////

    function _getUnicodeCharacter(cp) {

        if (cp >= 0 && cp <= 0xD7FF || cp >= 0xE000 && cp <= 0xFFFF) {
            return String.fromCharCode(cp);
        } else if (cp >= 0x10000 && cp <= 0x10FFFF) {

            // we substract 0x10000 from cp to get a 20-bits number
            // in the range 0..0xFFFF
            cp -= 0x10000;

            // we add 0xD800 to the number formed by the first 10 bits
            // to give the first byte
            var first = ((0xffc00 & cp) >> 10) + 0xD800

            // we add 0xDC00 to the number formed by the low 10 bits
            // to give the second byte
            var second = (0x3ff & cp) + 0xDC00;

            return String.fromCharCode(first) + String.fromCharCode(second);
        }
    }

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

        _createScale(root, ...newModifiers) {
            var modifiers = this._getModifiers();

            if(newModifiers)
                for(var m of newModifiers)
                    modifiers.push(m);

            if(modifiers.length === 3) {
                if(modifiers.find(m => m instanceof _Scale_Modifier_Minor_Third) && 
                    modifiers.find(m => m instanceof _Scale_Modifier_Flat_Five) && 
                    modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven))
                    return new _Scale_Half_Diminished(root, [ new _Scale_Modifier_Half_Diminished() ]);
            }

            if(modifiers.length === 2) {
                if(modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven) && modifiers.find(m => m instanceof _Scale_Modifier_Sharp_Nine))
                    return new _Scale_Seven_Sharp_Nine(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven) && modifiers.find(m => m instanceof _Scale_Modifier_Flat_Nine))
                    return new _Scale_Seven_Flat_Nine(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Sharp_Five) && modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven))
                    return new _Scale_Plus_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Sharp_Five) && modifiers.find(m => m instanceof _Scale_Modifier_Major_Seven))
                    return new _Scale_Plus_Major_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven) && modifiers.find(m => m instanceof _Scale_Modifier_Sharp_Eleven))
                    return new _Scale_Seven_Sharp_Eleven(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Minor_Third) && modifiers.find(m => m instanceof _Scale_Modifier_Major_Seven)) 
                    return new _Scale_Minor_Major_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Minor_Third) && modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven)) 
                    return new _Scale_Minor_Seven(root, modifiers);
            }

            if(modifiers.length === 1) {
                if(modifiers.find(m => m instanceof _Scale_Modifier_Half_Diminished))
                    return new _Scale_Half_Diminished(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Diminished))
                    return new _Scale_Diminished(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Sharp_Five)) 
                    return new _Scale_Plus(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Dominant_Seven)) 
                    return new _Scale_Dominant_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Major_Seven)) 
                    return new _Scale_Major_Seven(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Minor_Third))
                    return new _Scale_Minor(root, modifiers);
                if(modifiers.find(m => m instanceof _Scale_Modifier_Major_Third))
                    return new _Scale_Major(root, modifiers);
            }
            
            if(modifiers.length === 0)
                return new _Scale_Major(root, modifiers);
            
             
            throw Error('No valid scale with set modifiers.')
        }

        // Public methods.

        get name() { return this._name; }

        // Conversion methods.

        // Third.
        
        major() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Major_Third());
        }

        minor() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Minor_Third());
        }

        // Five.

        sharpFive() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Sharp_Five());
        }
        sharp5() { return this.sharpFive(); }
        plus() { return this.sharpFive(); }
        augmented() { return this.sharpFive(); }

        flatFive() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Flat_Five());
        }
        flat5() { return this.flatFive(); }

        // Seven.

        majorSeven() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Major_Seven());
        }
        major7() { return this.majorSeven(); }

        seven() {
            // if(this._modifiers && this._modifiers.find(m => m instanceof _Scale_Modifier_Major_Third))
            //     return this._createScale(this._getRoot(), new _Scale_Modifier_Major_Seven());
            return this._createScale(this._getRoot(), new _Scale_Modifier_Dominant_Seven());
        }

        // Third and seven.

        // minorSeven() {
        //     return this.minor().seven();
        // }
        // minor7() { return this.minorSeven(); }

        // Nine.

        flatNine() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Flat_Nine());
        }
        flat9() { return this.flatNine(); }

        sharpNine() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Sharp_Nine());
        }
        sharp9() { return this.sharpNine(); }

        // Eleven.

        sharpEleven() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Sharp_Eleven());
        }
        sharp11() { return this.sharpEleven(); }
        sharpFour() { return this.sharpEleven(); }
        sharp4() { return this.sharpEleven(); }
        plusFour() { return this.sharpEleven(); }
        plus4() { return this.sharpEleven(); }

        // Other.

        halfDiminished() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Half_Diminished());
        }

        diminished() {
            return this._createScale(this._getRoot(), new _Scale_Modifier_Diminished());
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

            return this;
        }

        // Public methods.

        minorSecond() { return this._halfSteps(1)._bestEnharmonic(this.name[0], 1); }
        majorSecond() { return this._halfSteps(2)._bestEnharmonic(this.name[0], 1); }
        sharpSecond() { return this._halfSteps(3)._bestEnharmonic(this.name[0], 1); }

        minorThird() { return this._halfSteps(3)._bestEnharmonic(this.name[0], 2); }
        majorThird() { return this._halfSteps(4)._bestEnharmonic(this.name[0], 2); }

        perfectFourth() { return this._halfSteps(5)._bestEnharmonic(this.name[0], 3); }
        triTone() { return this._halfSteps(6)._bestEnharmonic(this.name[0], 3); }

        flatFifth() { return this._halfSteps(6)._bestEnharmonic(this.name[0], 4); }
        perfectFifth() { return this._halfSteps(7)._bestEnharmonic(this.name[0], 4); }
        sharpFifth() { return this._halfSteps(8)._bestEnharmonic(this.name[0], 4); }

        minorSixth() { return this._halfSteps(8)._bestEnharmonic(this.name[0], 5); }
        majorSixth() { return this._halfSteps(9)._bestEnharmonic(this.name[0], 5); }

        flatflatSeventh() { return this._halfSteps(9)._bestEnharmonic(this.name[0], 6); }
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

        mostLegibleEnharmonic() {
            var best = this;

            for(var e of this.enharmonics()) {
                if(e.name.length < best.name.length)
                    best = e;
            }

            return best;
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
            this._name = 'Db';
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
    // Scale modifiers.
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

    class _Scale_Modifier_Base_Five extends _Scale_Modifier_Base {
        constructor() {
            super();
            this._noteNumber = 5;
        }
    }
    class _Scale_Modifier_Flat_Five extends _Scale_Modifier_Base_Five {
        constructor() {
            super();
            this._name = '(b5)';
        }
    }
    class _Scale_Modifier_Sharp_Five extends _Scale_Modifier_Base_Five {
        constructor() {
            super();
            this._name = '+';
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
            this._name = '\u03947';
        }
    }

    class _Scale_Modifier_Base_Nine extends _Scale_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 9;
        }
    }
    class _Scale_Modifier_Flat_Nine extends _Scale_Modifier_Base_Nine {
        constructor() {
            super();
            this._name = '(b9)';
        }
    }
    class _Scale_Modifier_Sharp_Nine extends _Scale_Modifier_Base_Nine {
        constructor() {
            super();
            this._name = '(#9)';
        }
    }

    class _Scale_Modifier_Base_Eleven extends _Scale_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 11;
        }
    }
    class _Scale_Modifier_Sharp_Eleven extends _Scale_Modifier_Base_Eleven {
        constructor() {
            super();
            this._name = '(#11)';
        }
    }

    class _Scale_Modifier_Base_Other extends _Scale_Modifier_Base { 
        constructor() {
            super();
            this._noteNumber = 0;
        }
    }
    class _Scale_Modifier_Diminished extends _Scale_Modifier_Base_Other {
        constructor() {
            super();
            this._name = '\u00b0';
        }
    }
    class _Scale_Modifier_Half_Diminished extends _Scale_Modifier_Base_Other {
        constructor() {
            super();
            this._name = '\u00d8';
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
            if(modifiers.filter(m => m instanceof _Scale_Modifier_Base_Five).length > 1)
                throw Error('More than one modifier specified for the five.')
            if(modifiers.filter(m => m instanceof _Scale_Modifier_Base_Seven).length > 1)
                throw Error('More than one modifier specified for the seven.')
            if(modifiers.filter(m => m instanceof _Scale_Modifier_Base_Nine).length > 1)
                throw Error('More than one modifier specified for the nin.')
            if(modifiers.filter(m => m instanceof _Scale_Modifier_Base_Eleven).length > 1)
                throw Error('More than one modifier specified for the eleven.')
            if(modifiers.filter(m => m instanceof _Scale_Modifier_Base_Other).length > 1)
                throw Error('More than one modifier specified for other.')

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

        scale() {
            return this._notes;
        }

        chord() {
            return this._chord;
        }

        playScale() {
            this._notImplemented();
        }

        playChord(length) {
            for(var note of this.chord())
                note.play(length);
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

    class _Scale_Seven_Sharp_Eleven extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'lydian dominant', 
                'lyxian', 
                'major with sharp four and flat seven'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh(), 
                this._root.triTone()
            ];
        }
    }

    class _Scale_Plus extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'augmented', 
                'major with sharp five'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.minorSixth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.minorSixth(), 
            ];
        }
    }

    class _Scale_Plus_Major_Seven extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'augmented major seven', 
                'lyxian', 
                'major with sharp five'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.perfectFourth(), 
                this._root.sharpFifth(), 
                this._root.majorSixth(), 
                this._root.majorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.sharpFifth(), 
                this._root.majorSeventh(), 
            ];
        }
    }

    class _Scale_Plus_Seven extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'augmented seven', 
                'whole tone'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.sharpFifth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.sharpFifth(), 
                this._root.minorSeventh(), 
            ];
        }
    }

    class _Scale_Half_Diminished extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'half diminished', 
                'locrian', 
                'seventh mode of major scale', 
                'major scale one half step up'
            ];

            this._notes = [
                this._root, 
                this._root.minorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.flatFifth(), 
                this._root.minorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.minorThird(), 
                this._root.flatFifth(), 
                this._root.minorSeventh(), 
            ];
        }
    }

    class _Scale_Diminished extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'fully diminished', 
                'whole/half/whole'
            ];

            this._notes = [
                this._root, 
                this._root.majorSecond(), 
                this._root.minorThird(), 
                this._root.perfectFourth(), 
                this._root.flatFifth(), 
                this._root.minorSixth(), 
                this._root.flatflatSeventh(), 
                this._root.majorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.minorThird(), 
                this._root.flatFifth(), 
                this._root.flatflatSeventh(), 
            ];
        }
    }

    class _Scale_Seven_Flat_Nine extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'fully diminished (half step first)', 
                'half/whole/half'
            ];

            this._notes = [
                this._root, 
                this._root.minorSecond(), 
                this._root.minorThird(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.perfectFifth(), 
                this._root.majorSixth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh(), 
                this._root.minorSecond(), 
            ];
        }
    }

    class _Scale_Seven_Sharp_Nine extends _Scale_Base {
        constructor(root, modifiers) {
            super(root, modifiers);

            this._descriptions = [
                'diminished whole tone', 
                'seventh mode of a melodic minor scale', 
                'melodic minor up a half step'
            ];

            this._notes = [
                this._root, 
                this._root.minorSecond(), 
                this._root.sharpSecond(), 
                this._root.majorThird(), 
                this._root.triTone(), 
                this._root.sharpFifth(), 
                this._root.minorSeventh()
            ];

            this._chord = [
                this._root, 
                this._root.majorThird(), 
                this._root.perfectFifth(), 
                this._root.minorSeventh(), 
                this._root.sharpSecond()
            ];
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

        add(...notes) {

            // Flatten the notes.
            var notesToAdd = [];
            for(var n of notes)
                if(n instanceof Array)
                    notesToAdd = notesToAdd.concat(n);
                else
                    notesToAdd.push(n);

            var newNotes = Object.assign([], this._notes);
            for(var n of notesToAdd)
                newNotes.push(n);
            return new _Player(newNotes);
        }

        play(noteLength) {
            for(var k = 0; k < this._notes.length; k++) {
                let note = this._notes[k];
                let func = undefined;

                if(note instanceof _Note_Base) {
                    func = note.play;
                } else if (note instanceof _Scale_Base) {
                    func = note.playChord;
                }

                setTimeout(() => {
                    console.log(`Playing ${note.name}...`)

                    if(note.chord) {
                        console.log(`   Chord (proper): ${note.chord().map(n => n.name)}.`);
                        console.log(`   Chord (legible): ${note.chord().map(n => n.mostLegibleEnharmonic().name)}.`);
                    }
                    

                    if(note.scale) {
                        console.log(`   Scale (proper): ${note.scale().map(n => n.name)}.`);
                        console.log(`   Scale (legible): ${note.scale().map(n => n.mostLegibleEnharmonic().name)}.`);
                    }

                    func.call(note, noteLength);
                }, (noteLength + 10) * k);
            }
        }
    }

    ///////////////////////////////////////
    // Exports.
    ///////////////////////////////////////

    var N = window.N = _Notes;

    var P = window.P = new _Player();
    
})();