const pug = require('pug');
const pugJSON = require('./src/pug.json');
const fs = require('fs');
const { marked } = require('marked');
const hljs = require('highlight.js');

const blogArticleTemplate = pug.compileFile('./src/partials/blog-item.pug', { pretty: true });

// code highlighting
marked.setOptions({
  highlight: function (code, language) {
    if (!language) {
      return hljs.highlightAuto(code).value;
    }
    return hljs.highlight(code, { language }).value;
  },
});

// lazy loading images
marked.use({
  extensions: [
    {
      name: 'image',
      level: 'inline',
      renderer(token) {
        const html = this.parser.renderer.image(token.href, token.title, token.text);
        return html.replace(/^<img /, '<img loading="lazy" ');
      },
    },
  ],
});

for (let article of pugJSON.data.blogArticles) {
  article.content = marked.parse(fs.readFileSync(`src/views/blog/posts/${article.slug}.md`).toString());
  article.url = '/blog/' + article.slug;
  const html = blogArticleTemplate(article);
  fs.writeFileSync(`dist/blog/${article.slug}.html`, html);
}
