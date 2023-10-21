import {StringFacetUI, SelectedFacet, NumberFacetUI} from "@/packages/sdk/ui/sdk-ui-facets";
import {QueryStringOperator} from "@/packages/sdk/mongodb/search/queryString.operator";
import {SearchOperator} from "@/packages/sdk/mongodb/search/search.types";
import {RangeOperator, RangeValues} from "@/packages/sdk/mongodb/search/range.operator";

export const mapNumberFacetToSearchOperator = (facetDefinition: NumberFacetUI, selectedFacet: SelectedFacet): SearchOperator[] => {
    const searchOperators = selectedFacet.bucketIds.map((pBucketId) => {
        const bucketId = parseInt(pBucketId);
        const bucketIndex = facetDefinition.boundaries.indexOf(bucketId);
        const isLastBucketId = bucketIndex === facetDefinition.boundaries.length - 1;

        const range: RangeValues = {
            gte: bucketId
        };

        if (!isLastBucketId) {
            range.lt = facetDefinition.boundaries[bucketIndex + 1];
        }

        return new RangeOperator(facetDefinition.path, range);
    });
    return searchOperators;
}
