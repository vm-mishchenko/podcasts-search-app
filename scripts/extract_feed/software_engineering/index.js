const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();
const {EPISODE_FIELDS} = require('../episode.js');
const axios = require('axios');

(async () => {
    const fileXML = fs.readFileSync('./raw/231001_software_engineering.xml')
    const feed = await parser.parseString(fileXML);

    const episodes = [];
    feed.items.filter((item) => {
        if(!item['enclosure'] || !item['enclosure']['url']) {
            console.warn(`Episode has no audio URL. Skip it: ${item['title']}`);
            return false;
        }
        return true;
    }).forEach(rawEpisode => {
        const episode = {
            [EPISODE_FIELDS.id]: rawEpisode['guid'],
            [EPISODE_FIELDS.title]: rawEpisode['title'],
            [EPISODE_FIELDS.audioUrl]: rawEpisode['enclosure']['url'],
            [EPISODE_FIELDS.episodeLink]: rawEpisode['link'],
            [EPISODE_FIELDS.publishedAt]: (new Date(rawEpisode['pubDate'])).toISOString(),
        }
        episodes.push(episode);
    });

    // Schedule all episodes for transcription
    // for (let i = 0; i < episodes.length; i++) {
    //     const schedule_audio_transcription_url = `http://localhost:3000/?audioUrl=${episodes[i][EPISODE_FIELDS.audioUrl]}`
    //     const response = await axios.get(schedule_audio_transcription_url);
    //     console.log(`status: ${response.data.status}`)
    // }

    fs.writeFileSync('./extracted/231001_software_engineering.json', JSON.stringify(episodes));
})();
