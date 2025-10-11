const path = require("path");
const fs = require("fs");

module.exports = (eleventyConfig) => {
    let imageMap = new Map();

    // Map prebuilt OG images to posts
    eleventyConfig.on("beforeBuild", async () => {
        console.log("Mapping prebuilt OG images...");

        // Get all blog posts from the content directory
        const glob = require("glob");
        const matter = require("gray-matter");

        const blogPosts = glob.sync("content/blog/**/*.md");

        for (const postPath of blogPosts) {
            try {
                const fileContent = fs.readFileSync(postPath, 'utf8');
                const { data } = matter(fileContent);

                if (!data.title || !data.date) continue;

                const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                const dateStr = new Date(data.date).toISOString().split("T")[0];
                const imageFilename = `${dateStr}-${slug}.png`;
                const imageUrl = `/img/og-images/${imageFilename}`;

                // Store the mapping using both the filename and fileSlug
                const postFilename = path.basename(postPath, '.md');
                // Also create a fileSlug (what Eleventy uses)
                const fileSlug = postFilename.replace(/^\d{4}-\d{2}-\d{2}-/, '');

                imageMap.set(postFilename, imageUrl);
                imageMap.set(fileSlug, imageUrl);

            } catch (error) {
                console.error(`Error processing ${postPath}:`, error);
            }
        }

        console.log(`Mapped ${imageMap.size / 2} OG images`);
    });

    // Add a filter to get OG image URL for a post
    eleventyConfig.addFilter("getOgImage", function(fileSlug) {
        return imageMap.get(fileSlug) || "";
    });
};