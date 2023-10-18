"use client"
import styles from './page.module.css'
import React, {useState, useEffect, useRef} from "react";
import {LoadingDotComp} from "@/components/LoadingDotComp/LoadingDotComp";
import {SearchResultsComp} from "@/components/SearchResultsComp/SearchResultsComp";
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {searchEpisodes} from "@/packages/api/episode-search-api";
import {FacetResultUI} from "@/packages/sdk/ui/sdk-ui-facets";
import {PublishedAtFilterComp} from "@/components/PublishedAtFilterComp/PublishedAtFilterComp";
import {FilterType} from "@/packages/filters/filters.type";
import {PublishedAtFilter, PUBLISHED_AT_OPTIONS} from "@/packages/filters/published-at.filter";

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [requestsInFlight, setRequestsInFlight] = useState(0);
    const [episodeSearchResults, setEpisodeSearchResults] = useState<EpisodeSearchResult[]>([])
    const [facetResults, setFacetResults] = useState<FacetResultUI[]>([])
    const [publishedAtFilter, setPublishedAtFilter] = useState<PUBLISHED_AT_OPTIONS>(PUBLISHED_AT_OPTIONS.ANY_TIME)

    const inputRef = useRef<HTMLInputElement>(null);
    const onSearchQueryChange = (newSearchQuery: string) => {
        setSearchQuery(newSearchQuery);
    };

    const showResetBtn = searchQuery.length > 0 || publishedAtFilter !== PUBLISHED_AT_OPTIONS.ANY_TIME;
    const onResetBtnClick = () => {
        setSearchQuery('');
        setPublishedAtFilter(PUBLISHED_AT_OPTIONS.ANY_TIME);
        inputRef.current!.focus();
    }

    // Run search request
    useEffect(() => {
        setRequestsInFlight((currentFlights) => {
            return currentFlights + 1;
        });

        // todo-vm: need to define filter default values in some config
        // todo-vm: need to store in some array in more centralized place
        const filter: PublishedAtFilter = {
            name: 'publishedAt',
            type: FilterType.PUBLISHED_AT,
            value: publishedAtFilter
        };

        searchEpisodes(searchQuery, [filter]).then((response) => {
            setFacetResults(response.facetResults);
            setEpisodeSearchResults(response.searchResults);
        }).catch((error: any) => {
            console.error(error)
        }).finally(() => {
            setRequestsInFlight((currentFlights) => {
                return currentFlights - 1;
            });
        });
    }, [searchQuery, publishedAtFilter]);

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <input
                    ref={inputRef}
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
                {showResetBtn && <button className={styles.resetBtn} onClick={onResetBtnClick}>Reset</button>}
            </div>

            <div className={styles.filters}>
                <PublishedAtFilterComp value={publishedAtFilter} onChange={(selectedFilterValue) => {
                    setPublishedAtFilter(selectedFilterValue);
                }}/>
            </div>

            {episodeSearchResults.length > 0 ? <div className={styles.content}>
                <div className={styles.facets}>
                    Facets and filters
                </div>
                <div className={styles.searchResults}>
                    <SearchResultsComp episodeSearchResults={episodeSearchResults}
                                       searchQuery={searchQuery}/>
                </div>
            </div> : 'No results'}
        </main>
    )
}
