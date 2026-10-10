export default function ContactCTA() {
  return (
    <section className="section section-dark cta" id="contact">
      <div className="container cta-inner">
        <div className="cta-copy">
          <h2>What&rsquo;s holding your growth back?</h2>
          <p>
            Let&rsquo;s explore the engineering challenges standing between your business and its
            next stage of growth.
          </p>
        </div>
        <div className="cta-action">
          <a className="btn btn-primary btn-lg" href="mailto:hello@theunpin.com">
            Book a Discovery Call
          </a>
          <p className="cta-contact">
            Or reach us directly at{" "}
            <a href="mailto:hello@theunpin.com">hello@theunpin.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}
