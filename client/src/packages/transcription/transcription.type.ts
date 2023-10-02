export interface Chunk {
    text: string;
    start: string;
    end: string;
}

export interface Transcription extends Array<Chunk> {
}
