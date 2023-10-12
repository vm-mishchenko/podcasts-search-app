import type {NextApiRequest, NextApiResponse} from 'next';
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {HTTP_STATUS_CODE, HTTP_METHOD} from "@/packages/http/http";
import {captureErrorsMiddleware} from "@/packages/middlewares/capture-errors.middleware";
import {use} from "@/packages/middleware/use";
import {allowMethodsMiddleware} from "@/packages/middlewares/allow-methods.middleware";
import {getMongoClient} from "@/packages/database/client";
import {ObjectId} from "bson";
import {FacetType, StringFacet, Facets, Operator, FacetsResults} from "@/packages/sdk/pipeline";
import {FacetPipeline, FacetPipelineExecutor, Search} from "@/packages/sdk/sdk";
import {StringFacetUI, SearchUI, FacetResultUI, BucketIdResolver} from "@/packages/sdk/sdk-ui";

// Set up Mongodb
const client = getMongoClient();
const episodes = client.db('online').collection('episodes');
const podcasts = client.db('online').collection('podcasts');

// Set up search
const searchUI = new SearchUI(new Search(episodes));

// Define Facets
const podcastIdFacet: StringFacetUI = {
    type: FacetType.STRING,
    name: "podcast_id_str",
    path: 'podcast_id_str',
    numBuckets: 3
};

const podcastsResolver: BucketIdResolver<any> = async (facetResult) => {
    // Fetch podcasts
    const podcastObjectIds = facetResult.buckets.map((bucket) => new ObjectId(bucket._id));
    const podcastDocList = await podcasts.find({
        _id: {
            "$in": podcastObjectIds
        }
    }).toArray();

    // map MongoDB doc to bucket doc
    const bucketDocs = podcastDocList.map((podcastDoc) => {
        const {_id, ...rest} = podcastDoc;
        return {
            _id: `${_id}`,
            ...rest
        }
    });

    return bucketDocs;
}

const buildSearchPipeline = (searchQuery: string): Array<Record<string, any>> => {
    // base $search query
    const oneMonthInMilliseconds = 2592000000;
    const searchPipeline: Array<Record<string, any>> = [
        {
            "$search": {
                "compound": {
                    "must": [],
                    "should": [
                        {
                            // text: https://www.mongodb.com/docs/atlas/atlas-search/text/
                            "text": {
                                "query": searchQuery,
                                "path": "title",
                                "score": {
                                    "boost": {
                                        "value": 3
                                    }
                                }
                            }
                        },
                        // boost newer episodes
                        {
                            // https://www.mongodb.com/docs/atlas/atlas-search/near
                            'near': {
                                'path': 'published_at',
                                'origin': new Date(),
                                // must be specified in milliseconds for date data type
                                'pivot': oneMonthInMilliseconds * 12, // one year
                                'score': {
                                    'boost': {
                                        'value': 4
                                    }
                                }
                            }
                        },
                        {
                            "text": {
                                "query": searchQuery,
                                "path": "derived_summary",
                                "score": {
                                    "boost": {
                                        "value": 2
                                    }
                                }
                            }
                        },
                        {
                            "text": {
                                "query": searchQuery,
                                "path": "derived_transcription_text"
                            }
                        }
                    ]
                }
            }
        },
        {
            $limit: 20
        },
        {
            $project: {
                "title": 1,
                "published_at": 1,
                "derived_summary": 1
            }
        }
    ];

    // rudiment query understanding
    const exactMatchQuery = extractExactMatch(searchQuery);
    if (exactMatchQuery) {
        const mustClause = {
            // text: https://www.mongodb.com/docs/atlas/atlas-search/phrase
            "phrase": {
                "query": exactMatchQuery,
                "path": {"value": "title", "multi": "title_standard"}
            }
        };

        searchPipeline[0]['$search']['compound']['must'].push(mustClause);
    }

    return searchPipeline;
}

const extractExactMatch = (searchQuery: string): string | undefined => {
    const split = searchQuery.split('"');

    if (split.length >= 3) {
        const exactMatchQuery = split[1].trim();
        if (exactMatchQuery.length) {
            return exactMatchQuery;
        }
    }
}

export interface EpisodeSearchResponse {
    facetResults: FacetResultUI[];
    searchResults: EpisodeSearchResult[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse<EpisodeSearchResponse>) => {
    const searchQuery = req.query['searchQuery'] as string;

    if (!searchQuery) {
        res.status(HTTP_STATUS_CODE.OK);
        res.json({
            searchResults: [],
            facetResults: []
        });
        return;
    }

    // Fetch search and facets
    const searchPipeline = buildSearchPipeline(searchQuery);
    const facetOperator: Operator = searchPipeline[0]['$search'];
    const [mongodbEpisodesResults, facetResults] = await Promise.all([
        episodes.aggregate(searchPipeline).toArray(),
        searchUI.facets(facetOperator, [podcastIdFacet], {
            bucketIdResolver: podcastsResolver
        })
    ]);

    // Map results to public views
    const searchResults = mongodbEpisodesResults.map((mongodbEpisode) => {
        const episode: EpisodeSearchResult = {
            _id: mongodbEpisode._id,
            title: mongodbEpisode['title'],
            published_at: mongodbEpisode['published_at'],
            derived_summary: mongodbEpisode['derived_summary']
        };

        return episode;
    });
    const {facets} = facetResults;

    res.status(HTTP_STATUS_CODE.OK);
    res.json({
        searchResults: searchResults,
        facetResults: facets,
    });
};

export default use(captureErrorsMiddleware, allowMethodsMiddleware([HTTP_METHOD.GET]), handler);
