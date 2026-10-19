import { SOCIAL_NETWORKS, type SocialLinks, type SocialNetwork } from "@/lib/product-types";

const LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

function Icon({ network }: { network: SocialNetwork }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (network) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.5 2.5 2.5 4.5 5 4.5" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M15 3h-2a4 4 0 0 0-4 4v14" />
          <path d="M6 11h9" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="5" width="20" height="14" rx="4" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export default function SocialIcons({ links }: { links: SocialLinks }) {
  const active = SOCIAL_NETWORKS.filter((network) => links[network]);
  if (active.length === 0) return null;

  return (
    <div className="flex gap-3">
      {active.map((network) => (
        <a
          key={network}
          href={links[network]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`HugosToyz on ${LABELS[network]}`}
          title={LABELS[network]}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-htz-lime hover:text-htz-navy"
        >
          <Icon network={network} />
        </a>
      ))}
    </div>
  );
}
