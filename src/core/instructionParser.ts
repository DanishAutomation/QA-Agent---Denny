import type { ParsedInstructionData } from "@/types";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+?\d[\d\s-]{7,}\d)/g;
const cardPattern = /\b(?:\d[ -]*?){13,19}\b/g;
const expiryPattern = /\b(0[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})\b/g;
const cvvPattern = /\b(?:cvv|cvc|security code|cvv code|سی وی وی)\s*[:=-]?\s*(\d{3,4})\b/i;

function cleanValue(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function setIfMissing(
  obj: Record<string, string | undefined>,
  key: string,
  value: string | undefined
): void {
  if (!value || obj[key]) {
    return;
  }
  obj[key] = cleanValue(value);
}

function extractFirst(pattern: RegExp, input: string): string | undefined {
  const match = input.match(pattern);
  if (!match || match.length === 0) {
    return undefined;
  }
  return cleanValue(match[0]);
}

function detectKeyAlias(key: string): string {
  const normalized = key.toLowerCase().trim();
  if (/(login email|email|ای میل|ایمیل)/.test(normalized)) return "email";
  if (/(password|pass|پاس ورڈ)/.test(normalized)) return "password";
  if (/(name|full name|naam|نام)/.test(normalized)) return "name";
  if (/(phone|mobile|cell|فون)/.test(normalized)) return "phone";
  if (/(street|address line|address|گلی|پتہ)/.test(normalized)) return "street";
  if (/(city|شہر)/.test(normalized)) return "city";
  if (/(state|province|ریاست)/.test(normalized)) return "state";
  if (/(zip|postal|postcode|پن کوڈ)/.test(normalized)) return "zip";
  if (/(country|ملک)/.test(normalized)) return "country";
  if (/(card number|card no|cc number|کارڈ نمبر)/.test(normalized)) return "cardNumber";
  if (/(expiry|exp|valid thru|میعاد)/.test(normalized)) return "expiry";
  if (/(cvv|cvc|security code|سی وی وی)/.test(normalized)) return "cvv";
  if (/(cardholder|card holder|card name|کارڈ ہولڈر)/.test(normalized)) {
    return "cardholderName";
  }
  return normalized;
}

function maybeSelector(
  line: string,
  selectors: ParsedInstructionData["selectors"]
): void {
  const trimmed = line.trim();

  if (/^(xpath|x-path)\s*[:=]/i.test(trimmed) || /^\/\//.test(trimmed)) {
    const xpath = trimmed.replace(/^(xpath|x-path)\s*[:=]\s*/i, "");
    if (xpath.length > 0) selectors.xpaths.push(xpath);
    return;
  }

  if (
    /(getbyrole|getbytext|getbylabel|getbyplaceholder|getbytestid|locator\(|page\.locator)/i.test(
      trimmed
    )
  ) {
    selectors.playwrightLocators.push(trimmed);
    return;
  }

  if (/^(css|selector)\s*[:=]/i.test(trimmed)) {
    const css = trimmed.replace(/^(css|selector)\s*[:=]\s*/i, "");
    if (css.length > 0) selectors.cssSelectors.push(css);
    return;
  }

  if (/[#.\[\]>]/.test(trimmed) && /\s/.test(trimmed) === false) {
    selectors.cssSelectors.push(trimmed);
  }
}

export function parseInstructionText(input: string): ParsedInstructionData {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const bulletPoints: string[] = [];
  const naturalLanguageCommands: string[] = [];

  const parsed: ParsedInstructionData = {
    rawText: input,
    bulletPoints,
    naturalLanguageCommands,
    login: {},
    signup: {},
    address: {},
    payment: {},
    selectors: {
      cssSelectors: [],
      xpaths: [],
      playwrightLocators: [],
    },
  };

  for (const line of lines) {
    const isBullet = /^[-*•]\s+/.test(line);
    const cleanLine = line.replace(/^[-*•]\s+/, "");

    if (isBullet) {
      bulletPoints.push(cleanLine);
    }

    maybeSelector(cleanLine, parsed.selectors);

    const kvMatch = cleanLine.match(/^([^:=]+)\s*[:=]\s*(.+)$/);
    if (kvMatch) {
      const alias = detectKeyAlias(kvMatch[1]);
      const value = cleanValue(kvMatch[2]);

      switch (alias) {
        case "email":
          setIfMissing(parsed.login as Record<string, string | undefined>, "email", value);
          setIfMissing(parsed.signup as Record<string, string | undefined>, "email", value);
          break;
        case "password":
          setIfMissing(parsed.login as Record<string, string | undefined>, "password", value);
          setIfMissing(parsed.signup as Record<string, string | undefined>, "password", value);
          break;
        case "name":
          setIfMissing(parsed.signup as Record<string, string | undefined>, "name", value);
          setIfMissing(parsed.address as Record<string, string | undefined>, "name", value);
          break;
        case "phone":
          setIfMissing(parsed.signup as Record<string, string | undefined>, "phone", value);
          setIfMissing(parsed.address as Record<string, string | undefined>, "phone", value);
          break;
        case "street":
          setIfMissing(parsed.address as Record<string, string | undefined>, "street", value);
          break;
        case "city":
          setIfMissing(parsed.address as Record<string, string | undefined>, "city", value);
          break;
        case "state":
          setIfMissing(parsed.address as Record<string, string | undefined>, "state", value);
          break;
        case "zip":
          setIfMissing(parsed.address as Record<string, string | undefined>, "zip", value);
          break;
        case "country":
          setIfMissing(parsed.address as Record<string, string | undefined>, "country", value);
          break;
        case "cardNumber":
          setIfMissing(parsed.payment as Record<string, string | undefined>, "cardNumber", value);
          break;
        case "expiry":
          setIfMissing(parsed.payment as Record<string, string | undefined>, "expiry", value);
          break;
        case "cvv":
          setIfMissing(parsed.payment as Record<string, string | undefined>, "cvv", value);
          break;
        case "cardholderName":
          setIfMissing(
            parsed.payment as Record<string, string | undefined>,
            "cardholderName",
            value
          );
          break;
        default:
          break;
      }
      if (/^enter\s+(email|password|card|payment)/i.test(cleanLine)) {
        naturalLanguageCommands.push(cleanLine);
      }
    } else if (/^(card no|card number|expiry|cvv|cvc)\b/i.test(cleanLine)) {
      naturalLanguageCommands.push(cleanLine);
      const cardKv = cleanLine.match(/^([^:=]+)\s*[:=]\s*(.+)$/);
      if (cardKv) {
        const alias = detectKeyAlias(cardKv[1]);
        const value = cleanValue(cardKv[2]);
        if (alias === "cardNumber") {
          setIfMissing(parsed.payment as Record<string, string | undefined>, "cardNumber", value);
        } else if (alias === "expiry") {
          setIfMissing(parsed.payment as Record<string, string | undefined>, "expiry", value);
        } else if (alias === "cvv") {
          setIfMissing(parsed.payment as Record<string, string | undefined>, "cvv", value);
        }
      }
    } else if (cleanLine.length > 5) {
      naturalLanguageCommands.push(cleanLine);
    }
  }

  const allEmails = input.match(emailPattern) ?? [];
  if (allEmails[0]) {
    setIfMissing(parsed.login as Record<string, string | undefined>, "email", allEmails[0]);
    setIfMissing(parsed.signup as Record<string, string | undefined>, "email", allEmails[0]);
  }

  const allPhones = input.match(phonePattern) ?? [];
  if (allPhones[0]) {
    setIfMissing(parsed.signup as Record<string, string | undefined>, "phone", allPhones[0]);
    setIfMissing(parsed.address as Record<string, string | undefined>, "phone", allPhones[0]);
  }

  const allCards = input.match(cardPattern) ?? [];
  if (allCards[0]) {
    setIfMissing(
      parsed.payment as Record<string, string | undefined>,
      "cardNumber",
      allCards[0].replace(/\s|-/g, "")
    );
  }

  const expiry = extractFirst(expiryPattern, input);
  if (expiry) {
    setIfMissing(parsed.payment as Record<string, string | undefined>, "expiry", expiry);
  }

  const cvvMatch = input.match(cvvPattern);
  if (cvvMatch?.[1]) {
    setIfMissing(parsed.payment as Record<string, string | undefined>, "cvv", cvvMatch[1]);
  }
  const passwordInlineMatch = input.match(
    /(?:password|pass|پاس\s?ورڈ)\s*[:=]\s*([^\s,;]+)/i
  );
  if (passwordInlineMatch?.[1]) {
    setIfMissing(
      parsed.login as Record<string, string | undefined>,
      "password",
      passwordInlineMatch[1]
    );
  }

  // Support mixed Urdu/English hints in free text.
  if (/لاگ\s?ان|login/i.test(input) && !parsed.login.email && allEmails[0]) {
    parsed.login.email = allEmails[0];
  }
  if (/سائن\s?اپ|signup|register/i.test(input) && !parsed.signup.name) {
    const nameMatch = input.match(/(?:name|نام)\s*[:=-]?\s*([A-Za-z\u0600-\u06FF ]{3,40})/i);
    if (nameMatch?.[1]) {
      parsed.signup.name = cleanValue(nameMatch[1]);
    }
  }

  parsed.selectors.cssSelectors = [...new Set(parsed.selectors.cssSelectors)];
  parsed.selectors.xpaths = [...new Set(parsed.selectors.xpaths)];
  parsed.selectors.playwrightLocators = [...new Set(parsed.selectors.playwrightLocators)];
  parsed.naturalLanguageCommands = [...new Set(parsed.naturalLanguageCommands)];
  parsed.bulletPoints = [...new Set(parsed.bulletPoints)];

  return parsed;
}
