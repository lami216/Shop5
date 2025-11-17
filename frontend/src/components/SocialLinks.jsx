import { useEffect, useState } from "react";

// Simple inline SVGs to avoid extra deps:
const Icon = {
  facebook: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 5.02 3.66 9.19 8.44 9.98v-7.06H7.9v-2.92h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.23 0-1.61.77-1.61 1.56v1.87h2.74l-.44 2.92h-2.3v7.06C18.34 21.26 22 17.09 22 12.07z" />
    </svg>
  ),
  tiktok: (props) => (
    <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor" {...props}>
      <path d="M41 17.5c-3.7 0-7-1.2-9.7-3.3v12.8c0 6.9-5.6 12.5-12.5 12.5S6.3 33.9 6.3 27c0-6.9 5.6-12.5 12.5-12.5 1 0 2 .1 2.9.4v5.5c-.9-.3-1.9-.5-2.9-.5-3.8 0-6.9 3.1-6.9 6.9 0 3.8 3.1 6.9 6.9 6.9 3.8 0 6.9-3.1 6.9-6.9V6.6h5.5c1 3.6 4.3 6.3 8.3 6.6v4.3z" />
    </svg>
  ),
  whatsapp: (props) => (
    <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" {...props}>
      <path d="M19.1 17.2c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1c-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.8-2.1-.2-.3 0-.5.1-.6s.3-.3.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.2-.9.8-.9 2s.9 2.3 1 2.5c.1.2 1.8 2.8 4.3 3.9.6.3 1.1.5 1.5.6.6.2 1.1.2 1.5.1.5-.1 1.8-.7 2-1.4.2-.7.2-1.2.2-1.3 0-.1-.1-.2-.3-.3z"/><path d="M26.1 5.9C23.4 3.2 19.9 1.7 16.2 1.7 8.7 1.7 2.7 7.7 2.7 15.2c0 2.3.6 4.6 1.9 6.6L3 30l8.3-1.6c1.9 1 4 1.5 6.1 1.5 7.5 0 13.5-6 13.5-13.5 0-3.6-1.5-7.1-4.2-9.8zm-9.9 21c-2 0-3.9-.5-5.6-1.5l-.4-.2-4.9.9.9-4.8-.3-.5c-1.2-1.8-1.8-3.8-1.8-5.9 0-5.9 4.8-10.7 10.7-10.7 2.9 0 5.6 1.1 7.6 3.1s3.1 4.7 3.1 7.6c0 5.9-4.8 10.7-10.7 10.7z"/>
    </svg>
  ),
};

export default function SocialLinks() {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    fetch("/api/public-config")
      .then((r) => r.json())
      .then((data) => setLinks(data))
      .catch(() => setLinks({}));
  }, []);

  if (!links) return null;

  const items = [
    { key: "facebook", label: "Facebook", href: links.facebook, className: "hover:bg-[#1877F2]" },
    { key: "tiktok", label: "TikTok", href: links.tiktok, className: "hover:bg-black" },
    { key: "whatsapp", label: "WhatsApp", href: links.whatsapp, className: "hover:bg-[#25D366]" },
  ].filter((x) => !!x.href);

  if (items.length === 0) return null;

  return (
    <div className="w-full flex flex-wrap items-center justify-center gap-3 mt-8">
      {items.map(({ key, label, href, className }) => {
        const IconComponent = Icon[key];

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-white/10 text-white transition ${className}`}
            aria-label={label}
          >
            <span className="inline-flex"><IconComponent /></span>
            <span className="text-sm">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
