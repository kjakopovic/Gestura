import { useState, useEffect } from "react";
import { api } from "@/lib/api";

/**
 * Custom hook for managing settings state with change tracking
 * @param initialState The initial state object
 * @returns Object containing state, setState, hasChanges, saveChanges function and loading state
 */
export function useSettingsState<T extends Record<string, any>>(
  initialState: T
) {
  // Current state values
  const [state, setState] = useState<T>(initialState);

  // Original values to track changes against
  const [originalState, setOriginalState] = useState<T>(initialState);

  // Whether current state differs from original
  const [hasChanges, setHasChanges] = useState(false);

  // Loading state for API operations
  const [isLoading, setIsLoading] = useState(false);

  // Error state for API operations
  const [error, setError] = useState<string | null>(null);

  // Check for changes whenever state updates
  useEffect(() => {
    const changed = JSON.stringify(state) !== JSON.stringify(originalState);
    setHasChanges(changed);
  }, [state, originalState]);

  /**
   * Save changes, optionally making an API call
   * @param stateOverride Optional object to override current state values for this save operation
   * @returns Promise that resolves when the save operation is complete
   */
  const saveChanges = async (stateOverride?: Partial<T>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use overridden state if provided, otherwise use current state
      const stateToSave = stateOverride
        ? { ...state, ...stateOverride }
        : state;

      // Convert camelCase keys to snake_case for API and filter out null values
      const body: Record<string, any> = {};

      // Add all state properties with converted naming convention
      Object.entries(stateToSave).forEach(([key, value]) => {
        // Skip null, undefined, or empty string values
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          key === "email"
        ) {
          return;
        }

        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        body[snakeKey] = value;
      });

      const response = await api.patch("/users", body);

      if (!response.success) {
        const errorMsg =
          typeof response.error === "object" && response.error !== null
            ? response.error.message
            : response.error || "Failed to update settings";

        setError(errorMsg);
        return false;
      }

      // If we used an override, update the state to match what we saved
      if (stateOverride) {
        setState((prev) => ({ ...prev, ...stateOverride }));
      }

      // Update original state to match what was saved
      setOriginalState(
        stateOverride ? { ...state, ...stateOverride } : { ...state }
      );
      setHasChanges(false);

      return true;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state,
    setState,
    hasChanges,
    isLoading,
    error,
    clearError: () => setError(null),
    saveChanges,
    resetChanges: () => setState({ ...originalState }),
  };
}
