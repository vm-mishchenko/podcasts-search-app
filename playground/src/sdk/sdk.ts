import {Document, Collection} from "mongodb";
import {
    Facets,
    Facet,
    SearchMetaStage,
    SearchMetaPipeline,
    Operator,
    SearchMetaStageResult,
    FacetsResults, FacetDefinition, FacetResult, BucketId, FacetName
} from "./pipeline";

export class FacetPipeline {
    readonly operator: Record<string, any>
    readonly facets: Facets

    constructor(operator: Operator, facets: Facets) {
        this.operator = operator;
        this.facets = facets;
    }

    getPipeline(): Document[] {
        const facet: Facet = {
            operator: this.operator,
            facets: this.facets,
        }

        const searchMetaStage: SearchMetaStage = {
            facet
        }

        const searchMetaPipeline: SearchMetaPipeline = {
            $searchMeta: searchMetaStage
        }

        return [searchMetaPipeline]
    }

    getFacetDefinition(facetName: FacetName): FacetDefinition {
        const facetDefinition = this.facets[facetName];

        if (!facetDefinition) {
            throw new Error(`Cannot find ${facetName} facet name in pipeline.`);
        }

        return facetDefinition;
    }
}

/** @deprecated */
export class FacetPipelineExecutor {
    collection: Collection

    constructor(collection: Collection) {
        this.collection = collection;
    }

    async execute(facetPipeline: FacetPipeline): Promise<SearchMetaStageResult> {
        const pipeline = facetPipeline.getPipeline();
        const response = (await this.collection.aggregate(pipeline).toArray())[0] as unknown as SearchMetaStageResult
        return response;
    }
}


// no selected id list as it doesn't make sense for client without UI
export interface FacetResultCombined {
    name: string;
    facetDefinition: FacetDefinition
    facetResult: FacetResult;
}


export class Search {
    private readonly collection: Collection;

    constructor(collection: Collection) {
        this.collection = collection;
    }

    async facets(facetPipeline: FacetPipeline): Promise<SearchMetaStageResult> {
        const pipeline = facetPipeline.getPipeline();
        const response = (await this.collection.aggregate(pipeline).toArray())[0] as unknown as SearchMetaStageResult
        return response;
    }
}
