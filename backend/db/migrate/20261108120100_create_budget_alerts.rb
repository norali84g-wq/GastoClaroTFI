class CreateBudgetAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :budget_alerts do |t|
      t.references :budget, null: false, foreign_key: true
      t.references :financial_tip, foreign_key: true
      t.integer :threshold_percentage, null: false
      t.datetime :triggered_at, null: false

      t.timestamps
    end

    add_index :budget_alerts, %i[budget_id threshold_percentage], unique: true
  end
end
