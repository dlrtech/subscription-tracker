public class Subscription {
    private Long id;
    private String name;
    private BigDecimal price;
    private BillingPeriod billingPeriod;
    private LocalDate nextBillingDate;
    private Category category;
    private boolean active;
    private User user;
}