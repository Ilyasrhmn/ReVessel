import styles from "./brand.module.css";

export function BrandSymbol() {
  return (
    <svg
      className={styles.symbol}
      viewBox="0 0 256 256"
      aria-hidden="true"
      focusable="false"
    >
      <use href="/brand/bergilir.svg#bergilir" />
    </svg>
  );
}

export default function BrandLogo() {
  return (
    <span className={styles.lockup}>
      <BrandSymbol />
      ReVessel
    </span>
  );
}
