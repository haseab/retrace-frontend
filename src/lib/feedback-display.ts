export interface LeadingBracketParseResult {
  tokens: string[];
  remainder: string;
}

const LEADING_BRACKET_TOKEN_REGEX = /^\s*\[([^\]]+)\]\s*/;

export function extractLeadingBracketTokens(input: string): LeadingBracketParseResult {
  let remainder = input.trimStart();
  const tokens: string[] = [];

  while (true) {
    const match = remainder.match(LEADING_BRACKET_TOKEN_REGEX);
    if (!match?.[0]) {
      break;
    }

    tokens.push(match[1].trim());
    remainder = remainder.slice(match[0].length);
  }

  return {
    tokens,
    remainder: remainder.trimStart(),
  };
}

export function stripLeadingBracketPrefixes(input: string): string {
  return extractLeadingBracketTokens(input).remainder;
}

export function getDisplayDescription(rawDescription: string): string {
  if (!rawDescription) {
    return "";
  }

  const lines = rawDescription.split("\n");
  if (lines.length === 0) {
    return rawDescription;
  }

  const firstLineStripped = stripLeadingBracketPrefixes(lines[0]);
  if (firstLineStripped.length > 0) {
    lines[0] = firstLineStripped;
    return lines.join("\n");
  }

  const remaining = lines.slice(1).join("\n").trimStart();
  return remaining.length > 0 ? remaining : rawDescription;
}
