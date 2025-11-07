import bunLogo from "../assets/logo-mini.svg";
export const Footer = () => {
  return (
    <footer className="flex text-xs text-gray-600 justify-center items-center gap-1.5">
      <span>handcrafted with</span>
      <a href="https://bun.sh" target="_blank" rel="noopener noreferrer">
        <img src={bunLogo} className="w-3" />
      </a>
      <span>by</span>
      <a
        href="https://github.com/jordykoppen"
        className="text-white/80"
        target="_blank"
        rel="noopener noreferrer"
      >
        jordy
      </a>
    </footer>
  );
};
