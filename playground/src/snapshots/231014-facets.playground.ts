import {MongoClient, ObjectId} from "mongodb";
import {config} from "../config";
import {FacetType, Operator} from "../sdk/pipeline";
import {Search} from "../sdk/sdk";
import {SearchUI, StringFacetUI, BucketIdResolver} from "../sdk/sdk-ui";

// Configure MongoDB
const client = new MongoClient(`mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@${config.MONGODB_CLUSTER}/?retryWrites=true&w=majority`);
const episodes = client.db('online').collection('episodes');
const podcasts = client.db('online').collection('podcasts');

// Get facets for UI
const podcastIdFacet: StringFacetUI = {
    type: FacetType.STRING,
    name: "podcast_id_str",
    path: 'podcast_id_str',
    numBuckets: 3,
};

const bucketIdResolver: BucketIdResolver<any> = async (facetResult) => {
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

const operator: Operator = {
    "text": {
        "path": "title",
        "query": "year"
    }
};

const search = new Search(episodes);
const searchUI = new SearchUI(search);
searchUI.facets(operator, [podcastIdFacet], {bucketIdResolver})
    .then((facets) => {
        console.log(facets)
        return facets;
    })
    .finally(process.exit);
