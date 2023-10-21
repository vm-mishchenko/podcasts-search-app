import {StringFacetUI, SelectedFacet} from "@/packages/sdk/ui/sdk-ui-facets";
import {QueryStringOperator} from "@/packages/sdk/mongodb/search/queryString.operator";

export const mapStringFacetToSearchOperator = (facetDefinition: StringFacetUI, selectedFacet: SelectedFacet) => {
    const query = selectedFacet.bucketIds.join(' OR ');
    return new QueryStringOperator(facetDefinition.path, query);
}
