class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

class NotNode extends ASTNode {
  constructor(value) {
    super("NOT");
    this.value = value;
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

const parseNot = (expression) => {
  const { node, rest } = expression.startsWith("(")
    ? parseParentheses(expression.slice(1))
    : parseLiteral(expression);

  return { node: new NotNode(node), rest };
};

const parseLiteral = (expression) => {
  const match = expression.match(/^(\d+)(.*)$/);
  return { node: new LiteralNode(parseInt(match[1])), rest: match[2] };
};

const startsWithInteger = (str) => str.match(/^\d/);

const newBinaryNodeFromType = (type) => (left, right) => {
  switch (type) {
    case "AND":
      return new AndNode(left, right);
    case "OR":
      return new OrNode(left, right);
    default:
      throw new Error(`Invalid binary node type: ${type}`);
  }
};

// Apply a left rotation of a binary tree, eg:
//   AND               OR
//  /  \              /  \
// A   OR     to    AND   C
//    /   \        /  \
//   B     C      A    B
const rotateLeft = (node) =>
  newBinaryNodeFromType(node.right.type)(
    newBinaryNodeFromType(node.type)(node.left, node.right.left),
    node.right.right
  );

const rotateLeftIf = (predicate) => (node) =>
  predicate(node) ? rotateLeft(node) : node;

const righChildHasSameType = (node) => node.type === node.right.type;

const righChildIsTypeOr = (node) => node.right instanceof OrNode;

const or =
  (...predicates) =>
  (x) =>
    predicates.reduce((acc, curr) => acc || curr(x), false);

function parse(expression) {
  if (
    !(
      expression.startsWith("(") ||
      startsWithInteger(expression) ||
      expression.startsWith("NOT")
    )
  ) {
    throw new Error(
      "Invalid expression: expected integer or opening parenthesis"
    );
  }

  let result;
  if (expression.startsWith("(")) {
    result = parseParentheses(expression.slice(1));
  } else if (expression.startsWith("NOT")) {
    result = parseNot(expression.slice(3));
  } else {
    result = parseLiteral(expression);
  }

  if (result.rest.startsWith("AND")) {
    const right = parse(result.rest.slice(3));
    return {
      node: rotateLeftIf(or(righChildHasSameType, righChildIsTypeOr))(
        new AndNode(result.node, right.node)
      ),
      rest: right.rest,
    };
  }

  if (result.rest.startsWith("OR")) {
    const right = parse(result.rest.slice(2));
    return {
      node: rotateLeftIf(righChildHasSameType)(
        new OrNode(result.node, right.node)
      ),
      rest: right.rest,
    };
  }

  return result;
}

export default class LogicalExpressionAST {
  static from(expression) {
    if (typeof expression !== "string") {
      throw new Error(`Invalid expression: ${JSON.stringify(expression)}`);
    }
    const result = parse(removeAllSpaceCharacters(expression));
    if (result.rest.length > 0) {
      throw new Error(
        "Invalid expression: unexpected characters at end of string"
      );
    }
    return result.node;
  }
}
