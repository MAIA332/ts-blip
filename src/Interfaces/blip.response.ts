export default interface BlipResponse {
    type?: string;
    resource?: any;
    method?: string,
    status: string,
    id: string,
    from: string,
    to: string,
    metadata?: any
}