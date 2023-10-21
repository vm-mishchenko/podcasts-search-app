Podcast RSS: https://feeds.simplecast.com/N5eKDxJI
Found feed: https://podcastaddict.com/podcast/you-are-not-so-smart/4088003

More official RSS feed?:https://youarenotsosmart.com/feed

Get raw feed
```shell
const _feed = await parser.parseURL('https://feeds.simplecast.com/N5eKDxJI');
fs.writeFileSync('./raw/231008_you_are_not_so_smart.json', JSON.stringify(_feed.items));
```

