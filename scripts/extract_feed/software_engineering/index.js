const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();
const {EPISODE_FIELDS} = require('../episode.js');
const axios = require('axios');
const {filterRawEpisode, getDurationInSec} = require("../episode");

(async () => {
    const fileXML = fs.readFileSync('./raw/231001_software_engineering.xml')
    const feed = await parser.parseString(fileXML);

    const required_fields = ['guid', 'title', 'enclosure.url', 'link', 'pubDate', 'itunes.duration'];
    const episodes = feed.items.filter((rawEpisode) => {
        return filterRawEpisode(rawEpisode, required_fields);
    }).map(rawEpisode => {
        const episode = {
            [EPISODE_FIELDS.id]: rawEpisode['guid'],
            [EPISODE_FIELDS.title]: rawEpisode['title'],
            [EPISODE_FIELDS.audioUrl]: rawEpisode['enclosure']['url'],
            [EPISODE_FIELDS.episodeLink]: rawEpisode['link'],
            [EPISODE_FIELDS.publishedAt]: (new Date(rawEpisode['pubDate'])).toISOString(),
            [EPISODE_FIELDS.durationInSec]: getDurationInSec(rawEpisode['itunes']['duration']),
        }
        return episode;
    });

    // Schedule all episodes for transcription
    // for (let i = 0; i < episodes.length; i++) {
    //     const schedule_audio_transcription_url = `http://localhost:3000/?audioUrl=${episodes[i][EPISODE_FIELDS.audioUrl]}`
    //     const response = await axios.get(schedule_audio_transcription_url);
    //     console.log(`status: ${response.data.status}`)
    // }

    fs.writeFileSync('./extracted/231001_software_engineering.json', JSON.stringify(episodes));
})();
