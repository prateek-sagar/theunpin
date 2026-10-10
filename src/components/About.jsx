const values = [
  {
    title: "Reliable and Secure",
    description:
      "Systems designed to be dependable, maintainable, and secure by default.",
    icon: "shield",
  },
  {
    title: "Transparent Collaboration",
    description:
      "Clear communication, shared visibility, and no hidden surprises along the way.",
    icon: "chat",
  },
  {
    title: "Business Aligned",
    description:
      "Technical decisions measured against the outcomes that matter to your business.",
    icon: "target",
  },
  {
    title: "Long-Term Focus",
    description:
      "Solutions built to hold up as your product, team, and traffic grow.",
    icon: "horizon",
  },
];

function Icon({ name }) {
  const common = {
    className: "value-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3l7 3v5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />
        <path d="M9.5 12l1.8 1.8L15 10" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M4 6h16v9H9l-5 4V6z" />
        <path d="M8 10h8M8 12.5h5" />
      </svg>
    );
  }
  if (name === "target") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 16c3-5 6-5 9 0s6 5 9 0" />
      <circle cx="12" cy="7" r="2.4" />
    </svg>
  );
}

export default function About() {
  return (
    <section className="section section-light" id="about">
      <div className="container about-grid">
        <div className="about-intro">
          <h2>More than a service. A partner in your growth.</h2>
          <p>
            We combine technical expertise with a business mindset to help you scale confidently,
            reduce risk, and improve profitability through better engineering decisions.
          </p>
        </div>

        <ul className="value-list">
          {values.map((value) => (
            <li className="value-item" key={value.title}>
              <span className="value-icon-wrap">
                <Icon name={value.icon} />
              </span>
              <div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-text">{value.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
