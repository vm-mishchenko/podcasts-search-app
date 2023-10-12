import {MongoClient, Collection} from "mongodb";

// server sdk

enum FacetType {
    STRING = "string",
    NUMBER = "number"
}

interface StringFacetConfig {
    type: FacetType.STRING;
    fieldPath: string; // document fieldName.subFieldName
    numBuckets: number;
}

interface NumberFacetConfig {
    type: FacetType.NUMBER;
    fieldPath: string; // document fieldName.subFieldName
    boundaries: number[];
    default: string;
}

type FacetConfig = StringFacetConfig | NumberFacetConfig;

// request what kind of facet I want to get
interface FacetRequest {
    name: string; // random name
    config: FacetConfig
}

// request for my request
interface FacetResponse {
    name: string; // random name
    config: FacetConfig
}

class FacetPipeline {
    constructor(operator: Record<string, any>, facetRequests: FacetRequest[]) {
    }

    getPipeline(): Record<string, any> {
        return {};
    }
}

class FacetExecutor {
    constructor(collection: Collection, pipeline: FacetPipeline) {
    }

    async execute(): Promise<FacetResponse[]> {
        return Promise.resolve([]);
    }
}

// server client
const facetRequests: FacetRequest[] = [
    {
        name: "test",
        config: {
            type: FacetType.STRING,
            fieldPath: "foo",
            numBuckets: 4
        }
    }
];

const facetPipeline = new FacetPipeline({}, facetRequests);

const collection = {} as Collection;
const facets = new FacetExecutor(collection, facetPipeline);

facets.execute().then((facetResults) => {
})