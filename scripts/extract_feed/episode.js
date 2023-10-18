exports.EPISODE_FIELDS = {
    id: 'id',
    title: 'title',
    audioUrl: 'audio_url',
    episodeLink: 'episode_link',
    publishedAt: 'published_at',
    durationInSec: 'duration_in_sec',
}


exports.filterRawEpisode = (rawEpisode, required_fields) => {
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
}

// value example: 1:13:14 or 08:25
exports.getDurationInSec = (value) => {
    const values = value.split(':');
    if (values.length === 1) {
        // only seconds which is strange
        const seconds = parseInt(values[0]);
        return seconds;
    } else if (values.length === 2) {
        const minutes = parseInt(values[0]);
        const seconds = parseInt(values[1]);
        const totalSeconds = minutes * 60 + seconds;
        return totalSeconds
    } else if (values.length === 3) {
        const hours = parseInt(values[0]);
        const minutes = parseInt(values[1]);
        const seconds = parseInt(values[2]);
        const totalSeconds = hours * 60 * 60 + minutes * 60 + seconds;
        return totalSeconds
    } else {
        throw new Error("Unexpected duration format.");
    }
}
