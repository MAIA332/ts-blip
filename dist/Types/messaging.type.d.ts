export type broadcast = {
    clients: client[];
    template_name: string;
    bot?: string;
    blockid?: string;
    components_mapping?: string;
    stateidentifier: string;
};
export type client = {
    id: string;
    name: string;
    credential: string;
    number: string;
    extras: Record<string, string>;
    component: any;
};
export type config = {
    ignore_onboarding?: boolean;
    retrieve_on_flow?: boolean;
};
