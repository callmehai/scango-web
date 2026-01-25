export interface Message {
  _id?: string
  role: 'system' | 'user' | 'assistant'
  content: string
  createdAt: string
}
