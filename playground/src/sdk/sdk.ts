import {Collection} from "mongodb";
import {SearchMetaStageResult} from "./mongodb/search-meta/search-meta.types";
import {SearchPipeline} from "./mongodb/search/search.types";
import {FacetPipeline} from "./mongodb/search-meta/search-meta";
import {Document} from "mongodb";

export class Search {
    private readonly collection: Collection;

    constructor(collection: Collection) {
        this.collection = collection;
    }

    async search(searchPipeline: SearchPipeline): Promise<Document[]> {
        const pipeline = searchPipeline.getPipeline();
        const response = await this.collection.aggregate(pipeline).toArray();
        return response;
    }

    async facets(facetPipeline: FacetPipeline): Promise<SearchMetaStageResult> {
        const pipeline = facetPipeline.getPipeline();
        const response = (await this.collection.aggregate(pipeline).toArray())[0] as unknown as SearchMetaStageResult
        return response;
    }
}
