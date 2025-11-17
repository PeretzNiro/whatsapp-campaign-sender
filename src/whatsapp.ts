import axios from "axios";
import { env } from "./env.js";

const api = axios.create({
  baseURL: `https://graph.facebook.com/v22.0/${env.PHONE_NUMBER_ID}`,
  timeout: 15000,
  headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` }
});

export async function sendTemplate(
  to: string,
  bodyText: string,
  templateName: string = "hello_world",
  languageCode: string = "en_US",
  componentsOverride?: any[]
) {
  const components = componentsOverride ?? [
    { type: "body", parameters: [{ type: "text", text: bodyText }] }
  ];

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: { name: templateName, language: { code: languageCode }, components }
  };

  const res = await api.post("/messages", payload);
  return res.data; // contains message id
}
