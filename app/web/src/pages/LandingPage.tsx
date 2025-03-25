const LandingPage = () => {
  return (
    <div>
      {/* Temp button samo da mogu doc do logina brze */}
      <button onClick={() => (window.location.href = "/login")}>Login</button>
    </div>
  );
};

export default LandingPage;
