/**
 * Filter types and implementations used by both client and server.
 */

/**
 * Type can be specific list PUBLISHED_AT or general like NUMBER.
 */
export enum FilterType {
    PUBLISHED_AT = 'PUBLISHED_AT'
}

/**
 * This is equivalent in runtime to :
 * type FilterTypeKeys = 'PUBLISHED_AT' | 'NUMBER'
 */
export const filterTypeKeys = Object.keys(FilterType);

export interface Filter {
    // Type helps API cast data to a particular interface.
    type: FilterType;
    // Name allows to distinguish multiple instances of the same filter type.
    // E.g. I can have 2 NUMBER filters - one for "totalViews" another for "likes".
    name: string;
}
