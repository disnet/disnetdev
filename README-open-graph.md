# Open Graph Meta Tags

This Eleventy site now includes comprehensive Open Graph meta tags on every page for better social media sharing.

## What's Included

The following Open Graph meta tags are automatically added to every page:

- `og:title` - Page title or site title
- `og:description` - Page description or auto-generated from content
- `og:url` - Canonical URL of the page
- `og:type` - "website" for regular pages, "article" for blog posts
- `og:image` - Page image or default avatar
- `og:image:alt` - Alt text for the image
- `og:image:width` - Image width
- `og:image:height` - Image height
- `og:site_name` - Site name

For blog posts, additional article-specific tags are included:
- `article:author` - Author name
- `article:published_time` - Publication date
- `article:tag` - Post tags

Twitter Card meta tags are also included for Twitter/X sharing.

## Customizing Open Graph Data

### Per-Page Overrides

Add any of these properties to your page's front matter:

```yaml
---
title: "My Amazing Post"
description: "A custom description for social sharing"
image: "https://example.com/custom-image.jpg"
---
```

### Default Settings

Default Open Graph settings are configured in `_data/metadata.js`:

```javascript
openGraph: {
  image: "https://disnetdev.com/img/avatar.jpg",
  imageAlt: "Tim Disney's avatar",
  imageWidth: 250,
  imageHeight: 250
}
```

## Auto-Generated Descriptions

For blog posts without explicit descriptions, the system automatically generates descriptions by:
1. Stripping HTML tags from the post content
2. Truncating to 160 characters
3. Using this as the `og:description`

## Implementation

The Open Graph meta tags are implemented in `_includes/og-meta.njk` and included in the base layout template, ensuring they appear on every page of the site.