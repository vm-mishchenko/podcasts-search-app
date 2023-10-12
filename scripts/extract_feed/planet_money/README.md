Podcast RSS: https://feeds.npr.org/510289/podcast.xml
Found feed : https://www.npr.org/podcasts/510289/planet-money

Get raw feed
```shell
Get raw feed
```shell
const _feed = await parser.parseURL('https://feeds.npr.org/510289/podcast.xml');
fs.writeFileSync('./raw/231014_planet_money.json', JSON.stringify(_feed.items));
```
