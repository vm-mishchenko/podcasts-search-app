const fs = require('fs');
const {EPISODE_FIELDS, filterRawEpisode} = require("../episode");

(async () => {
    const rawEpisodes = JSON.parse(fs.readFileSync('./raw/230929_mongodb_episodes.json'))
    const required_fields = ['id', 'name', 'hostedUrl', 'externalId', 'publishedAt', 'duration'];
    const episodes = rawEpisodes.filter((rawEpisode) => {
        return filterRawEpisode(rawEpisode, required_fields);
    }).map(rawEpisode => {
        const episode = {
            [EPISODE_FIELDS.id]: rawEpisode['id'],
            [EPISODE_FIELDS.title]: rawEpisode['name'],
            [EPISODE_FIELDS.audioUrl]: rawEpisode['hostedUrl'],
            [EPISODE_FIELDS.episodeLink]: `https://podcasts.mongodb.com/public/115/The-MongoDB-Podcast-b02cf624/${rawEpisode['externalId']}`,
            [EPISODE_FIELDS.publishedAt]: (new Date(rawEpisode['publishedAt'])).toISOString(),
            [EPISODE_FIELDS.durationInSec]: rawEpisode['duration'],
        }
        return episode;
    });

    fs.writeFileSync('./extracted/230929_mongodb_episodes.json', JSON.stringify(episodes));
})();
