# ts-blip SDK

O `ts-blip` é um SDK TypeScript para integração com a plataforma BLiP, focado em envio de mensagens (imediatas e agendadas), gestão de contatos e rastreamento de eventos, com suporte especial ao canal WhatsApp Cloud API.

## Instalação

```bash
npm install @nmultifibra/ts-blip
```

## Configuração

Crie um arquivo `.env` com as variáveis necessárias:

```
ROUTER_KEY="Key ..."
BLIP_URL="https://<seu-endpoint>.http.msging.net"
```

## Principais Classes e Métodos

### BlipContacts
Gerencia contatos, variáveis de contexto e estados de usuário.

```ts
import { BlipContacts } from '@nmultifibra/ts-blip';
const contacts = new BlipContacts(network, process.env.ROUTER_KEY, process.env.BLIP_URL);
await contacts.init();
```

### BlipMessaging
Envia mensagens (imediatas e agendadas), templates, rastreia eventos e integra com o Scheduler.

```ts
import { BlipMessaging } from '@nmultifibra/ts-blip';
const messaging = new BlipMessaging(network, process.env.ROUTER_KEY, contacts, process.env.BLIP_URL);
await messaging.init();
```

## Envio de Mensagens

### Mensagem Imediata (WhatsApp Cloud API)

```ts
const result = await messaging.sendGrowthMessage(myBroad,{ignore_onboarding: true,retrieve_on_flow: false,force_active: false});
```

### Parâmetros de condicionamento

- **ignore_onboarding** : boolean (true or false)
    - Decide se os clientes que não estão em onboarding serão ignorados
- **retrieve_on_flow**: boolean (true or false)
    - Decide se o cliente será retirado ou não do flow, se for true deverá ser passado o bot e o bloco para onde ele irá
- **force_active**: boolean (true or false)
    - Decide se deverá forçar o envio de disparo ativo mesmo se o contato tiver sessão ativa

### Mensagem Agendada (Scheduler)

O método `sendGrowthMessage` tenta agendar a mensagem se o contato possui sessão ativa (<24h). Caso o canal não suporte agendamento (ex: WhatsApp Cloud API), o SDK pode realizar fallback automático para envio imediato.

#### Exemplo de Broadcast

```ts
const broadcast = {
  clients: [
    {
      id: 'uuid',
      name: 'Cliente',
      number: '551199999999',
      extras: {},
      component: [
        { type: 'body', parameters: [ { type: 'text', text: 'Lucas' } ] }
      ]
    }
  ],
  template_name: 'nome_template',
  stateidentifier: 'id_fluxo'
};
```

## Montagem de Template

Use `mountMessageTemplate` para gerar o objeto broadcast a partir de arrays de clientes e componentes:

```ts
const broadcast = messaging.mountMessageTemplate(clientes, componentes, 'nome_template', 'id_fluxo');
```

## Observações Importantes

- **Logs**: O SDK gera logs detalhados para payloads, autenticação e troubleshooting.
- **Templates**: Certifique-se de que o template está aprovado no BLiP e que os parâmetros estejam corretos.


## Exemplos de Uso Completo

Veja `main.sample.ts` para um fluxo completo de envio:

```ts
import { BlipContacts, BlipMessaging } from '@nmultifibra/ts-blip';
// ...configuração de network, keys, etc
const contacts = new BlipContacts(network, routerKey, blipUrl);
await contacts.init();
const messaging = new BlipMessaging(network, routerKey, contacts, blipUrl);
await messaging.init();
const result = await messaging.sendGrowthMessage(broadcast, { ignore_onboarding: true });
```

## Troubleshooting

- Verifique os logs para detalhes de payloads e autenticação.
- Certifique-se de que as variáveis de ambiente estão corretas.
- Para canais que não suportam agendamento, utilize sempre o envio imediato.

## Referências
- [Documentação BLiP](https://help.blip.ai/)
- [Exemplo de uso no main.sample.ts](./main.sample.ts)

---

Contribuições e sugestões são bem-vindas!