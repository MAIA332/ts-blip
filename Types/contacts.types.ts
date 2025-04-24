export type Contact = {
    name: string;
    lastMessageDate: Date;
    lastUpdateDate: Date;
    identity: string;
    extras: object;
    source: string;
}

export type userState = {
    status: string;
    resource: string;
}