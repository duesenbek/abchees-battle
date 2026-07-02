import { Chess } from 'chess.js';

const fen1 = "r1bqkb1r/pp3ppp/2n5/2p1P3/3P4/8/PPP3PP/R1BQKBNR w KQkq - 0 1";
const chess1 = new Chess(fen1);
console.log("FEN 1:");
console.log(chess1.ascii());

const parts = fen1.split(' ');
parts[1] = 'b';
const chess1b = new Chess(parts.join(' '));
console.log("Black in check?", chess1b.inCheck());

const fen2 = "8/8/8/8/8/8/1Q6/k1K5 w - - 0 1";
const chess2 = new Chess(fen2);
console.log("FEN 2:");
console.log(chess2.ascii());

const parts2 = fen2.split(' ');
parts2[1] = 'b';
const chess2b = new Chess(parts2.join(' '));
console.log("Black in check?", chess2b.inCheck());
