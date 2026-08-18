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
export type ContentAuthoringMode = "raw_html" | "wysiwyg";
export type ComplaintStatus = PublicEnums["inquiry_status"];
export type InquiryStatus = PublicEnums["inquiry_status"];
export type PostKind = PublicEnums["post_kind"];
export type OrderChannel = PublicEnums["order_channel"];
export type OrderStatus = PublicEnums["order_status"];
export type PaymentStatus = PublicEnums["payment_status"];
export type RefundStatus = PublicEnums["refund_status"];
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
          content_asset_scope: string;
          content_authoring_mode: ContentAuthoringMode;
          content_json: Json | null;
          content_schema_version: number;
          content_source_backup: string | null;
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
          thumbnail_file_name: string | null;
          thumbnail_path: string | null;
          title: string;
          type: string;
          view_count: number;
        };
        Insert: {
          content_asset_scope?: string;
          content_authoring_mode?: ContentAuthoringMode;
          content_json?: Json | null;
          content_schema_version?: number;
          content_source_backup?: string | null;
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
          thumbnail_file_name?: string | null;
          thumbnail_path?: string | null;
          title: string;
          type: string;
          view_count?: number;
        };
        Update: {
          content_asset_scope?: string;
          content_authoring_mode?: ContentAuthoringMode;
          content_json?: Json | null;
          content_schema_version?: number;
          content_source_backup?: string | null;
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
          thumbnail_file_name?: string | null;
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
          content_asset_scope: string;
          content_authoring_mode: ContentAuthoringMode;
          content_json: Json | null;
          content_schema_version: number;
          content_source_backup: string | null;
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
          content_asset_scope?: string;
          content_authoring_mode?: ContentAuthoringMode;
          content_json?: Json | null;
          content_schema_version?: number;
          content_source_backup?: string | null;
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
          content_asset_scope?: string;
          content_authoring_mode?: ContentAuthoringMode;
          content_json?: Json | null;
          content_schema_version?: number;
          content_source_backup?: string | null;
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
          company_name: string;
          content_asset_scope: string;
          content_authoring_mode: ContentAuthoringMode;
          content_json: Json | null;
          content_schema_version: number;
          content_source_backup: string | null;
          content: string;
          content_mode: ContentMode;
          created_at: string;
          id: string;
          kind: ReviewKind;
          manager_name: string | null;
          project_deliverable: string | null;
          project_usage: string | null;
          published_at: string | null;
          seo_description: string | null;
          show_on_landing: boolean;
          slug: string | null;
          sort_order: number;
          status: PublishStatus;
          title: string | null;
          video_alt: string | null;
          video_path: string | null;
          view_count: number;
          youtube_video_id: string | null;
        };
        Insert: {
          company_name: string;
          content_asset_scope?: string;
          content_authoring_mode?: ContentAuthoringMode;
          content_json?: Json | null;
          content_schema_version?: number;
          content_source_backup?: string | null;
          content: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          kind: ReviewKind;
          manager_name?: string | null;
          project_deliverable?: string | null;
          project_usage?: string | null;
          published_at?: string | null;
          seo_description?: string | null;
          show_on_landing?: boolean;
          slug?: string | null;
          sort_order?: number;
          status?: PublishStatus;
          title?: string | null;
          video_alt?: string | null;
          video_path?: string | null;
          view_count?: number;
          youtube_video_id?: string | null;
        };
        Update: {
          company_name?: string;
          content_asset_scope?: string;
          content_authoring_mode?: ContentAuthoringMode;
          content_json?: Json | null;
          content_schema_version?: number;
          content_source_backup?: string | null;
          content?: string;
          content_mode?: ContentMode;
          created_at?: string;
          id?: string;
          kind?: ReviewKind;
          manager_name?: string | null;
          project_deliverable?: string | null;
          project_usage?: string | null;
          published_at?: string | null;
          seo_description?: string | null;
          show_on_landing?: boolean;
          slug?: string | null;
          sort_order?: number;
          status?: PublishStatus;
          title?: string | null;
          video_alt?: string | null;
          video_path?: string | null;
          view_count?: number;
          youtube_video_id?: string | null;
        };
        Relationships: [];
      };
      complaints: {
        Row: {
          complaint_type: string;
          content: string;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string;
          phone_verified: boolean;
          privacy_agreed_at: string;
          service: string;
          status: ComplaintStatus;
        };
        Insert: {
          complaint_type: string;
          content: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          phone: string;
          phone_verified?: boolean;
          privacy_agreed_at: string;
          service: string;
          status?: ComplaintStatus;
        };
        Update: {
          complaint_type?: string;
          content?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string;
          phone_verified?: boolean;
          privacy_agreed_at?: string;
          service?: string;
          status?: ComplaintStatus;
        };
        Relationships: [];
      };
      complaint_attachments: {
        Row: {
          bucket_id: string;
          complaint_id: string;
          content_type: string;
          created_at: string;
          file_size: number;
          id: string;
          object_path: string;
          original_file_name: string;
        };
        Insert: {
          bucket_id?: string;
          complaint_id: string;
          content_type: string;
          created_at?: string;
          file_size: number;
          id?: string;
          object_path: string;
          original_file_name: string;
        };
        Update: {
          bucket_id?: string;
          complaint_id?: string;
          content_type?: string;
          created_at?: string;
          file_size?: number;
          id?: string;
          object_path?: string;
          original_file_name?: string;
        };
        Relationships: [
          {
            columns: ["complaint_id"];
            foreignKeyName: "complaint_attachments_complaint_id_fkey";
            referencedColumns: ["id"];
            referencedRelation: "complaints";
          },
        ];
      };
      payment_links: {
        Row: {
          amount: number;
          category: string;
          client_name: string;
          created_at: string;
          disabled_at: string | null;
          id: string;
          page_quantity: string;
          paper: string;
          payment_name: string;
          public_token: string;
          service: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          category: string;
          client_name: string;
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          page_quantity: string;
          paper: string;
          payment_name: string;
          public_token?: string;
          service: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category?: string;
          client_name?: string;
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          page_quantity?: string;
          paper?: string;
          payment_name?: string;
          public_token?: string;
          service?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          amount: number;
          buyer_company: string | null;
          buyer_email: string;
          buyer_name: string;
          buyer_phone: string;
          channel: OrderChannel;
          checkout_request_id: string;
          created_at: string;
          currency: string;
          customer_label: string;
          id: string;
          item_snapshot: Json;
          order_name: string;
          payment_link_id: string | null;
          privacy_agreed_at: string;
          public_token: string;
          status: OrderStatus;
          updated_at: string;
        };
        Insert: {
          amount: number;
          buyer_company?: string | null;
          buyer_email: string;
          buyer_name: string;
          buyer_phone: string;
          channel: OrderChannel;
          checkout_request_id: string;
          created_at?: string;
          currency?: string;
          customer_label: string;
          id?: string;
          item_snapshot: Json;
          order_name: string;
          payment_link_id?: string | null;
          privacy_agreed_at: string;
          public_token?: string;
          status?: OrderStatus;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          buyer_company?: string | null;
          buyer_email?: string;
          buyer_name?: string;
          buyer_phone?: string;
          channel?: OrderChannel;
          checkout_request_id?: string;
          created_at?: string;
          currency?: string;
          customer_label?: string;
          id?: string;
          item_snapshot?: Json;
          order_name?: string;
          payment_link_id?: string | null;
          privacy_agreed_at?: string;
          public_token?: string;
          status?: OrderStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ["payment_link_id"];
            foreignKeyName: "orders_payment_link_id_fkey";
            referencedColumns: ["id"];
            referencedRelation: "payment_links";
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          balance_amount: number | null;
          can_part_cancel: boolean | null;
          cancelled_at: string | null;
          created_at: string;
          id: string;
          nicepay_tid: string | null;
          order_id: string;
          paid_at: string | null;
          pay_method: string | null;
          provider_order_id: string;
          receipt_url: string | null;
          result_code: string | null;
          result_message: string | null;
          status: PaymentStatus;
          updated_at: string;
        };
        Insert: {
          amount: number;
          balance_amount?: number | null;
          can_part_cancel?: boolean | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          nicepay_tid?: string | null;
          order_id: string;
          paid_at?: string | null;
          pay_method?: string | null;
          provider_order_id: string;
          receipt_url?: string | null;
          result_code?: string | null;
          result_message?: string | null;
          status?: PaymentStatus;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          balance_amount?: number | null;
          can_part_cancel?: boolean | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          nicepay_tid?: string | null;
          order_id?: string;
          paid_at?: string | null;
          pay_method?: string | null;
          provider_order_id?: string;
          receipt_url?: string | null;
          result_code?: string | null;
          result_message?: string | null;
          status?: PaymentStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ["order_id"];
            foreignKeyName: "payments_order_id_fkey";
            referencedColumns: ["id"];
            referencedRelation: "orders";
          },
        ];
      };
      refunds: {
        Row: {
          amount: number;
          id: string;
          nicepay_cancelled_tid: string | null;
          payment_id: string;
          provider_refund_order_id: string;
          reason: string;
          receipt_url: string | null;
          refunded_at: string | null;
          request_id: string;
          requested_at: string;
          requested_by: string;
          result_code: string | null;
          result_message: string | null;
          status: RefundStatus;
          updated_at: string;
        };
        Insert: {
          amount: number;
          id?: string;
          nicepay_cancelled_tid?: string | null;
          payment_id: string;
          provider_refund_order_id: string;
          reason: string;
          receipt_url?: string | null;
          refunded_at?: string | null;
          request_id: string;
          requested_at?: string;
          requested_by: string;
          result_code?: string | null;
          result_message?: string | null;
          status?: RefundStatus;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          id?: string;
          nicepay_cancelled_tid?: string | null;
          payment_id?: string;
          provider_refund_order_id?: string;
          reason?: string;
          receipt_url?: string | null;
          refunded_at?: string | null;
          request_id?: string;
          requested_at?: string;
          requested_by?: string;
          result_code?: string | null;
          result_message?: string | null;
          status?: RefundStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            columns: ["payment_id"];
            foreignKeyName: "refunds_payment_id_fkey";
            referencedColumns: ["id"];
            referencedRelation: "payments";
          },
        ];
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
      create_linkpay_checkout: {
        Args: {
          p_buyer_company: string | null;
          p_buyer_email: string;
          p_buyer_name: string;
          p_buyer_phone: string;
          p_checkout_request_id: string;
          p_customer_label: string;
          p_privacy_agreed_at: string;
          p_provider_order_id: string;
          p_public_token: string;
        };
        Returns: {
          amount: number;
          order_id: string;
          order_name: string;
          order_public_token: string;
          payment_id: string;
          provider_order_id: string;
        }[];
      };
      create_site_checkout: {
        Args: {
          p_amount: number;
          p_buyer_company: string | null;
          p_buyer_email: string;
          p_buyer_name: string;
          p_buyer_phone: string;
          p_checkout_request_id: string;
          p_customer_label: string;
          p_item_snapshot: Json;
          p_order_name: string;
          p_privacy_agreed_at: string;
          p_provider_order_id: string;
        };
        Returns: {
          amount: number;
          order_id: string;
          order_name: string;
          order_public_token: string;
          payment_id: string;
          provider_order_id: string;
        }[];
      };
      finish_payment: {
        Args: {
          p_balance_amount: number | null;
          p_can_part_cancel: boolean | null;
          p_cancelled_at: string | null;
          p_nicepay_tid: string | null;
          p_amount: number;
          p_paid_at: string | null;
          p_pay_method: string | null;
          p_provider_order_id: string;
          p_receipt_url: string | null;
          p_result_code: string | null;
          p_result_message: string | null;
          p_status: PaymentStatus;
        };
        Returns: PublicTables["payments"]["Row"][];
      };
      finish_refund: {
        Args: {
          p_nicepay_cancelled_tid: string | null;
          p_balance_amount: number | null;
          p_receipt_url: string | null;
          p_refunded_at: string | null;
          p_request_id: string;
          p_result_code: string | null;
          p_result_message: string | null;
          p_status: RefundStatus;
        };
        Returns: {
          payment_status: PaymentStatus;
          refundable_amount: number;
          refunded_amount: number;
          status: RefundStatus;
        }[];
      };
      reserve_refund: {
        Args: {
          p_amount: number;
          p_payment_id: string;
          p_provider_refund_order_id: string;
          p_reason: string;
          p_request_id: string;
          p_requested_by: string;
        };
        Returns: {
          amount: number;
          can_part_cancel: boolean | null;
          nicepay_tid: string | null;
          payment_amount: number;
          payment_balance_amount: number | null;
          payment_id: string;
          provider_order_id: string;
          refund_id: string;
          refund_status: RefundStatus;
          should_execute: boolean;
        }[];
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
      order_channel: "site" | "linkpay";
      order_status:
        | "open"
        | "payment_pending"
        | "paid"
        | "partially_refunded"
        | "refunded";
      payment_status:
        | "ready"
        | "unknown"
        | "paid"
        | "failed"
        | "partial_cancelled"
        | "cancelled"
        | "expired";
      product_status: "draft" | "published";
      refund_status: "requested" | "unknown" | "succeeded" | "failed";
      review_kind: "interview" | "testimonial";
      user_role: "user" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
