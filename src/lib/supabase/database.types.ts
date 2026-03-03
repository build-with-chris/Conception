export type Json = string[] | string | number | boolean | null;

export type VideoIdeaStatus = "idee" | "skizze" | "produktion" | "fertig";

export interface Database {
  public: {
    Tables: {
      pillars: {
        Row: {
          id: string;
          leitbild: string;
          annahmen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          leitbild: string;
          annahmen: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          leitbild?: string;
          annahmen?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ideas: {
        Row: {
          id: string;
          title: string;
          summary: string;
          tags: string[];
          favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          tags?: string[];
          favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          summary?: string;
          tags?: string[];
          favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      video_ideas: {
        Row: {
          id: string;
          idea_id: string | null;
          title: string;
          note: string | null;
          status: VideoIdeaStatus;
          tags: string[];
          favorite: boolean;
          skizze_notes: string | null;
          skizze_todos: string[];
          skizze_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idea_id?: string | null;
          title: string;
          note?: string | null;
          status: VideoIdeaStatus;
          tags?: string[];
          favorite?: boolean;
          skizze_notes?: string | null;
          skizze_todos?: string[];
          skizze_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string | null;
          title?: string;
          note?: string | null;
          status?: VideoIdeaStatus;
          tags?: string[];
          favorite?: boolean;
          skizze_notes?: string | null;
          skizze_todos?: string[];
          skizze_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type PillarRow = Database["public"]["Tables"]["pillars"]["Row"];
export type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"];
export type VideoIdeaRow = Database["public"]["Tables"]["video_ideas"]["Row"];
