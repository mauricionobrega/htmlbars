import { ProgramNode, BlockNode, ElementNode, TextNode, appendChild } from "htmlbars/ast";

/**
  @param {String} state the current state of the tokenizer
  @param {Array} stack the element stack
  @token {Token} token the current token being built
  @child {Token|Mustache|Block} child the new token to insert into the AST
*/
export function processToken(state, stack, token, child) {
  // EOF
  if (child === undefined) { return; }
  return handlers[child.type](child, currentElement(stack), stack, token, state);
}

function currentElement(stack) {
  return stack[stack.length - 1];
}

// This table maps from the state names in the tokenizer to a smaller
// number of states that control how mustaches are handled
var states = {
  "attributeValueDoubleQuoted": "attr",
  "attributeValueSingleQuoted": "attr",
  "attributeValueUnquoted": "attr",
  "beforeAttributeName": "in-tag"
};

var voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
var voidMap = {};

voidTagNames.split(" ").forEach(function(tagName) {
  voidMap[tagName] = true;
});

// Except for `mustache`, all tokens are only allowed outside of
// a start or end tag.
var handlers = {
  Chars: function(token, current) {
    appendChild(current, new TextNode(token.chars));
  },

  StartTag: function(tag, current, stack) {
    var element = new ElementNode(tag.tagName, tag.attributes, tag.helpers || [], []);
    stack.push(element);

    if (voidMap.hasOwnProperty(tag.tagName)) {
      this.EndTag(tag, element, stack);
    }
  },

  block: function(block, current, stack) {
  },

  mustache: function(mustache, current, stack, token, state) {
    switch(states[state]) {
      case "attr":
        token.addToAttributeValue(mustache);
        return;
      case "in-tag":
        token.addTagHelper(mustache);
        return;
      default:
        appendChild(current, mustache);
    }
  },

  EndTag: function(tag, current, stack, token, stackate) {
    if (current.tag !== tag.tagName) {
      throw new Error("Closing tag " + tag.tagName + " did not match last open tag " + current.tag);
    }

    stack.pop();

    var parent = currentElement(stack);
    appendChild(parent, current);
  }
};
