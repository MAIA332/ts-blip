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
    credential?: string;
    number: string;
    extras: Record<string, string>;
    component: any;
};
export type Component = {
    type: string;
    text?: string;
    example: {
        [key: string]: string[][] | string[];
    };
};
export type config = {
    ignore_onboarding?: boolean;
    retrieve_on_flow?: boolean;
    force_active?: boolean;
};
export type schedulerStatus = {
    type: "application/vnd.iris.schedule+json";
    resource: {
        name: string;
        when: string;
        message: {
            type: string;
            content: any;
            id: string;
            to: string;
        };
        status: string;
    };
    method: string;
    status: string;
    id: string;
    from: string;
    to: string;
    metadata: {
        traceparent: string;
        "#command.uri": string;
        "#metrics.custom.label": string;
        [key: string]: any;
    };
};
