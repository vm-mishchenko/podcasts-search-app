const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();
const {EPISODE_FIELDS, filterRawEpisode, getDurationInSec} = require('../episode.js');
const axios = require('axios');

(async () => {
    const rawEpisodes = JSON.parse(fs.readFileSync('./raw/231007_practicalai.json'))
    const required_fields = ['guid', 'title', 'enclosure.url', 'link', 'pubDate', 'itunes.duration'];
    const episodes = rawEpisodes.filter((rawEpisode) => {
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
    //     const schedule_audio_transcription_url = `https://whisper-app-b4lxkp5rjq-uc.a.run.app/api/audio`
    //     const response = await axios.post(schedule_audio_transcription_url, {
    //         url: episodes[i][EPISODE_FIELDS.audioUrl],
    //         ADMIN_ACCESS_TOKEN: "xxx"
    //     }, {
    //         headers: {
    //             "Content-Type": "application/x-www-form-urlencoded"
    //         },
    //     });
    //     console.log(`Transcription status for podcast ${i} out of ${episodes.length}: ${response.data.status}`)
    // }

    fs.writeFileSync('./extracted/231007_practicalai.json', JSON.stringify(episodes));
})();
