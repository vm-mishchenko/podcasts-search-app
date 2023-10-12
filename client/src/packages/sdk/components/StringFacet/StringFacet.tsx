import {FacetResultUI} from "@/packages/sdk/sdk-ui";

export interface StringFacetProps {
    facetResult: FacetResultUI;
}

export const StringFacet = ({facetResult}: StringFacetProps) => {
    return <div>
        <ul>
            {facetResult.facetResult.buckets.map((bucket) => {
                return <li>
                    {bucket._id}
                </li>
            })}
        </ul>
    </div>;
}
