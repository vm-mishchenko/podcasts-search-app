"use client"
import styles from './page.module.css'
import {Document} from "mongodb";
import React, {useState, useEffect, useRef} from "react";
import {LoadingDotComp} from "@/components/LoadingDotComp/LoadingDotComp";
import {SearchResultsComp} from "@/components/SearchResultsComp/SearchResultsComp";
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {searchEpisodes} from "@/packages/api/episode-search-api";
import {FacetResultUI, SelectedFacet} from "@/packages/sdk/ui/sdk-ui-facets";
import {PublishedAtFilterComp} from "@/components/PublishedAtFilterComp/PublishedAtFilterComp";
import {FilterType} from "@/packages/filters/filters.type";
import {PublishedAtFilter, PUBLISHED_AT_OPTIONS} from "@/packages/filters/published-at.filter";
import {StringFacet} from "@/packages/sdk/components/StringFacet/StringFacet";
import {BucketId, FacetName} from "@/packages/sdk/mongodb/search-meta/search-meta.types";
import {useRouter, useSearchParams} from "next/navigation";

const extractPublishedAtFilterValue = (value: string | undefined | null): PUBLISHED_AT_OPTIONS => {
    if (!value) {
        return PUBLISHED_AT_OPTIONS_DEFAULT;
    }

    console.log(Object.keys(PUBLISHED_AT_OPTIONS))
    const supportedValues = Object.keys(PUBLISHED_AT_OPTIONS);

    if (supportedValues.includes(value)) {
        return value as PUBLISHED_AT_OPTIONS;
    }

    return PUBLISHED_AT_OPTIONS_DEFAULT;
}

const SEARCH_QUERY_PARAM_NAME = 'query';
const PUBLISHED_AT_FILTER_PARAM_NAME = 'published_at';

// Default values
const PUBLISHED_AT_OPTIONS_DEFAULT = PUBLISHED_AT_OPTIONS.ANY_TIME;

interface HomeQueryParams {
    searchParams: {
        [SEARCH_QUERY_PARAM_NAME]: string | undefined,
        [PUBLISHED_AT_FILTER_PARAM_NAME]: string | undefined,
    }
}

export default function Home(params: HomeQueryParams) {
    const searchQuery = params.searchParams[SEARCH_QUERY_PARAM_NAME] || '';
    const publishedAt = extractPublishedAtFilterValue(params.searchParams[PUBLISHED_AT_FILTER_PARAM_NAME]);
    const [inputSearchQuery, setInputSearchQuery] = useState(searchQuery);
    const [submittedSearchQuery, setSubmittedSearchQuery] = useState(searchQuery);
    const [requestsInFlight, setRequestsInFlight] = useState(0);
    const [episodeSearchResults, setEpisodeSearchResults] = useState<EpisodeSearchResult[]>([])
    const [facetResults, setFacetResults] = useState<FacetResultUI[]>([])
    const [selectedFacets, setSelectedFacets] = useState<SelectedFacet[]>([]);
    const [publishedAtFilter, setPublishedAtFilter] = useState<PUBLISHED_AT_OPTIONS>(publishedAt)
    const [searchPipeline, setSearchPipeline] = useState<Document[]>([]);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const clearBtnRef = useRef<HTMLButtonElement>(null);

    /**
     * 1. Read URL param set initial state for query, filter, facets, -> run search.
     * 2. User changes UI -> update URL -> go to point 1.
     */
    const router = useRouter();
    const searchParams = useSearchParams()!;

    /**
     * Update URL parameters.
     */
    const onSubmit = (publishedAt: PUBLISHED_AT_OPTIONS = publishedAtFilter) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        // update search query
        if (!inputSearchQuery) {
            current.delete(SEARCH_QUERY_PARAM_NAME);
        } else {
            current.set(SEARCH_QUERY_PARAM_NAME, inputSearchQuery);
        }

        // update selected filters
        if (publishedAt === PUBLISHED_AT_OPTIONS.ANY_TIME) {
            current.delete(PUBLISHED_AT_FILTER_PARAM_NAME);
        } else {
            current.set(PUBLISHED_AT_FILTER_PARAM_NAME, publishedAt);
        }

        // cast to string
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${query}`);
    }

    /**
     * Listen for URL param changes and run search.
     */
    useEffect(() => {
        const newSearchQuery = searchParams.get(SEARCH_QUERY_PARAM_NAME) || '';
        setInputSearchQuery(newSearchQuery);
        setSubmittedSearchQuery(newSearchQuery);

        const publishedAtFilterValue = extractPublishedAtFilterValue(searchParams.get(PUBLISHED_AT_FILTER_PARAM_NAME));
        setPublishedAtFilter(publishedAtFilterValue);

        selectedFacets.length && setSelectedFacets([]);
    }, [searchParams]);

    // Run search request
    useEffect(() => {
        clearBtnRef.current?.focus();
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

        searchEpisodes(submittedSearchQuery, [filter], selectedFacets).then((response) => {
            setFacetResults(response.facetResults);
            setEpisodeSearchResults(response.searchResults);
            setSearchPipeline(response.searchPipeline);

        }).catch((error: any) => {
            console.error(error);
        }).finally(() => {
            setRequestsInFlight((currentFlights) => {
                return currentFlights - 1;
            });
        });
    }, [submittedSearchQuery, publishedAtFilter, selectedFacets]);

    const onPublishedAtFilterChange = (publishedAt: PUBLISHED_AT_OPTIONS) => {
        onSubmit(publishedAt);
    }

    const showResetBtn = inputSearchQuery.length > 0 || selectedFacets.length > 0;
    const onClearBtnClick = () => {
        setInputSearchQuery('');
        searchInputRef.current!.focus();
    }

    // Facets
    const onFacetChange = (facetName: FacetName, selectedBucketIds: BucketId[]) => {
        // remove facet from the list
        if (selectedBucketIds.length === 0) {
            const newSelectedFacets = selectedFacets.filter((selectedFacet) => {
                return selectedFacet.name !== facetName;
            });
            setSelectedFacets(newSelectedFacets);
            return;
        }

        const selectedFacet = selectedFacets.find((selectedFacet) => {
            return selectedFacet.name === facetName;
        });

        // update existing facet
        if (selectedFacet) {
            selectedFacet.bucketIds = selectedBucketIds
            setSelectedFacets([...selectedFacets]);
            return;
        }

        // add new facet
        setSelectedFacets([
            ...selectedFacets,
            {
                name: facetName,
                bucketIds: selectedBucketIds
            }
        ]);
    };

    return (
        <div className={styles.root}>
            <main className={styles.main}>
                <nav className={styles.nav}>
                    <ul className={styles.navList}>
                        <li className={styles.navListLink}>
                            <a href="/">Home</a>
                        </li>
                        <li className={styles.navListLink}>
                            <a target="_blank"
                               href="https://github.com/vm-mishchenko/podcasts-search-app">GitHub</a>
                        </li>
                    </ul>
                </nav>

                <div className={styles.header}>
                    <form className={styles.searchForm} onSubmit={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onSubmit();
                    }}>
                        <input
                            ref={searchInputRef}
                            placeholder={'Search'}
                            aria-label="Search"
                            onChange={(event) => {
                                setInputSearchQuery(event.target.value);
                            }}
                            type="search"
                            value={inputSearchQuery}
                            autoFocus={true}
                            autoComplete="off"
                            className={styles.searchInput}
                        />

                        <LoadingDotComp className={styles.loadingDot} requestsInFlight={requestsInFlight}/>

                        {showResetBtn &&
                            <button type="button" className={styles.resetBtn} onClick={onClearBtnClick}
                                    ref={clearBtnRef}>Clear</button>}
                    </form>
                </div>

                <div className={styles.filters}>
                    <PublishedAtFilterComp value={publishedAtFilter} onChange={(selectedFilterValue) => {
                        onPublishedAtFilterChange(selectedFilterValue);
                    }}/>
                </div>

                {episodeSearchResults.length > 0 ? <div className={styles.content}>
                    <div className={styles.facets}>
                        {facetResults.map((facetResult, index) => {
                            const selectedFacet = selectedFacets.find((selectedFacet) => {
                                return selectedFacet.name === facetResult.facetDefinition.name;
                            });
                            return <StringFacet key={index} facetResult={facetResult}
                                                selectedBucketIds={selectedFacet?.bucketIds || []}
                                                onChange={(bucketIds) => {
                                                    onFacetChange(facetResult.facetDefinition.name, bucketIds);
                                                }}/>
                        })}
                    </div>
                    <div className={styles.searchResults}>
                        <SearchResultsComp episodeSearchResults={episodeSearchResults}
                                           searchQuery={inputSearchQuery}/>
                    </div>
                </div> : <div>
                    <span>No results</span>
                </div>}
            </main>

            {searchParams.get('debug') && <div className={styles.debug}>
                <div>
                    <h4>Inner state</h4>
                    <pre>
                        {JSON.stringify({
                            inputSearchQuery,
                            submittedSearchQuery,
                        }, null, 2)}
                    </pre>
                </div>
                <div>
                    <h4>Selected Facets</h4>
                    <pre>
                        {JSON.stringify(selectedFacets, null, 2)}
                    </pre>
                </div>
                <div>
                    <h4>Search pipeline</h4>
                    <pre>
                        {JSON.stringify(searchPipeline, null, 2)}
                    </pre>
                </div>
                <div>
                    <h4>Facets Results</h4>
                    <pre>
                        {JSON.stringify(facetResults, null, 2)}
                    </pre>
                </div>
            </div>}
        </div>
    )
}
