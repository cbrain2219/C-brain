export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicEnums = Database["public"]["Enums"];
type PublicTables = Database["public"]["Tables"];

export type TableRow<TableName extends keyof PublicTables> =
  PublicTables[TableName]["Row"];
export type TableInsert<TableName extends keyof PublicTables> =
  PublicTables[TableName]["Insert"];
export type TableUpdate<TableName extends keyof PublicTables> =
  PublicTables[TableName]["Update"];

export type PublishStatus = PublicEnums["publish_status"];
export type ContentMode = PublicEnums["content_mode"];
export type InquiryStatus = PublicEnums["inquiry_status"];
export type PostKind = PublicEnums["post_kind"];
export type ProductStatus = PublicEnums["product_status"];
export type ReviewKind = PublicEnums["review_kind"];
export type UserRole = PublicEnums["user_role"];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
          role: UserRole;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          content: string;
          content_mode: ContentMode;
          created_at: string;
          excerpt: string | null;
          id: string;
          is_banner_enabled: boolean;
          is_featured_enabled: boolean;
          is_landing_enabled: boolean;
          is_pinned: boolean;
          kind: PostKind;
          published_at: string | null;
          seo: Json | null;
          seo_description: string | null;
          slug: string;
          sort_order: number;
          status: PublishStatus;
          thumbnail_alt: string | null;
          thumbnail_path: string | null;
          title: string;
          type: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          content: string;
          content_mode?: ContentMode;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          is_banner_enabled?: boolean;
          is_featured_enabled?: boolean;
          is_landing_enabled?: boolean;
          is_pinned?: boolean;
          kind?: PostKind;
          published_at?: string | null;
          seo?: Json | null;
          seo_description?: string | null;
          slug: string;
          sort_order?: number;
          status?: PublishStatus;
          thumbnail_alt?: string | null;
          thumbnail_path?: string | null;
          title: string;
          type: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          content?: string;
          content_mode?: ContentMode;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          is_banner_enabled?: boolean;
          is_featured_enabled?: boolean;
          is_landing_enabled?: boolean;
          is_pinned?: boolean;
          kind?: PostKind;
          published_at?: string | null;
          seo?: Json | null;
          seo_description?: string | null;
          slug?: string;
          sort_order?: number;
          status?: PublishStatus;
          thumbnail_alt?: string | null;
          thumbnail_path?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [];
      };
      portfolio_items: {
        Row: {
          client_name: string | null;
          content: string;
          content_mode: ContentMode;
          created_at: string;
          id: string;
          image_path: string | null;
          images: Json;
          is_landing_enabled: boolean;
          is_pinned: boolean;
          published_at: string | null;
          seo: Json | null;
          seo_description: string | null;
          slug: string;
          sort_order: number;
          status: PublishStatus;
          summary: string | null;
          title: string;
          type: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          client_name?: string | null;
          content: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          images?: Json;
          is_landing_enabled?: boolean;
          is_pinned?: boolean;
          published_at?: string | null;
          seo?: Json | null;
          seo_description?: string | null;
          slug: string;
          sort_order?: number;
          status?: PublishStatus;
          summary?: string | null;
          title: string;
          type: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          client_name?: string | null;
          content?: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          images?: Json;
          is_landing_enabled?: boolean;
          is_pinned?: boolean;
          published_at?: string | null;
          seo?: Json | null;
          seo_description?: string | null;
          slug?: string;
          sort_order?: number;
          status?: PublishStatus;
          summary?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          company: string;
          content: string;
          content_mode: ContentMode;
          created_at: string;
          id: string;
          is_landing_enabled: boolean;
          kind: ReviewKind;
          manager: string | null;
          published_at: string | null;
          seo_description: string | null;
          slug: string | null;
          sort_order: number;
          status: PublishStatus;
          title: string | null;
          updated_at: string;
          video_alt: string | null;
          video_path: string | null;
          view_count: number;
        };
        Insert: {
          company: string;
          content: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          is_landing_enabled?: boolean;
          kind: ReviewKind;
          manager?: string | null;
          published_at?: string | null;
          seo_description?: string | null;
          slug?: string | null;
          sort_order?: number;
          status?: PublishStatus;
          title?: string | null;
          updated_at?: string;
          video_alt?: string | null;
          video_path?: string | null;
          view_count?: number;
        };
        Update: {
          company?: string;
          content?: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          is_landing_enabled?: boolean;
          kind?: ReviewKind;
          manager?: string | null;
          published_at?: string | null;
          seo_description?: string | null;
          slug?: string | null;
          sort_order?: number;
          status?: PublishStatus;
          title?: string | null;
          updated_at?: string;
          video_alt?: string | null;
          video_path?: string | null;
          view_count?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          created_at: string;
          design_print_estimate: number;
          id: string;
          name: string;
          order_quantities: number[];
          page_counts: number[];
          paper_types: string[];
          planning_estimate: number;
          sort_order: number;
          status: ProductStatus;
          type: string;
          unit_prices: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          design_print_estimate: number;
          id?: string;
          name: string;
          order_quantities: number[];
          page_counts: number[];
          paper_types: string[];
          planning_estimate: number;
          sort_order?: number;
          status?: ProductStatus;
          type: string;
          unit_prices?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          design_print_estimate?: number;
          id?: string;
          name?: string;
          order_quantities?: number[];
          page_counts?: number[];
          paper_types?: string[];
          planning_estimate?: number;
          sort_order?: number;
          status?: ProductStatus;
          type?: string;
          unit_prices?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          sort_order: number;
          status: PublishStatus;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          status?: PublishStatus;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          sort_order?: number;
          status?: PublishStatus;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          category: string | null;
          created_at: string;
          id: string;
          question: string;
          sort_order: number;
          status: PublishStatus;
          updated_at: string;
        };
        Insert: {
          answer: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          question: string;
          sort_order?: number;
          status?: PublishStatus;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          question?: string;
          sort_order?: number;
          status?: PublishStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          budget: string | null;
          company: string | null;
          complaint_type: string;
          content: string;
          created_at: string;
          email: string;
          id: string;
          name: string;
          phone: string;
          phone_verified: boolean;
          privacy_agreed_at: string;
          service: string;
          status: InquiryStatus;
          title: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          budget?: string | null;
          company?: string | null;
          complaint_type: string;
          content: string;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          phone: string;
          phone_verified?: boolean;
          privacy_agreed_at: string;
          service: string;
          status?: InquiryStatus;
          title?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          budget?: string | null;
          company?: string | null;
          complaint_type?: string;
          content?: string;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          phone?: string;
          phone_verified?: boolean;
          privacy_agreed_at?: string;
          service?: string;
          status?: InquiryStatus;
          title?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      inquiry_attachments: {
        Row: {
          bucket: string;
          content_type: string | null;
          created_at: string;
          file_name: string;
          file_size: number;
          id: string;
          inquiry_id: string;
          path: string;
        };
        Insert: {
          bucket?: string;
          content_type?: string | null;
          created_at?: string;
          file_name: string;
          file_size: number;
          id?: string;
          inquiry_id: string;
          path: string;
        };
        Update: {
          bucket?: string;
          content_type?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number;
          id?: string;
          inquiry_id?: string;
          path?: string;
        };
        Relationships: [
          {
            columns: ["inquiry_id"];
            foreignKeyName: "inquiry_attachments_inquiry_id_fkey";
            referencedColumns: ["id"];
            referencedRelation: "inquiries";
          },
        ];
      };
      site_settings: {
        Row: {
          created_at: string;
          is_public: boolean;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          created_at?: string;
          is_public?: boolean;
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          created_at?: string;
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      reorder_portfolio_items: {
        Args: {
          portfolio_item_ids: string[];
        };
        Returns: undefined;
      };
      reorder_products: {
        Args: {
          product_ids: string[];
        };
        Returns: undefined;
      };
      reorder_posts: {
        Args: {
          post_ids: string[];
          post_kind: PostKind;
        };
        Returns: undefined;
      };
      reorder_reviews: {
        Args: {
          review_ids: string[];
        };
        Returns: undefined;
      };
    };
    Enums: {
      content_mode: "html" | "text";
      inquiry_status: "received" | "processing" | "resolved";
      post_kind: "blog" | "notice";
      publish_status: "draft" | "published" | "archived";
      product_status: "draft" | "published";
      review_kind: "interview" | "testimonial";
      user_role: "user" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
