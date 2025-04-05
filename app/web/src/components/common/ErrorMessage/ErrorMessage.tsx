interface Props {
  message?: string;
  onClick?: () => void;
}

const ErrorMessage = ({ message, onClick }: Props) => (
  <div className="flex items-center bg-red-500/50 text-white px-4 py-2 rounded-lg shadow-lg mt-[25%] xxs:mt-[7%] xs:mt-0 w-full">
    <button
      onClick={onClick}
      className="mr-3 p-1 rounded-full hover:cursor-pointer transition"
      aria-label="Close error message"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <span className="text-sm font-medium gestura-text-landing-title">
      {message}
    </span>
  </div>
);

export default ErrorMessage;
