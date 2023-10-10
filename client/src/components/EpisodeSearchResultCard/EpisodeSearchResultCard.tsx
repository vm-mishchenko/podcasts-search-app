import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import styles from './EpisodeSearchResultCard.module.css';
import {useState} from "react";
import {
    EpisodeTranscription
} from "@/components/EpisodeSearchResultCard/components/EpisodeTranscription/EpisodeTranscription";

export interface EpisodeSearchResultProps {
    searchQuery: string;
    episodeSearchResult: EpisodeSearchResult;
}

export const EpisodeSearchResultCard = ({searchQuery, episodeSearchResult}: EpisodeSearchResultProps) => {
    const [showMore, setShowMore] = useState(false)
    const toggleMore = () => {
        setShowMore(!showMore)
    }
    return <div>
        <div className={styles.header}>
            <a href={`/episodes/${episodeSearchResult._id}`} target="_blank">{episodeSearchResult.title}</a>
            <button className={styles.showMoreBtn} onClick={toggleMore}>{showMore ? 'Less' : 'More'}</button>
        </div>
        {showMore && (
            <div>
                <EpisodeTranscription searchQuery={searchQuery} episode_id={episodeSearchResult._id}/>
            </div>
        )}
    </div>
}
