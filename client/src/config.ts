const assertValue = (value: string | undefined, key: string): string => {
    if (!value) {
        console.error(`"${key}" config key doesn't have a value.`)
    }

    return value!;
}

export const config = {
    MONGODB_USER: assertValue(process.env.MONGODB_USER, 'MONGODB_USER'),
    MONGODB_PASSWORD: assertValue(process.env.MONGODB_PASSWORD, "MONGODB_PASSWORD"),
    MONGODB_CLUSTER: assertValue(process.env.MONGODB_CLUSTER, "MONGODB_CLUSTER"),
};
