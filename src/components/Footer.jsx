const footerNav = [
  { label: "Services", href: "#services" },
  { label: "Our Approach", href: "#approach" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="brand brand-footer" href="#home" aria-label="theUnpin — home">
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M16 25V13" strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="16" cy="9.5" r="3.4" />
              <path d="M8.5 20.5h15" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
            </svg>
            <span className="brand-name">theUnpin</span>
          </a>
          <p className="footer-statement">
            Engineering for sustainable growth — reliable systems, clear thinking, and technology
            aligned with your business.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          <ul>
            {footerNav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-contact">
          <h2 className="footer-heading">Contact</h2>
          <p>
            <a href="mailto:hello@theunpin.com">hello@theunpin.com</a>
          </p>
          <p className="footer-note">Remote-first · Working across time zones</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} theUnpin. All rights reserved.</p>
        <a href="#home">Back to top</a>
      </div>
    </footer>
  );
}
