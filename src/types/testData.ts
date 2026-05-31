export interface LoginData {
  email?: string;
  password?: string;
}

export interface SignupData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
}

export interface AddressData {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

export interface PaymentData {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  cardholderName?: string;
}

export interface CustomSelectors {
  cssSelectors: string[];
  xpaths: string[];
  playwrightLocators: string[];
}

export interface ParsedInstructionData {
  rawText: string;
  bulletPoints: string[];
  naturalLanguageCommands: string[];
  login: LoginData;
  signup: SignupData;
  address: AddressData;
  payment: PaymentData;
  selectors: CustomSelectors;
}

export type TestDataStep = "login" | "signup" | "address" | "payment";

export interface StepResolution<T> {
  status: "use-parsed" | "use-fallback" | "skip";
  reason: string;
  data?: T;
}
