import { destinys } from "./Types/general.type";
import { BlipResponse } from "./Interfaces/blip.response";
import { Contact,userState } from "./Types/contacts.types";
import dotenv from "dotenv";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { eventCounter,category,templateMessage,event } from "./Types/analytics.type";
import { broadcast,config } from "./Types/messaging.type";
import moment from 'moment-timezone';
import { Network } from "./utils/network";


class BlipAnalytics {
  protected blipApiUrl: string =  process.env.BLIP_URL!;
  protected destinys: destinys[] = [{ to: "postmaster@analytics.msging.net" }, { to: "postmaster@wa.gw.msging.net" }, { to: "postmaster@scheduler.msging.net" }];
  
  constructor() {
    dotenv.config();
  }
  
  async createEvent(blipApiKey: string, event: event): Promise<BlipResponse> {
      const response = await axios.post(
        `${this.blipApiUrl}/commands`,
        {
          id: uuidv4(),
          to: this.destinys[0].to,
          method: "set",
          uri: "/event-track",
          type: "application/vnd.iris.eventTrack+json",
          resource: event,
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
  }
export class BlipContacts extends BlipAnalytics{
      protected destinys: destinys[] = [];
      private blipUrl: string =  process.env.BLIP_URL!;
      private instanceId: string;
      private categoryTrack: string;
      private classIdentifier: string;
      private networkModule: Network;
      private isInscented: boolean = false
  
      constructor(networkModule: Network = new Network()){
          dotenv.config();
          super();
  
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
  
          return new Proxy(this, {
            get: (target, prop: string, receiver) => {
              const original = Reflect.get(target, prop, receiver);
        
              if (
                typeof original === "function" &&
                prop !== "init" &&
                prop !== "constructor" &&
                !prop.startsWith("_")
              ) {
                return (...args: any[]) => {
                  if (!target.isInscented) {
                    console.warn(`[BlipContacts] Método '${prop}' bloqueado, inicialize a classe antes`);
                    return;
                  }
                  return original.apply(target, args);
                };
              }
        
              return original;
            }
          });
                  
      }
  
      public async init(blipApiKey: string){
        await this.sendUseRegister(blipApiKey);
        this.isInscented = true
      }
  
      private async sendUseRegister(blipApiKey: string) {
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
  
        await this.createEvent(blipApiKey, trackobj);
      }
  
      async get_contact(tunnel_originator: string,blip_api_key: string): Promise<Contact>{
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
                Authorization: blip_api_key,
              },
              data: data,
            });
          
          return response.data.resource;
      }
  
      async get_all_contacts(blip_api_key: string,skip:number = 0,take:number = 5000,filter?:string): Promise<Contact[]>{
          
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
                Authorization: blip_api_key,
              },
              data: data,
            });
          
          return response.data.resource;
      }
  
      async get_context_variables(blip_api_key: string,contact_identintity: string,filter?:string): Promise<BlipResponse>{
          
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
                  Authorization: blip_api_key,
              },
              data: data,
          });
          
          return response.data;
      }
      async create_context_variable(blip_api_key: string, contact_identity: string, variable: string, value: string, type_ = "text/plain"): Promise<BlipResponse> {
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
              Authorization: blip_api_key,
            },
          });
      
          return response.data;
        }
      
      async set_master_state(blip_api_key: string, contact_identity: string, state: string): Promise<BlipResponse> {
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
              Authorization: blip_api_key,
              },
          });
  
          return response.data;
      }
      
      async set_user_state(blip_api_key: string, contact_identity: string, state: string, identifier: string): Promise<BlipResponse> {
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
              Authorization: blip_api_key,
            },
          });
      
          return response.data;
      }
      
      async get_user_state(blip_api_key: string, contact_identity: string, identifier: string): Promise<userState> {
          const data = {
            id: uuidv4(),
            to: this.destinys[1].to,
            method: "get",
            uri: `/contexts/${contact_identity}/stateid%40${identifier}`,
          };
      
          const response = await axios.post(`${this.blipUrl}/commands`, data, {
            headers: {
              "Content-Type": "application/json",
              Authorization: blip_api_key,
            },
          });
  
          const response_ = {
              status: response.data.status,
              resource: response.data.resource? response.data.resource : null
          }
      
          return response_;
      }
      
      async create_or_update_contact(name: string, contact_identity: string, blip_api_key: string, extras: Record<string, string>): Promise<BlipResponse> {
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
              Authorization: blip_api_key,
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
    
    constructor(networkModule: Network = new Network() ,blipApiKey: string,BlipContacts: BlipContacts){
      dotenv.config();
      super();
      
      this.instanceId =`${uuidv4()}-${moment().format('YYYYMMDDHHmmss')}`
      this.categoryTrack = "sdkuse.ts-blip";
      this.classIdentifier = "ts-blip.BlipMessaging";
      this.BlipContacts = BlipContacts
      this.networkModule = networkModule;
      this.blipApiKey = blipApiKey

      return new Proxy(this, {
        get: (target, prop: string, receiver) => {
          const original = Reflect.get(target, prop, receiver);
    
          if (
            typeof original === "function" &&
            prop !== "init" &&
            prop !== "constructor" &&
            !prop.startsWith("_")
          ) {
            return (...args: any[]) => {
              if (!target.isInscented) {
                console.warn(`[BlipMessaging] Método '${prop}' bloqueado, inicialize a classe antes`);
                return;
              }
              return original.apply(target, args);
            };
          }
    
          return original;
        }
      });
    }

    public async init(){
      
      this.isInscented = true
      await this.sendUseRegister(this.blipApiKey);
    }

    private async sendUseRegister(blipApiKey: string) {
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

      await this.createEvent(blipApiKey, trackobj);
    }
  
    public async sendGrowthMessage(broadcast: broadcast,config?:config): Promise<any[]> {
        try {  
            const { ignore_onboarding, retrieve_on_flow } = config ? config : {ignore_onboarding: false,retrieve_on_flow: false};
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
                    const user_state = await this.BlipContacts.get_user_state(this.blipApiKey, contact_identity, stateidentifier);
                    
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
        
                const contact = await this.BlipContacts.get_contact(contact_identity,this.blipApiKey);
                let hasActiveSession = false;
                const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss');

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

                //console.log("hasActiveSession",hasActiveSession);

                //return[{ status: "mock", message: "Mocking active session", clients: [client] }];
                
                
                await this.BlipContacts.create_or_update_contact(client.name, contact_identity, this.blipApiKey, client.extras);
                
                if(retrieve_on_flow){
                    
                    await this.BlipContacts.set_master_state(this.blipApiKey, contact_identity, botstate);
                    await this.BlipContacts.set_user_state(this.blipApiKey, contact_identity, blockid, stateidentifier);
                }

                let sendResult = false;
                if (hasActiveSession) {
                    
                    
                    const formated_message = await this.componentToBuilder(message,selectedTemplate);
                    
                    //return [{ status: "mock", message: "Mocking active session", clients: [client] }];
                    
                    sendResult = await this.sendScheduledMessage(contact_identity, formated_message,"application/json",now,`Scheduled|[${client.name}]|SDK|${now}`);
                }
                else{
                    sendResult = await this.sendSingleMessage(contact_identity, message);

                }
                successRates.push({
                    number: contact_identity,
                    name: client.name,
                    status: sendResult ? "success" : "failure",
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

    async sendScheduledMessage(to: string, message: any,type: string,when: string,name?: string): Promise<any> {
        try{

            let name_ = name
            if(!name_){
                name_ = `Scheduled message - ${when}`
            }

            const res = await axios.post(
                `${this.blipApiUrl}/commands`,
                {
                    id: uuidv4(),
                    to: this.destinys[2].to,
                    method: "set",
                    uri: "/schedules",
                    type: "application/vnd.iris.schedule+json",
                    resource: { 
                        message:{ 
                            id: uuidv4(),
                            to: to,
                            type: type,
                            content: {
                                ...message,
                            },
                        }
                    },
                    when: when,
                    name: name_,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: this.blipApiKey,
                    },
                }
            );

            return res
        }
        catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            return false;
        }
    }
  
    private mountMessageTemplate(
      telefone: string,
      nome_template: string,
      variaveis_body: string[],
      imagem_url?: string
    ): any {
      const components: any[] = [];
  
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
        id: uuidv4(),
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

    private async componentToBuilder(component: any,template:any): Promise<any> {
        /* console.log("component",component);
        console.log(template); */

        const contact_source = "whatsapp"
        let mimeType = contact_source == "whatsapp" ? "application/json" : "application/vnd.lime.select+json"
        
        let text = template.components.find((component: any) => component.type === "BODY")?.text || "";


        let bodyComponent = component.template.components.find((c: any) => c.type === "body");
        let parameters = bodyComponent?.parameters || [];
        

        let formated_text = this.replacePlaceholders(text,parameters)

        //console.log(formated_text);
        
        let footerText = template.components.find((component: any) => component.type === "FOOTER")?.text || "";
        
        let hasButtons = template.components.find((component: any) => component.type === "BUTTONS");
        let opt = []

        if (hasButtons) {
            opt = hasButtons.buttons.map((button: any) => {
                return {
                    type: "reply",
                    reply: {
                        id: `ID 1.${hasButtons.buttons.indexOf(button) + 1}`,
                        title: button.text
                    }
                }
            });
        }

        let listTemplate: any = {
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
        
        
        return listTemplate
    
    }

    private replacePlaceholders(templateText: string, data: any[]): string {
        let i = 0;
        return templateText.replace(/\{\{.*?\}\}/g, () => {
            const param = data[i++];
            return param?.text ?? "";
        });
    }
    
    
}