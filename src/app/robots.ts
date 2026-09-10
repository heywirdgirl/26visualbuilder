import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/core/utils/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/projects", "/editor", "/post", "/auth"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
