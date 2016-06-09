;'use strict';

(function() {

    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };

    var _ctx;
    var _stave;
    var _width = 800;

    var _selectedChord;

    function _reset() {
        var canvas = document.querySelector('#staff');
        var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);

        _ctx = renderer.getContext();
        _ctx.clear();
        _stave = new Vex.Flow.Stave(20, 20, _width);
        _stave.addClef('treble').setContext(_ctx).draw();
    }

    function _addScale(chordObj) {

        if(!chordObj)
            throw Error('Chord required!');

        var scale = chordObj.scale();
        var chord = chordObj.chord();

        // Create the scale.
        var scaleNotes = [];
        for(var note of scale) {
            var noteName = note.simpleName();
            var staveNote = new Vex.Flow.StaveNote({ keys: [`${noteName.toLowerCase()}/${note.designation()}`], duration: 'q' });

            if(note.name().length > 1)
                staveNote.addAccidental(0, new Vex.Flow.Accidental(noteName.substring(1)));

            if(chord.find(n => n.toneEquals(note))) {
                staveNote.setStyle({ fillStyle: '#0000ff', strokeStyle: '#0000ff' });
            }

            scaleNotes.push(staveNote);
        }
        var scaleVoice = new Vex.Flow.Voice({
            num_beats: 8,
            beat_value: 4,
            resolution: Vex.Flow.RESOLUTION, 
        });
        scaleVoice.setMode(Vex.Flow.Voice.Mode.SOFT);
        scaleVoice.addTickables(scaleNotes);

        // Render.
        new Vex.Flow.Formatter().joinVoices([scaleVoice]).format([scaleVoice], _width);
        scaleVoice.draw(_ctx, _stave);
    }

    document.addEventListener("DOMContentLoaded", function(event) {
        Stream.dom('chord', 'input').subscribe(d => {
            _selectedChord = C[d.srcElement.value];

            if(!_selectedChord) {
                document.querySelector('#info').innerHTML = '';
                _reset();
                return;
            }

            if(_selectedChord.isNote())
                _selectedChord = _selectedChord.major();
            
            document.querySelector('#info').innerHTML = _selectedChord.toString().replaceAll(' ', '&nbsp;').replaceAll('\n', '<br />');

            _reset();
            _addScale(_selectedChord);
        });

        Stream.dom('play', 'click').subscribe(d => {
            if(_selectedChord) {
                P 
                    .add(_selectedChord)
                    .add(_selectedChord.chord())
                    .add(_selectedChord)
                    .play(500);
            }
        });

        _reset();
    });

})();

// Other simple examples...

// var chord = C['C'].seven().flatNine();
// console.log(`${chord.name()}`);
// console.log(`${chord.descriptions()}`);
// console.log(`${chord.scale().map(n => n.name())}`);
// console.log(`${chord.chord().map(n => n.name())}`);
// chord.playChord();

// var root = C['C'];
// P
//     .add(root.major())
//     .add(root.majorSeven())
//     .add(root.minor())
//     .add(root.minor().majorSeven())
//     .add(root.minor().seven())
//     .add(root.seven())
//     .add(root.seven().sharpEleven())
//     .add(root.plus().majorSeven())
//     .add(root.plus().seven())
//     .add(root.halfDiminished())
//     .add(root.diminished())
//     .add(root.seven().flatNine())
//     .add(root.seven().sharpNine())
//     .play(2000);

// P 
//     .add(root.major().scale())
//     .play(500);

// P
//     .add(C['CM'])
//     .add(C['Cmaj7'])
//     .add(C['C-'])
//     .add(C['C-maj7'])
//     .add(C['C-7'])
//     .add(C['C7'])
//     .add(C['C7#11'])
//     .add(C['C+maj7'])
//     .add(C['C+7'])
//     .add(C['C-7b5'])
//     .add(C['Cdim'])
//     .add(C['C7b9'])
//     .add(C['C7#9'])
//     .play(2000);