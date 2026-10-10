const services = [
  {
    number: "01",
    title: "Software Engineering",
    description:
      "Custom applications, APIs, backend systems, integrations, and modernization.",
  },
  {
    number: "02",
    title: "DevOps & Platform Engineering",
    description:
      "CI/CD, infrastructure as code, deployment automation, and developer workflows.",
  },
  {
    number: "03",
    title: "Cloud & Infrastructure",
    description:
      "Cloud architecture, migration, capacity planning, and cost optimization.",
  },
  {
    number: "04",
    title: "Reliability & Optimization",
    description:
      "Monitoring, observability, performance analysis, and incident readiness.",
  },
];

export default function Services() {
  return (
    <section className="section section-light" id="services">
      <div className="container">
        <div className="section-head">
          <h2>Engineering for what matters most.</h2>
          <p>
            We focus on the engineering areas that directly impact your ability to grow, deliver
            value, and stay profitable.
          </p>
        </div>

        <ul className="service-list">
          {services.map((service) => (
            <li className="service-row" key={service.number}>
              <span className="service-number" aria-hidden="true">
                {service.number}
              </span>
              <div className="service-body">
                <h3 className="service-title">{service.title}</h3>
                <p className="service-text">{service.description}</p>
              </div>
              <a className="text-link" href="#contact">
                Discuss this
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
