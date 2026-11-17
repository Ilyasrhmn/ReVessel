import Link from "next/link";
import Icon from "./interface-icon";

export default function NewTabLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={`${label} (buka di tab baru)`}
      className={`${className} new-tab-link`}
    >
      <span>{label}</span>
      <Icon kind="external" />
    </Link>
  );
}
