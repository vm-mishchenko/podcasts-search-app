import {Filter, FilterType} from "@/packages/filters/filters.type";
import {RangeOperator} from "@/packages/sdk/mongodb/search/range.operator";
import {getNDaysAgo} from "@/packages/utils/time";

export interface PublishedAtFilter extends Filter {
    type: FilterType.PUBLISHED_AT
    name: 'publishedAt'
    value: PUBLISHED_AT_OPTIONS
}

export enum PUBLISHED_AT_OPTIONS {
    ANY_TIME = 'ANY_TIME',
    PAST_WEEK = 'PAST_WEEK',
    PAST_MONTH = 'PAST_MONTH',
    PAST_6_MONTH = 'PAST_6_MONTH',
    PAST_YEAR = 'PAST_YEAR'
}

/**
 * Map the filter config that server received from that client to the search operator.
 */
export const mapToSearchOperator = (filter: PublishedAtFilter): RangeOperator => {
    let gtNumberOfDays: number;
    switch (filter.value) {
        case PUBLISHED_AT_OPTIONS.ANY_TIME:
            gtNumberOfDays = 1000000;
            break;
        case PUBLISHED_AT_OPTIONS.PAST_WEEK:
            gtNumberOfDays = 7;
            break;
        case PUBLISHED_AT_OPTIONS.PAST_MONTH:
            gtNumberOfDays = 30;
            break;
        case PUBLISHED_AT_OPTIONS.PAST_6_MONTH:
            gtNumberOfDays = 30 * 6;
            break;
        case PUBLISHED_AT_OPTIONS.PAST_YEAR:
            gtNumberOfDays = 365;
            break;
        default:
            throw new Error(`Unsupported PublishedAt filter value: "${filter.value}"`);
    }

    return new RangeOperator('published_at', {
        gte: getNDaysAgo(gtNumberOfDays)
    });
}
