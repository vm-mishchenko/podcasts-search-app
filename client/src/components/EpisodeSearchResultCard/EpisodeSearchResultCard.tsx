import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import styles from './EpisodeSearchResultCard.module.css';

export interface EpisodeSearchResultProps {
    episodeSearchResult: EpisodeSearchResult;
}

export const EpisodeSearchResultCard = ({episodeSearchResult}: EpisodeSearchResultProps) => {
    return <div>
        <a href={`/episodes/${episodeSearchResult._id}`} target="_blank">{episodeSearchResult.title}</a>
    </div>
}
