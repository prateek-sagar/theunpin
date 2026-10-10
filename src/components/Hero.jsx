const principles = [
  { title: "Build", text: "Software that solves real problems." },
  { title: "Scale", text: "Infrastructure built for growth." },
  { title: "Optimize", text: "Engineering aligned with business value." },
];

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Engineering for sustainable growth</p>
            <h1 className="hero-title">Unpin your potential. Engineer your scale.</h1>
            <p className="hero-lead">
              We help growing businesses overcome engineering bottlenecks, build reliable
              technology, and scale with confidence.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#contact">
                Book an Engineering Discovery Call
              </a>
              <a className="btn btn-ghost" href="#services">
                Explore Our Services
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <HeroGraphic />
          </div>
        </div>

        <div className="hero-principles">
          {principles.map((item) => (
            <div className="principle" key={item.title}>
              <h2 className="principle-title">{item.title}</h2>
              <p className="principle-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroGraphic() {
  return (
    <svg className="hero-svg" viewBox="0 0 460 420" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#75DFC2" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#75DFC2" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <g className="hero-svg-panel">
        <rect x="20" y="20" width="420" height="380" rx="22" />
      </g>

      <g className="hero-svg-grid">
        <line x1="20" y1="120" x2="440" y2="120" />
        <line x1="20" y1="220" x2="440" y2="220" />
        <line x1="20" y1="320" x2="440" y2="320" />
      </g>

      <path
        className="hero-svg-path"
        d="M70 330 L150 330 L150 250 L240 250 L240 170 L330 170 L330 100 L400 100"
        fill="none"
        stroke="url(#heroLine)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <g className="hero-svg-nodes">
        <circle cx="70" cy="330" r="6" />
        <circle cx="150" cy="250" r="6" />
        <circle cx="240" cy="170" r="6" />
        <circle cx="330" cy="100" r="6" />
      </g>

      <circle className="hero-svg-focus" cx="400" cy="100" r="13" />
      <circle className="hero-svg-focus-ring" cx="400" cy="100" r="24" />
    </svg>
  );
}
