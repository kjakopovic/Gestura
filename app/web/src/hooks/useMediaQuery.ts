import { useState, useEffect } from "react";

/**
 * Custom hook for tracking media queries (responsive breakpoints).
 *
 * @param query - The CSS media query string (e.g., "(min-width: 768px)").
 * @returns `true` if the media query matches, otherwise `false`.
 */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export default useMediaQuery;
