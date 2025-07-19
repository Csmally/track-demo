import Parser from './parser';
import Normal from './parser/plugins/parseNormal';
import Path from './parser/plugins/parsePath';
import Expression from './parser/plugins/parseExpression';

const parser: Parser = new Parser();
parser.useArr([{
	type: 1,
	callback: Normal,
}, {
	type: 2,
	callback: Path,
}, {
	type: 3,
	callback: Expression,
}]);

export default parser;
