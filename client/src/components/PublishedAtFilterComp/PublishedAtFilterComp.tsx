import {PUBLISHED_AT_OPTIONS} from "@/packages/filters/published-at.filter";

import styles from './PublishedAtFilterComp.module.css';

export interface PublishedAtFilterProps {
    value: PUBLISHED_AT_OPTIONS;
    onChange: (selectedFilterValue: PUBLISHED_AT_OPTIONS) => void
}

export const PublishedAtFilterComp = ({value, onChange}: PublishedAtFilterProps) => {
    return <label>
        <span className={styles.label}>Published at</span>
        <select value={value} onChange={(e) => {
            onChange(e.target.value as PUBLISHED_AT_OPTIONS);
        }} className={styles.select}>
            <option value={PUBLISHED_AT_OPTIONS.ANY_TIME}>Any time</option>
            <option value={PUBLISHED_AT_OPTIONS.PAST_WEEK}>Past week</option>
            <option value={PUBLISHED_AT_OPTIONS.PAST_MONTH}>Past month</option>
            <option value={PUBLISHED_AT_OPTIONS.PAST_6_MONTH}>Past 6 month</option>
            <option value={PUBLISHED_AT_OPTIONS.PAST_YEAR}>Past year</option>
        </select>
    </label>;
}
