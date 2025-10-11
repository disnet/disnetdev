const nodeHtmlToImage = require("node-html-to-image");
const path = require("path");
const nunjucks = require("nunjucks");
const fs = require("fs");
const glob = require("glob");
const matter = require("gray-matter");

// Configure nunjucks to use the _includes directory
nunjucks.configure('_includes', { autoescape: false });

async function generateOgImages() {
    console.log("Generating OG images...");

    const outputDir = path.join("public", "img", "og-images");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get all blog posts from the content directory
    const blogPosts = glob.sync("content/blog/**/*.md");

    let generated = 0;
    let skipped = 0;

    for (const postPath of blogPosts) {
        try {
            const fileContent = fs.readFileSync(postPath, 'utf8');
            const { data, content } = matter(fileContent);

            if (!data.title || !data.date) {
                console.log(`Skipping ${postPath}: missing title or date`);
                continue;
            }

            const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const dateStr = new Date(data.date).toISOString().split("T")[0];
            const imageFilename = `${dateStr}-${slug}.png`;
            const imagePath = path.join(outputDir, imageFilename);

            // Skip if image already exists
            if (fs.existsSync(imagePath)) {
                console.log(`✓ Already exists: ${imageFilename}`);
                skipped++;
                continue;
            }

            console.log(`→ Generating: ${imageFilename}`);

            const html = nunjucks.render("layouts/og-image.njk", {
                title: data.title
            });

            await nodeHtmlToImage({
                output: imagePath,
                html: html,
                width: 1200,
                height: 630,
            });

            console.log(`✓ Generated: ${imageFilename}`);
            generated++;

        } catch (error) {
            console.error(`✗ Error processing ${postPath}:`, error.message);
        }
    }

    console.log(`\nComplete! Generated ${generated} images, skipped ${skipped} existing images`);
}

generateOgImages().catch(console.error);
