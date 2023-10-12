import dotenv from "dotenv"

dotenv.config({override: true});

const assertValue = (value: string | undefined, key: string): string => {
    if (!value) {
        throw Error(`"${key}" config key doesn't have a value.`);
    }

    return value;
}

export const config = {
    MONGODB_CLUSTER: assertValue(process.env.MONGODB_CLUSTER, 'MONGODB_CLUSTER'),
    MONGODB_USER: assertValue(process.env.MONGODB_USER, 'MONGODB_USER'),
    MONGODB_PASSWORD: assertValue(process.env.MONGODB_PASSWORD, 'MONGODB_PASSWORD'),
}
