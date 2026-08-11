export interface Profile {
  id: string;
  display_name: string;
  role: 'admin' | 'patient' | 'contact';
}

export interface Conversation {
  id: string;
  created_at: string;
  // Join properties when fetching list
  participants?: Profile[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  pending?: boolean; // Front-end flag for offline messages
}
