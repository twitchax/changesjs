var chord = N['C'].seven().flatNine();
console.log(`${chord.name()}`);
console.log(`${chord.descriptions()}`);
console.log(`${chord.scale().map(n => n.name())}`);
console.log(`${chord.chord().map(n => n.name())}`);
chord.playChord();

var root = N['C'];
P
    .add(root.major())
    .add(root.majorSeven())
    .add(root.minor())
    .add(root.minor().majorSeven())
    .add(root.minor().seven())
    .add(root.seven())
    .add(root.seven().sharpEleven())
    .add(root.plus().majorSeven())
    .add(root.plus().seven())
    .add(root.halfDiminished())
    .add(root.diminished())
    .add(root.seven().flatNine())
    .add(root.seven().sharpNine())
    .play(2000);

P 
    .add(root.major().scale())
    .play(500);