% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
% load a module as 'mod'
% 
% based off Node.js' require function
% 
% parameters ---
% :param name - the name of a module as a string
% :param kwargs - keyword arguments in a struct
% 
% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function json = require( name )
	
	file = '';

	% read the contents of the file or throw an error if the package doesn't exist
	try 
		file = fileread(['modules/' name '/iff.json']);
	catch e
		error(['No module could be found by the name of ''' name '''' ])
	end

	% parse the JSON text file into a struct
	json = parseJSON( file );

	% add the module to the path
	addpath(['modules/', name ]);

end


% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
% a very basic JSON parser that translate JSON into a matlab struct
% ---
% this is based off the way real parser/lexers like GNU BISON/FLEX work, but it's
% obviously quite a bit more simple than that
% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function strct = parseJSON ( json )

	% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	% define a grammar for the lexer
	% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	lexicon = struct();

	 % end of line
	lexicon.ENDL =  { '(,)', @(s)(deal('ENDL','')) };

	% matches (non-greedy) contents of single or double quotes
	lexicon.STR =  { '[''"](.*?)[''"]', @(s)(deal('STR',s(2:end-1))) };

	% matches a colon, which is the only operator JSON uses
	lexicon.EQU = { '(:)', @(s)(deal('EQU',''))};

	% matches numbers like 0, +1, -2.0, 2.23442
	lexicon.NUM =  { '([\-\+]?[0-9]*(\.[0-9]+)?)', @(s)( deal('NUM',str2double(s))) };

	% open & close curly brace
	lexicon.OBRACE =  { '({)', @(s)(deal('OBRACE','')) };
	lexicon.CBRACE =  { '(})', @(s)(deal('CBRACE','')) };

	% open & close square brackets
	lexicon.OBRACK =  { '([)', @(s)(deal('OBRACK','')) };
	lexicon.CBRACK =  { '(])', @(s)(deal('CBRACK','')) };

	% match the empty string, tabs, returns and newlines
	lexicon.EMPTY = { '\s+', @(s)(deal('','')) };

	% call the lexer
	[ tokens, values ] = lex(lexicon,json);


	% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	% expressions in 'Backus-Naur Form' (BNF) - the input syntax to GNU Bison
	% 
	% BNF expressions consist of arrays of lexical tokens and other BNF expressions
	% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	bnf = struct();

	% bnf function handles are passed to two params
	% :param a - the first value
	% :param varargin - the values that are consumed

	% a key
	bnf.KEY = { {{'STR','EQU'}}, @(key,varargin)(key) };

	% a value can be a string, number, array or obj
	bnf.VAL = { {{'STR'},{'NUM'},{'ARRAY'}}, @(val,varargin)(val) };

	% multiple value array
	bnf.VALSARRAY = { {{'OBRACK','VALS','CBRACK'}}, @(a,varargin)([varargin{1}{1} varargin{1}{2}]) };

	% single value array
	bnf.VALARRAY = {{{'OBRACK','VAL','CBRACK'}},@(a,varargin)(varargin(1)) };

	bnf.ARRAY = {{{'VALARRAY'},{'VALSARRAY'}}, @(a,varargin)( a ) };

	% assignment expression is a key-value pair
	bnf.EXPR = { {{'KEY','VAL','ENDL'},{'KEY','VAL'}}, @(key,varargin)(struct(key,{varargin{1}})) };

	% recursively consume multiple expressions
	% concat structs by merging their fields
	bnf.EXPRX = { {{'EXPR','EXPR'},{'EXPRX','EXPR'},{'EXPRX','EXPRX'}}, @concat };

	% an object is one or more expressions wrapped in braces
	bnf.OBJ = { {{'OBRACE','EXPRX','CBRACE'},{'OBRACE','EXPR','CBRACE'}}, @(a,varargin)(varargin{1}) };

	% multiple values (as part of an array)
	bnf.VALS = { {{'VAL','ENDL','VAL'},{'VALS','ENDL','VALS'},{'VALS','ENDL','VAL'}}, @(a,varargin)({deal(a),deal(varargin{2})}) };

	% call the parser, and return the output
	strct = parse(bnf,tokens,values);

end % End of parseJSON


% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
% LEXER - Lex a string based on 'grammar'
% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function [ tokens, values ] = lex ( grammar, str )

	% the tokenized strings and values are placed into cell arrays, where they will be read 
	% by the language parser
	tokens = {}; values = {};

	fields = fieldnames(grammar);
	while str

		% loop through the lexer expressions, find the first match
		for i=1:length(fields)

			[starti,endi] = regexp(str,['^' grammar.(fields{i}){1} ]);
			if starti

				% push the evaluated match into the tokenized containers
				[ tokens{end+1}, values{end+1} ] = grammar.(fields{i}){2}(str(starti:endi));

				% consume the length of the captured group
				str = str(endi+1:end);

				% break the for loop to stop evaluating expressions
				break
			end

			% TODO don't evaluate this each time
			if i == length(fields)
				error(['LEXER: Unexpected token at ' str ]);
			end
		end
	end
end


% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
% PARSER - Parse tokens
% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function [ values ] = parse ( grammar, tokens, values )

	% remove tokens and values where the tokens are empty
	notEmpty = ~cellfun(@(t)isempty(t),tokens);
	tokens = tokens(notEmpty);
	values = values(notEmpty);

	fields = fieldnames(grammar);

	% the json file should compile down to one token
	while length(tokens) > 1

		for i=1:length(fields)
			expr = grammar.(fields{i}){1};
			for j=1:length(expr)
				for k=1:length(tokens)
				
					% break if the number of tokens the expression needs is 
					% greater than the number of tokens left
					if length(expr{j}) > length(tokens(k:end))
						break
					end

					% test if the expression matches
					if isequal(tokens(k:k+length(expr{j})-1),expr{j})

						% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
						% 		consume tokens
						% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

						% replace the tokens with the expression by removing
						% the tokens that are consumed by the expression
						% and replacing them with the expression key
						b = logical(ones(size(tokens)));
						b(k+1:k+length(expr{j})-1) = 0;
						tokens = tokens(b);
						tokens{k} = fields{i};

						% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
						% 		consume values
						% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

						values{k} = grammar.(fields{i}){2}( values{k}, values{~b} );
						values = values(b);
					end
				end
			end
		end
	end

	% return the first element in values
	values = values{1,1};
end


% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
% concatenate two structured arrays by copying field-value pairs from 'a' into 'b'
% ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function b = concat(a,b)
	fieldsa = fieldnames(a);
	for i=1:length(fieldsa)
		b.(fieldsa{i}) = a.(fieldsa{i});
	end
end
