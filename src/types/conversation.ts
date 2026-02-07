import { type Message } from './message'

export interface Conversation {
  _id: string
  title: string
  topic: string;
  rootLang: string;
  targetLang: string;
  createdAt: string
  messages?: Message[]
}