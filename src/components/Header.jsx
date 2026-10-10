import { useState } from "react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Our Approach", href: "#approach" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#home" aria-label="theUnpin — home" onClick={close}>
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 25V13" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="16" cy="9.5" r="3.4" />
            <path d="M8.5 20.5h15" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
          </svg>
          <span className="brand-name">theUnpin</span>
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={`nav-toggle-icon ${open ? "is-open" : ""}`} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>

        <nav
          id="primary-nav"
          className={`primary-nav ${open ? "is-open" : ""}`}
          aria-label="Primary"
        >
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={close}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="btn btn-primary nav-cta" href="#contact" onClick={close}>
            Book a Discovery Call
          </a>
        </nav>
      </div>
    </header>
  );
}
