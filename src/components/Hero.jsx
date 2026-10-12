import ThreadField from "./ThreadField.jsx";

const principles = [
  { title: "Build", text: "Software that solves real problems." },
  { title: "Scale", text: "Infrastructure built for growth." },
  { title: "Optimize", text: "Engineering aligned with business value." },
];

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-bg" aria-hidden="true">
        <ThreadField variant="background" />
      </div>

      <div className="container">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Engineering for sustainable growth</p>
            <h1 className="hero-title">Engineer your scale.</h1>
            <p className="hero-lead">
              We help growing businesses overcome engineering bottlenecks, build reliable
              technology, and scale with confidence.
            </p>
            <div className="hero-actions">
              <a className="btn btn-ghost" href="#services">
                Explore Our Services
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true" />
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
