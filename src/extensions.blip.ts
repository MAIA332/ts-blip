import { destinys, statusObject } from "./Types/general.type";
import BlipResponse  from "./Interfaces/blip.response";
import { Contact,userState } from "./Types/contacts.types";
import dotenv from "dotenv";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { eventCounter,category,templateMessage,event } from "./Types/analytics.type";
import { broadcast,config, schedulerStatus } from "./Types/messaging.type";
import moment from 'moment-timezone';
import { Network } from "./utils/network";


class BlipAnalytics {
  protected blipApiUrl: string;
  protected destinys: destinys[] = [{ to: "postmaster@analytics.msging.net" }, { to: "postmaster@wa.gw.msging.net" }, { to: "postmaster@scheduler.msging.net" }];
  
  constructor(blipApiUrl:string) {
    this.blipApiUrl = blipApiUrl;
  }
  
  async createEvent(blipApiKey: string, event: event): Promise<BlipResponse> {
    
    const resource = {
      category: event.category,
      action: JSON.stringify(event.action),
    }
    

    const response = await axios.post(
      `${this.blipApiUrl}/commands`,
      {
        id: uuidv4(),
        to: "postmaster@analytics.msging.net",
        method: "set",
        uri: "/event-track",
        type: "application/vnd.iris.eventTrack+json",
        resource: resource,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: blipApiKey,
        },
      }
    );

    return response.data;
  }
  
  async getEventCounters(category: string, startDate: string, endDate: string, blipApiKey: string, take:number = 500): Promise<eventCounter[]> {
      const response = await axios.post(
      `${this.blipApiUrl}/commands`,
      {
          id: uuidv4(),
          to: this.destinys[0].to,
          method: "get",
          uri: `/event-track/${category}?startDate=${startDate}&endDate=${endDate}&$take=${take}`,
      },
      {
          headers: {
              "Content-Type": "application/json",
              Authorization: blipApiKey,
          },
      }
      );

      return response.data.resource.items;
  }

  async getTrackingCategories(blipApiKey: string): Promise<category[]> {
      const response = await axios.post(
      `${this.blipApiUrl}/commands`,
      {
          id: uuidv4(),
          to: this.destinys[0].to,
          method: "get",
          uri: "/event-track",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: blipApiKey,
        },
      }
    );
      return response.data.resource.items;
  }

  async getTemplateMessages(blipApiKey: string):Promise<templateMessage[]> {
    const response = await axios.post(
      `${this.blipApiUrl}/commands`,
      {
        id: uuidv4(),
        to: this.destinys[1].to,
        method: "get",
        uri: "/message-templates",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: blipApiKey,
        },
      }
    );
    return response.data.resource.data;
  }

  async get_scheduled_message(blipApiKey: string, messageID: string):Promise<schedulerStatus> {
    let response = await axios.post(
      `${this.blipApiUrl}/commands`,
      {
        id: uuidv4(),
        to: this.destinys[2].to,
        method: "get",
        uri: `/schedules/${messageID}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: blipApiKey,
        },
      }
    );

    return response.data
  }
}
export class BlipContacts extends BlipAnalytics{
  protected destinys: destinys[] = [];
  private blipUrl: string;
  private instanceId: string;
  private categoryTrack: string;
  private classIdentifier: string;
  private networkModule: Network;
  public isInscented: boolean = false
  private blipApiKey: string;
  public accessGranted: boolean = false;


  constructor(networkModule: Network = new Network(),blipApiKey: string,blipUrl: string){
      dotenv.config();
      super(blipUrl);

      this.destinys = [
          {
              to: "postmaster@crm.msging.net"
          },
          {
              to: "postmaster@msging.net"
          }
      ]

      this.instanceId =`${uuidv4()}-${moment().format('YYYYMMDDHHmmss')}`
      this.categoryTrack = "sdkuse.ts-blip";
      this.classIdentifier = "ts-blip.BlipContacts";
      this.networkModule = networkModule
      this.blipApiKey = blipApiKey
      this.blipUrl = blipUrl

      return new Proxy(this, {
        get: (target, prop: string, receiver) => {
          const original = Reflect.get(target, prop, receiver);
      
          const shouldWrap =
            typeof original === "function" &&
            prop !== "constructor" &&
            !prop.startsWith("_");
      
          if (!shouldWrap) return original;
      
          return (...args: any[]) => {
      
            // 🔐 Métodos bloqueados se `isInscented === false` (menos os que liberamos)
            const alwaysAllowed = ["init"];
            if (!target.isInscented && !alwaysAllowed.includes(prop)) {
              console.warn(`[BlipContacts] method '${prop}' blocked. Initialize the class first.`);
              return;
            }
      
            // 🔐 Bloquear métodos sensíveis se `accessGranted === false`
            const accessRequiredMethods = ["get_contact","get_all_contacts","get_context_variables","create_context_variable","set_master_state","set_user_state","get_user_state","create_or_update_contact"];
            if (!target.accessGranted && accessRequiredMethods.includes(prop)) {
              console.warn(`[BlipContacts] access denied to '${prop}', key is not granted`);
              return;
            }
      
            return original.apply(target, args);
          };
        },
      });
              
  }

  
  public async init(){
    /**
   * Initializes the BlipMessaging class, sending a use register request to the
   * server. If the response status is "success", sets `accessGranted` to true,
   * otherwise sets it to false.
   * @returns nothing
   */
  
    this.isInscented = true
    
    const initResponse = await this.sendUseRegister(this.blipApiKey);
    
    if(initResponse[0].status == "success"){
      this.accessGranted = true
    }
    else{
      this.accessGranted = false
    }
  }

  
  private async sendUseRegister(blipApiKey: string) {
    /**
   * Envia um evento de uso da classe para o servidor,
   * solicitando acesso   API do BLiP.
   * @param blipApiKey - Chave de acesso API do BLiP.
   * @returns Uma promessa com o resultado da opera o. Caso a chave seja
   * v lida, retorna um array com um objeto no formato { status: "success", message: "access granted" }.
   * Caso contr rio, retorna um array com um objeto no formato { status: "failure", message: "access denied" }.
   */
    
    const trackobj: event = {
      category:this.categoryTrack,
      action: JSON.stringify({
        class: this.classIdentifier,
        method: "sendGrowthMessage",
        datetime:moment().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'),
        instance: this.instanceId,
        network: this.networkModule.summary()
      })
    }

    try {

      const response = await this.createEvent(blipApiKey, trackobj);
      
      if( response.status == "success"){
        return [{ status: "success", message: "access granted" }];
      }
      else{
        return [{ status: "failure", message: "access denied" }];
      }
      
    } catch (error:any) {
        return [{ status: "failure", message: error.message }];
    }
  }

 
  async get_contact(tunnel_originator: string): Promise<Contact>{
     /**
   * Returns a contact by its tunnel originator.
   * @param tunnel_originator - the tunnel originator of the contact to be retrieved.
   * @returns a promise with the contact object.
   */
      const data = {
          id: uuidv4(),
          to: this.destinys[0].to,
          method: "get",
          uri: `/contacts/${tunnel_originator}`,
        };
      
        const response = await axios.request({
          url: `${this.blipUrl}/commands`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.blipApiKey,
          },
          data: data,
        });
      
      return response.data.resource;
  }

 
  async get_all_contacts(skip:number = 0,take:number = 5000,filter?:string): Promise<Contact[]>{
      /**
     * Returns a list of contacts.
     * @param skip - the number of records to skip. Defaults to 0.
     * @param take - the number of records to take. Defaults to 5000.
     * @param filter - the filter to be applied to the contacts. Defaults to an empty string.
     * @returns a promise with the list of contacts.
     */
      const filter_ = filter?`&$filter=${filter}`:"";
      
      const data = {
          id: uuidv4(),
          to: this.destinys[0].to,
          method: "get",
          uri: `/contacts?$skip=${skip}&$top=${take}${filter_}`,
        };
      
        const response = await axios.request({
          url: `${this.blipUrl}/commands`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.blipApiKey,
          },
          data: data,
        });
      
      return response.data.resource;
  }

  async get_context_variables(contact_identintity: string,filter?:string): Promise<BlipResponse>{
    /**
   * Retrieves context variables for a given contact identity.
   * @param contact_identintity - The identity of the contact for which to retrieve context variables.
   * @param filter - An optional filter to narrow down the context variables. Defaults to an empty string.
   * @returns A promise that resolves to a BlipResponse containing the context variables.
   */
      const filter_ = filter?`/${filter}`:"";

      const data = {
          id: uuidv4(),
          to: this.destinys[1].to,
          method: "get",
          uri: `/contexts/${contact_identintity}${filter_}`,
        };
      
      const response = await axios.request({
          url: `${this.blipUrl}/commands`,
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: this.blipApiKey,
          },
          data: data,
      });
      
      return response.data;
  }
  
  async create_context_variable(contact_identity: string, variable: string, value: string, type_ = "text/plain"): Promise<BlipResponse> {
    /**
   * Creates a context variable for a given contact identity.
   * @param contact_identity - The identity of the contact for which to create the context variable.
   * @param variable - The name of the context variable to be created.
   * @param value - The value of the context variable to be created.
   * @param type_ - The type of the context variable to be created. Defaults to "text/plain".
   * @returns A promise that resolves to a BlipResponse containing the created context variable.
   */
    const data = {
      id: uuidv4(),
      to: this.destinys[1].to,
      method: "set",
      uri: `/contexts/${contact_identity}/${variable}`,
      type: type_,
      resource: value,
    };

    const response = await axios.post(`${this.blipUrl}/commands`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.blipApiKey,
      },
    });

    return response.data;
  }
  
    
  async set_master_state(contact_identity: string, state: string): Promise<BlipResponse> {
    
    /**
     * Sets the master state for a given contact identity.
     * @param contact_identity - The identity of the contact for which to set the master state.
     * @param state - The state value to be set.
     * @returns A promise that resolves to a BlipResponse containing the result of the operation.
     */
    const data = {
        id: uuidv4(),
        to: this.destinys[1].to,
        method: "set",
        uri: `/contexts/${contact_identity}@wa.gw.msging.net/master-state`,
        type: "text/plain",
        resource: state,
    };

    const response = await axios.post(`${this.blipUrl}/commands`, data, {
        headers: {
        "Content-Type": "application/json",
        Authorization: this.blipApiKey,
        },
    });

    return response.data;
  }
  

  async set_user_state(contact_identity: string, state: string, identifier: string): Promise<BlipResponse> {
    /**
     * Sets a user state for a given contact identity and identifier.
     * @param contact_identity - The identity of the contact for which to set the user state.
     * @param state - The state value to be set.
     * @param identifier - The identifier of the user state to be set.
     * @returns A promise that resolves to a BlipResponse containing the result of the operation.
    */
  
    const data = {
      id: uuidv4(),
      to: this.destinys[1].to,
      method: "set",
      uri: `/contexts/${contact_identity}@wa.gw.msging.net/stateid%40${identifier}`,
      type: "text/plain",
      resource: state,
    };

    const response = await axios.post(`${this.blipUrl}/commands`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.blipApiKey,
      },
    });

    return response.data;
  }


  async get_user_state(contact_identity: string, identifier: string): Promise<userState> {
    /**
   * Retrieves the user state for a given contact identity and identifier.
   * @param contact_identity - The identity of the contact for which to retrieve the user state.
   * @param identifier - The identifier of the user state to be retrieved.
   * @returns A promise that resolves to a userState object containing the status and resource of the user state.
   */
    const data = {
      id: uuidv4(),
      to: this.destinys[1].to,
      method: "get",
      uri: `/contexts/${contact_identity}/stateid%40${identifier}`,
    };

    const response = await axios.post(`${this.blipUrl}/commands`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.blipApiKey,
      },
    });

    const response_ = {
        status: response.data.status,
        resource: response.data.resource? response.data.resource : null
    }

    return response_;
  }


  async create_or_update_contact(name: string, contact_identity: string, extras: Record<string, string>): Promise<BlipResponse> {
    /**
   * Creates or updates a contact with the given name, contact identity, and extras.
   * 
   * @param name - The name of the contact.
   * @param contact_identity - The unique identity of the contact, typically in the format of an email or phone number.
   * @param extras - Additional information to be stored with the contact as key-value pairs.
   * @returns A promise that resolves to a BlipResponse containing the result of the operation.
   */
    const phone = contact_identity.split("@")[0];

    const data = {
      id: uuidv4(),
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

    const response = await axios.post(`${this.blipUrl}/commands`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: this.blipApiKey,
      },
    });

    return response.data;
  }
}

export class BlipMessaging extends BlipAnalytics {
  
  private BlipContacts: BlipContacts;
  private instanceId: string;
  private categoryTrack: string;
  private classIdentifier: string;
  private networkModule: Network;
  private blipApiKey: string;
  private isInscented: boolean = false
  private accessGranted: boolean = false;
  protected blipApiUrl: string;
  public accessStatus: statusObject = {
    isInstancied: this.isInscented,
    accessGranted: this.accessGranted,
  };
  constructor(networkModule: Network = new Network() ,blipApiKey: string,BlipContacts: BlipContacts,blipApiUrl: string){
    dotenv.config();
    super(blipApiUrl);
    
    this.instanceId =`${uuidv4()}-${moment().format('YYYYMMDDHHmmss')}`
    this.categoryTrack = "sdkuse.ts-blip";
    this.classIdentifier = "ts-blip.BlipMessaging";
    this.BlipContacts = BlipContacts
    this.networkModule = networkModule;
    this.blipApiKey = blipApiKey
    this.blipApiUrl = blipApiUrl

    return new Proxy(this, {
      get: (target, prop: string, receiver) => {
        const original = Reflect.get(target, prop, receiver);
    
        const shouldWrap =
          typeof original === "function" &&
          prop !== "constructor" &&
          !prop.startsWith("_");
    
        if (!shouldWrap) return original;
    
        return (...args: any[]) => {
    
          // 🔐 Métodos bloqueados se `isInscented === false` (menos os que liberamos)
          const alwaysAllowed = ["init"];
          if (!target.isInscented && !alwaysAllowed.includes(prop)) {
            console.warn(`[BlipMessaging] method '${prop}' blocked. Initialize the class first.`);
            throw new Error(`[BlipMessaging] method '${prop}' blocked. Initialize the class first.`);
          }
    
          // 🔐 Bloquear métodos sensíveis se `accessGranted === false`
          const accessRequiredMethods = ["sendGrowthMessage", "sendScheduledMessage","sendSingleMessage","getTemplateMessages","getTrackingCategories","getEventCounters","createEvent"];
          if (!target.accessGranted && accessRequiredMethods.includes(prop)) {
            console.warn(`[BlipMessaging] access denied to '${prop}', key is not granted`);
            throw new Error(`[BlipMessaging] access denied to '${prop}', key is not granted`);
          }
    
          return original.apply(target, args);
        };
      },
    });
  }

  
  public async init(){
    /**
     * Initializes the class and enables the use of other methods.
     *
     * This method is responsible for sending a "use register" event to the Blip platform,
     * which is a special type of event that is used to keep track of Blip SDK usage.
     *
     * If the event is sent successfully, the `accessGranted` property is set to `true`.
     * Otherwise, it is set to `false`.
     *
     * @returns {Promise<void>}
     */
    
    this.isInscented = true
    const initResponse = await this.sendUseRegister(this.blipApiKey);
    //console.log("[BlipMessaging][init] sendUseRegister response:", initResponse);
    if(initResponse[0].status == "success"){
      this.accessGranted = true
    }
    else{
      this.accessGranted = false
      return {"status": "failure", "message": "access denied"};
    }

    this.accessStatus = {
      isInstancied: this.isInscented,
      accessGranted: this.accessGranted,
    };
  }

  
  private async sendUseRegister(blipApiKey: string) {
  /**
   * Realiza um registro de uso da classe BlipMessaging.
   * Essa chamada   necess ria para que a classe possa acessar os
   * recursos protegidos da API do BLiP.
   * @param blipApiKey - Chave de acesso API do BLiP.
   * @returns Uma promessa com o resultado da opera o. Caso a chave seja
   * v lida, retorna um array com um objeto no formato { status: "success", message: "access granted" }.
   * Caso contr rio, retorna um array com um objeto no formato { status: "failure", message: "access denied" }.
   */
    
    const trackobj: event = {
      category:this.categoryTrack,
      action: JSON.stringify({
        class: this.classIdentifier,
        method: "sendGrowthMessage",
        datetime:moment().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'),
        instance: this.instanceId,
        network: this.networkModule.summary()
      })
    }

    try {

      const response = await this.createEvent(blipApiKey, trackobj);
      //console.log("[BlipMessaging][sendUseRegister] createEvent response:", response);
      if( response.status == "success"){
        return [{ status: "success", message: "access granted" }];
      }
      else{
        return [{ status: "failure", message: "access denied" }];
      }
      
    } catch (error:any) {
      console.error("[BlipMessaging][sendUseRegister] Error:", error.message);
      return [{ status: "failure", message: error.message }];
    }
  }
  public async sendGrowthMessage(broadcast: broadcast,config?:config): Promise<any[]> {
    /**
     * Envia uma mensagem personalizada para um contato, com base em uma template e parametros informados.
     * @param broadcast - Objeto com as informações da mensagem a ser enviada.
     * @param config - Configurações adicionais para o envio da mensagem.
     * @returns Promise com o resultado da operação. Um array com os status de cada mensagem enviada.
     * @example
     * const broadcast = {
     *  template_name: "template_name",
     *  stateidentifier: "stateidentifier",
     *  blockid: "blockid",
     *  clients: [
     *      {
     *          number: "+551199999999",
     *          name: "John Doe",
     *          component: {
     *              type: "text",
     *              text: "Ol , como voc  est ?"
     *          }
     *      }
     *  ],
     *  bot: "bot@msging.net"
     * }
     * 
     * const config = {
     *  ignore_onboarding: false,
     *  retrieve_on_flow: false
     * }
     * 
     * const result = await blipMessaging.sendGrowthMessage(broadcast, config);
     * 
     * console.log(result);
     * // Output: [{ status: "success", number: "+551199999999", name: "John Doe" }]
     */
      try {  
          const { ignore_onboarding, retrieve_on_flow,force_active } = config ? config : {ignore_onboarding: false,retrieve_on_flow: false,force_active: false};
          const { template_name, stateidentifier, blockid, clients, bot, components_mapping } = broadcast;
  
          const templates = await this.getTemplateMessages(this.blipApiKey);
          const selectedTemplate = templates.find((tpl: any) => tpl.name === template_name);
      
          if (!selectedTemplate) {
              return [{ status: "failure", message: "Template not found" }];
          }
      
          const botstate = `${bot}@msging.net`;
          const successRates: any[] = [];

          if (!ignore_onboarding) {
              const notOnboarded = await Promise.all(clients.map(async (client) => {
              
                  const contact_identity = `${client.number}@wa.gw.msging.net`;
                  const user_state = await this.BlipContacts.get_user_state(contact_identity, stateidentifier);
                  
                  if (user_state.resource !== "onboarding" && user_state.status !== "failure") {
                      return client;
                  }
                  return null; // Retorna null para que não seja considerado na filtragem

              }));
          
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
      
              const contact = await this.BlipContacts.get_contact(contact_identity);
              let hasActiveSession = false;
                const now = moment().tz('America/Sao_Paulo').subtract(3, 'hours').format('YYYY-MM-DDTHH:mm:ss');

              if(contact){
                  //.log("has contact",contact);
                  
                  const lastMessageDate = contact.lastMessageDate;
                  
                  //.log("lastMessageDate",lastMessageDate);
                  
                  const lastMessage = moment(lastMessageDate).tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss');
                  
                  //console.log("Last message",lastMessage);
                  
                  const timeDiff = moment.duration(moment(now).diff(moment(lastMessage))).asHours();
                  
                  //console.log("Time diff",timeDiff);
                  
                  if (timeDiff < 24) {
                      hasActiveSession = true;
                  }
              }
              
              //Une os extras atuais do cliente com os novos extras se o contato já existir
              let concatenatedExtras = {};
              if(contact){
                  concatenatedExtras = this.mergeExtras(contact.extras, client.extras);
              }
              else{
                  concatenatedExtras = { ...client.extras };
              }

              await this.BlipContacts.create_or_update_contact(client.name, contact_identity,concatenatedExtras);
              
              if(retrieve_on_flow){

                if(!blockid || !bot){
                    return [{ status: "failure", message: "Blockid and bot are required to retrieve client off the flow" }];
                }
                  
                  await this.BlipContacts.set_master_state(contact_identity, botstate);
                  await this.BlipContacts.set_user_state(contact_identity, blockid, stateidentifier);
              }

              let sendResult = false;
              let successFlag = false;
              if (hasActiveSession && !force_active) {
                  
                  
                  const formated_message = await this.componentToBuilder(message,selectedTemplate);

                  //console.log("[BLiP][Agendamento] message:");
                  
                  //console.dir(formated_message,{depth: null});
                  
                  
                  sendResult = await this.sendScheduledMessage(contact_identity, formated_message,"application/json",now,`Scheduled|[${client.name}]|SDK|${now}`);
                  if (sendResult) {
                      successFlag = true;
                  }

              }
              else{ 
                  //console.log("[BLiP][Agendamento] message:");
                  //console.dir(message,{depth: null});
                  sendResult = await this.sendSingleMessage(contact_identity, message);
                  if (sendResult) {
                      successFlag = true;
                  }
              }
              successRates.push({
                  number: contact_identity,
                  name: client.name,
                  status: successFlag ? "success" : "failure",
                  hasActiveSession: hasActiveSession
              });
          }

          const growthTrackobj: event = {
            category:"sdkuse.ts-blip.sendGrowthMessage",
            action: JSON.stringify({
              class: this.classIdentifier,
              instance: this.instanceId,
              datetime:moment().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'),
              successRates: successRates
            })
          }

          await this.createEvent(this.blipApiKey, growthTrackobj);
          
          return successRates;
      }
      catch (error:any) {
          return [{ status: "failure", message: "Error sending message", error: error.message }];
      }
  }

  private async sendSingleMessage(to: string, message: any): Promise<boolean> {
    /**
     * Sends a single message to a specified recipient using the BLiP API.
     * 
     * This method constructs a message with the provided content and 
     * sends it to the specified recipient via the BLiP API. The message 
     * is sent as a JSON object with the type "template".
     * 
     * @param to - The recipient's identity in the BLiP network.
     * @param message - The content of the message to be sent. This is an 
     * object that will be merged with the default template type.
     * @returns A promise that resolves to a boolean indicating the success 
     * of the operation. Returns true if the message was sent successfully, 
     * otherwise returns false.
     */
    
    try {
      await axios.post(
        `${this.blipApiUrl}/messages`,
        {
          id: uuidv4(),
          to: to,
          type: "application/json",
          content: {
            ...message,
            type: "template",
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.blipApiKey,
          },
        }
      );
      return true;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return false;
    }
  }

  private async sendScheduledMessage(to: string, message: any, type: string, when: string, name?: string): Promise<any> {
    /**
     * Sends a scheduled message to a specified recipient using the BLiP API.
     * Corrigido para garantir que o objeto message esteja no formato correto para o BLiP.
     */
    try {
      let name_ = name;
      if (!name_) {
        name_ = `Scheduled message - ${when}`;
      }

      const messageID = uuidv4();
      //console.log("[BLiP][Agendamento] messageID:", messageID);
      // Garante o formato correto do campo 'when'
      const whenUtc = moment(when).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

      // Corrige o formato do objeto message para o BLiP Scheduler
      let blipMessage;
      if (message.type === "text/plain") {
        blipMessage = {
          id: messageID,
          to: to,
          type: "text/plain",
          content: message.content
        };
      } else {
        blipMessage = {
          id: messageID,
          to: to,
          type: "application/json",
          content: { ...message }
        };
      }
      //console.log("[BLiP][Agendamento] Payload final enviado ao Scheduler:");
      //console.dir(blipMessage, { depth: null });

      const res = await axios.post(
        `${this.blipApiUrl}/commands`,
        {
          id: uuidv4(),
          to: "postmaster@scheduler.msging.net",
          method: "set",
          uri: "/schedules",
          type: "application/vnd.iris.schedule+json",
          resource: {
            message: blipMessage,
            when: whenUtc,
            name: name_,
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.blipApiKey,
          },
        }
      );

      // Check if message was scheduled successfully
      let schedulerStatus = await this.get_scheduled_message(this.blipApiKey, messageID);
      
      //console.log("[BLiP][Agendamento] response:", res.data);
      //console.log("[BLiP][Agendamento] schedulerStatus:", schedulerStatus);
      
      if (schedulerStatus.resource.status != "executed") {
        return false;
      }

      return res;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return false;
    }
  }

  public mountMessageTemplate(
    customers: any[],
    components: any[],
    templateName: string,
    stateidentifier: string,
  ): broadcast {
    /**
     * Monta um objeto broadcast a partir de uma lista de clientes, componentes e nome do template.
     * @param customers - Array de clientes, cada um com contacts, id, name, credential, phone, component_map, etc.
     * @param components - Array de componentes do template (ex: body, header, etc).
     * @param templateName - Nome do template a ser utilizado.
     * @returns Objeto broadcast pronto para envio.
     */
    const contacts: any[] = customers.map((customer) => customer.contacts).flat();

    const broadcast: broadcast = {
      clients: contacts.map((customer) => {
        return {
          id: customer.id,
          name: customer.name,
          credential: customer.credential,
          extras: {},
          number: customer.phone,
          component: components.map((component) => {
            return {
              type: component.type,
              parameters: component.example.body_text!.flatMap((parameterBlock: string[]) =>
                parameterBlock.map((parameter: string) => {
                  let type = "text";
                  if (/^\d+$/.test(parameter)) {
                    type = "number";
                  }
                  // Busca o valor correto do parâmetro no customer usando o mapeamento
                  const mappedKey = customer.component_map[parameterBlock.indexOf(parameter)];
                  return {
                    type: type,
                    text: customer[mappedKey]
                  };
                })
              )
            };
          })
        };
      }),
      template_name: templateName,
      stateidentifier: stateidentifier
    };
    return broadcast;
  }

  private async componentToBuilder(component: any,template:any): Promise<any> {
      /**
       * Converte um componente de mensagem para o formato esperado pelo BLiP.
       * 
       * @param component - O componente a ser convertido.
       * @param template - O template a ser utilizado.
       * @returns Um objeto representando o componente formatado para envio.
       */

      const contact_source = "whatsapp"
      let mimeType = contact_source == "whatsapp" ? "application/json" : "application/vnd.lime.select+json"
      
      let text = template.components.find((component: any) => component.type === "BODY")?.text || "";


      let bodyComponent = component.template.components.find((c: any) => c.type === "body");
      let parameters = bodyComponent?.parameters || [];
      

      let formated_text = this.replacePlaceholders(text,parameters)

      //console.log(formated_text);
      
      let footerText = template.components.find((component: any) => component.type === "FOOTER")?.text || "";
      
      let hasButtons = template.components.find((component: any) => component.type === "BUTTONS");
      
      // Corrige o formato do objeto interativo para o padrão do WhatsApp Cloud API
      let buttons = [];
      if (hasButtons) {
          buttons = hasButtons.buttons.map((button: any, idx: number) => ({
              type: "reply",
              reply: {
                  id: `ID 1.${idx + 1}`,
                  title: button.text
              }
          }));
      }

      // Se não houver botões, retorna mensagem de texto simples no formato aceito pelo Scheduler
      if (!hasButtons || buttons.length === 0) {
        const simpleText = {
          type: "text/plain",
          content: formated_text
        };
        //console.log("[BLiP][componentToBuilder] Payload texto simples para Scheduler:");
        //console.dir(simpleText, { depth: null });
        return simpleText;
      }

      // Mensagem interativa (com botões e possivelmente footer)
      const interactiveMsg = {
        recipient_type: "individual",
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: formated_text },
          ...(footerText ? { footer: { text: footerText } } : {}),
          action: { buttons }
        }
      };
      //console.log("[BLiP][componentToBuilder] Payload interativo para Scheduler:");
      //console.dir(interactiveMsg, { depth: null });
      return interactiveMsg;
  }

  private replacePlaceholders(templateText: string, data: any[]): string {
      /**
       * Substitui os placeholders em um texto de template pelos valores fornecidos.
       * 
       * @param templateText - O texto do template com placeholders.
       * @param data - Os dados a serem inseridos nos placeholders.
       * @returns O texto do template com os placeholders substituídos pelos valores correspondentes.
       */
      let i = 0;
      return templateText.replace(/\{\{.*?\}\}/g, () => {
          const param = data[i++];
          return param?.text ?? "";
      });
  }
    
  private mergeExtras(existing: any, newData: any): any {
      /**
       * Mescla dois objetos de extras, preservando os dados existentes e adicionando novos.
       * 
       * @param existing - O objeto de extras existente.
       * @param newData - O novo objeto de extras a ser mesclado.
       * @returns O objeto resultante da mesclagem dos dois objetos de extras.
       */
      return { ...existing, ...newData };
  }

  public getAccessStatus(): statusObject {
    /**
     * Retorna o status de acesso da classe BlipMessaging.
     * 
     * @returns Um objeto contendo o status de acesso da classe.
     */
    return this.accessStatus;
  }
}