import { type Message } from "./message";

export interface Conversation {
  id: string;
  title: string;
  topic: string;
  rootLang: string;
  targetLang: string;
  hasImage: boolean;
  createdAt: string;
  updatedAt?: string;
  messages?: Message[];
}
