import { useCallback, useEffect } from "react";

/**
 * Custom hook for infinite scrolling.
 *
 * @param loadMore - Function to call when reaching the bottom.
 */
function useInfiniteScroll(loadMore: () => void) {
  const handleScroll = useCallback(
    (container: HTMLElement) => {
      if (
        window.innerHeight + container.scrollTop + 1 >=
        container.scrollHeight
      ) {
        loadMore();
      }
    },
    [loadMore]
  );

  useEffect(() => {
    const container = document.querySelector("main");
    if (!container) return;

    container.addEventListener("scroll", () => handleScroll(container));
    return () =>
      container.removeEventListener("scroll", () => handleScroll(container));
  }, []);
}

export default useInfiniteScroll;
