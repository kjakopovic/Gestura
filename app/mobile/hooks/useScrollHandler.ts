import { useRef } from "react";
import { Dimensions } from "react-native";

export const useScrollHandler = (onScrollEnd: () => void) => {
  const isLoadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedOnScrollEnd = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (!isLoadingRef.current) {
        isLoadingRef.current = true;
        onScrollEnd();
        // Reset after a delay to prevent multiple triggers
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 500);
      }
    }, 100);
  };

  return {
    onScroll: ({ nativeEvent }: { nativeEvent: any }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;

      const { height: deviceHeight } = Dimensions.get("window");
      const paddingToBottom = deviceHeight * 0.25;

      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      ) {
        debouncedOnScrollEnd();
      }
    },
    scrollEventThrottle: 16,
  };
};
