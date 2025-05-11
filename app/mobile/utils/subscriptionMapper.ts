/**
 * Maps subscription numeric codes to their string representations
 * 0 = No subscription
 * 1 = Premium
 * 2 = Live
 */
export const mapSubscriptionToString = (
  subscriptionCode: number | null | undefined
): string => {
  if (subscriptionCode === null || subscriptionCode === undefined) {
    return "No Subscription";
  }

  switch (subscriptionCode) {
    case 0:
      return "No Subscription";
    case 1:
      return "Premium";
    case 2:
      return "Live";
    default:
      return "Unknown Subscription";
  }
};

/**
 * Maps subscription strings to their numeric codes
 */
export const mapSubscriptionToCode = (subscriptionString: string): number => {
  switch (subscriptionString.toLowerCase()) {
    case "premium":
      return 1;
    case "live":
      return 2;
    case "no subscription":
    default:
      return 0;
  }
};
