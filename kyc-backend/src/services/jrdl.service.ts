/**
 * Jurisdiction Rule Definition Language (JRDL) Engine
 * 
 * Evaluates programmable compliance policies against user attributes.
 * This ensures that a user is not only KYC verified, but also permitted
 * to transact based on jurisdiction rules, AML risk scores, and sanctions.
 */

export interface UserAttributes {
  kycStatus: string;
  jurisdiction: string;
  amlRiskScore: number;
  isSanctioned: boolean;
}

export interface JrdlCondition {
  field: keyof UserAttributes;
  operator: "==" | "!=" | "<" | ">" | "<=" | ">=" | "IN" | "NOT_IN";
  value: any;
}

export interface JrdlRule {
  condition: JrdlCondition;
  action: "ALLOW" | "DENY";
  errorMessage?: string;
}

export interface JrdlPolicy {
  name: string;
  rules: JrdlRule[];
}

// Default Global Financial Compliance Policy
const GLOBAL_POLICY: JrdlPolicy = {
  name: "Global Financial Compliance v1.0",
  rules: [
    {
      condition: { field: "kycStatus", operator: "==", value: "APPROVED" },
      action: "ALLOW",
      errorMessage: "User must be KYC APPROVED."
    },
    {
      condition: { field: "isSanctioned", operator: "==", value: false },
      action: "ALLOW",
      errorMessage: "User is on a sanctions list."
    },
    {
      condition: { field: "amlRiskScore", operator: "<", value: 75 },
      action: "ALLOW",
      errorMessage: "AML risk score is too high (>= 75)."
    },
    {
      // FATF high-risk jurisdictions commonly restricted
      condition: { field: "jurisdiction", operator: "NOT_IN", value: ["KP", "IR", "MM", "RestrictedRegion"] },
      action: "ALLOW",
      errorMessage: "Jurisdiction is restricted by geofencing rules."
    }
  ]
};

export class JrdlService {
  private activePolicy: JrdlPolicy;

  constructor(policy?: JrdlPolicy) {
    this.activePolicy = policy || GLOBAL_POLICY;
  }

  /**
   * Evaluates the user attributes against the active JRDL policy.
   * All rules must pass (implicit AND) for the policy to evaluate to ALLOW.
   * If any rule fails, an error is thrown with the specific reason.
   */
  public evaluate(attributes: UserAttributes): boolean {
    for (const rule of this.activePolicy.rules) {
      const isMatch = this.evaluateCondition(attributes, rule.condition);
      
      if (rule.action === "ALLOW" && !isMatch) {
        throw new Error(`JRDL Policy Violation: ${rule.errorMessage || "Condition not met."}`);
      }
      
      if (rule.action === "DENY" && isMatch) {
        throw new Error(`JRDL Policy Violation: ${rule.errorMessage || "Deny condition matched."}`);
      }
    }

    return true; // All rules passed
  }

  private evaluateCondition(attributes: UserAttributes, condition: JrdlCondition): boolean {
    const userValue = attributes[condition.field];
    const targetValue = condition.value;

    switch (condition.operator) {
      case "==":
        return userValue === targetValue;
      case "!=":
        return userValue !== targetValue;
      case "<":
        return Number(userValue) < Number(targetValue);
      case ">":
        return Number(userValue) > Number(targetValue);
      case "<=":
        return Number(userValue) <= Number(targetValue);
      case ">=":
        return Number(userValue) >= Number(targetValue);
      case "IN":
        return Array.isArray(targetValue) && targetValue.includes(userValue);
      case "NOT_IN":
        return Array.isArray(targetValue) && !targetValue.includes(userValue);
      default:
        throw new Error(`Unknown operator: ${condition.operator}`);
    }
  }
}
