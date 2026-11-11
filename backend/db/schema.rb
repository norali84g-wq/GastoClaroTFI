# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_11_130000) do
  create_table "active_storage_attachments", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "budget_alerts", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "budget_id", null: false
    t.bigint "financial_tip_id"
    t.integer "threshold_percentage", null: false
    t.datetime "triggered_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["budget_id", "threshold_percentage"], name: "index_budget_alerts_on_budget_id_and_threshold_percentage", unique: true
    t.index ["budget_id"], name: "index_budget_alerts_on_budget_id"
    t.index ["financial_tip_id"], name: "index_budget_alerts_on_financial_tip_id"
  end

  create_table "budgets", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "category_id", null: false
    t.string "period", null: false
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_budgets_on_category_id"
    t.index ["user_id", "category_id", "period"], name: "index_budgets_on_user_id_and_category_id_and_period", unique: true
    t.index ["user_id"], name: "index_budgets_on_user_id"
    t.check_constraint "`amount` > 0", name: "chk_budgets_amount_positive"
  end

  create_table "categories", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "tracks_installments"
    t.string "icon"
    t.boolean "active", default: true, null: false
    t.index ["parent_id"], name: "index_categories_on_parent_id"
  end

  create_table "expense_items", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "expense_id", null: false
    t.string "name", null: false
    t.integer "quantity", default: 1, null: false
    t.decimal "unit_price", precision: 12, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "unit", default: "unidad", null: false
    t.index ["expense_id"], name: "index_expense_items_on_expense_id"
    t.index ["name"], name: "index_expense_items_on_name"
    t.check_constraint "`quantity` > 0", name: "chk_expense_items_quantity_positive"
    t.check_constraint "`unit_price` >= 0", name: "chk_expense_items_unit_price_not_negative"
  end

  create_table "expenses", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.date "date", null: false
    t.bigint "user_id", null: false
    t.bigint "family_group_id", null: false
    t.bigint "category_id", null: false
    t.bigint "vendor_id"
    t.integer "purchase_channel", default: 0, null: false
    t.boolean "is_fixed", default: false, null: false
    t.string "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "payment_method_id"
    t.index ["category_id"], name: "index_expenses_on_category_id"
    t.index ["family_group_id"], name: "index_expenses_on_family_group_id"
    t.index ["payment_method_id"], name: "index_expenses_on_payment_method_id"
    t.index ["user_id", "date"], name: "index_expenses_on_user_id_and_date"
    t.index ["user_id"], name: "index_expenses_on_user_id"
    t.index ["vendor_id"], name: "index_expenses_on_vendor_id"
    t.check_constraint "`amount` > 0", name: "chk_expenses_amount_positive"
  end

  create_table "family_groups", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.integer "savings_percentage", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "card_monthly_fee", precision: 10, scale: 2, default: "0.0", null: false
    t.check_constraint "(`savings_percentage` >= 0) and (`savings_percentage` <= 100)", name: "chk_family_groups_savings_range"
    t.check_constraint "`card_monthly_fee` >= 0", name: "chk_family_groups_fee_not_negative"
  end

  create_table "financial_tips", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "content", null: false
    t.boolean "show_with_alert", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "incomes", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.date "date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "description"
    t.index ["user_id", "date"], name: "index_incomes_on_user_id_and_date"
    t.index ["user_id"], name: "index_incomes_on_user_id"
    t.check_constraint "`amount` > 0", name: "chk_incomes_amount_positive"
  end

  create_table "installment_purchases", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "family_group_id", null: false
    t.bigint "category_id", null: false
    t.bigint "vendor_id"
    t.string "description"
    t.decimal "total_amount", precision: 10, scale: 2
    t.integer "installments_count"
    t.string "first_period"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "interest_rate", precision: 5, scale: 2, default: "0.0", null: false
    t.bigint "payment_method_id"
    t.index ["category_id"], name: "index_installment_purchases_on_category_id"
    t.index ["family_group_id"], name: "index_installment_purchases_on_family_group_id"
    t.index ["payment_method_id"], name: "index_installment_purchases_on_payment_method_id"
    t.index ["vendor_id"], name: "index_installment_purchases_on_vendor_id"
    t.check_constraint "(`interest_rate` >= 0) and (`interest_rate` <= 100)", name: "chk_installment_purchases_interest_range"
    t.check_constraint "`installments_count` > 0", name: "chk_installment_purchases_count_positive"
    t.check_constraint "`total_amount` > 0", name: "chk_installment_purchases_total_positive"
  end

  create_table "installments", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "installment_purchase_id", null: false
    t.integer "number", null: false
    t.string "period", null: false
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.boolean "paid", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["installment_purchase_id", "number"], name: "index_installments_on_installment_purchase_id_and_number", unique: true
    t.index ["installment_purchase_id"], name: "index_installments_on_installment_purchase_id"
    t.check_constraint "`amount` >= 0", name: "chk_installments_amount_not_negative"
  end

  create_table "payment_methods", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.decimal "monthly_fee", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "icon"
    t.index ["user_id"], name: "index_payment_methods_on_user_id"
    t.check_constraint "`monthly_fee` >= 0", name: "chk_payment_methods_fee_not_negative"
  end

  create_table "reference_indices", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "period", null: false
    t.decimal "value", precision: 12, scale: 4, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "savings_goals", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "family_group_id", null: false
    t.string "name", null: false
    t.decimal "target_amount", precision: 12, scale: 2, null: false
    t.decimal "saved_amount", precision: 12, scale: 2, default: "0.0", null: false
    t.date "deadline"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_group_id"], name: "index_savings_goals_on_family_group_id"
    t.check_constraint "`saved_amount` >= 0", name: "chk_savings_goals_saved_not_negative"
    t.check_constraint "`target_amount` > 0", name: "chk_savings_goals_target_positive"
  end

  create_table "shopping_list_items", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "family_group_id", null: false
    t.string "name", null: false
    t.string "period", null: false
    t.decimal "quantity", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "category_id"
    t.decimal "estimated_unit_price", precision: 10, scale: 2, default: "0.0", null: false
    t.boolean "purchased", default: false, null: false
    t.index ["category_id"], name: "index_shopping_list_items_on_category_id"
    t.index ["family_group_id", "period"], name: "index_shopping_list_items_on_group_and_period"
    t.index ["family_group_id"], name: "index_shopping_list_items_on_family_group_id"
    t.check_constraint "(`quantity` is null) or (`quantity` > 0)", name: "chk_shopping_list_items_quantity_positive"
    t.check_constraint "`estimated_unit_price` >= 0", name: "chk_shopping_list_items_price_not_negative"
  end

  create_table "support_messages", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "subject", limit: 120, null: false
    t.text "message", null: false
    t.boolean "attended", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "created_at"], name: "index_support_messages_on_user_and_created_at"
    t.index ["user_id"], name: "index_support_messages_on_user_id"
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "user", null: false
    t.string "password_digest", null: false
    t.bigint "family_group_id", null: false
    t.boolean "admin", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "email"
    t.integer "token_version", default: 0, null: false
    t.string "first_name"
    t.string "last_name"
    t.date "birth_date"
    t.string "dni", limit: 8
    t.boolean "active", default: true, null: false
    t.index ["email"], name: "index_users_on_email_unique", unique: true
    t.index ["family_group_id"], name: "index_users_on_family_group_id"
    t.index ["user"], name: "index_users_on_user", unique: true
    t.check_constraint "`dni` IS NULL OR `dni` REGEXP '^[0-9]{7,8}$'", name: "chk_users_dni_format"
  end

  create_table "vendors", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "category"
    t.boolean "online_purchase", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "budget_alerts", "budgets"
  add_foreign_key "budget_alerts", "financial_tips"
  add_foreign_key "budgets", "categories"
  add_foreign_key "budgets", "users"
  add_foreign_key "categories", "categories", column: "parent_id"
  add_foreign_key "expense_items", "expenses"
  add_foreign_key "expenses", "categories"
  add_foreign_key "expenses", "family_groups"
  add_foreign_key "expenses", "payment_methods"
  add_foreign_key "expenses", "users"
  add_foreign_key "expenses", "vendors"
  add_foreign_key "incomes", "users"
  add_foreign_key "installment_purchases", "categories"
  add_foreign_key "installment_purchases", "family_groups"
  add_foreign_key "installment_purchases", "payment_methods"
  add_foreign_key "installment_purchases", "vendors"
  add_foreign_key "installments", "installment_purchases"
  add_foreign_key "payment_methods", "users"
  add_foreign_key "savings_goals", "family_groups"
  add_foreign_key "shopping_list_items", "categories"
  add_foreign_key "shopping_list_items", "family_groups"
  add_foreign_key "support_messages", "users"
  add_foreign_key "users", "family_groups"
end
