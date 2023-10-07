Podcast RSS: https://changelog.com/practicalai/feed

Save locally:
```shell
const feed = await parser.parseURL('https://changelog.com/practicalai/feed');
fs.writeFileSync('./extracted/231007_practicalai.json', JSON.stringify(feed.items));
```