export type Json = string[] | string | number | boolean | null;

export type VideoIdeaStatus = "idee" | "skizze" | "produktion" | "fertig";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          created_at: string;
          updated_at: string;
          password_protected: boolean;
          password_hash: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
          password_protected?: boolean;
          password_hash?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
          password_protected?: boolean;
          password_hash?: string | null;
        };
      };
      pillars: {
        Row: {
          id: string;
          project_id: string;
          leitbild: string;
          annahmen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          leitbild: string;
          annahmen: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          leitbild?: string;
          annahmen?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ideas: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          summary: string;
          tags: string[];
          favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          summary: string;
          tags?: string[];
          favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
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
          project_id: string;
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
          project_id: string;
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
          project_id?: string;
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

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type PillarRow = Database["public"]["Tables"]["pillars"]["Row"];
export type IdeaRow = Database["public"]["Tables"]["ideas"]["Row"];
export type VideoIdeaRow = Database["public"]["Tables"]["video_ideas"]["Row"];
