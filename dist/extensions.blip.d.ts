import { destinys, statusObject } from "./Types/general.type";
import BlipResponse from "./Interfaces/blip.response";
import { Contact, userState } from "./Types/contacts.types";
import { eventCounter, category, templateMessage, event } from "./Types/analytics.type";
import { broadcast, config } from "./Types/messaging.type";
import { Network } from "./utils/network";
declare class BlipAnalytics {
    protected blipApiUrl: string;
    protected destinys: destinys[];
    constructor(blipApiUrl: string);
    createEvent(blipApiKey: string, event: event): Promise<BlipResponse>;
    getEventCounters(category: string, startDate: string, endDate: string, blipApiKey: string, take?: number): Promise<eventCounter[]>;
    getTrackingCategories(blipApiKey: string): Promise<category[]>;
    getTemplateMessages(blipApiKey: string): Promise<templateMessage[]>;
}
export declare class BlipContacts extends BlipAnalytics {
    protected destinys: destinys[];
    private blipUrl;
    private instanceId;
    private categoryTrack;
    private classIdentifier;
    private networkModule;
    isInscented: boolean;
    private blipApiKey;
    accessGranted: boolean;
    constructor(networkModule: Network | undefined, blipApiKey: string, blipUrl: string);
    init(): Promise<void>;
    private sendUseRegister;
    get_contact(tunnel_originator: string): Promise<Contact>;
    get_all_contacts(skip?: number, take?: number, filter?: string): Promise<Contact[]>;
    get_context_variables(contact_identintity: string, filter?: string): Promise<BlipResponse>;
    create_context_variable(contact_identity: string, variable: string, value: string, type_?: string): Promise<BlipResponse>;
    set_master_state(contact_identity: string, state: string): Promise<BlipResponse>;
    set_user_state(contact_identity: string, state: string, identifier: string): Promise<BlipResponse>;
    get_user_state(contact_identity: string, identifier: string): Promise<userState>;
    create_or_update_contact(name: string, contact_identity: string, extras: Record<string, string>): Promise<BlipResponse>;
}
export declare class BlipMessaging extends BlipAnalytics {
    private BlipContacts;
    private instanceId;
    private categoryTrack;
    private classIdentifier;
    private networkModule;
    private blipApiKey;
    private isInscented;
    private accessGranted;
    protected blipApiUrl: string;
    accessStatus: statusObject;
    constructor(networkModule: Network | undefined, blipApiKey: string, BlipContacts: BlipContacts, blipApiUrl: string);
    init(): Promise<void>;
    private sendUseRegister;
    sendGrowthMessage(broadcast: broadcast, config?: config): Promise<any[]>;
    private sendSingleMessage;
    private sendScheduledMessage;
    private mountMessageTemplate;
    private componentToBuilder;
    private replacePlaceholders;
    private mergeExtras;
    getAccessStatus(): statusObject;
}
export {};
