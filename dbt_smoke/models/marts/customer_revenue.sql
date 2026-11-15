select
    customer_id,
    count(*) as order_count,
    sum(amount) as total_revenue,
    min(order_date) as first_order_date
from {{ ref('stg_orders') }}
group by customer_id
