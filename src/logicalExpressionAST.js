class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

class LiteralNode extends ASTNode {
  constructor(value) {
    super("literal");
    this.value = value;
  }
}

class BinaryOperatorNode extends ASTNode {
  constructor(type, left, right) {
    super(type);
    this.left = left;
    this.right = right;
  }
}

class AndNode extends BinaryOperatorNode {
  constructor(left, right) {
    super("AND", left, right);
  }
}

class OrNode extends BinaryOperatorNode {
  constructor(left, right) {
    super("OR", left, right);
  }
}

const removeAllSpaceCharacters = (str) => str.replace(/\s+/g, "");

const parseParentheses = (expression) => {
  const { node, rest } = parse(expression);
  if (!rest.startsWith(")")) {
    throw new Error("Invalid expression: missing closing parenthesis");
  }
  return { node, rest: rest.slice(1) };
};

const parseLiteral = (expression) => {
  const match = expression.match(/^(\d+)(.*)$/);
  return match
    ? { node: new LiteralNode(parseInt(match[1])), rest: match[2] }
    : { node: undefined, rest: expression };
};

const startsWithInteger = (str) => str.match(/^\d/);

function parse(expression) {
  if (!(expression.startsWith("(") || startsWithInteger(expression))) {
    throw new Error(
      "Invalid expression: expected integer or opening parenthesis"
    );
  }

  const result = expression.startsWith("(")
    ? parseParentheses(expression.slice(1))
    : parseLiteral(expression);

  if (result.rest.startsWith("AND")) {
    const right = parse(result.rest.slice(3));
    return { node: new AndNode(result.node, right.node), rest: right.rest };
  }

  if (result.rest.startsWith("OR")) {
    const right = parse(result.rest.slice(2));
    return {
      node: new OrNode(
        result.node,
        right.node //instanceof AndNode ? new AndNode(right.left, right.right) : right
      ),
      rest: right.rest,
    };
  }

  return result;
}

export default class LogicalExpressionAST {
  static from(expression) {
    expression = removeAllSpaceCharacters(expression);
    if (expression.length < 1) {
      throw new Error(
        "Invalid expression: expected literal or opening parenthesis"
      );
    }
    const result = parse(expression);
    // if (result.rest.length > 0) {
    //   throw new Error(
    //     "Invalid expression: unexpected characters at end of string"
    //   );
    // }
    return result.node;
  }
}
