const fs = require('fs');
const {EPISODE_FIELDS} = require('../episode.js');
const axios = require('axios');

const assertValue = (value, key) => {
    if (!value) {
        console.error(`"${key}" config key doesn't have a value.`)
    }

    return value;
}

(async () => {
    const rawEpisodes = JSON.parse(fs.readFileSync('./raw/231005_changelog.json'))
    const episodes = [];
    const required_fields = ['guid', 'title', 'enclosure.url', 'link', 'pubDate'];
    rawEpisodes.filter((rawEpisode) => {
        const doesNotHaveRequiredFields = required_fields.some((fieldPath) => {
            const fields = fieldPath.split('.'); // e.g. enclosure.url

            const fieldValue = fields.reduce((item, fieldName,) => {
                if (!item) {
                    return item;
                }

                const nextValue = item[fieldName];
                return nextValue;
            }, rawEpisode);

            if (!fieldValue) {
                console.warn(`Skip episode that doesn't has required field: ${fieldPath}, name: ${rawEpisode['title']}`);
                return true;
            }

            return false;
        });
        return !doesNotHaveRequiredFields;
    }).forEach(rawEpisode => {
        const episode = {
            [EPISODE_FIELDS.id]: assertValue(rawEpisode['guid'], 'guid'),
            [EPISODE_FIELDS.title]: assertValue(rawEpisode['title'], 'title'),
            [EPISODE_FIELDS.audioUrl]: rawEpisode['enclosure']['url'],
            [EPISODE_FIELDS.episodeLink]: rawEpisode['link'],
            [EPISODE_FIELDS.publishedAt]: (new Date(rawEpisode['pubDate'])).toISOString(),
        }
        episodes.push(episode);
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

    fs.writeFileSync('./extracted/231005_changelog.json', JSON.stringify(episodes));
})();


