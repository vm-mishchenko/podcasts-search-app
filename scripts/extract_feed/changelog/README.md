Podcast RSS: https://changelog.com/podcast/feed

Save locally:
```shell
const feed = await parser.parseURL('https://changelog.com/podcast/feed');
fs.writeFileSync('./extracted/231005_changelog.json', JSON.stringify(episodes));
```