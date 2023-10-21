import {FacetResultUI} from "@/packages/sdk/ui/sdk-ui-facets";
import styles from './StringFacet.module.css'
import {BucketId} from "@/packages/sdk/mongodb/search-meta/search-meta.types";

export interface StringFacetProps {
    facetResult: FacetResultUI;
    selectedBucketIds: BucketId[];
    onChange: (bucketIds: BucketId[]) => void
}

export const StringFacet = ({facetResult, selectedBucketIds, onChange}: StringFacetProps) => {
    const handleCheck = (bucketId: BucketId, isChecked: boolean) => {
        let newSelectedBucketIds = [...selectedBucketIds];
        if (isChecked) {
            newSelectedBucketIds = [...newSelectedBucketIds, bucketId];
        } else {
            newSelectedBucketIds.splice(selectedBucketIds.indexOf(bucketId), 1);
        }

        onChange(newSelectedBucketIds);
    };

    return <div className={styles.rool}>
        <h4 className={styles.name}>{facetResult.facetDefinition.displayName}</h4>
        <ul className={styles.list}>
            {facetResult.facetResult.buckets.map((bucket, index) => {
                const bucketDoc = facetResult.bucketDocs.find((bucketDoc) => {
                    return bucketDoc["_id"] === bucket._id;
                });

                const checked = selectedBucketIds.includes(bucket._id);

                return <li key={index} className={styles.bucket}>
                    <label className={styles.bucketLabel}>
                        <div className={styles.checkboxWithName}>
                            <input checked={checked} onChange={(e) => {
                                handleCheck(bucket._id, e.target.checked);
                            }} type='checkbox' className={styles.checkbox}/>
                            <span className={styles.bucketName}>{bucketDoc ? bucketDoc.name : bucket._id}</span>
                        </div>
                        <span className={styles.count}>{bucket.count}</span>
                    </label>
                </li>
            })}
        </ul>
    </div>;
}
