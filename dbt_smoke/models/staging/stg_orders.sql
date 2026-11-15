select
    order_id,
    customer_id,
    cast(order_date as date) as order_date,
    cast(amount as decimal(10, 2)) as amount
from {{ ref('raw_orders') }}
