const prefix = "Invariant failed";

// This is an alternative to tiny-invariant that includes an error message even in production builds.
type Invariant = (condition: unknown, message?: string) => asserts condition;
const invariant: Invariant = (
  condition: unknown,
  message?: string
): asserts condition => {
  if (condition) {
    return;
  }

  // Condition not passed
  const value: string = message ? `${prefix}: ${message}` : prefix;
  throw new Error(value);
};

export default invariant;
