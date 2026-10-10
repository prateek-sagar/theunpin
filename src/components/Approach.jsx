const steps = [
  {
    number: "01",
    title: "Discover",
    description: "Understand business goals, technical constraints, and opportunities.",
  },
  {
    number: "02",
    title: "Design",
    description: "Identify improvements and develop a practical plan.",
  },
  {
    number: "03",
    title: "Build",
    description: "Implement and validate the solution.",
  },
  {
    number: "04",
    title: "Grow",
    description: "Measure results and improve continuously.",
  },
];

export default function Approach() {
  return (
    <section className="section section-dark" id="approach">
      <div className="container">
        <div className="section-head section-head-dark">
          <h2>Understand first. Engineer deliberately. Improve continuously.</h2>
          <p>
            A straightforward process built around your context, not a fixed template.
          </p>
        </div>

        <ol className="approach-list">
          {steps.map((step) => (
            <li className="approach-step" key={step.number}>
              <span className="approach-number" aria-hidden="true">
                {step.number}
              </span>
              <h3 className="approach-title">{step.title}</h3>
              <p className="approach-text">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
