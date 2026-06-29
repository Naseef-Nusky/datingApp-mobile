const Logo = ({ className = "" }) => {
  const imgClass = className.trim() ? className : "h-10 w-auto object-contain";
  return (
    <div className="flex items-center">
      <img
        src="/logonew.png"
        alt="Vantage Dating Logo"
        className={imgClass}
      />
    </div>
  );
};

export default Logo;



