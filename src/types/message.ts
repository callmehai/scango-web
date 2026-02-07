export interface Message {
  _id?: string
  role: 'system' | 'user' | 'assistant' | 'image'
  content?: string;
  image?: {
    mimeType: string;
    buffer: string;
  }
  createdAt: string
}
