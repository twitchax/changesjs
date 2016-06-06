

;'use strict';

(function() {

    var _ctx;
    var _stave;
    var _width = 800;

    function _reset() {
        var canvas = document.querySelector('#staff');
        var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);

        _ctx = renderer.getContext();
        _ctx.clear();
        _stave = new Vex.Flow.Stave(10, 0, _width);
        _stave.addClef("treble").setContext(_ctx).draw();
    }

    function _addScale(chordObj) {

        if(!chordObj)
            throw Error('Chord required!');

        var scale = chordObj.legibleScale();
        var chord = chordObj.legibleChord();

        // Create the scale.
        var scaleNotes = [];
        for(var n of scale) {
            var staveNote = new Vex.Flow.StaveNote({ keys: [`${n.name().toLowerCase()}/4`], duration: "q" });
            if(n.name().length > 1)
                staveNote.addAccidental(0, new Vex.Flow.Accidental(n.name().substring(1)));
            scaleNotes.push(staveNote);
        }
        var scaleVoice = new Vex.Flow.Voice({
            num_beats: 8,
            beat_value: 4,
            resolution: Vex.Flow.RESOLUTION, 
        });
        scaleVoice.setMode(Vex.Flow.Voice.Mode.SOFT);
        scaleVoice.addTickables(scaleNotes);
        //new Vex.Flow.Formatter().joinVoices([scaleVoice]).format([scaleVoice], _width);

        // Create the chord.
        var chordNoteKeys = [];
        var chordNoteAccidentals = [];
        for(var n of chord) {
            chordNoteKeys.push(`${n.name().toLowerCase()}/4`);
            if(n.name().length > 1)
                chordNoteAccidentals.push({ pos: chordNoteKeys.length - 1, accidental: new Vex.Flow.Accidental(n.name().substring(1)) });
        }
        var chordNote = new Vex.Flow.StaveNote({ keys: chordNoteKeys, duration: "q" });
        for(var a of chordNoteAccidentals)
            chordNote.addAccidental(a.pos, a.accidental);
        var chordVoice = new Vex.Flow.Voice({
            num_beats: 8,
            beat_value: 4,
            resolution: Vex.Flow.RESOLUTION, 
        });
        chordVoice.setMode(Vex.Flow.Voice.Mode.SOFT);
        chordVoice.addTickables([chordNote]);
        //new Vex.Flow.Formatter().joinVoices([chordVoice]).format([chordVoice], _width);

        new Vex.Flow.Formatter().joinVoices([scaleVoice, chordVoice]).format([scaleVoice, chordVoice], _width);

        // Render.
        scaleVoice.draw(_ctx, _stave);
        chordVoice.draw(_ctx, _stave);
    }

    _reset();
    _addScale(N['B'].seven().sharpNine());

})();

// var chord = N['C'].seven().flatNine();
// console.log(`${chord.name()}`);
// console.log(`${chord.descriptions()}`);
// console.log(`${chord.scale().map(n => n.name())}`);
// console.log(`${chord.chord().map(n => n.name())}`);
// chord.playChord();

// var root = N['C'];
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