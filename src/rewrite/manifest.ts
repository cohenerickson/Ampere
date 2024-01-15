import { rewriteURL } from "./url";
import { WebAppManifest } from "web-app-manifest";

function rewriteSrcKey(resource: { src?: string }, meta: string | URL) {
  if (resource.src) {
    resource.src = rewriteURL(resource.src, meta);
  }

  return resource;
}

function rewriteUrlKey(resource: { url?: string }, meta: string | URL) {
  if (resource.url) {
    resource.url = rewriteURL(resource.url, meta);
  }

  return resource;
}

export function rewriteManifest(manifest: string, meta: string | URL): string {
  try {
    const parsed = JSON.parse(manifest) as WebAppManifest;

    // Rewrite icons
    if (parsed.icons) {
      for (const icon of parsed.icons) {
        rewriteSrcKey(icon, meta);
      }
    }

    // Rewrite screenshots
    if (parsed.screenshots) {
      for (const screenshot of parsed.screenshots) {
        rewriteSrcKey(screenshot, meta);
      }
    }

    // Rewrite start url
    if (parsed.start_url) {
      parsed.start_url = rewriteURL(parsed.start_url, meta);
    }

    // Rewrite scope
    if (parsed.scope) {
      parsed.scope = rewriteURL(parsed.scope, meta);
    }

    // Rewrite related applications
    if (parsed.related_applications) {
      for (const app of parsed.related_applications) {
        rewriteUrlKey(app, meta);
      }
    }

    // Rewrite shortcuts
    if (parsed.shortcuts) {
      for (const shortcut of parsed.shortcuts) {
        rewriteUrlKey(shortcut, meta);

        if (shortcut.icons) {
          for (const icon of shortcut.icons) {
            rewriteSrcKey(icon, meta);
          }
        }
      }
    }

    return JSON.stringify(parsed);
  } catch (e) {
    __$ampere.logger.warn(
      `Failed to parse manifest, returning unwritten content ${manifest}`,
      e
    );

    return manifest;
  }
}
