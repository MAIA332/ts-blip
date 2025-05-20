import { BlipContacts, BlipMessaging } from "./src/extensions.blip";
import dotenv from "dotenv";
import { broadcast } from "./src/Types/messaging.type";
import { v4 as uuidv4 } from "uuid";
import { Network } from "./src/utils/network";

dotenv.config();

const routerKey = process.env.ROUTER_KEY! 
const network = new Network();
const blipUrl = process.env.BLIP_URL!;


const myBroad: broadcast = {
    clients: [{
        "id": uuidv4(),
        "name": "Lucas",
        "credential":"480.119.258-06",
        "extras":{},
        "number": "551151977528",
        "component": [
            {
            "type":"body",
                "parameters":[
                    { type: 'text', text: 'Lucas' },
                    { type: 'text', text: 'Banda Larga' },
                    { type: 'text', text: '(11) 4210-0123' }
                ]
            }
        ],
    }],
    template_name:"alertas_atualizacoes_conta",
    //bot:"testprincipal", apenas caso você defina retrieve_on_flow como true, o bot é o bot que vai receber a mensagem e o bloco que vai ser enviado para o cliente
    //blockid:"79610af8-12d5-4942-8ff0-792c90ca08e3", apenas caso você defina retrieve_on_flow como true, o bot é o bot que vai receber a mensagem e o bloco que vai ser enviado para o cliente
    stateidentifier:"7404cf6c-45b6-4739-8c40-350bf880cefb"
}

async function makeBlipService() {
    
    const blipContacts = new BlipContacts(network,routerKey,blipUrl);
    await blipContacts.init();
    //======================================================
    const blip = new BlipMessaging(network,routerKey,blipContacts,blipUrl);
    await blip.init();
    return blip;
}

/* const messagingresult = async () => {
    return await blip.sendGrowthMessage(myBroad); //{ignore_onboarding: false,retrieve_on_flow: false}
};

// Forma correta de chamar e exibir:
messagingresult().then(result => {
    console.log("Resultado:", result);
}).catch(err => {
    console.error("Erro ao buscar contato:", err);
}); */

makeBlipService()
  .then(async (result) => {  // Use async within the callback function
    console.log("Resultado:", result.getAccessStatus());
    console.log("Resultado:", await result.sendGrowthMessage(myBroad,{ignore_onboarding: true,retrieve_on_flow: false,force_active: false}));  // Await the async call
  })
  .catch(err => {
    console.error("Erro ao buscar contato:", err);
  });
