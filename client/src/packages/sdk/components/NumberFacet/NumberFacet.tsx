import {FacetResultUI} from "@/packages/sdk/ui/sdk-ui-facets";

export interface StringFacetProps {
    facetResult: FacetResultUI;
}

export const NumberFacet = ({facetResult}: StringFacetProps) => {
    return <div>
        <ul>
            {facetResult.facetResult.buckets.map((bucket, index) => {
                return <li key={index}>
                    {bucket._id}
                </li>
            })}
        </ul>
    </div>;
}
