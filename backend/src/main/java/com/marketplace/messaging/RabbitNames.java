package com.marketplace.messaging;


public final class RabbitNames {

    private RabbitNames() {}   // no instances

    /** Main topic exchange. All domain events pass through here. */
    public static final String EXCHANGE = "marketplace.events";

    /** Dead-letter exchange for failed messages. */
    public static final String DLX = "marketplace.dlx";

    // ---- Email queues + routing keys ----

    public static final String QUEUE_EMAIL_VERIFICATION = "email.verification";
    public static final String QUEUE_EMAIL_ORDER_STATUS = "email.order-status";
    public static final String QUEUE_EMAIL_SELLER_INVITE = "email.seller-invite";

    public static final String ROUTING_EMAIL_VERIFICATION = "email.verification";
    public static final String ROUTING_EMAIL_ORDER_STATUS = "email.order-status";
    public static final String ROUTING_EMAIL_SELLER_INVITE = "email.seller-invite";

    // ---- Order-processing queues ----

    public static final String QUEUE_ORDER_PROCESSING = "order.processing";
    public static final String ROUTING_ORDER_PROCESSING = "order.processing";
}
