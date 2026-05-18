import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Industries from "./components/Industries";
import LeadPreview from "./components/LeadPreview";
import Stats from "./components/Stats";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
import CRMDashboard from "./components/CRMDashboard";

const params = new URLSearchParams(window.location.search);
const page = params.get("page");

export default function App() {
  if (page === "crm") return <CRMDashboard />;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-ink-700 antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-[0.4]" />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <HowItWorks />
        <Industries />
        <LeadPreview />
        <Stats />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
