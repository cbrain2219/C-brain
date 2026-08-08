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
export type PaymentLinkStatus = PublicEnums["payment_link_status"];
export type PaymentOrderStatus =
  | "ready"
  | "paid"
  | "failed"
  | "cancelled"
  | "partialCancelled"
  | "expired";
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
          featured: boolean;
          id: string;
          kind: PostKind;
          pinned: boolean;
          published_at: string;
          seo_description: string | null;
          show_as_banner: boolean;
          show_on_landing: boolean;
          slug: string;
          sort_order: number;
          status: PublishStatus;
          thumbnail_alt: string | null;
          thumbnail_path: string | null;
          title: string;
          type: string;
          view_count: number;
        };
        Insert: {
          content: string;
          content_mode?: ContentMode;
          created_at?: string;
          excerpt?: string | null;
          featured?: boolean;
          id?: string;
          kind: PostKind;
          pinned?: boolean;
          published_at?: string;
          seo_description?: string | null;
          show_as_banner?: boolean;
          show_on_landing?: boolean;
          slug: string;
          sort_order?: number;
          status?: PublishStatus;
          thumbnail_alt?: string | null;
          thumbnail_path?: string | null;
          title: string;
          type: string;
          view_count?: number;
        };
        Update: {
          content?: string;
          content_mode?: ContentMode;
          created_at?: string;
          excerpt?: string | null;
          featured?: boolean;
          id?: string;
          kind?: PostKind;
          pinned?: boolean;
          published_at?: string;
          seo_description?: string | null;
          show_as_banner?: boolean;
          show_on_landing?: boolean;
          slug?: string;
          sort_order?: number;
          status?: PublishStatus;
          thumbnail_alt?: string | null;
          thumbnail_path?: string | null;
          title?: string;
          type?: string;
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
          images: Json;
          pinned: boolean;
          published_at: string | null;
          show_on_landing: boolean;
          slug: string;
          sort_order: number;
          status: PublishStatus;
          title: string;
          type: string;
          view_count: number;
        };
        Insert: {
          client_name?: string | null;
          content: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          images?: Json;
          pinned?: boolean;
          published_at?: string | null;
          show_on_landing?: boolean;
          slug: string;
          sort_order?: number;
          status?: PublishStatus;
          title: string;
          type: string;
          view_count?: number;
        };
        Update: {
          client_name?: string | null;
          content?: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          images?: Json;
          pinned?: boolean;
          published_at?: string | null;
          show_on_landing?: boolean;
          slug?: string;
          sort_order?: number;
          status?: PublishStatus;
          title?: string;
          type?: string;
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
      payment_links: {
        Row: {
          amount: number;
          category: string;
          client_name: string;
          created_at: string;
          id: string;
          page_quantity: string;
          paper: string;
          payment_name: string;
          public_token: string;
          service: string;
          status: PaymentLinkStatus;
          updated_at: string;
        };
        Insert: {
          amount: number;
          category: string;
          client_name: string;
          created_at?: string;
          id?: string;
          page_quantity: string;
          paper: string;
          payment_name: string;
          public_token?: string;
          service: string;
          status?: PaymentLinkStatus;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category?: string;
          client_name?: string;
          created_at?: string;
          id?: string;
          page_quantity?: string;
          paper?: string;
          payment_name?: string;
          public_token?: string;
          service?: string;
          status?: PaymentLinkStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_orders: {
        Row: {
          amount: number;
          cancelled_at: string | null;
          created_at: string;
          id: string;
          nicepay_tid: string | null;
          order_id: string;
          paid_at: string | null;
          pay_method: string | null;
          payment_link_id: string;
          provider_status: PaymentOrderStatus;
          receipt_url: string | null;
          result_code: string | null;
          result_message: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          nicepay_tid?: string | null;
          order_id: string;
          paid_at?: string | null;
          pay_method?: string | null;
          payment_link_id: string;
          provider_status?: PaymentOrderStatus;
          receipt_url?: string | null;
          result_code?: string | null;
          result_message?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          nicepay_tid?: string | null;
          order_id?: string;
          paid_at?: string | null;
          pay_method?: string | null;
          payment_link_id?: string;
          provider_status?: PaymentOrderStatus;
          receipt_url?: string | null;
          result_code?: string | null;
          result_message?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          configuration: Json;
          created_at: string;
          id: string;
          product_type: string;
          sort_order: number;
          status: ProductStatus;
        };
        Insert: {
          configuration?: Json;
          created_at?: string;
          id?: string;
          product_type: string;
          sort_order?: number;
          status?: ProductStatus;
        };
        Update: {
          configuration?: Json;
          created_at?: string;
          id?: string;
          product_type?: string;
          sort_order?: number;
          status?: ProductStatus;
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
      complete_payment_order: {
        Args: {
          p_amount: number;
          p_nicepay_tid: string;
          p_order_id: string;
          p_paid_at: string;
          p_pay_method: string | null;
          p_receipt_url: string | null;
          p_result_code: string;
          p_result_message: string;
        };
        Returns: undefined;
      };
      get_or_create_payment_order: {
        Args: {
          p_public_token: string;
        };
        Returns: PublicTables["payment_orders"]["Row"][];
      };
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
      content_mode: "html" | "markdown";
      inquiry_status: "received" | "processing" | "resolved";
      post_kind: "blog" | "notice";
      publish_status: "draft" | "published" | "archived";
      payment_link_status: "pending" | "paid";
      product_status: "draft" | "published";
      review_kind: "interview" | "testimonial";
      user_role: "user" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
