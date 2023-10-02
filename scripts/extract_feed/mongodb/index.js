const fs = require('fs');
const {EPISODE_FIELDS} = require("../episode");

(async () => {
    const rawEpisodes = JSON.parse(fs.readFileSync('./raw/230929_mongodb_episodes.json'))

    const episodes = [];
    rawEpisodes.forEach(rawEpisode => {
        const episode = {
            [EPISODE_FIELDS.id]: rawEpisode['id'],
            [EPISODE_FIELDS.title]: rawEpisode['name'],
            [EPISODE_FIELDS.audioUrl]: rawEpisode['hostedUrl'],
            [EPISODE_FIELDS.episodeLink]: `https://podcasts.mongodb.com/public/115/The-MongoDB-Podcast-b02cf624/${rawEpisode['externalId']}`,
            [EPISODE_FIELDS.publishedAt]: (new Date(rawEpisode['publishedAt'])).toISOString(),
        }
        episodes.push(episode);
    });

    fs.writeFileSync('./extracted/230929_mongodb_episodes.json', JSON.stringify(episodes));
})();
