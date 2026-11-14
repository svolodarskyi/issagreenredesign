select * from {{ ref('customer_revenue') }} where total_revenue < 0
