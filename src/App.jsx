import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Services from "./components/Services.jsx";
import Approach from "./components/Approach.jsx";
import About from "./components/About.jsx";
import ContactCTA from "./components/ContactCTA.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#home">
        Skip to content
      </a>
      <Header />
      <main>
        <Hero />
        <Services />
        <Approach />
        <About />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
}
