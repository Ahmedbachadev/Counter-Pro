import Database from 'better-sqlite3';

export function settingsExpansionSchema(db: Database.Database) {
  // We need to add all missing columns to the settings table.
  const settingsColumns = [
    'logo', 'website', 'tax_registration_number', 'description',
    'invoice_logo', 'receipt_header', 'receipt_footer', 'primary_color', 'secondary_color', 'accent_color',
    // Localization
    'language', 'time_zone', 'date_format', 'number_format',
    // Tax Settings
    'tax_rates_json', 'tax_inclusive', 'tax_exclusive', 'invoice_tax_display',
    // Receipt Settings
    'receipt_size', 'show_logo_receipt', 'show_customer_receipt', 'show_tax_breakdown_receipt', 'show_barcode_receipt', 'print_automatically',
    'watermark', 'store_name', 'branch_name', 'tagline', 'receipt_background', 'show_header_business_name', 'show_header_branch', 'show_header_address', 'show_header_phone', 'show_header_email', 'show_header_website', 'show_header_ntn', 'show_header_strn', 'show_header_gst', 'show_header_qr', 'show_header_social', 'show_invoice_number', 'show_date', 'show_time', 'show_cashier', 'show_customer_name', 'show_customer_phone', 'show_customer_address', 'show_membership', 'show_payment_method', 'show_counter_number', 'show_terminal', 'show_order_notes', 'show_product_name', 'show_sku', 'show_brand', 'show_category', 'show_quantity', 'show_unit_price', 'show_product_discount', 'show_product_tax', 'show_serial_number', 'show_batch_number', 'show_expiry_date', 'show_variant', 'product_view_mode', 'show_subtotal', 'show_total_discount', 'show_coupons', 'show_total_tax', 'show_service_charges', 'show_delivery_charges', 'show_tips', 'show_cash_received', 'show_change_returned', 'show_grand_total', 'show_loyalty_points', 'show_gift_card_balance', 'exchange_policy', 'refund_policy', 'warranty_policy', 'terms_and_conditions', 'social_facebook', 'social_instagram', 'social_whatsapp', 'print_copies', 'print_customer_copy', 'print_merchant_copy', 'print_kitchen_copy', 'print_silent', 'print_auto_cut', 'print_beep', 'default_printer', 'connection_type', 'printer_encoding', 'digital_receipt_email', 'digital_receipt_sms', 'digital_receipt_whatsapp', 'digital_receipt_pdf', 'digital_receipt_customer_portal', 'attach_pdf_automatically', 'qr_type', 'qr_website_url', 'barcode_size', 'receipt_font', 'receipt_character_density',
    // Barcode Settings
    'auto_sku_generation', 'sku_format', 'sku_workspace_prefix', 'sku_store_prefix', 'sku_category_prefix', 'sku_brand_prefix', 'sku_prefix_separator', 'sku_starting_number', 'sku_number_length', 'sku_increment_by', 'auto_barcode_generation', 'barcode_type', 'barcode_prefix', 'barcode_starting_number', 'barcode_length', 'barcode_increment_by', 'sku_counter', 'barcode_counter', 'prevent_duplicate_sku', 'prevent_duplicate_barcode', 'validate_during_import', 'auto_detect_conflicts', 'auto_suggest_next_available_number', 'highlight_duplicate_ids', 'allow_manual_sku', 'allow_manual_barcode', 'default_label_size', 'label_orientation', 'include_product_name_label', 'include_price_label', 'include_sku_label', 'include_barcode_label', 'include_brand_label', 'include_category_label', 'include_logo_label', 'print_quantity_default', 'default_barcode_font_size', 'scanner_optimization',
    // Inventory Defaults
    'low_stock_threshold', 'default_unit', 'sku_generation_pattern', 'auto_product_code', 'inventory_valuation_method',
    // POS Defaults
    'default_payment_method', 'default_customer_type', 'auto_print_receipt_pos', 'open_cash_drawer', 'default_discount_behavior',
    // Notification Preferences
    'low_stock_alerts', 'purchase_alerts', 'sales_alerts', 'customer_balance_alerts', 'supplier_payment_alerts', 'system_notifications', 'desktop_notifications',
    // Appearance
    'system_theme', 'compact_mode', 'comfortable_mode', 'sidebar_behavior', 'dashboard_density',
    // Keyboard Shortcuts
    'shortcut_new_sale', 'shortcut_add_product', 'shortcut_search', 'shortcut_print_receipt', 'shortcut_save', 'shortcut_dashboard', 'shortcut_reports',
    // Advanced Preferences
    'auto_save', 'auto_refresh', 'default_landing_page', 'number_precision', 'search_behavior', 'table_density',
    // Security
    'session_timeout', 'auto_logout', 'device_remembering', 'password_policy'
  ];

  const columns = db.pragma("table_info(settings)") as any[];
  const existingColumns = new Set(columns.map(c => c.name));

  for (const col of settingsColumns) {
    if (!existingColumns.has(col)) {
      db.exec(`ALTER TABLE settings ADD COLUMN ${col} TEXT;`);
    }
  }
}
