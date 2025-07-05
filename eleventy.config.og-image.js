const nodeHtmlToImage = require("node-html-to-image");
const path = require("path");
const nunjucks = require("nunjucks");
const fs = require("fs");

module.exports = (eleventyConfig) => {
    let generatedImages = new Map();

    // Pre-generate all OG images before build
    eleventyConfig.on("beforeBuild", async () => {
        console.log("Pre-generating OG images...");
        
        const outputDir = path.join("_site", "img", "og-images");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Get all blog posts from the content directory
        const glob = require("glob");
        const matter = require("gray-matter");
        
        const blogPosts = glob.sync("content/blog/**/*.md");
        
        for (const postPath of blogPosts) {
            try {
                const fileContent = fs.readFileSync(postPath, 'utf8');
                const { data, content } = matter(fileContent);
                
                if (!data.title || !data.date) continue;
                
                const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                const dateStr = new Date(data.date).toISOString().split("T")[0];
                const imageFilename = `${dateStr}-${slug}.png`;
                const imagePath = path.join(outputDir, imageFilename);
                const imageUrl = `/img/og-images/${imageFilename}`;
                
                // Store the mapping using both the filename and fileSlug
                const postFilename = path.basename(postPath, '.md');
                // Also create a fileSlug (what Eleventy uses)
                const fileSlug = postFilename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
                
                generatedImages.set(postFilename, imageUrl);
                generatedImages.set(fileSlug, imageUrl);
                
                // Skip if image already exists
                if (fs.existsSync(imagePath)) {
                    console.log(`OG image exists: ${imageFilename}`);
                    continue;
                }
                
                console.log(`Generating OG image: ${imageFilename}`);
                
                const html = nunjucks.render("_includes/layouts/og-image.njk", { 
                    title: data.title 
                });

                await nodeHtmlToImage({
                    output: imagePath,
                    html: html,
                    width: 1200,
                    height: 630,
                });
                
                console.log(`Generated: ${imageUrl}`);
                
            } catch (error) {
                console.error(`Error processing ${postPath}:`, error);
            }
        }
        
        console.log(`Pre-generated ${generatedImages.size} OG images`);
    });

    // Add a filter to get OG image URL for a post
    eleventyConfig.addFilter("getOgImage", function(fileSlug) {
        return generatedImages.get(fileSlug) || "";
    });
};