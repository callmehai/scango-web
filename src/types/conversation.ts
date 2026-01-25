import { type Message } from './message'

export interface Conversation {
  _id: string
  title: string
  createdAt: string
  messages?: Message[]
}