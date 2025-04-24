"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlipMessaging = exports.BlipContacts = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const network_1 = require("./utils/network");
class BlipAnalytics {
    constructor() {
        this.blipApiUrl = process.env.BLIP_URL;
        this.destinys = [{ to: "postmaster@analytics.msging.net" }, { to: "postmaster@wa.gw.msging.net" }, { to: "postmaster@scheduler.msging.net" }];
        dotenv_1.default.config();
    }
    createEvent(blipApiKey, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.post(`${this.blipApiUrl}/commands`, {
                id: (0, uuid_1.v4)(),
                to: this.destinys[0].to,
                method: "set",
                uri: "/event-track",
                type: "application/vnd.iris.eventTrack+json",
                resource: event,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: blipApiKey,
                },
            });
            return response.data;
        });
    }
    getEventCounters(category_1, startDate_1, endDate_1, blipApiKey_1) {
        return __awaiter(this, arguments, void 0, function* (category, startDate, endDate, blipApiKey, take = 500) {
            const response = yield axios_1.default.post(`${this.blipApiUrl}/commands`, {
                id: (0, uuid_1.v4)(),
                to: this.destinys[0].to,
                method: "get",
                uri: `/event-track/${category}?startDate=${startDate}&endDate=${endDate}&$take=${take}`,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: blipApiKey,
                },
            });
            return response.data.resource.items;
        });
    }
    getTrackingCategories(blipApiKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.post(`${this.blipApiUrl}/commands`, {
                id: (0, uuid_1.v4)(),
                to: this.destinys[0].to,
                method: "get",
                uri: "/event-track",
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: blipApiKey,
                },
            });
            return response.data.resource.items;
        });
    }
    getTemplateMessages(blipApiKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.post(`${this.blipApiUrl}/commands`, {
                id: (0, uuid_1.v4)(),
                to: this.destinys[1].to,
                method: "get",
                uri: "/message-templates",
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: blipApiKey,
                },
            });
            return response.data.resource.data;
        });
    }
}
class BlipContacts extends BlipAnalytics {
    constructor(networkModule = new network_1.Network(), blipApiKey) {
        dotenv_1.default.config();
        super();
        this.destinys = [];
        this.blipUrl = process.env.BLIP_URL;
        this.isInscented = false;
        this.accessGranted = false;
        this.destinys = [
            {
                to: "postmaster@crm.msging.net"
            },
            {
                to: "postmaster@msging.net"
            }
        ];
        this.instanceId = `${(0, uuid_1.v4)()}-${(0, moment_timezone_1.default)().format('YYYYMMDDHHmmss')}`;
        this.categoryTrack = "sdkuse.ts-blip";
        this.classIdentifier = "ts-blip.BlipContacts";
        this.networkModule = networkModule;
        this.blipApiKey = blipApiKey;
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                const original = Reflect.get(target, prop, receiver);
                const shouldWrap = typeof original === "function" &&
                    prop !== "constructor" &&
                    !prop.startsWith("_");
                if (!shouldWrap)
                    return original;
                return (...args) => {
                    // 🔒 Bloquear `init` se `isInitilized === false`
                    if (prop === "init" && target.isInscented === false) {
                        console.warn(`[BlipMessaging] method '${prop}' blocked, ininialize the class first`);
                        return;
                    }
                    // 🔐 Métodos bloqueados se `isInscented === false` (menos os que liberamos)
                    const alwaysAllowed = ["init"];
                    if (!target.isInscented && !alwaysAllowed.includes(prop)) {
                        console.warn(`[BlipMessaging] method '${prop}' blocked. Initialize the class first.`);
                        return;
                    }
                    // 🔐 Bloquear métodos sensíveis se `accessGranted === false`
                    const accessRequiredMethods = ["get_contact", "get_all_contacts", "get_context_variables", "create_context_variable", "set_master_state", "set_user_state", "get_user_state", "create_or_update_contact"];
                    if (!target.accessGranted && accessRequiredMethods.includes(prop)) {
                        console.warn(`[BlipMessaging] access denied to '${prop}', key is not granted`);
                        return;
                    }
                    return original.apply(target, args);
                };
            },
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isInscented = true;
            const initResponse = yield this.sendUseRegister(this.blipApiKey);
            if (initResponse[0].status == "success") {
                this.accessGranted = true;
            }
            else {
                this.accessGranted = false;
            }
        });
    }
    sendUseRegister(blipApiKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackobj = {
                category: this.categoryTrack,
                action: JSON.stringify({
                    class: this.classIdentifier,
                    method: "sendGrowthMessage",
                    datetime: (0, moment_timezone_1.default)().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'),
                    instance: this.instanceId,
                    network: this.networkModule.summary()
                })
            };
            try {
                const response = yield this.createEvent(blipApiKey, trackobj);
                if (response.status == "success") {
                    return [{ status: "success", message: "access granted" }];
                }
                else {
                    return [{ status: "failure", message: "access denied" }];
                }
            }
            catch (error) {
                return [{ status: "failure", message: error.message }];
            }
        });
    }
    get_contact(tunnel_originator) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[0].to,
                method: "get",
                uri: `/contacts/${tunnel_originator}`,
            };
            const response = yield axios_1.default.request({
                url: `${this.blipUrl}/commands`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
                data: data,
            });
            return response.data.resource;
        });
    }
    get_all_contacts() {
        return __awaiter(this, arguments, void 0, function* (skip = 0, take = 5000, filter) {
            const filter_ = filter ? `&$filter=${filter}` : "";
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[0].to,
                method: "get",
                uri: `/contacts?$skip=${skip}&$top=${take}${filter_}`,
            };
            const response = yield axios_1.default.request({
                url: `${this.blipUrl}/commands`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
                data: data,
            });
            return response.data.resource;
        });
    }
    get_context_variables(contact_identintity, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter_ = filter ? `/${filter}` : "";
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[1].to,
                method: "get",
                uri: `/contexts/${contact_identintity}${filter_}`,
            };
            const response = yield axios_1.default.request({
                url: `${this.blipUrl}/commands`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
                data: data,
            });
            return response.data;
        });
    }
    create_context_variable(contact_identity_1, variable_1, value_1) {
        return __awaiter(this, arguments, void 0, function* (contact_identity, variable, value, type_ = "text/plain") {
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[1].to,
                method: "set",
                uri: `/contexts/${contact_identity}/${variable}`,
                type: type_,
                resource: value,
            };
            const response = yield axios_1.default.post(`${this.blipUrl}/commands`, data, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
            });
            return response.data;
        });
    }
    set_master_state(contact_identity, state) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[1].to,
                method: "set",
                uri: `/contexts/${contact_identity}@wa.gw.msging.net/master-state`,
                type: "text/plain",
                resource: state,
            };
            const response = yield axios_1.default.post(`${this.blipUrl}/commands`, data, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
            });
            return response.data;
        });
    }
    set_user_state(contact_identity, state, identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[1].to,
                method: "set",
                uri: `/contexts/${contact_identity}@wa.gw.msging.net/stateid%40${identifier}`,
                type: "text/plain",
                resource: state,
            };
            const response = yield axios_1.default.post(`${this.blipUrl}/commands`, data, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
            });
            return response.data;
        });
    }
    get_user_state(contact_identity, identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[1].to,
                method: "get",
                uri: `/contexts/${contact_identity}/stateid%40${identifier}`,
            };
            const response = yield axios_1.default.post(`${this.blipUrl}/commands`, data, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
            });
            const response_ = {
                status: response.data.status,
                resource: response.data.resource ? response.data.resource : null
            };
            return response_;
        });
    }
    create_or_update_contact(name, contact_identity, extras) {
        return __awaiter(this, void 0, void 0, function* () {
            const phone = contact_identity.split("@")[0];
            const data = {
                id: (0, uuid_1.v4)(),
                to: this.destinys[0].to,
                method: "set",
                uri: `/contacts`,
                type: "application/vnd.lime.contact+json",
                resource: {
                    name,
                    phoneNumber: phone,
                    identity: contact_identity,
                    extras: extras,
                },
            };
            const response = yield axios_1.default.post(`${this.blipUrl}/commands`, data, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.blipApiKey,
                },
            });
            return response.data;
        });
    }
}
exports.BlipContacts = BlipContacts;
class BlipMessaging extends BlipAnalytics {
    constructor(networkModule = new network_1.Network(), blipApiKey, BlipContacts) {
        dotenv_1.default.config();
        super();
        this.isInscented = false;
        this.accessGranted = false;
        this.instanceId = `${(0, uuid_1.v4)()}-${(0, moment_timezone_1.default)().format('YYYYMMDDHHmmss')}`;
        this.categoryTrack = "sdkuse.ts-blip";
        this.classIdentifier = "ts-blip.BlipMessaging";
        this.BlipContacts = BlipContacts;
        this.networkModule = networkModule;
        this.blipApiKey = blipApiKey;
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                const original = Reflect.get(target, prop, receiver);
                const shouldWrap = typeof original === "function" &&
                    prop !== "constructor" &&
                    !prop.startsWith("_");
                if (!shouldWrap)
                    return original;
                return (...args) => {
                    // 🔒 Bloquear `init` se `isInitilized === false`
                    if (prop === "init" && target.isInscented === false) {
                        console.warn(`[BlipMessaging] method '${prop}' blocked, ininialize the class first`);
                        return;
                    }
                    // 🔐 Métodos bloqueados se `isInscented === false` (menos os que liberamos)
                    const alwaysAllowed = ["init"];
                    if (!target.isInscented && !alwaysAllowed.includes(prop)) {
                        console.warn(`[BlipMessaging] method '${prop}' blocked. Initialize the class first.`);
                        return;
                    }
                    // 🔐 Bloquear métodos sensíveis se `accessGranted === false`
                    const accessRequiredMethods = ["sendGrowthMessage", "sendScheduledMessage", "sendSingleMessage", "getTemplateMessages", "getTrackingCategories", "getEventCounters", "createEvent"];
                    if (!target.accessGranted && accessRequiredMethods.includes(prop)) {
                        console.warn(`[BlipMessaging] access denied to '${prop}', key is not granted`);
                        return;
                    }
                    return original.apply(target, args);
                };
            },
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isInscented = true;
            const initResponse = yield this.sendUseRegister(this.blipApiKey);
            if (initResponse[0].status == "success") {
                this.accessGranted = true;
            }
            else {
                this.accessGranted = false;
            }
        });
    }
    sendUseRegister(blipApiKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const trackobj = {
                category: this.categoryTrack,
                action: JSON.stringify({
                    class: this.classIdentifier,
                    method: "sendGrowthMessage",
                    datetime: (0, moment_timezone_1.default)().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'),
                    instance: this.instanceId,
                    network: this.networkModule.summary()
                })
            };
            try {
                const response = yield this.createEvent(blipApiKey, trackobj);
                if (response.status == "success") {
                    return [{ status: "success", message: "access granted" }];
                }
                else {
                    return [{ status: "failure", message: "access denied" }];
                }
            }
            catch (error) {
                return [{ status: "failure", message: error.message }];
            }
        });
    }
    sendGrowthMessage(broadcast, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { ignore_onboarding, retrieve_on_flow } = config ? config : { ignore_onboarding: false, retrieve_on_flow: false };
                const { template_name, stateidentifier, blockid, clients, bot, components_mapping } = broadcast;
                const templates = yield this.getTemplateMessages(this.blipApiKey);
                const selectedTemplate = templates.find((tpl) => tpl.name === template_name);
                if (!selectedTemplate) {
                    return [{ status: "failure", message: "Template not found" }];
                }
                const botstate = `${bot}@msging.net`;
                const successRates = [];
                if (!ignore_onboarding) {
                    const notOnboarded = yield Promise.all(clients.map((client) => __awaiter(this, void 0, void 0, function* () {
                        const contact_identity = `${client.number}@wa.gw.msging.net`;
                        const user_state = yield this.BlipContacts.get_user_state(contact_identity, stateidentifier);
                        if (user_state.resource !== "onboarding" && user_state.status !== "failure") {
                            return client;
                        }
                        return null; // Retorna null para que não seja considerado na filtragem
                    })));
                    // Filtra os resultados para remover os valores null
                    const notOnboardedClients = notOnboarded.filter(client => client !== null);
                    if (notOnboardedClients.length > 0) {
                        return [{ status: "warning", message: "You are trying to send a message to a client that is not onboarding", clients: notOnboardedClients }];
                    }
                }
                for (const client of clients) {
                    const contact_identity = `${client.number}@wa.gw.msging.net`;
                    const message = {
                        template: {
                            name: template_name,
                            language: {
                                code: "pt_BR",
                                policy: "deterministic",
                            },
                            components: client.component,
                        },
                    };
                    const contact = yield this.BlipContacts.get_contact(contact_identity);
                    let hasActiveSession = false;
                    const now = (0, moment_timezone_1.default)().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss');
                    if (contact) {
                        //.log("has contact",contact);
                        const lastMessageDate = contact.lastMessageDate;
                        //.log("lastMessageDate",lastMessageDate);
                        const lastMessage = (0, moment_timezone_1.default)(lastMessageDate).tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss');
                        //console.log("Last message",lastMessage);
                        const timeDiff = moment_timezone_1.default.duration((0, moment_timezone_1.default)(now).diff((0, moment_timezone_1.default)(lastMessage))).asHours();
                        //console.log("Time diff",timeDiff);
                        if (timeDiff < 24) {
                            hasActiveSession = true;
                        }
                    }
                    //console.log("hasActiveSession",hasActiveSession);
                    //return[{ status: "mock", message: "Mocking active session", clients: [client] }];
                    yield this.BlipContacts.create_or_update_contact(client.name, contact_identity, client.extras);
                    if (retrieve_on_flow) {
                        yield this.BlipContacts.set_master_state(contact_identity, botstate);
                        yield this.BlipContacts.set_user_state(contact_identity, blockid, stateidentifier);
                    }
                    let sendResult = false;
                    if (hasActiveSession) {
                        const formated_message = yield this.componentToBuilder(message, selectedTemplate);
                        //return [{ status: "mock", message: "Mocking active session", clients: [client] }];
                        sendResult = yield this.sendScheduledMessage(contact_identity, formated_message, "application/json", now, `Scheduled|[${client.name}]|SDK|${now}`);
                    }
                    else {
                        sendResult = yield this.sendSingleMessage(contact_identity, message);
                    }
                    successRates.push({
                        number: contact_identity,
                        name: client.name,
                        status: sendResult ? "success" : "failure",
                        hasActiveSession: hasActiveSession
                    });
                }
                const growthTrackobj = {
                    category: "sdkuse.ts-blip.sendGrowthMessage",
                    action: JSON.stringify({
                        class: this.classIdentifier,
                        instance: this.instanceId,
                        datetime: (0, moment_timezone_1.default)().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'),
                        successRates: successRates
                    })
                };
                yield this.createEvent(this.blipApiKey, growthTrackobj);
                return successRates;
            }
            catch (error) {
                return [{ status: "failure", message: "Error sending message", error: error.message }];
            }
        });
    }
    sendSingleMessage(to, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios_1.default.post(`${this.blipApiUrl}/messages`, {
                    id: (0, uuid_1.v4)(),
                    to: to,
                    type: "application/json",
                    content: Object.assign(Object.assign({}, message), { type: "template" }),
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: this.blipApiKey,
                    },
                });
                return true;
            }
            catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                return false;
            }
        });
    }
    sendScheduledMessage(to, message, type, when, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let name_ = name;
                if (!name_) {
                    name_ = `Scheduled message - ${when}`;
                }
                const res = yield axios_1.default.post(`${this.blipApiUrl}/commands`, {
                    id: (0, uuid_1.v4)(),
                    to: this.destinys[2].to,
                    method: "set",
                    uri: "/schedules",
                    type: "application/vnd.iris.schedule+json",
                    resource: {
                        message: {
                            id: (0, uuid_1.v4)(),
                            to: to,
                            type: type,
                            content: Object.assign({}, message),
                        }
                    },
                    when: when,
                    name: name_,
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: this.blipApiKey,
                    },
                });
                return res;
            }
            catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                return false;
            }
        });
    }
    mountMessageTemplate(telefone, nome_template, variaveis_body, imagem_url) {
        const components = [];
        if (imagem_url) {
            components.push({
                type: "header",
                parameters: [
                    {
                        type: "image",
                        image: {
                            link: imagem_url,
                        },
                    },
                ],
            });
        }
        const body_parameters = variaveis_body.map((text) => ({ type: "text", text }));
        components.push({
            type: "body",
            parameters: body_parameters,
        });
        return {
            id: (0, uuid_1.v4)(),
            to: `${telefone}@wa.gw.msging.net`,
            type: "application/json",
            content: {
                type: "template",
                template: {
                    name: nome_template,
                    language: {
                        code: "pt_BR",
                        policy: "deterministic",
                    },
                    components,
                },
            },
        };
    }
    componentToBuilder(component, template) {
        return __awaiter(this, void 0, void 0, function* () {
            /* console.log("component",component);
            console.log(template); */
            var _a, _b;
            const contact_source = "whatsapp";
            let mimeType = contact_source == "whatsapp" ? "application/json" : "application/vnd.lime.select+json";
            let text = ((_a = template.components.find((component) => component.type === "BODY")) === null || _a === void 0 ? void 0 : _a.text) || "";
            let bodyComponent = component.template.components.find((c) => c.type === "body");
            let parameters = (bodyComponent === null || bodyComponent === void 0 ? void 0 : bodyComponent.parameters) || [];
            let formated_text = this.replacePlaceholders(text, parameters);
            //console.log(formated_text);
            let footerText = ((_b = template.components.find((component) => component.type === "FOOTER")) === null || _b === void 0 ? void 0 : _b.text) || "";
            let hasButtons = template.components.find((component) => component.type === "BUTTONS");
            let opt = [];
            if (hasButtons) {
                opt = hasButtons.buttons.map((button) => {
                    return {
                        type: "reply",
                        reply: {
                            id: `ID 1.${hasButtons.buttons.indexOf(button) + 1}`,
                            title: button.text
                        }
                    };
                });
            }
            let listTemplate = {
                recipient_type: "individual",
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: formated_text
                    },
                    footer: {
                        text: footerText
                    }
                }
            };
            if (opt.length > 0) {
                listTemplate.interactive.action = {
                    buttons: opt
                };
            }
            return listTemplate;
        });
    }
    replacePlaceholders(templateText, data) {
        let i = 0;
        return templateText.replace(/\{\{.*?\}\}/g, () => {
            var _a;
            const param = data[i++];
            return (_a = param === null || param === void 0 ? void 0 : param.text) !== null && _a !== void 0 ? _a : "";
        });
    }
}
exports.BlipMessaging = BlipMessaging;
