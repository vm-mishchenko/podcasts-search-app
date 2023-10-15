import {Document} from "mongodb";
import {
    Facets,
    Operator,
    SearchMetaStage,
    SearchMetaPipeline,
    FacetName,
    FacetDefinition,
    Facet
} from "./search-meta.types";

export class FacetPipeline {
    readonly operator: Record<string, any>
    readonly facets: Facets

    constructor(operator: Operator, facets: Facets) {
        this.operator = operator;
        this.facets = facets;
    }

    getPipeline(): Document[] {
        const {index, ...operator} = this.operator;
        const facet: Facet = {
            operator,
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

