import {Search} from "../sdk";
import {FacetName, Operator, Facets} from "../mongodb/search-meta/search-meta.types";
import {
    FacetDefinitionUI,
    SearchFacetOptions,
    SearchFacetUIResult,
    FacetResultUI,
    defaultBucketIdResolver
} from "./sdk-ui-facets";
import {FacetPipeline} from "../mongodb/search-meta/search-meta";

export class SearchUI {
    private readonly search: Search;

    constructor(search: Search) {
        this.search = search;
    }

    static getFacetPipeline(operator: Operator, facetDefinitionUIList: FacetDefinitionUI[]) {
        const facets = SearchUI.getFacets(facetDefinitionUIList);
        return new FacetPipeline(operator, facets);
    }

    static getFacets(facetDefinitionUIList: FacetDefinitionUI[]) {
        const facets: Facets = {};
        facetDefinitionUIList.forEach((facetDefinitionUI) => {
            const {name, displayName, ...facetDefinition} = facetDefinitionUI;
            if (name in facets) {
                throw new Error(`All facet definition must have unique name, found duplicate: ${facetDefinitionUI.name}`);
            }

            facets[name] = facetDefinition;
        });

        return facets;
    }

    async facets(operator: Operator, facetDefinitionUIList: FacetDefinitionUI[], options: SearchFacetOptions = {}): Promise<SearchFacetUIResult> {
        // Fetch facets
        const facetPipeline = SearchUI.getFacetPipeline(operator, facetDefinitionUIList);
        const searchMetaStageResult = await this.search.facets(facetPipeline);

        // Map MongoDB facets to UI facets
        const facetNames: FacetName[] = Object.keys(searchMetaStageResult.facet);

        const facets: FacetResultUI[] = [];
        for (const facetName of facetNames) {
            // get MongoDB facet result
            const facetResult = searchMetaStageResult.facet[facetName];

            // get facet definition UI
            const facetDefinition = facetDefinitionUIList.find((facetDefinitionUI) => facetDefinitionUI.name === facetName);
            if (!facetDefinition) {
                throw new Error(`Mongot did not returned requested facet with name: ${facetName}.`);
            }

            // get selected bucket ids
            const selectedFacet = options.selectedFacets ? options.selectedFacets.find((selectedFacet) => selectedFacet.name === facetName) : undefined;
            const selectedBuketIds = selectedFacet ? selectedFacet.bucketIds : [];

            // resolve bucket ids to custom documents
            const resolver = options.bucketIdResolver || defaultBucketIdResolver;
            const bucketDocs = await resolver(facetResult, facetDefinition);

            // build FacetUI
            const facetUI: FacetResultUI = {
                facetResult,
                facetDefinition,
                selectedBuketIds,
                bucketDocs
            }

            facets.push(facetUI);
        }

        return {facets};
    }
}
