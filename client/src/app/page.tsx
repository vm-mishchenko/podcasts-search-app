"use client"
import styles from './page.module.css'
import TextInput from "@leafygreen-ui/text-input";
import React, {useState, useEffect} from "react";
import {LoadingDotComp} from "@/components/LoadingDotComp/LoadingDotComp";
import {SearchResultsComp} from "@/components/SearchResultsComp/SearchResultsComp";
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {searchEpisodes} from "@/packages/api/episode-search-api";
import {FacetResultUI} from "@/packages/sdk/sdk-ui";
import {StringFacet} from "@/packages/sdk/components/StringFacet/StringFacet";

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [requestsInFlight, setRequestsInFlight] = useState(0);
    const [episodeSearchResults, setEpisodeSearchResults] = useState<EpisodeSearchResult[]>([])
    const [facetResults, setFacetResults] = useState<FacetResultUI[]>([])

    const onSearchQueryChange = (newSearchQuery: string) => {
        setSearchQuery(newSearchQuery);
    };

    // Run search request
    useEffect(() => {
        setRequestsInFlight((currentFlights) => {
            return currentFlights + 1;
        });
        searchEpisodes(searchQuery).then((response) => {
            setFacetResults(response.facetResults);
            setEpisodeSearchResults(response.searchResults);
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
                <input
                    placeholder={'Search'}
                    aria-label="Search"
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
                {facetResults.map((facetResult) => {
                    return <StringFacet facetResult={facetResult}/>
                })}
            </div>
            <div>
                {episodeSearchResults.length > 0 ?
                    <SearchResultsComp episodeSearchResults={episodeSearchResults}
                                       searchQuery={searchQuery}/> : "No results"}
            </div>

        </main>
    )
}
