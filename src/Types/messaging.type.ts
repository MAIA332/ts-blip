export type broadcast = {
    clients: client[],
    template_name:string,
    bot?:string, //testeprincipal
    blockid?: string, // id do bloco de destino 79610af8-12d5-4942-8ff0-792c90ca08e3
    components_mapping?:string,
    stateidentifier: string //identificador do fluxo, ex: principal: PDR_IDENTIFIER = "7404cf6c-45b6-4739-8c40-350bf880cefb"
}

export type client = {
    id: string,
    name: string,
    credential?: string,
    number:string, //5511930769312
    extras:Record<string, string>,
    component:any
}

export type Component = {
    type: string,
    text?: string,
    example: {
        [key: string]: string[][] | string[]
    }
}

export type config = {
    ignore_onboarding?: boolean
    retrieve_on_flow?: boolean
}