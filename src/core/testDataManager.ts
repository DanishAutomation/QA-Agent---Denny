import { parseInstructionText } from "./instructionParser";
import type {
  AddressData,
  LoginData,
  ParsedInstructionData,
  PaymentData,
  SignupData,
  StepResolution,
  TestDataStep,
} from "@/types";

const SAFE_DUMMY_DATA = {
  login: {
    email: "qa.user@example.test",
    password: "Password@123",
  } satisfies LoginData,
  signup: {
    name: "Denny QA User",
    email: "new.user@example.test",
    password: "Signup@123",
    phone: "+12025550199",
  } satisfies SignupData,
  address: {
    name: "Denny QA User",
    street: "221B Baker Street",
    city: "London",
    state: "Greater London",
    zip: "NW16XE",
    country: "UK",
    phone: "+442071234567",
  } satisfies AddressData,
  payment: {
    cardNumber: "4242424242424242",
    expiry: "12/30",
    cvv: "123",
    cardholderName: "Denny QA User",
  } satisfies PaymentData,
};

type StepDataMap = {
  login: LoginData;
  signup: SignupData;
  address: AddressData;
  payment: PaymentData;
};

function hasRequiredFields(step: TestDataStep, data: StepDataMap[TestDataStep]): boolean {
  if (step === "login") {
    const value = data as LoginData;
    return Boolean(value.email && value.password);
  }
  if (step === "signup") {
    const value = data as SignupData;
    return Boolean(value.name && value.email && value.password);
  }
  if (step === "address") {
    const value = data as AddressData;
    return Boolean(value.name && value.street && value.city && value.country && value.phone);
  }
  const value = data as PaymentData;
  return Boolean(value.cardNumber && value.expiry && value.cvv && value.cardholderName);
}

export class TestDataManager {
  private readonly parsedByRun = new Map<string, ParsedInstructionData>();

  parseAndRegister(runId: string, instructionText: string): ParsedInstructionData {
    const parsed = parseInstructionText(instructionText);
    this.parsedByRun.set(runId, parsed);
    return parsed;
  }

  getParsed(runId: string): ParsedInstructionData | undefined {
    return this.parsedByRun.get(runId);
  }

  resolveStepData(
    runId: string,
    step: TestDataStep
  ): StepResolution<StepDataMap[TestDataStep]> {
    const parsed = this.getParsed(runId);
    const parsedData = parsed?.[step] as StepDataMap[TestDataStep] | undefined;

    if (parsedData && hasRequiredFields(step, parsedData)) {
      return {
        status: "use-parsed",
        reason: "Parsed data found in custom instruction box.",
        data: parsedData,
      };
    }

    const fallback = SAFE_DUMMY_DATA[step] as StepDataMap[TestDataStep];
    if (hasRequiredFields(step, fallback)) {
      return {
        status: "use-fallback",
        reason: "Missing parsed fields; using safe dummy test data.",
        data: fallback,
      };
    }

    return {
      status: "skip",
      reason: `Cannot proceed with ${step}; required data unavailable.`,
    };
  }
}

export const testDataManager = new TestDataManager();
