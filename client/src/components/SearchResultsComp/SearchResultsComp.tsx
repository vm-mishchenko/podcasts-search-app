import {EpisodeSearchResultCard} from "@/components/EpisodeSearchResultCard/EpisodeSearchResultCard";
import styles from './SearchResultsComp.module.css';
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";

export interface SearchResultsCompProps {
    searchQuery: string;
    episodeSearchResults: EpisodeSearchResult[];
}

export const SearchResultsComp = ({episodeSearchResults, searchQuery}: SearchResultsCompProps) => {
    return <ul className={styles.wrapper}>
        {episodeSearchResults.map((episodeSearchResult) => {
            return <li className={styles.searchResult} key={episodeSearchResult._id}>
                {/* eslint-disable-next-line react/jsx-no-undef */}
                <EpisodeSearchResultCard searchQuery={searchQuery} episodeSearchResult={episodeSearchResult}/>
            </li>;
        })}
    </ul>;
};
