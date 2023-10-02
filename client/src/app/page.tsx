"use client"
import styles from './page.module.css'
import TextInput from "@leafygreen-ui/text-input";
import React, {useState, useEffect} from "react";
import {LoadingDotComp} from "@/components/LoadingDotComp/LoadingDotComp";
import {SearchResultsComp} from "@/components/SearchResultsComp/SearchResultsComp";
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {searchEpisodes} from "@/packages/api/episode-search-api";

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [requestsInFlight, setRequestsInFlight] = useState(0);
    const [episodeSearchResults, setEpisodeSearchResults] = useState<EpisodeSearchResult[]>([])

    const onSearchQueryChange = (newSearchQuery: string) => {
        setSearchQuery(newSearchQuery);
    };

    // Run search request
    useEffect(() => {
        setRequestsInFlight((currentFlights) => {
            return currentFlights + 1;
        });
        searchEpisodes(searchQuery).then((episodeSearchResults) => {
            setEpisodeSearchResults(episodeSearchResults);
        }).catch((error: any) => {
            console.error(error)
        }).finally(() => {
            setRequestsInFlight((currentFlights) => {
                return currentFlights - 1;
            });
        });
    }, [searchQuery]);

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <TextInput
                    label={''}
                    placeholder={'Search'}
                    sizeVariant="large"
                    onChange={(event) => {
                        onSearchQueryChange(event.target.value);
                    }}
                    type="search"
                    value={searchQuery}
                    autoFocus={true}
                    autoComplete="off"
                    className={styles.searchInput}
                />
                <LoadingDotComp className={styles.loadingDot} requestsInFlight={requestsInFlight}/>
            </div>
            <div>
                <SearchResultsComp episodeSearchResults={episodeSearchResults}/>
            </div>
        </main>
    )
}
