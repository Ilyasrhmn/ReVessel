import Landing from "./landing";
import LandingIntro from "./ui/landing-intro";

const startIntro = `try {
  if (!location.hash && !sessionStorage.getItem("revessel-intro") &&
    !matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active), (prefers-reduced-transparency: reduce)").matches) {
    document.documentElement.setAttribute("data-revessel-intro", "");
  }
} catch {}`;

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: startIntro }} />
      <LandingIntro />
      <Landing />
    </>
  );
}
