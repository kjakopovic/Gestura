import error_testing from "@/assets/hand-signs/error_testing.png";
import letter_c from "@/assets/hand-signs/letter_c.png";
import letter_l from "@/assets/hand-signs/letter_l.png";
import letter_v from "@/assets/hand-signs/letter_v.png";
import letter_a from "@/assets/hand-signs/letter_a.png";
import letter_o from "@/assets/hand-signs/letter_o.png";

// Export individual signs
export { letter_c, letter_l, letter_v, letter_a, letter_o, error_testing };

// Group signs by type for easier access
export const letters = {
  a: letter_a,
  c: letter_c,
  l: letter_l,
  o: letter_o,
  v: letter_v,
};

// Get a hand sign by letter
export const getHandSignByLetter = (letter: string) => {
  const key = letter.toLowerCase();
  return letters[key as keyof typeof letters] || error_testing;
};

// Utility: Get a random hand sign
export const getRandomHandSign = () => {
  const keys = Object.keys(letters);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return letters[randomKey as keyof typeof letters];
};
