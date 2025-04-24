export type eventCounter = {
    storageDate: Date,
    category: string,
    action: string,
    count: number
}

export type category = {
    category: string
}

export type templateMessage = {
    id: string,
    category: string,
    components: Array<object>,
    language: string,
    last_updated_time: Date,
    name: string,
    rejected_reason: string,
    status: string
}